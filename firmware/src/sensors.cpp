#include "sensors.h"
#include "config.h"
#include <OneWire.h>
#include <DallasTemperature.h>

static OneWire oneWire(PIN_DS18B20);
static DallasTemperature ds18b20(&oneWire);

void sensorsBegin() {
	ds18b20.begin();
	// ADC1 (GPIO34/35): 12-bit, dải đầy đủ ~0–3.3V cho cảm biến chia áp.
	analogReadResolution(12);
	analogSetPinAttenuation(PIN_TDS, ADC_11db);
	analogSetPinAttenuation(PIN_VBAT, ADC_11db);
}

// Đọc DS18B20; trả NAN nếu cảm biến mất kết nối để tầng trên xử lý.
static float readTemperature() {
	ds18b20.requestTemperatures();
	const float t = ds18b20.getTempCByIndex(0);
	return (t == DEVICE_DISCONNECTED_C) ? NAN : t;
}

// Trung bình ADC nhiều mẫu -> giảm nhiễu cho tín hiệu analog chậm.
static float averageAdcVoltage(uint8_t pin) {
	uint32_t sum = 0;
	for (uint8_t i = 0; i < TDS_SAMPLES; i++) {
		sum += analogRead(pin);
		delay(2);
	}
	const float raw = static_cast<float>(sum) / TDS_SAMPLES;
	return raw / 4095.0f * TDS_VREF;
}

// TDS Meter V1.0 -> độ mặn (g/L). Công thức bậc 3 chuẩn của module Gravity,
// có bù nhiệt; ppm sau đó quy đổi sang g/L NaCl qua TDS_TO_SALINITY.
static float readSalinity(float temp) {
	const float voltage = averageAdcVoltage(PIN_TDS);
	const float comp = 1.0f + 0.02f * ((isnan(temp) ? 25.0f : temp) - 25.0f);
	const float v = voltage / comp;
	const float tdsPpm =
		(133.42f * v * v * v - 255.86f * v * v + 857.39f * v) * 0.5f;
	const float salinity = tdsPpm * TDS_TO_SALINITY / 1000.0f;
	return salinity < 0.0f ? 0.0f : salinity;
}

// Voltage Sensor 0–25V: nhân lại tỉ lệ cầu chia để ra điện áp pin thực.
static float readBatteryVoltage() {
	return averageAdcVoltage(PIN_VBAT) * VBAT_DIVIDER;
}

SensorReading sensorsRead() {
	SensorReading r;
	r.temp = readTemperature();
	r.ec = readSalinity(r.temp);
	r.level = 0.0f;  // mực nước lấy từ web VN, không đo tại trạm
	r.vbat = readBatteryVoltage();
	return r;
}
