import { env } from '$env/dynamic/public';
import type { Station, LatestReading } from './types';

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
