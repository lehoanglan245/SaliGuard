import type { PageServerLoad } from './$types';
import { getStations, getLatest, ApiError } from '$lib/api';
import { toStationViews, summarize } from '$lib/derive';
import type { LatestReading } from '$lib/types';

export const prerender = false;

export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
	setHeaders({ 'cache-control': 'max-age=60' });
	try {
		const stations = await getStations(fetch);
		const settled = await Promise.allSettled(stations.map((s) => getLatest(fetch, s.station_id)));
		const readings = settled
			.filter((r): r is PromiseFulfilledResult<LatestReading> => r.status === 'fulfilled')
			.map((r) => r.value);

		const views = toStationViews(stations, readings);
		return { views, summary: summarize(views), error: null };
	} catch (err) {
		const message = err instanceof ApiError ? err.message : 'Unknown error loading dashboard';
		return { views: [], summary: summarize([]), error: message };
	}
};
