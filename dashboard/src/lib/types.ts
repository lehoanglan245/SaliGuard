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
