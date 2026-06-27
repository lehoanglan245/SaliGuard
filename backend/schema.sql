-- SaliGuard - Database schema (PostgreSQL + TimescaleDB)
-- Chỉ dùng 1 bảng `telemetry` dạng hypertable.

-- Bật extension TimescaleDB (cần quyền superuser).
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Bảng lưu dữ liệu quan trắc từ các trạm cảm biến.
CREATE TABLE IF NOT EXISTS telemetry (
    time       TIMESTAMPTZ NOT NULL,
    station_id TEXT        NOT NULL,
    temp       REAL,
    ec         REAL,
    level      REAL
);

-- Chuyển telemetry thành hypertable, phân mảnh theo cột thời gian.
-- if_not_exists => chạy lại script nhiều lần không gây lỗi.
SELECT create_hypertable('telemetry', 'time', if_not_exists => TRUE);

-- Index hỗ trợ truy vấn dữ liệu mới nhất theo từng trạm.
CREATE INDEX IF NOT EXISTS idx_telemetry_station_time
    ON telemetry (station_id, time DESC);
