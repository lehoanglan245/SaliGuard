# SaliGuard - AI-Powered Salinity Intrusion Early Warning System
**Project Context & Instructions for AI Assistant**

## 1. Project Overview
SaliGuard là hệ thống IoT cảnh báo sớm xâm nhập mặn (24h - 72h) dành cho nông dân khu vực ven biển (Hải Phòng, Việt Nam).
Hệ thống sử dụng cảm biến thực địa để thu thập dữ liệu thủy văn, xử lý qua mô hình AI trên server để đưa ra dự báo, và hiển thị cảnh báo lên Dashboard web.

## 2. Monorepo Architecture & Tech Stack
Dự án được tổ chức theo dạng Monorepo, bao gồm 4 khối chính:

- **/firmware**: Code nạp cho thiết bị biên.
  - *Tech:* ESP32, C/C++, PlatformIO, thư viện PubSubClient (MQTT), ArduinoJson.
  - *Role:* Đọc cảm biến (EC, Nhiệt độ, Mực nước), gửi JSON qua mạng 4G (MQTT over TLS).
  
- **/backend**: Dịch vụ tiếp nhận và quản lý luồng dữ liệu (Ingestion Service).
  - *Tech:* Node.js, TypeScript, Express.js, thư viện `mqtt` và `pg`.
  - *Role:* Subscribe MQTT Broker, lưu dữ liệu vào Database, gọi AI Engine để lấy dự báo, và cung cấp REST API cho Dashboard.

- **/ai_engine**: Dịch vụ tính toán và dự báo.
  - *Tech:* Python 3, FastAPI, XGBoost, Pandas, Numpy.
  - *Role:* Chạy mô hình XGBoost đã được huấn luyện, nhận input từ Backend qua HTTP POST và trả về dự báo độ mặn cho 24h, 48h tới.

- **/dashboard**: Giao diện người dùng web.
  - *Tech:* SvelteKit (Svelte 5), TypeScript, TailwindCSS, uPlot (biểu đồ).
  - *Role:* Gọi REST API từ Backend, hiển thị bản đồ, biểu đồ lịch sử và thẻ cảnh báo (Xanh/Vàng/Đỏ). Deploy trên Cloudflare Pages.

- **Database / Infrastructure:** - PostgreSQL + TimescaleDB (chỉ dùng 1 bảng `telemetry` dạng hypertable).
  - Mosquitto MQTT Broker.

## 3. Data Flow (Luồng dữ liệu)
1. `ESP32` publish chuỗi JSON lên topic `waterqa/<station_id>/telemetry`.
2. `Backend (Node.js)` nhận message, insert thẳng vào bảng `telemetry` trong PostgreSQL.
3. `Backend (Node.js)` gửi request POST mang theo {temp, ec, level} sang `AI Engine (Python/FastAPI)` ở cổng 8000.
4. `AI Engine` dùng mô hình XGBoost tính toán và trả về JSON `{"forecast_24h": value}`.
5. `Backend` nhận kết quả, nếu > 4g/L (mức đỏ) thì kích hoạt cảnh báo, đồng thời cập nhật dữ liệu để phục vụ API.
6. `Dashboard (Svelte 5)` gọi REST API để render UI.

## 4. Coding Conventions & AI Guidelines
Khi hỗ trợ viết code cho dự án này, AI cần tuân thủ tuyệt đối các quy tắc sau:

- **TypeScript / JavaScript:** Sử dụng ES6+ syntax, ưu tiên `async/await` thay vì `.then()`. Luôn khai báo type/interface rõ ràng cho các payload dữ liệu.
- **Svelte 5:** BẮT BUỘC sử dụng cú pháp Runes (`$state`, `$derived`, `$effect`) cho hệ thống reactivity, không dùng cú pháp Svelte 4 cũ. Khuyến khích chia nhỏ thành các Component độc lập.
- **Python:** Viết code clean, có type hinting đầy đủ (vd: `def predict(data: dict) -> dict:`).
- **Security:** Không bao giờ hardcode mật khẩu, token hay URL. Bắt buộc dùng `process.env` (Node.js) hoặc `os.getenv` (Python) để đọc cấu hình từ file `.env`.
- **Formatting:** Luôn format trả lời rõ ràng, nếu tạo file mới phải chỉ định chính xác đường dẫn tương đối (vd: `backend/src/db.ts`).
- **Context Awareness:** Tự động nhận diện file đang làm việc thuộc khối nào (firmware, backend, ai, hay dashboard) để dùng đúng ngôn ngữ và thư viện tương ứng.

Here are several guidelines you must always follow:

- Follow https://svelte.dev/llms.txt when writing Svelte code.
  - Do not update states using `$effect`. If a variable depends on states, use `$derived` instead.
- You must always use Svelte 5 syntax and Tailwind utility classes whenever possible.

- You must use kebab-case rather than camelCase or snake_case for file names.
- You must use camelCase for variables and SCREAMING_SNAKE_CASE for constants.
- Use Zod to validate inputs passed to remote functions. Instructions are provided at https://zod.dev/llms.txt.
  - Prefer `z.strictObject` over `z.object` when possible.
- Use `form` remote functions instead of form actions when adding a form. Look into https://svelte.dev/docs/kit/llms.txt to understand what a remote function is. Do not use `onsubmit` for form submissions. Client-side preflight schema and server-side remote function schema must be the same Zod schema. Export it from a shared file (e.g. `./schema.ts`) as `.remote.ts` files cannot export Zod schemas.
- Use `prerender` remote functions to fetch data that only needs to be updated once per deployment.
- Use `load` functions rather than `query` remote functions to fetch dynamic data. Add `Cache-Control` header via `setHeaders` appropriately. Since the website is static by default, add `export const prerender = false` (or `export const prerender = "auto"` if page can be prerendered) to `+page.server.ts` to allow fetching dynamic data.
- If any `class` property is too long (i.e. over 100 characters), you must divide it into multiple lines using the `clsx` utility imported using `import { clsx } from "$lib/clsx"`. Keep the lines balanced in length.
- You must write Drizzle code following instructions provided at https://orm.drizzle.team/llms.txt.
  - Table names and column names must use the camelCase convention in TypeScript and snake_case in Postgres.
  - Use the Postgres schema `cncSchema` when writing a Drizzle schema.


## Available MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.

- When making a Git commit, follow the Conventional Commits specification for commit messages.
- Always run `pnpm lint` before committing. Fix all issues until `pnpm lint` no longer returns warnings or errors.

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:
