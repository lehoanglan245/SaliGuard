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
  forecast_24h: number;
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
 */
export async function insertTelemetry(
  station_id: string,
  temp: number,
  ec: number,
  level: number,
  forecast_24h: number | null = null
): Promise<void> {
  const sql = `
    INSERT INTO telemetry (time, station_id, temp, ec, level, forecast_24h)
    VALUES (NOW(), $1, $2, $3, $4, $5)
  `;

  try {
    await pool.query(sql, [station_id, temp, ec, level, forecast_24h]);
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
 * Lấy các bản ghi vượt ngưỡng cảnh báo (>= 1 g/L theo forecast, hoặc ec nếu
 * chưa có forecast) trên toàn mạng lưới, mới nhất trước.
 */
export async function getAlerts(limit = 200): Promise<AlertRow[]> {
  const sql = `
    SELECT t.time AS ts, t.station_id, s.name AS station, s.region,
           t.ec, t.forecast_24h
    FROM telemetry t
    JOIN stations s ON s.station_id = t.station_id
    WHERE COALESCE(t.forecast_24h, t.ec) >= 1
    ORDER BY t.time DESC
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
    SELECT station_id, temp, ec, level, forecast_24h, time AS updated_at
    FROM telemetry
    WHERE station_id = $1
    ORDER BY time DESC
    LIMIT 1
  `;
  const { rows } = await pool.query<LatestRow>(sql, [stationId]);
  return rows[0] ?? null;
}

export default pool;
