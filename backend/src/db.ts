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

export interface UserProfile {
  email: string;
  province: string;
  district: string;
  commune?: string;
  farm_type?: string;
  farm_area?: string;
  water_source?: string;
  alert_threshold?: string;
  lead_time?: string;
  experience?: string;
}

/** Tạo bảng users nếu chưa tồn tại. Gọi khi khởi động server. */
export async function ensureUsersTable(): Promise<void> {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id          SERIAL PRIMARY KEY,
      email       TEXT NOT NULL UNIQUE,
      province    TEXT NOT NULL,
      district    TEXT NOT NULL,
      commune     TEXT,
      farm_type   TEXT,
      farm_area   TEXT,
      water_source TEXT,
      alert_threshold TEXT,
      lead_time   TEXT,
      experience  TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  try {
    await pool.query(sql);
    console.log('[DB] users table ready');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[DB] Failed to ensure users table:', message);
  }
}

/** Upsert user profile (update nếu email đã tồn tại). */
export async function saveUser(user: UserProfile): Promise<void> {
  const sql = `
    INSERT INTO users (email, province, district, commune, farm_type, farm_area, water_source, alert_threshold, lead_time, experience)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    ON CONFLICT (email) DO UPDATE SET
      province = EXCLUDED.province,
      district = EXCLUDED.district,
      commune = EXCLUDED.commune,
      farm_type = EXCLUDED.farm_type,
      farm_area = EXCLUDED.farm_area,
      water_source = EXCLUDED.water_source,
      alert_threshold = EXCLUDED.alert_threshold,
      lead_time = EXCLUDED.lead_time,
      experience = EXCLUDED.experience
  `;
  try {
    await pool.query(sql, [
      user.email, user.province, user.district, user.commune ?? null,
      user.farm_type ?? null, user.farm_area ?? null, user.water_source ?? null,
      user.alert_threshold ?? null, user.lead_time ?? null, user.experience ?? null,
    ]);
    console.log(`[DB] Saved user profile for ${user.email}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[DB] Failed to save user:', message);
    throw err;
  }
}

/** Lấy danh sách email user đang ở province bị ảnh hưởng. */
export async function getUserEmailsByProvince(province: string): Promise<string[]> {
  try {
    const result = await pool.query<{ email: string }>(
      'SELECT email FROM users WHERE province = $1',
      [province],
    );
    return result.rows.map((r) => r.email);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[DB] Failed to query users by province:', message);
    return [];
  }
}

export default pool;
