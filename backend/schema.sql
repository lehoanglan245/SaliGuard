-- SaliGuard - Database schema (PostgreSQL + TimescaleDB)
-- Chỉ dùng 1 bảng `telemetry` dạng hypertable.

-- Bật extension TimescaleDB (cần quyền superuser).
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Bảng danh mục các trạm đo (thông tin tĩnh: tên, toạ độ).
-- Dùng cho GET /api/stations và để Dashboard vẽ bản đồ.
CREATE TABLE IF NOT EXISTS stations (
    station_id TEXT PRIMARY KEY,
    name       TEXT             NOT NULL,
    region     TEXT             NOT NULL DEFAULT '',
    lat        DOUBLE PRECISION NOT NULL,
    lon        DOUBLE PRECISION NOT NULL
);

-- Dữ liệu mẫu: 3 trạm cửa sông ở Hải Phòng (kèm quận/huyện).
-- ON CONFLICT => chạy lại script nhiều lần không gây lỗi trùng khoá.
-- ST001 là trạm gắn phần cứng thật (khớp REAL_STATION_ID trong .env);
-- các trạm còn lại trả dữ liệu mock.
INSERT INTO stations (station_id, name, region, lat, lon) VALUES
    ('ST001', 'Cửa sông Văn Úc',    'Tiên Lãng',   20.6712, 106.5483),
    ('ST002', 'Cửa sông Bạch Đằng',  'Thủy Nguyên', 20.7891, 106.7654),
    ('ST003', 'Cửa sông Lạch Tray',  'Hải An',      20.8123, 106.6892),
    ('ST004', 'Cửa Cấm',             'Hải An',      20.8550, 106.7200),
    ('ST005', 'Sông Đa Độ',          'Kiến Thụy',   20.7400, 106.6200),
    ('ST006', 'Cửa Nam Triệu',       'Cát Hải',     20.8300, 106.8500),
    ('ST007', 'Sông Thái Bình',      'Vĩnh Bảo',    20.6100, 106.4500),
    ('ST008', 'Bến Đồ Sơn',          'Đồ Sơn',      20.7100, 106.7800)
ON CONFLICT (station_id) DO NOTHING;

-- Bảng lưu dữ liệu quan trắc từ các trạm cảm biến.
CREATE TABLE IF NOT EXISTS telemetry (
    time         TIMESTAMPTZ NOT NULL,
    station_id   TEXT        NOT NULL,
    temp         REAL,
    ec           REAL,
    level        REAL,
    forecast_24h REAL  -- dự báo độ mặn 24h do AI Engine trả về (lưu sẵn để API đọc nhanh)
);

-- Chuyển telemetry thành hypertable, phân mảnh theo cột thời gian.
-- if_not_exists => chạy lại script nhiều lần không gây lỗi.
SELECT create_hypertable('telemetry', 'time', if_not_exists => TRUE);

-- Index hỗ trợ truy vấn dữ liệu mới nhất theo từng trạm.
CREATE INDEX IF NOT EXISTS idx_telemetry_station_time
    ON telemetry (station_id, time DESC);
