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

/**
 * Insert một bản ghi telemetry vào hypertable `telemetry`.
 *
 * @param station_id - Mã trạm đo (vd: "ST001")
 * @param temp - Nhiệt độ nước (°C)
 * @param ec - Độ dẫn điện / độ mặn (g/L)
 * @param level - Mực nước (m)
 */
export async function insertTelemetry(
  station_id: string,
  temp: number,
  ec: number,
  level: number
): Promise<void> {
  const sql = `
    INSERT INTO telemetry (time, station_id, temp, ec, level)
    VALUES (NOW(), $1, $2, $3, $4)
  `;

  try {
    await pool.query(sql, [station_id, temp, ec, level]);
    console.log(`[DB] Inserted telemetry for station "${station_id}"`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[DB] Failed to insert telemetry for "${station_id}":`, message);
  }
}

export default pool;
