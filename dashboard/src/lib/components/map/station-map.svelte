<script lang="ts">
	import { resolve } from '$app/paths';
	import { fade, scale } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	import { clsx } from '$lib/clsx';
	import { prefersReducedMotion } from '$lib/motion';
	import { ALERT_LABEL, ALERT_STRIP, ALERT_HEX } from '$lib/alert-ui';
	import type { StationDetail } from '$lib/types';

	interface Props {
		stations: StationDetail[];
		/** Station id highlighted from the sidebar — its marker enlarges + opens. */
		focusId?: string | null;
	}
	let { stations, focusId = null }: Props = $props();

	// Fixed geographic bounding box around the Hải Phòng estuaries, padded so
	// markers never sit on the edge. Keeps the layout stable for any data subset.
	const LON_MIN = 106.42;
	const LON_MAX = 106.9;
	const LAT_MIN = 20.55;
	const LAT_MAX = 20.9;

	// Project lon/lat → percentage offsets inside the map frame (y inverted: north up).
	function project(lon: number, lat: number) {
		const x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * 100;
		const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * 100;
		return { x, y };
	}

	const placed = $derived(stations.map((s) => ({ station: s, ...project(s.lon, s.lat) })));

	let hovered = $state<string | null>(null);
	const activeId = $derived(hovered ?? focusId);

	// Motion (reduced-motion aware): fade the map, pop the markers + popover.
	const reduced = $derived(prefersReducedMotion());
	const mapFade = $derived({ duration: reduced ? 0 : 400 });
	const popDuration = $derived(reduced ? 0 : 160);
	const markerIn = (i: number) =>
		reduced ? { duration: 0 } : { duration: 320, delay: 120 + i * 70, start: 0.3, easing: backOut };
</script>

<div class="relative h-full w-full overflow-hidden rounded-3xl bg-[#eef3f7]" in:fade={mapFade}>
	<!-- Decorative estuary backdrop (palette-matched, no external tiles). -->
	<svg
		viewBox="0 0 1000 780"
		preserveAspectRatio="xMidYMid slice"
		class="absolute inset-0 h-full w-full"
		aria-hidden="true"
	>
		<defs>
			<linearGradient id="sea" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0%" stop-color="#cfe3ef" />
				<stop offset="100%" stop-color="#aecbde" />
			</linearGradient>
			<linearGradient id="land" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color="#f3f1e7" />
				<stop offset="100%" stop-color="#e8ead9" />
			</linearGradient>
		</defs>

		<!-- land base -->
		<rect x="0" y="0" width="1000" height="780" fill="url(#land)" />

		<!-- sea filling the south-east (open water + Gulf of Tonkin) -->
		<path
			d="M1000,780 L1000,140 C880,180 820,300 700,360 C600,410 560,520 470,560 C560,640 760,700 1000,720 Z"
			fill="url(#sea)"
		/>

		<!-- river channels feeding the estuary (Cấm / Lạch Tray / Văn Úc) -->
		<g fill="none" stroke="#bcd6e6" stroke-linecap="round">
			<path d="M-20,180 C220,200 420,250 700,360" stroke-width="26" opacity="0.9" />
			<path d="M-20,360 C240,360 430,420 560,520" stroke-width="22" opacity="0.85" />
			<path d="M-20,540 C200,540 360,560 470,560" stroke-width="18" opacity="0.8" />
		</g>

		<!-- subtle land contour lines -->
		<g fill="none" stroke="#d8d9c4" stroke-width="2" opacity="0.6">
			<path d="M60,120 C260,150 500,150 760,120" />
			<path d="M40,640 C260,620 520,640 780,660" />
		</g>
	</svg>

	<!-- Markers (HTML overlay → clean hover popovers + keyboard focus). -->
	{#each placed as p, i (p.station.station_id)}
		{@const active = activeId === p.station.station_id}
		<a
			href={resolve(`/stations/${p.station.station_id}`)}
			class="absolute z-10 -translate-x-1/2 -translate-y-1/2 focus-visible:outline-none"
			style="left: {p.x}%; top: {p.y}%;"
			onmouseenter={() => (hovered = p.station.station_id)}
			onmouseleave={() => (hovered = null)}
			onfocus={() => (hovered = p.station.station_id)}
			onblur={() => (hovered = null)}
			aria-label="{p.station.name} — {ALERT_LABEL[p.station.alert]}, EC {p.station.ec} g/L"
		>
			<!-- pin -->
			<span class="relative grid place-items-center" in:scale={markerIn(i)}>
				{#if p.station.alert === 'red'}
					<span
						class="absolute h-6 w-6 animate-ping rounded-full opacity-60"
						style="background: {ALERT_HEX[p.station.alert]}"
						aria-hidden="true"
					></span>
				{/if}
				<span
					class={clsx(
						'block rounded-full border-2 border-white shadow-[0_2px_6px_rgba(31,25,16,0.35)] transition-transform',
						active ? 'h-5 w-5 scale-110' : 'h-4 w-4'
					)}
					style="background: {ALERT_HEX[p.station.alert]}"
					aria-hidden="true"
				></span>
			</span>

			<!-- popover -->
			{#if active}
				<div
					class="absolute bottom-full left-1/2 z-20 mb-2 -ml-26 w-52 rounded-2xl border border-black/[0.06] bg-white p-3 shadow-[0_12px_30px_-12px_rgba(31,25,16,0.4)]"
					transition:scale={{ duration: popDuration, start: 0.85, easing: backOut }}
				>
					<p class="text-sm font-semibold tracking-tight text-gray-900">{p.station.name}</p>
					<p class="text-xs text-gray-500">{p.station.region}</p>
					<div class="mt-2 flex items-end justify-between">
						<p class="text-xl font-semibold tracking-tight text-gray-900">
							{p.station.ec}<span class="ml-0.5 text-xs font-medium text-gray-400">g/L</span>
						</p>
						<span class="flex items-center gap-1.5">
							<span
								class={clsx('h-2.5 w-2.5 rounded-full', ALERT_STRIP[p.station.alert])}
								aria-hidden="true"
							></span>
							<span class="text-xs font-medium text-gray-600">{ALERT_LABEL[p.station.alert]}</span>
						</span>
					</div>
					<p class="mt-1 text-xs text-gray-500">
						24h forecast: <span class="font-medium text-gray-700">{p.station.forecast_24h} g/L</span
						>
					</p>
					<p class="mt-2 text-xs font-medium text-accent">View detail →</p>
				</div>
			{/if}
		</a>
	{/each}
</div>
