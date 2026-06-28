<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { clearSession } from '$lib/auth';
	import { fetchStationDetails } from '$lib/api';
	import { HAI_PHONG_REGIONS } from '$lib/stations-mock';
	import type { StationDetail } from '$lib/types';
	import StationFilterBar from '$lib/components/stations/station-filter-bar.svelte';
	import StationGrid from '$lib/components/stations/station-grid.svelte';
	import StationModal from '$lib/components/stations/station-modal.svelte';

	let { data }: { data: PageData } = $props();

	// Latest poll result; falls back to the server-loaded data until the first poll.
	let polled = $state<StationDetail[] | null>(null);
	let filterRegion = $state<string | null>(null);
	let filterQuery = $state('');
	let selectedStation = $state<StationDetail | null>(null);

	const stations = $derived(polled ?? data.stations);

	// Demo aid: ?skeleton renders the loading state for screenshots.
	const loading = $derived(page.url.searchParams.has('skeleton'));

	const filtered = $derived(
		stations.filter(
			(s) =>
				(filterRegion === null || s.region === filterRegion) &&
				(filterQuery === '' || s.name.toLowerCase().includes(filterQuery.toLowerCase()))
		)
	);

	function onFilter(region: string | null, query: string) {
		filterRegion = region;
		filterQuery = query;
	}

	// Poll for fresh data every 60s.
	$effect(() => {
		const id = setInterval(async () => {
			polled = await fetchStationDetails(fetch);
		}, 60_000);
		return () => clearInterval(id);
	});

	const navLink = 'rounded-full px-3.5 py-1.5 text-sm text-gray-500 transition hover:text-gray-900';

	function logout() {
		clearSession();
		goto(resolve('/login'));
	}
</script>

<svelte:head><title>Stations — SaliGuard</title></svelte:head>

<div class="relative min-h-screen overflow-hidden bg-cream font-[Inter] text-gray-900">
	<div class="pointer-events-none absolute inset-0" aria-hidden="true">
		<div
			class="absolute -top-32 -right-24 h-[34rem] w-[34rem] rounded-full opacity-60 blur-3xl"
			style="background: radial-gradient(circle, #fde9c8 0%, transparent 70%);"
		></div>
		<div
			class="absolute top-1/3 -left-40 h-[30rem] w-[30rem] rounded-full opacity-50 blur-3xl"
			style="background: radial-gradient(circle, #d9efe9 0%, transparent 70%);"
		></div>
	</div>

	<header class="sticky top-0 z-20 border-b border-white/40 bg-white/55 backdrop-blur-xl">
		<div class="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3.5">
			<div class="flex items-center gap-2">
				<span class="h-7 w-7 rounded-full bg-accent" aria-hidden="true"></span>
				<span class="text-[15px] font-semibold tracking-tight">SaliGuard</span>
			</div>
			<nav class="ml-4 hidden items-center gap-1 md:flex" aria-label="Primary">
				<a href={resolve('/')} class={navLink}>Overview</a>
				<a
					href="#stations"
					aria-current="page"
					class="rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-gray-900 shadow-sm"
					>Stations</a
				>
				<a href="#map" class={navLink}>Map</a>
				<a href="#alerts" class={navLink}>Alerts</a>
				<a href="#reports" class={navLink}>Reports</a>
			</nav>
			<div class="ml-auto flex items-center gap-3">
				<span
					class="grid h-9 w-9 place-items-center rounded-full bg-accent/15 text-sm font-semibold text-accent"
					>AT</span
				>
				<button
					type="button"
					onclick={logout}
					aria-label="Sign out"
					class="grid h-9 w-9 place-items-center rounded-full text-gray-400 transition hover:bg-white/70 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-accent"
				>
					<svg
						viewBox="0 0 24 24"
						class="h-4 w-4"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						aria-hidden="true"
					>
						<path
							d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</button>
			</div>
		</div>
	</header>

	<main class="relative z-10 mx-auto max-w-6xl px-6 pt-10 pb-20">
		<div class="mb-8">
			<h1
				class="text-4xl leading-tight font-semibold tracking-tight"
				style="font-family: 'Lora', serif;"
			>
				Stations
			</h1>
			<p class="mt-2 text-[15px] text-gray-500">
				Monitoring {stations.length} field stations across {HAI_PHONG_REGIONS.length} Hải Phòng regions.
			</p>
		</div>

		<div class="mb-6">
			<StationFilterBar regions={HAI_PHONG_REGIONS} {onFilter} />
		</div>

		<StationGrid stations={filtered} onSelectStation={(s) => (selectedStation = s)} {loading} />
	</main>

	<StationModal station={selectedStation} onClose={() => (selectedStation = null)} />
</div>
