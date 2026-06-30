#pragma once
// MẪU file bí mật. Copy thành secrets.h rồi điền thông tin thật.
//   cp include/secrets.example.h include/secrets.h
// secrets.h đã được .gitignore -> KHÔNG commit token/mật khẩu (theo CLAUDE.md, mục Security).

// ---- APN nhà mạng (SIM 4G) ----
// Viettel: "v-internet" | Mobifone: "m-wap" | Vinaphone: "m3-world"
#define SECRET_APN          "v-internet"
#define SECRET_APN_USER     ""
#define SECRET_APN_PASS     ""

// ---- MQTT Broker (Mosquitto của backend, TLS) ----
// Host = domain MQTT đã trỏ về VPS (xem DEPLOY.md). Cổng 8883 = MQTT over TLS.
#define SECRET_MQTT_HOST    "mqtt.saliguard.example.com"
#define SECRET_MQTT_PORT    8883          // 8883 = TLS (khớp docker-compose.prod.yml)
// Broker production yêu cầu đăng nhập (tạo bằng mosquitto_passwd - xem DEPLOY.md B.4).
#define SECRET_MQTT_USER    "esp32"
#define SECRET_MQTT_PASS    "doi_mat_khau_thiet_bi"

// ---- Định danh trạm (khớp REAL_STATION_ID = ST001 ở backend/.env) ----
#define SECRET_STATION_ID   "ST001"
