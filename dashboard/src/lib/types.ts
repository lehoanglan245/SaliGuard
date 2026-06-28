export type AlertLevel = 'green' | 'yellow' | 'red';

export interface Station {
	station_id: string;
	name: string;
	lat: number;
	lon: number;
}

export interface LatestReading {
	station_id: string;
	temp: number;
	ec: number;
	level: number;
	forecast_24h: number;
	alert: AlertLevel;
	updated_at: string;
}

export interface StationView {
	station: Station;
	reading: LatestReading | null;
}

export type TrendDirection = 'up' | 'down' | 'flat';

export interface StationDetail {
	station_id: string;
	name: string;
	region: string;
	lat: number;
	lon: number;
	ec: number; // g/L
	temp: number; // °C
	level: number; // m
	forecast_24h: number; // g/L
	forecast_48h: number; // g/L
	alert: AlertLevel;
	battery: number; // %
	signal: number; // signal bars 0–4
	trend: TrendDirection; // EC change vs previous reading
	updated_at: string; // ISO timestamp
}

export interface HistoryPoint {
	ts: string; // ISO timestamp
	ec: number;
	temp: number;
	level: number;
}

// A single threshold-crossing event for the Alerts history page.
// Alerts only fire at caution (yellow) or danger (red) — never green.
export interface AlertEvent {
	id: string;
	station_id: string;
	station: string; // station name
	region: string;
	level: Exclude<AlertLevel, 'green'>;
	ec: number; // g/L at the time of the alert
	message: string;
	ts: string; // ISO timestamp
}

export interface TopStation {
	name: string;
	value: number;
	alert: AlertLevel;
}

export interface DashboardSummary {
	total: number;
	greenCount: number;
	atRiskCount: number;
	safePct: number;
	healthPct: number;
	topStations: TopStation[];
}
