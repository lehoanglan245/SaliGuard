<script lang="ts">
	import type { PageData } from './$types';
	import { clsx } from '$lib/clsx';
	import { CARD } from '$lib/ui';
	import { HAI_PHONG_REGIONS } from '$lib/stations-mock';
	import AppShell from '$lib/components/app-shell.svelte';
	import StationMap from '$lib/components/map/station-map.svelte';
	import MapSidebar from '$lib/components/map/map-sidebar.svelte';
	import MapLegend from '$lib/components/map/map-legend.svelte';

	let { data }: { data: PageData } = $props();

	// Shared hover/focus state links the sidebar list to the map markers.
	let focusId = $state<string | null>(null);
</script>

<svelte:head><title>Map — SaliGuard</title></svelte:head>

<AppShell>
	<div class="mb-8">
		<h1
			class="text-4xl leading-tight font-semibold tracking-tight"
			style="font-family: 'Lora', serif;"
		>
			Map
		</h1>
		<p class="mt-2 text-[15px] text-gray-500">
			{data.stations.length} field stations across {HAI_PHONG_REGIONS.length} Hải Phòng estuary regions.
			Hover a marker for details, click to open the station.
		</p>
	</div>

	<div class="grid grid-cols-1 gap-4 lg:grid-cols-[20rem_1fr]">
		<div class="flex flex-col gap-4">
			<MapSidebar stations={data.stations} selectedId={focusId} onHover={(id) => (focusId = id)} />
			<MapLegend />
		</div>

		<div class={clsx(CARD, 'h-[70vh] min-h-[420px] overflow-hidden p-0')}>
			<StationMap stations={data.stations} {focusId} />
		</div>
	</div>
</AppShell>
