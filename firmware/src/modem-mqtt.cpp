#include "modem-mqtt.h"
#include "config.h"
#include <TinyGsmClient.h>
#include <PubSubClient.h>

// TINY_GSM_MODEM_SIM7600 được khai báo ở platformio.ini (A7680/A7682 tương thích).
static TinyGsm modem(Serial2);
// MQTT over TLS: dùng client bảo mật của modem (cổng 8883, khớp broker production).
// Kết nối được MÃ HOÁ nên user/pass không đi cleartext qua Internet.
// Lưu ý: client này dựa vào SSL stack của A7680; xác thực CA pinning chặt cần nạp
// chứng chỉ vào modem bằng lệnh AT (xem README) - làm sau khi kết nối TLS chạy ổn.
static TinyGsmClientSecure gsmClient(modem);
static PubSubClient mqtt(gsmClient);

// Client-id duy nhất theo trạm để broker không từ chối phiên trùng.
static const char* MQTT_CLIENT_ID = "saliguard-" SECRET_STATION_ID;
static const char* TOPIC = MQTT_TOPIC_PREFIX SECRET_STATION_ID MQTT_TOPIC_SUFFIX;

void modemBegin() {
	// Bật module qua chân PEN (theo sơ đồ: không dùng MOSFET nguồn).
	pinMode(PIN_MODEM_PEN, OUTPUT);
	digitalWrite(PIN_MODEM_PEN, HIGH);
	delay(1500);  // chờ module ổn định nguồn trước khi nói AT

	Serial2.begin(MODEM_BAUD, SERIAL_8N1, PIN_MODEM_RX, PIN_MODEM_TX);
	delay(3000);

	Serial.println(F("[MODEM] Khởi tạo..."));

	// Chờ modem phản hồi AT (boot có thể mất 5-15s). Nếu hết retry mà im lặng
	// thì gần như chắc chắn lỗi UART: TX/RX ngược, thiếu GND chung, hoặc sai baud.
	bool atOk = false;
	for (uint8_t i = 1; i <= 10; i++) {
		Serial.printf("[MODEM] Test AT lần %u/10...\n", i);
		if (modem.testAT(2000)) {
			atOk = true;
			break;
		}
	}
	if (!atOk) {
		Serial.println(F("[MODEM] ❌ Modem KHÔNG phản hồi AT!"));
		Serial.println(F("[MODEM]   -> Kiểm tra: TX/RX có đấu chéo? (ESP32 GPIO16<-TXD, GPIO17->RXD)"));
		Serial.println(F("[MODEM]   -> GND của modem đã nối chung với GND ESP32 chưa?"));
		mqtt.setServer(SECRET_MQTT_HOST, SECRET_MQTT_PORT);
		mqtt.setKeepAlive(MQTT_KEEPALIVE_S);
		return;  // bỏ qua phần còn lại, không có modem thì hỏi SIM vô nghĩa
	}
	Serial.println(F("[MODEM] ✅ Modem phản hồi AT - UART OK"));

	modem.restart();
	Serial.print(F("[MODEM] Info: "));
	Serial.println(modem.getModemInfo());

	// --- Kiểm tra SIM ---
	const SimStatus sim = modem.getSimStatus();
	Serial.print(F("[SIM] Trạng thái: "));
	Serial.println(
		sim == SIM_READY      ? F("READY (SIM tốt, không khóa PIN)") :
		sim == SIM_LOCKED     ? F("LOCKED (SIM bị khóa PIN!)") :
		sim == SIM_ANTITHEFT_LOCKED ? F("ANTITHEFT_LOCKED") :
		F("ERROR (không nhận SIM - kiểm tra khe cắm/chiều SIM)"));

	const String ccid = modem.getSimCCID();
	if (ccid.length() > 0) {
		Serial.print(F("[SIM] CCID: "));
		Serial.println(ccid);
	}

	// CSQ 0-31 (càng cao càng khỏe); 99 = chưa có sóng.
	Serial.print(F("[SIM] Cường độ sóng (CSQ): "));
	Serial.println(modem.getSignalQuality());

	mqtt.setServer(SECRET_MQTT_HOST, SECRET_MQTT_PORT);
	mqtt.setKeepAlive(MQTT_KEEPALIVE_S);
}

// Kết nối lớp mạng (SIM + GPRS/LTE). Trả true nếu có IP.
static bool ensureNetwork() {
	if (modem.isGprsConnected()) return true;

	Serial.println(F("[MODEM] Chờ sóng mạng..."));
	if (!modem.waitForNetwork(60000L)) {
		Serial.println(F("[MODEM] Không bắt được sóng"));
		return false;
	}

	Serial.print(F("[MODEM] Kết nối APN "));
	Serial.println(SECRET_APN);
	if (!modem.gprsConnect(SECRET_APN, SECRET_APN_USER, SECRET_APN_PASS)) {
		Serial.println(F("[MODEM] GPRS thất bại"));
		return false;
	}
	Serial.print(F("[MODEM] Đã có IP: "));
	Serial.println(modem.localIP().toString());
	Serial.print(F("[MODEM] Nhà mạng: "));
	Serial.println(modem.getOperator());
	return true;
}

// Kết nối phiên MQTT tới broker. Trả true nếu đã connected.
static bool ensureMqtt() {
	if (mqtt.connected()) return true;

	Serial.print(F("[MQTT] Kết nối broker..."));
	bool ok = (strlen(SECRET_MQTT_USER) > 0)
		? mqtt.connect(MQTT_CLIENT_ID, SECRET_MQTT_USER, SECRET_MQTT_PASS)
		: mqtt.connect(MQTT_CLIENT_ID);

	if (ok) {
		Serial.println(F(" OK"));
	} else {
		Serial.print(F(" lỗi, rc="));
		Serial.println(mqtt.state());
	}
	return ok;
}

bool modemEnsureConnected() {
	return ensureNetwork() && ensureMqtt();
}

bool mqttPublishTelemetry(const char* json) {
	if (!mqtt.connected()) return false;
	const bool ok = mqtt.publish(TOPIC, json);
	Serial.print(F("[MQTT] publish "));
	Serial.print(TOPIC);
	Serial.print(F(" => "));
	Serial.println(ok ? json : "FAILED");
	return ok;
}

void mqttLoop() {
	mqtt.loop();
}
