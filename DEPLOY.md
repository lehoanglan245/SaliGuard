# SaliGuard — Hướng dẫn Deploy

Kiến trúc triển khai (theo CLAUDE.md):

```
                          ┌─────────────────────────┐
   Người dùng ──HTTPS──►  │  Cloudflare Pages        │   (dashboard - SvelteKit)
                          │  saliguard.pages.dev     │
                          └───────────┬──────────────┘
                                      │ gọi REST API qua HTTPS
                                      ▼
                          ┌─────────────────────────────────────────────┐
                          │  VPS (Docker)                                │
   ESP32 ──MQTT/TLS:8883─►│  caddy(443) → backend(3000) → ai_engine(8000)│
                          │                    └→ db(5432)               │
                          │  mqtt(8883 TLS / 1883 nội bộ)                │
                          └─────────────────────────────────────────────┘
```

- **Dashboard** → Cloudflare Pages (tĩnh, build từ `/dashboard`).
- **Backend + AI Engine + DB + MQTT** → 1 VPS, chạy bằng `docker-compose.prod.yml`.
- DB và AI Engine **không** mở ra Internet. Chỉ Caddy (443/80) và MQTT TLS (8883) lộ ra ngoài.

---

## A. Chuẩn bị VPS

### A.1 Chọn nhà cung cấp
Cần ~2 GB RAM (xgboost + Postgres). Gợi ý (rẻ → ổn định):
- **Hetzner Cloud** CX22 (2 vCPU / 4 GB, ~€4/tháng) — đáng tiền nhất.
- **DigitalOcean / Vultr** droplet 2 GB (~$12/tháng).
- **AWS Lightsail** 2 GB.

Chọn image **Ubuntu 24.04 LTS**.

### A.2 Cài Docker trên VPS
```bash
ssh root@<VPS_IP>
curl -fsSL https://get.docker.com | sh
docker compose version   # xác nhận có plugin compose
```

### A.3 DNS
Tạo 2 bản ghi **A** trỏ về IP VPS:
| Record | Trỏ tới |
|--------|---------|
| `api.saliguard.example.com`  | `<VPS_IP>` |
| `mqtt.saliguard.example.com` | `<VPS_IP>` |

### A.4 Mở firewall
Mở cổng **80, 443** (HTTP/HTTPS cho Caddy) và **8883** (MQTT TLS). KHÔNG mở 5432/8000/1883.

---

## B. Triển khai backend stack lên VPS

### B.1 Lấy mã nguồn
```bash
git clone <repo-url> saliguard && cd saliguard
```

### B.2 Tạo file cấu hình `.env`
```bash
cp .env.prod.example .env
nano .env          # điền DB_PASSWORD mạnh, API_DOMAIN, CORS_ORIGIN...
```

### B.3 Chứng chỉ TLS cho MQTT (Let's Encrypt)
Lấy cert cho domain MQTT bằng certbot rồi copy vào `infra/mosquitto/certs/`:
```bash
apt install -y certbot
certbot certonly --standalone -d mqtt.saliguard.example.com   # cần cổng 80 rảnh

mkdir -p infra/mosquitto/certs
cp /etc/letsencrypt/live/mqtt.saliguard.example.com/fullchain.pem infra/mosquitto/certs/
cp /etc/letsencrypt/live/mqtt.saliguard.example.com/privkey.pem   infra/mosquitto/certs/
chmod 644 infra/mosquitto/certs/*.pem
```
> Cert hết hạn sau 90 ngày — đặt cron `certbot renew` + copy lại + `docker compose ... restart mqtt`.

### B.4 Tạo user/password cho MQTT (thiết bị đăng nhập)
```bash
docker run --rm -v "$PWD/infra/mosquitto:/m" eclipse-mosquitto:2 \
  mosquitto_passwd -b -c /m/passwd esp32 <mat_khau_thiet_bi>
```
(`esp32` là username; thêm user khác: bỏ cờ `-c`.)

### B.5 (Tùy chọn) Model AI thật
Đặt file model vào `ai_engine/models/`:
```
ai_engine/models/xgboost_model.json        # model 24h
ai_engine/models/xgboost_model_48h.json    # model 48h (nếu có)
```
Không có file → AI Engine chạy **mock mode** (dự báo ngẫu nhiên), hệ thống vẫn hoạt động.

### B.6 Khởi động
```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
```
Schema DB tự nạp lần đầu (volume trống). Nếu sau này đổi `schema.sql`, chạy lại migration:
```bash
docker compose -f docker-compose.prod.yml exec -T db \
  psql -U postgres -d saliguard < backend/schema.sql
```

### B.7 Kiểm tra
```bash
curl https://api.saliguard.example.com/health      # {"status":"ok",...}
curl https://api.saliguard.example.com/api/stations # JSON 8 trạm
```

---

## C. Dashboard → Cloudflare Pages

Dashboard đã dùng `@sveltejs/adapter-cloudflare` nên deploy thẳng lên Pages.

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → chọn repo.
2. Cấu hình build:
   | Mục | Giá trị |
   |-----|---------|
   | Production branch | `main` |
   | Framework preset  | SvelteKit |
   | Root directory    | `dashboard` |
   | Build command     | `pnpm install && pnpm build` |
   | Build output dir  | `.svelte-kit/cloudflare` |
3. **Environment variables** (Settings → Environment variables) → thêm:
   ```
   PUBLIC_API_URL = https://api.saliguard.example.com
   ```
4. Save → Cloudflare tự build & deploy. Push code lên `main` → tự deploy lại.
5. Lấy domain Pages (vd `saliguard.pages.dev`) và **thêm vào `CORS_ORIGIN`** trong `.env` của VPS rồi:
   ```bash
   docker compose -f docker-compose.prod.yml up -d backend   # nạp lại CORS
   ```

> Đảm bảo `CORS_ORIGIN` (VPS) và domain Pages khớp nhau, nếu không trình duyệt sẽ chặn API.

---

## D. Firmware ESP32 (kết nối broker production)

Trỏ firmware tới broker TLS:
- Host: `mqtt.saliguard.example.com`, port `8883`, dùng `WiFiClientSecure`/TLS.
- Username/password = đã tạo ở **B.4**.
- Nạp CA cert (Let's Encrypt ISRG Root X1) vào firmware để verify broker.
- Topic publish: `waterqa/ST001/telemetry`, payload `{"temp":..,"ec":..,"level":..}`.

---

## E. Ghi nhớ vận hành
- **Backup DB**: `docker compose -f docker-compose.prod.yml exec -T db pg_dump -U postgres saliguard > backup.sql`
- **Xem log**: `docker compose -f docker-compose.prod.yml logs -f <service>`
- **Cập nhật code**: `git pull && docker compose -f docker-compose.prod.yml up -d --build`
- **Bí mật KHÔNG commit**: `.env`, `infra/mosquitto/passwd`, `infra/mosquitto/certs/` (đã có trong `.gitignore`).
