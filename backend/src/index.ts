import 'dotenv/config';
import { readFileSync } from 'node:fs';
import mqtt from 'mqtt';
import type { IClientOptions } from 'mqtt';
import app from './api.js';
import { insertTelemetry } from './db.js';
import { telemetrySchema, forecastResponseSchema } from './schemas.js';

const MQTT_URL = process.env.MQTT_URL ?? 'mqtt://localhost:1883';
const AI_ENGINE_URL = process.env.AI_ENGINE_URL ?? 'http://localhost:8000/predict';
const API_PORT = Number(process.env.API_PORT ?? 3000);
const TELEMETRY_TOPIC = 'waterqa/+/telemetry';
const RED_THRESHOLD = 4; // g/L -> mức cảnh báo đỏ

/**
 * Tùy chọn kết nối MQTT. Khi dùng `mqtts://` (TLS) thì gắn kèm chứng chỉ CA
 * (nếu có) và thông tin đăng nhập. Mọi cấu hình đọc từ .env, không hardcode.
 */
function buildMqttOptions(): IClientOptions {
  const options: IClientOptions = {};

  if (process.env.MQTT_USERNAME) options.username = process.env.MQTT_USERNAME;
  if (process.env.MQTT_PASSWORD) options.password = process.env.MQTT_PASSWORD;

  // TLS: chỉ áp dụng khi dùng mqtts://. CA tùy chọn cho broker self-signed.
  if (MQTT_URL.startsWith('mqtts://')) {
    if (process.env.MQTT_CA_CERT) {
      options.ca = readFileSync(process.env.MQTT_CA_CERT);
    }
    // Mặc định verify chứng chỉ broker; chỉ tắt khi đặt MQTT_TLS_INSECURE=true.
    options.rejectUnauthorized = process.env.MQTT_TLS_INSECURE !== 'true';
  }

  return options;
}

// --- 1. Khởi động REST API server ---
app.listen(API_PORT, () => {
  console.log(`[API] REST server listening on http://localhost:${API_PORT}`);
});

// --- 2. Kết nối MQTT Broker (hỗ trợ TLS qua mqtts://) ---
const client = mqtt.connect(MQTT_URL, buildMqttOptions());

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

  let raw: unknown;
  try {
    raw = JSON.parse(message.toString());
  } catch {
    console.error(`[MQTT] Invalid JSON on topic "${topic}":`, message.toString());
    return;
  }

  // Validate payload: từ chối dữ liệu thiếu field / sai kiểu / có field lạ.
  const parsed = telemetrySchema.safeParse(raw);
  if (!parsed.success) {
    console.error(`[MQTT] Invalid telemetry on "${topic}":`, parsed.error.issues);
    return;
  }

  const { temp, ec, level } = parsed.data;
  console.log(`[MQTT] ${station_id} =>`, parsed.data);

  // 3a. Gọi AI Engine để lấy dự báo (trước, để lưu kèm vào DB).
  let forecast24: number | null = null;
  let forecast48: number | null = null;
  try {
    const response = await fetch(AI_ENGINE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ temp, ec, level }),
    });

    if (response.ok) {
      const result = forecastResponseSchema.safeParse(await response.json());
      if (!result.success) {
        console.error(`[AI] Invalid response shape from engine:`, result.error.issues);
      } else {
        forecast24 = result.data.forecast_24h;
        forecast48 = result.data.forecast_48h;
        console.log(
          `[AI] ${station_id} forecast_24h = ${forecast24} g/L, forecast_48h = ${forecast48} g/L`
        );

        if (forecast24 > RED_THRESHOLD) {
          console.warn(
            `[ALERT] 🔴 RED ALERT for station "${station_id}": forecast ${forecast24} g/L > ${RED_THRESHOLD} g/L`
          );
        }
      }
    } else {
      console.error(`[AI] Engine responded with status ${response.status}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[AI] Failed to reach AI Engine at ${AI_ENGINE_URL}:`, msg);
  }

  // 3b. Lưu telemetry + forecast vào PostgreSQL (forecast có thể null nếu AI lỗi).
  await insertTelemetry(station_id, temp, ec, level, forecast24, forecast48);
});
