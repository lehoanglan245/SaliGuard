import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';

/** Trạng thái cảnh báo dựa trên độ mặn dự báo. */
type AlertLevel = 'green' | 'yellow' | 'red';

interface Station {
  station_id: string;
  name: string;
  lat: number;
  lon: number;
}

interface LatestReading {
  station_id: string;
  temp: number;
  ec: number;
  level: number;
  forecast_24h: number;
  alert: AlertLevel;
  updated_at: string;
}

const app = express();

app.use(cors());
app.use(express.json());

// --- Mock data (sẽ thay bằng truy vấn DB thật ở bước sau) ---
const MOCK_STATIONS: Station[] = [
  { station_id: 'ST001', name: 'Cửa sông Văn Úc', lat: 20.6712, lon: 106.5483 },
  { station_id: 'ST002', name: 'Cửa sông Bạch Đằng', lat: 20.7891, lon: 106.7654 },
  { station_id: 'ST003', name: 'Cửa sông Lạch Tray', lat: 20.8123, lon: 106.6892 },
];

/** Quy đổi giá trị dự báo độ mặn (g/L) sang mức cảnh báo. */
function classifyAlert(forecast_24h: number): AlertLevel {
  if (forecast_24h >= 4) return 'red';
  if (forecast_24h >= 1) return 'yellow';
  return 'green';
}

// GET /api/stations - danh sách các trạm đo
app.get('/api/stations', (_req: Request, res: Response) => {
  res.json(MOCK_STATIONS);
});

// GET /api/latest?station=ID - số liệu mới nhất của một trạm
app.get('/api/latest', (req: Request, res: Response) => {
  const station = String(req.query.station ?? '');

  if (!station) {
    return res.status(400).json({ error: 'Missing required query param: station' });
  }

  const exists = MOCK_STATIONS.some((s) => s.station_id === station);
  if (!exists) {
    return res.status(404).json({ error: `Station "${station}" not found` });
  }

  const forecast_24h = Number((Math.random() * 5 + 0.5).toFixed(2));
  const reading: LatestReading = {
    station_id: station,
    temp: Number((Math.random() * 8 + 24).toFixed(2)),
    ec: Number((Math.random() * 5 + 0.5).toFixed(2)),
    level: Number((Math.random() * 2 + 0.5).toFixed(2)),
    forecast_24h,
    alert: classifyAlert(forecast_24h),
    updated_at: new Date().toISOString(),
  };

  res.json(reading);
});

export default app;
