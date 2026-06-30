#pragma once
// Cấu hình tĩnh: pin map + hằng số. Bí mật (APN, broker, mật khẩu) nằm ở secrets.h.
// Pin map khớp chính xác "Sơ đồ nối dây đầy đủ" (khối 8–15).

#include "secrets.h"

// ---------- Khối 10A: DS18B20 (nhiệt độ nước) ----------
#define PIN_DS18B20        4      // DATA -> GPIO4 (trở kéo 4.7kΩ DATA->3V3 nếu dùng cảm biến trần)

// ---------- Khối 10B: TDS Meter V1.0 (độ mặn) ----------
#define PIN_TDS            35     // AO -> GPIO35 (input-only ADC1)
#define TDS_VREF           3.3f   // điện áp tham chiếu ADC
#define TDS_SAMPLES        30     // số mẫu lấy trung bình để khử nhiễu
#define TDS_TO_SALINITY    0.5f   // hệ số quy đổi ppm(KCl) -> NaCl, cần hiệu chuẩn thực tế

// ---------- Khối 10C: Voltage Sensor 0–25V (điện áp pin BMS) ----------
#define PIN_VBAT           34     // S -> GPIO34 (input-only ADC1)
#define VBAT_DIVIDER       5.0f   // module 0–25V dùng cầu chia tỉ lệ 5:1

// ---------- Khối 10D: microSD (VSPI) ----------
#define PIN_SD_CS          5
#define PIN_SD_SCK         18
#define PIN_SD_MOSI        23
#define PIN_SD_MISO        19
#define SD_LOG_PATH        "/telemetry.csv"

// ---------- Khối 11: Module 4G TDM-4G-V2 (A7680/A7682) trên Serial2 ----------
#define PIN_MODEM_RX       16     // ESP32 RX2 <- modem TXD
#define PIN_MODEM_TX       17     // ESP32 TX2 -> modem RXD
#define PIN_MODEM_PEN      27     // PEN: bật/tắt module (không dùng MOSFET nguồn)
#define MODEM_BAUD         115200

// ---------- Khối 12: DRV8825 trục NGHIÊNG (vít me T8) ----------
// RESET & SLEEP nối chung kéo lên 3V3 (theo sơ đồ) -> chỉ cần STEP/DIR/EN từ ESP32.
#define PIN_TILT_STEP      32
#define PIN_TILT_DIR       33
#define PIN_TILT_EN        25     // active-LOW: LOW = cấp dòng, HIGH = nhả

// ---------- Khối 14: DRV8825 trục QUAY (mâm xoay) ----------
// Lưu ý: GPIO12 là chân strapping (MTDI) - phải LOW lúc boot, EN có pulldown nên an toàn.
#define PIN_ROT_STEP       26
#define PIN_ROT_DIR        14
#define PIN_ROT_EN         12     // active-LOW

// ---------- Chu kỳ & ngưỡng ----------
#define TELEMETRY_PERIOD_MS   60000UL   // gửi telemetry mỗi 60s
#define MQTT_KEEPALIVE_S      60
#define RED_THRESHOLD_GL      4.0f      // độ mặn cảnh báo đỏ (chỉ để log tại chỗ)

// Topic MQTT khớp backend: waterqa/<station_id>/telemetry
#define MQTT_TOPIC_PREFIX  "waterqa/"
#define MQTT_TOPIC_SUFFIX  "/telemetry"
