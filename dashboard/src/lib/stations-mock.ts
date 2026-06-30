import type { StationDetail, HistoryPoint, AlertLevel, AlertEvent } from './types';

// Các vùng (quận/huyện) khớp đúng với roster trạm trong backend/schema.sql.
export const HAI_PHONG_REGIONS = [
	'Tiên Lãng',
	'Thủy Nguyên',
	'Hải An',
	'Kiến Thụy',
	'Cát Hải',
	'Vĩnh Bảo',
	'Đồ Sơn'
];

function alertFor(ec: number): AlertLevel {
	if (ec > 4) return 'red';
	if (ec >= 1) return 'yellow';
	return 'green';
}

function minsAgo(mins: number): string {
	return new Date(Date.now() - mins * 60_000).toISOString();
}

// Fallback khi không gọi được backend. Roster (id/tên/vùng/toạ độ) khớp ĐÚNG
// backend/schema.sql (ST001..ST008) để dashboard nhất quán dù online hay offline.
// ST001 là trạm phần cứng thật; phủ đủ các mức cảnh báo green/yellow/red.
export const MOCK_STATION_DETAILS: StationDetail[] = [
	{
		station_id: 'ST001',
		name: 'Cửa sông Văn Úc',
		region: 'Tiên Lãng',
		lat: 20.6712,
		lon: 106.5483,
		ec: 2.1,
		temp: 28.4,
		level: 1.5,
		forecast_24h: 2.6,
		forecast_48h: 2.9,
		alert: alertFor(2.1),
		battery: 88,
		signal: 4,
		trend: 'up',
		updated_at: minsAgo(3)
	},
	{
		station_id: 'ST002',
		name: 'Cửa sông Bạch Đằng',
		region: 'Thủy Nguyên',
		lat: 20.7891,
		lon: 106.7654,
		ec: 4.6,
		temp: 29.3,
		level: 1.9,
		forecast_24h: 5.0,
		forecast_48h: 5.2,
		alert: alertFor(4.6),
		battery: 73,
		signal: 4,
		trend: 'up',
		updated_at: minsAgo(6)
	},
	{
		station_id: 'ST003',
		name: 'Cửa sông Lạch Tray',
		region: 'Hải An',
		lat: 20.8123,
		lon: 106.6892,
		ec: 2.9,
		temp: 28.9,
		level: 1.7,
		forecast_24h: 3.3,
		forecast_48h: 3.0,
		alert: alertFor(2.9),
		battery: 64,
		signal: 3,
		trend: 'up',
		updated_at: minsAgo(11)
	},
	{
		station_id: 'ST004',
		name: 'Cửa Cấm',
		region: 'Hải An',
		lat: 20.855,
		lon: 106.72,
		ec: 1.4,
		temp: 28.1,
		level: 1.4,
		forecast_24h: 1.7,
		forecast_48h: 1.5,
		alert: alertFor(1.4),
		battery: 92,
		signal: 4,
		trend: 'flat',
		updated_at: minsAgo(18)
	},
	{
		station_id: 'ST005',
		name: 'Sông Đa Độ',
		region: 'Kiến Thụy',
		lat: 20.74,
		lon: 106.62,
		ec: 0.6,
		temp: 27.6,
		level: 1.2,
		forecast_24h: 0.9,
		forecast_48h: 0.8,
		alert: alertFor(0.6),
		battery: 41,
		signal: 2,
		trend: 'down',
		updated_at: minsAgo(24)
	},
	{
		station_id: 'ST006',
		name: 'Cửa Nam Triệu',
		region: 'Cát Hải',
		lat: 20.83,
		lon: 106.85,
		ec: 4.2,
		temp: 29.6,
		level: 2.0,
		forecast_24h: 4.7,
		forecast_48h: 4.9,
		alert: alertFor(4.2),
		battery: 80,
		signal: 3,
		trend: 'up',
		updated_at: minsAgo(9)
	},
	{
		station_id: 'ST007',
		name: 'Sông Thái Bình',
		region: 'Vĩnh Bảo',
		lat: 20.61,
		lon: 106.45,
		ec: 0.4,
		temp: 27.2,
		level: 1.1,
		forecast_24h: 0.6,
		forecast_48h: 0.5,
		alert: alertFor(0.4),
		battery: 19,
		signal: 1,
		trend: 'down',
		updated_at: minsAgo(52)
	},
	{
		station_id: 'ST008',
		name: 'Bến Đồ Sơn',
		region: 'Đồ Sơn',
		lat: 20.71,
		lon: 106.78,
		ec: 3.1,
		temp: 28.7,
		level: 1.6,
		forecast_24h: 3.5,
		forecast_48h: 3.8,
		alert: alertFor(3.1),
		battery: 57,
		signal: 3,
		trend: 'up',
		updated_at: minsAgo(15)
	}
];

// Deterministic pseudo-random from a string seed so a station's history is stable.
function seed(str: string): number {
	let h = 0;
	for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
	return h;
}

// Deterministic alert history derived from the station roster. Red stations
// produce danger events, caution stations yellow ones, and "safe" stations a
// single past spike — so the history list always shows realistic variety.
export function mockAlertHistory(): AlertEvent[] {
	const out: AlertEvent[] = [];

	for (const st of MOCK_STATION_DETAILS) {
		const s = seed(st.station_id);
		const plan: AlertEvent['level'][] =
			st.alert === 'red'
				? ['red', 'red', 'yellow']
				: st.alert === 'yellow'
					? ['yellow', 'yellow']
					: ['yellow']; // a green station that crossed caution earlier

		plan.forEach((level, i) => {
			const hoursAgo = 3 + ((s >> (i * 3)) & 31) + i * 22; // spread across ~a week
			const ts = new Date(Date.now() - hoursAgo * 3_600_000).toISOString();
			const frac = ((s >> i) & 7) / 7;
			const ec =
				level === 'red'
					? Number((4.1 + frac * 1.4).toFixed(1))
					: Number((1.1 + frac * 2.6).toFixed(1));
			out.push({
				id: `${st.station_id}-${i}`,
				station_id: st.station_id,
				station: st.name,
				region: st.region,
				level,
				ec,
				message:
					level === 'red'
						? 'EC exceeded 4 g/L — close the gates immediately'
						: 'EC crossed the 1 g/L caution threshold',
				ts
			});
		});
	}

	return out.sort((a, b) => +new Date(b.ts) - +new Date(a.ts));
}

export function mockHistory(stationId: string, from: string, to: string): HistoryPoint[] {
	const start = new Date(from).getTime();
	const end = new Date(to).getTime();
	const span = Math.max(end - start, 3_600_000);
	const points = 48;
	const step = span / points;
	const base = MOCK_STATION_DETAILS.find((s) => s.station_id === stationId)?.ec ?? 1.5;
	const s = seed(stationId);

	return Array.from({ length: points + 1 }, (_, i) => {
		const t = start + i * step;
		const wave = Math.sin((i / points) * Math.PI * 2 + (s % 7)) * 0.6;
		const drift = (i / points) * 0.4;
		const jitter = (((s >> (i % 16)) & 7) - 3) * 0.05;
		const ec = Math.max(0.1, base * 0.6 + wave + drift + jitter);
		return {
			ts: new Date(t).toISOString(),
			ec: Number(ec.toFixed(2)),
			temp: Number((27 + Math.sin(i / 6) * 1.5).toFixed(1)),
			level: Number((1.2 + Math.sin(i / 9) * 0.4).toFixed(2))
		};
	});
}
