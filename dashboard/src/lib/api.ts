import { env } from '$env/dynamic/public';
import type { Station, LatestReading, StationDetail, HistoryPoint, AlertEvent } from './types';
import { MOCK_STATION_DETAILS, mockHistory, mockAlertHistory } from './stations-mock';

export class ApiError extends Error {
	status: number;
	constructor(message: string, status: number) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
	}
}

function baseUrl(): string {
	const url = env.PUBLIC_API_URL;
	if (!url) throw new ApiError('PUBLIC_API_URL is not configured', 0);
	return url.replace(/\/$/, '');
}

export async function getStations(fetchFn: typeof fetch): Promise<Station[]> {
	const res = await fetchFn(`${baseUrl()}/api/stations`);
	if (!res.ok) throw new ApiError('Failed to fetch stations', res.status);
	return res.json();
}

export async function getLatest(fetchFn: typeof fetch, stationId: string): Promise<LatestReading> {
	const res = await fetchFn(`${baseUrl()}/api/latest?station=${encodeURIComponent(stationId)}`);
	if (!res.ok) throw new ApiError(`Failed to fetch latest for ${stationId}`, res.status);
	return res.json();
}

export type ChatReply = { reply: string };

// TODO: wire to the backend chatbot endpoint once it exists.
// Expected contract: POST /api/chat { message } -> { reply }.
export async function sendChatMessage(fetchFn: typeof fetch, message: string): Promise<ChatReply> {
	const res = await fetchFn(`${baseUrl()}/api/chat`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ message })
	});
	if (!res.ok) throw new ApiError('Failed to send chat message', res.status);
	return res.json();
}

// GET /api/stations → full station details. Falls back to mock data on any error
// so the Stations page always renders.
export async function fetchStationDetails(fetchFn: typeof fetch): Promise<StationDetail[]> {
	try {
		const res = await fetchFn(`${baseUrl()}/api/stations`, { signal: AbortSignal.timeout(2500) });
		if (!res.ok) throw new ApiError('Failed to fetch stations', res.status);
		return (await res.json()) as StationDetail[];
	} catch (err) {
		console.warn('[api] /api/stations unreachable, using fallback mock data:', err);
		return MOCK_STATION_DETAILS;
	}
}

// GET /api/alerts → threshold-crossing history. Falls back to generated mock
// data on any error so the Alerts page always renders.
export async function fetchAlertHistory(fetchFn: typeof fetch): Promise<AlertEvent[]> {
	try {
		const res = await fetchFn(`${baseUrl()}/api/alerts`, { signal: AbortSignal.timeout(2500) });
		if (!res.ok) throw new ApiError('Failed to fetch alerts', res.status);
		return (await res.json()) as AlertEvent[];
	} catch (err) {
		console.warn('[api] /api/alerts unreachable, using fallback mock data:', err);
		return mockAlertHistory();
	}
}

// GET /api/history?station=ID&from=ISO&to=ISO → readings over time.
// Falls back to generated mock history on any error.
export async function fetchHistory(
	fetchFn: typeof fetch,
	stationId: string,
	from: string,
	to: string
): Promise<HistoryPoint[]> {
	try {
		const params = new URLSearchParams({ station: stationId, from, to });
		const res = await fetchFn(`${baseUrl()}/api/history?${params}`, {
			signal: AbortSignal.timeout(2500)
		});
		if (!res.ok) throw new ApiError(`Failed to fetch history for ${stationId}`, res.status);
		return (await res.json()) as HistoryPoint[];
	} catch (err) {
		console.warn(`[api] /api/history for ${stationId} unreachable, using fallback mock:`, err);
		return mockHistory(stationId, from, to);
	}
}
