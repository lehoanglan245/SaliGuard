// SaliGuard - Firmware ESP32 DevKit V1 (khối 9 trong sơ đồ).
// Luồng: đọc DS18B20 + TDS -> tạo JSON {temp, ec, level} -> gửi MQTT qua 4G
// -> đồng thời log microSD. Khung điều khiển 2 DRV8825 sẵn sàng (chưa auto-track).
//
// Payload khớp backend (CLAUDE.md, mục 5.2): topic waterqa/<station_id>/telemetry.

#include <Arduino.h>
#include <ArduinoJson.h>
#include "config.h"
#include "sensors.h"
#include "modem-mqtt.h"
#include "sd-logger.h"
#include "solar-tracker.h"

static uint32_t lastTelemetryMs = 0;

// Dựng JSON telemetry vào buffer. Chỉ gồm temp/ec/level đúng hợp đồng backend;
// vbat ghi riêng ra SD, không đẩy lên broker.
static void buildTelemetryJson(const SensorReading& r, char* out, size_t len) {
	JsonDocument doc;
	doc["temp"] = round(r.temp * 10) / 10.0;   // 1 chữ số thập phân
	doc["ec"] = round(r.ec * 1000) / 1000.0;   // g/L, 3 chữ số
	doc["level"] = r.level;                     // = 0 (mực nước lấy từ web VN)
	serializeJson(doc, out, len);
}

static void publishCycle() {
	const SensorReading r = sensorsRead();

	// In giá trị đo được ra Serial Monitor để kiểm tra cảm biến.
	Serial.printf("[SENS] temp=%.2f C | ec=%.3f g/L | level=%.2f m | vbat=%.2f V\n",
	              r.temp, r.ec, r.level, r.vbat);

	if (isnan(r.temp)) {
		Serial.println(F("[SENS] DS18B20 mất kết nối - bỏ chu kỳ này"));
		sdLog(r, false);
		return;
	}

	char json[128];
	buildTelemetryJson(r, json, sizeof(json));

	if (r.ec > RED_THRESHOLD_GL) {
		Serial.printf("[ALERT] 🔴 Độ mặn %.2f g/L > %.1f g/L\n", r.ec, RED_THRESHOLD_GL);
	}

	bool sent = false;
	if (modemEnsureConnected()) {
		sent = mqttPublishTelemetry(json);
	} else {
		Serial.println(F("[NET] Không kết nối được - chỉ log SD"));
	}

	sdLog(r, sent);  // luôn lưu cục bộ dù gửi được hay không
}

void setup() {
	Serial.begin(115200);
	delay(200);
	Serial.println(F("\n=== SaliGuard firmware - station " SECRET_STATION_ID " ==="));

	sensorsBegin();
	trackerBegin();
	sdBegin();
	modemBegin();

	publishCycle();          // gửi ngay 1 lần lúc khởi động
	lastTelemetryMs = millis();
}

void loop() {
	mqttLoop();  // giữ phiên MQTT sống giữa các chu kỳ

	if (millis() - lastTelemetryMs >= TELEMETRY_PERIOD_MS) {
		publishCycle();
		lastTelemetryMs = millis();
	}
}
