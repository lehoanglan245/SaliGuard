import 'dotenv/config';
import { Pool } from 'pg';

/**
 * Kết nối PostgreSQL/TimescaleDB qua connection pool.
 * Cấu hình đọc hoàn toàn từ biến môi trường (.env), không hardcode.
 */
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT ?? 5432),
});

pool.on('error', (err: Error) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

/** Thông tin tĩnh của một trạm đo. */
export interface StationRow {
  station_id: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
}

/** Một điểm dữ liệu lịch sử (cho biểu đồ). */
export interface HistoryRow {
  ts: string;
  ec: number;
  temp: number;
  level: number;
}

/** Một bản ghi telemetry vượt ngưỡng cảnh báo (kèm thông tin trạm). */
export interface AlertRow {
  ts: string;
  station_id: string;
  station: string;
  region: string;
  ec: number;
  forecast_24h: number | null;
}

/** Bản ghi số liệu mới nhất của một trạm (chưa kèm mức cảnh báo). */
export interface LatestRow {
  station_id: string;
  temp: number;
  ec: number;
  level: number;
  forecast_24h: number | null;
  forecast_48h: number | null;
  updated_at: string;
}

/**
 * Insert một bản ghi telemetry vào hypertable `telemetry`.
 *
 * @param station_id - Mã trạm đo (vd: "ST001")
 * @param temp - Nhiệt độ nước (°C)
 * @param ec - Độ dẫn điện / độ mặn (g/L)
 * @param level - Mực nước (m)
 * @param forecast_24h - Dự báo độ mặn 24h từ AI Engine (có thể null nếu AI lỗi)
 * @param forecast_48h - Dự báo độ mặn 48h từ AI Engine (có thể null nếu AI lỗi)
 */
export async function insertTelemetry(
  station_id: string,
  temp: number,
  ec: number,
  level: number,
  forecast_24h: number | null = null,
  forecast_48h: number | null = null
): Promise<void> {
  const sql = `
    INSERT INTO telemetry (time, station_id, temp, ec, level, forecast_24h, forecast_48h)
    VALUES (NOW(), $1, $2, $3, $4, $5, $6)
  `;

  try {
    await pool.query(sql, [station_id, temp, ec, level, forecast_24h, forecast_48h]);
    console.log(`[DB] Inserted telemetry for station "${station_id}"`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[DB] Failed to insert telemetry for "${station_id}":`, message);
  }
}

/** Lấy danh sách tất cả trạm đo, sắp xếp theo mã trạm. */
export async function getStations(): Promise<StationRow[]> {
  const sql = `
    SELECT station_id, name, region, lat, lon
    FROM stations
    ORDER BY station_id
  `;
  const { rows } = await pool.query<StationRow>(sql);
  return rows;
}

/**
 * Lấy chuỗi dữ liệu lịch sử của một trạm trong khoảng [from, to].
 * Sắp xếp tăng dần theo thời gian để vẽ biểu đồ.
 */
export async function getHistory(
  stationId: string,
  from: string,
  to: string
): Promise<HistoryRow[]> {
  const sql = `
    SELECT time AS ts, ec, temp, level
    FROM telemetry
    WHERE station_id = $1 AND time >= $2 AND time <= $3
    ORDER BY time ASC
  `;
  const { rows } = await pool.query<HistoryRow>(sql, [stationId, from, to]);
  return rows;
}

/**
 * Lấy các SỰ KIỆN cảnh báo trên toàn mạng lưới, mới nhất trước.
 *
 * Chỉ giữ thời điểm mức cảnh báo "LEO THANG" (green→yellow, yellow→red...) thay
 * vì trả mọi bản ghi vượt ngưỡng — tránh trùng lặp dày đặc khi trạm đo liên tục.
 * Mức tính theo COALESCE(forecast_24h, ec): >=4 = đỏ (2), >=1 = vàng (1).
 * Dùng LAG để so mức của lần đo liền trước trong cùng một trạm.
 */
export async function getAlerts(limit = 200): Promise<AlertRow[]> {
  const sql = `
    WITH leveled AS (
      SELECT t.time AS ts, t.station_id, s.name AS station, s.region,
             t.ec, t.forecast_24h,
             CASE
               WHEN COALESCE(t.forecast_24h, t.ec) >= 4 THEN 2
               WHEN COALESCE(t.forecast_24h, t.ec) >= 1 THEN 1
               ELSE 0
             END AS lvl
      FROM telemetry t
      JOIN stations s ON s.station_id = t.station_id
    ),
    escalations AS (
      SELECT leveled.*,
             LAG(lvl) OVER (PARTITION BY station_id ORDER BY ts) AS prev_lvl
      FROM leveled
    )
    SELECT ts, station_id, station, region, ec, forecast_24h
    FROM escalations
    WHERE lvl > 0 AND lvl > COALESCE(prev_lvl, 0)
    ORDER BY ts DESC
    LIMIT $1
  `;
  const { rows } = await pool.query<AlertRow>(sql, [limit]);
  return rows;
}

/** Kiểm tra một trạm có tồn tại không. */
export async function stationExists(stationId: string): Promise<boolean> {
  const sql = `SELECT 1 FROM stations WHERE station_id = $1 LIMIT 1`;
  const { rowCount } = await pool.query(sql, [stationId]);
  return (rowCount ?? 0) > 0;
}

/**
 * Lấy bản ghi telemetry mới nhất của một trạm.
 * Trả về null nếu trạm chưa có dữ liệu nào.
 */
export async function getLatestReading(stationId: string): Promise<LatestRow | null> {
  const sql = `
    SELECT station_id, temp, ec, level, forecast_24h, forecast_48h, time AS updated_at
    FROM telemetry
    WHERE station_id = $1
    ORDER BY time DESC
    LIMIT 1
  `;
  const { rows } = await pool.query<LatestRow>(sql, [stationId]);
  return rows[0] ?? null;
}

export default pool;
