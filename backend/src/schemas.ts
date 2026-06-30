// Zod schemas để validate mọi dữ liệu ĐẦU VÀO không tin cậy:
//  - payload telemetry nhận qua MQTT (từ ESP32 ngoài hiện trường)
//  - phản hồi từ AI Engine
//  - query params của REST API
// Dùng z.strictObject để từ chối field lạ (bảo vệ chặt hơn z.object).

import { z } from 'zod';

/** Payload JSON do ESP32 publish lên topic waterqa/<id>/telemetry. */
export const telemetrySchema = z.strictObject({
  temp: z.number().finite(),
  ec: z.number().finite().nonnegative(),
  level: z.number().finite(),
});
export type TelemetryPayload = z.infer<typeof telemetrySchema>;

/** Kết quả dự báo trả về từ AI Engine. */
export const forecastResponseSchema = z.strictObject({
  forecast_24h: z.number().finite(),
  forecast_48h: z.number().finite(),
});
export type ForecastResponse = z.infer<typeof forecastResponseSchema>;

/** Query của GET /api/latest và các endpoint chỉ cần mã trạm. */
export const stationQuerySchema = z.strictObject({
  station: z.string().min(1, 'Missing required query param: station'),
});

/** Mốc thời gian phải parse được (giữ nguyên độ "rộng" như Date.parse cũ). */
const dateString = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), 'Invalid date format');

/** Query của GET /api/history (kèm khoảng thời gian hợp lệ). */
export const historyQuerySchema = z.strictObject({
  station: z.string().min(1),
  from: dateString,
  to: dateString,
});
