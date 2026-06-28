<script lang="ts">
	import type { StationDetail } from '$lib/types';
	import StationCard from './station-card.svelte';

	interface Props {
		stations: StationDetail[];
		onSelectStation: (station: StationDetail) => void;
		loading?: boolean;
	}
	let { stations, onSelectStation, loading = false }: Props = $props();

	const SKELETONS = [0, 1, 2, 3, 4, 5];
</script>

{#if loading}
	<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
		{#each SKELETONS as n (n)}
			<div class="overflow-hidden rounded-2xl border border-white/60 bg-white p-5 shadow-sm">
				<div class="h-1.5 w-full animate-pulse rounded bg-gray-200"></div>
				<div class="mt-4 h-4 w-2/3 animate-pulse rounded bg-gray-200"></div>
				<div class="mt-2 h-3 w-1/3 animate-pulse rounded bg-gray-100"></div>
				<div class="mt-5 h-8 w-1/2 animate-pulse rounded bg-gray-200"></div>
				<div class="mt-5 h-3 w-full animate-pulse rounded bg-gray-100"></div>
			</div>
		{/each}
	</div>
{:else if stations.length === 0}
	<div class="rounded-2xl border border-gray-100 bg-white/60 py-16 text-center">
		<p class="text-sm font-medium text-gray-500">No stations found</p>
		<p class="mt-1 text-xs text-gray-400">Try a different region or search term.</p>
	</div>
{:else}
	<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
		{#each stations as station (station.station_id)}
			<StationCard {station} onClick={() => onSelectStation(station)} />
		{/each}
	</div>
{/if}
