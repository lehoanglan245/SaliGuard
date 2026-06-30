import 'dotenv/config';
import mqtt from 'mqtt';
import app from './api.js';
import { insertTelemetry, ensureUsersTable, getUserEmailsByProvince } from './db.js';
import { sendAlertEmail } from './mailer.js';

/** Payload JSON do ESP32 publish lên MQTT. */
interface TelemetryPayload {
  temp: number;
  ec: number;
  level: number;
}

/** Kết quả dự báo trả về từ AI Engine. */
interface ForecastResponse {
  forecast_24h: number;
}

const MQTT_URL = process.env.MQTT_URL ?? 'mqtt://localhost:1883';
const AI_ENGINE_URL = process.env.AI_ENGINE_URL ?? 'http://localhost:8000/predict';
const API_PORT = Number(process.env.API_PORT ?? 3000);
const TELEMETRY_TOPIC = 'waterqa/+/telemetry';
const RED_THRESHOLD = 4;    // g/L → đỏ
const YELLOW_THRESHOLD = 1; // g/L → vàng

// Province của từng trạm — mở rộng khi thêm trạm mới
const STATION_PROVINCE: Record<string, string> = {
  ST001: 'Hải Phòng',
  ST002: 'Hải Phòng',
  ST003: 'Hải Phòng',
};

const STATION_NAME: Record<string, string> = {
  ST001: 'Cửa sông Văn Úc',
  ST002: 'Cửa sông Bạch Đằng',
  ST003: 'Cửa sông Lạch Tray',
};

// --- 1. Khởi động REST API server + đảm bảo DB schema ---
app.listen(API_PORT, () => {
  console.log(`[API] REST server listening on http://localhost:${API_PORT}`);
});
ensureUsersTable();

// --- 2. Kết nối MQTT Broker ---
const client = mqtt.connect(MQTT_URL);

client.on('connect', () => {
  console.log(`[MQTT] Connected to broker ${MQTT_URL}`);
  client.subscribe(TELEMETRY_TOPIC, (err) => {
    if (err) {
      console.error('[MQTT] Subscribe failed:', err.message);
      return;
    }
    console.log(`[MQTT] Subscribed to topic "${TELEMETRY_TOPIC}"`);
  });
});

client.on('error', (err: Error) => {
  console.error('[MQTT] Connection error:', err.message);
});

// --- 3. Xử lý message telemetry ---
client.on('message', async (topic: string, message: Buffer) => {
  // topic dạng: waterqa/<station_id>/telemetry
  const station_id = topic.split('/')[1] ?? 'unknown';

  let payload: TelemetryPayload;
  try {
    payload = JSON.parse(message.toString()) as TelemetryPayload;
  } catch {
    console.error(`[MQTT] Invalid JSON on topic "${topic}":`, message.toString());
    return;
  }

  const { temp, ec, level } = payload;
  console.log(`[MQTT] ${station_id} =>`, payload);

  // 3a. Lưu vào PostgreSQL
  await insertTelemetry(station_id, temp, ec, level);

  // 3b. Gọi AI Engine để lấy dự báo
  try {
    const response = await fetch(AI_ENGINE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ temp, ec, level }),
    });

    if (!response.ok) {
      console.error(`[AI] Engine responded with status ${response.status}`);
      return;
    }

    const result = (await response.json()) as ForecastResponse;
    const forecast = result.forecast_24h;

    console.log(`[AI] ${station_id} forecast_24h = ${forecast} g/L`);

    const alertLevel =
      forecast > RED_THRESHOLD ? 'red' : forecast > YELLOW_THRESHOLD ? 'yellow' : null;

    if (alertLevel) {
      const province = STATION_PROVINCE[station_id] ?? 'Unknown';
      const stationName = STATION_NAME[station_id] ?? station_id;
      console.warn(
        `[ALERT] ${alertLevel === 'red' ? '🔴' : '🟡'} ${alertLevel.toUpperCase()} for "${station_id}": ${forecast} g/L`
      );

      const emails = await getUserEmailsByProvince(province);
      for (const email of emails) {
        sendAlertEmail({ to: email, stationName, province, forecast24h: forecast, alertLevel }).catch(
          (err: unknown) => console.error('[MAIL] Failed to send to', email, err),
        );
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[AI] Failed to reach AI Engine at ${AI_ENGINE_URL}:`, msg);
  }
});
