<script lang="ts">
	import type { PageData } from './$types';
	import { resolve } from '$app/paths';
	import { clsx } from '$lib/clsx';
	import { CARD_INTERACTIVE } from '$lib/ui';
	import AppShell from '$lib/components/app-shell.svelte';

	type Alert = 'green' | 'yellow' | 'red';
	type Row = { name: string; ec: number; forecast: number; level: number; alert: Alert };

	let { data }: { data: PageData } = $props();

	// Fallback data so the page always renders rich while the API returns mocks/errors.
	const MOCK_STATIONS: Row[] = [
		{ name: 'Lạch Tray', ec: 4.6, forecast: 5.0, level: 1.9, alert: 'red' },
		{ name: 'Bạch Đằng', ec: 2.3, forecast: 2.8, level: 1.6, alert: 'yellow' },
		{ name: 'Cấm', ec: 1.4, forecast: 1.7, level: 1.4, alert: 'yellow' },
		{ name: 'Văn Úc', ec: 0.6, forecast: 0.8, level: 1.2, alert: 'green' },
		{ name: 'Đá Bạc', ec: 0.4, forecast: 0.5, level: 1.1, alert: 'green' }
	];
	const TREND = [0.6, 0.9, 1.4, 2.1, 3.2, 2.6, 1.8];
	const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

	const liveStations = $derived(
		data.views
			.filter((v) => v.reading !== null)
			.map((v) => ({
				name: v.station.name,
				ec: v.reading!.ec,
				forecast: v.reading!.forecast_24h,
				level: v.reading!.level,
				alert: v.reading!.alert
			}))
	);
	const stations = $derived<Row[]>(liveStations.length ? liveStations : MOCK_STATIONS);

	const total = $derived(stations.length);
	const greenCount = $derived(stations.filter((s) => s.alert === 'green').length);
	const atRisk = $derived(stations.filter((s) => s.alert !== 'green').length);
	const safePct = $derived(total === 0 ? 0 : Math.round((greenCount / total) * 100));
	const peak = $derived(stations.length ? Math.max(...stations.map((s) => s.forecast)) : 0);
	const avgLevel = $derived(
		stations.length ? stations.reduce((a, s) => a + s.level, 0) / stations.length : 0
	);

	const alerts = $derived(
		stations
			.filter((s) => s.alert !== 'green')
			.map((s) => ({
				station: s.name,
				level: s.alert,
				text:
					s.alert === 'red'
						? 'Exceeded 4 g/L — close the gates'
						: 'Approaching the caution threshold'
			}))
	);

	const DOT: Record<Alert, string> = {
		green: 'bg-green-500',
		yellow: 'bg-yellow-500',
		red: 'bg-red-600'
	};
	const SOFT: Record<Alert, string> = {
		green: 'bg-green-50 text-green-700',
		yellow: 'bg-yellow-50 text-yellow-700',
		red: 'bg-red-50 text-red-700'
	};

	// ---- area chart geometry (smooth Catmull-Rom → bezier) ----
	const W = 680;
	const H = 240;
	const PAD = 20;
	const maxY = Math.max(...TREND) * 1.18;
	const pts = TREND.map((v, i) => {
		const x = PAD + (i / (TREND.length - 1)) * (W - 2 * PAD);
		const y = H - PAD - (v / maxY) * (H - 2 * PAD);
		return [x, y] as const;
	});
	function smooth(p: readonly (readonly [number, number])[]): string {
		let d = `M ${p[0][0]} ${p[0][1]}`;
		for (let i = 0; i < p.length - 1; i++) {
			const p0 = p[i - 1] ?? p[i];
			const p1 = p[i];
			const p2 = p[i + 1];
			const p3 = p[i + 2] ?? p2;
			const c1x = p1[0] + (p2[0] - p0[0]) / 6;
			const c1y = p1[1] + (p2[1] - p0[1]) / 6;
			const c2x = p2[0] - (p3[0] - p1[0]) / 6;
			const c2y = p2[1] - (p3[1] - p1[1]) / 6;
			d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
		}
		return d;
	}
	const linePath = smooth(pts);
	const areaPath = `${linePath} L ${pts[pts.length - 1][0]} ${H - PAD} L ${pts[0][0]} ${H - PAD} Z`;

	const SENSORS_ONLINE = 96;
	const ringCirc = 2 * Math.PI * 52;
	const ringFill = (SENSORS_ONLINE / 100) * ringCirc;
</script>

<svelte:head><title>Overview — SaliGuard</title></svelte:head>

<AppShell>
	{#if data.error}
		<p class="mb-6 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800" role="status">
			Showing sample data — live API unavailable ({data.error}).
		</p>
	{/if}

	<!-- hero greeting -->
	<div class="reveal mb-10">
		<p class="text-sm font-medium tracking-wide text-gray-400">
			Sunday · June 28, 2026 · Hải Phòng
		</p>
		<h1
			class="mt-1 text-5xl leading-[1.05] font-semibold tracking-tight"
			style="font-family: 'Lora', serif;"
		>
			Salinity overview
		</h1>
		<p class="mt-3 max-w-xl text-[15px] leading-relaxed text-gray-500">
			{total} field stations along the Hải Phòng estuaries. Forecasts run 24–72 hours ahead, flagged against
			the 1 &amp; 4 g/L thresholds.
		</p>
	</div>

	<!-- KPI row -->
	<section class="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Key metrics">
		{#each [{ label: 'Safe stations', value: `${greenCount} / ${total}`, sub: `${safePct}% of network`, tone: 'text-green-600' }, { label: 'At risk', value: String(atRisk), sub: 'Yellow or red', tone: 'text-amber-600' }, { label: 'Peak salinity', value: peak.toFixed(1), unit: 'g/L', sub: '24h forecast', tone: 'text-red-600' }, { label: 'Avg water level', value: avgLevel.toFixed(1), unit: 'm', sub: 'Across network', tone: 'text-gray-500' }] as kpi, i (kpi.label)}
			<div class={clsx(CARD_INTERACTIVE, 'reveal p-5')} style="animation-delay: {80 + i * 60}ms">
				<p class="text-[13px] font-medium text-gray-500">{kpi.label}</p>
				<p class="mt-3 text-3xl font-semibold tracking-tight">
					{kpi.value}{#if kpi.unit}<span class="ml-1 text-lg font-medium text-gray-400"
							>{kpi.unit}</span
						>{/if}
				</p>
				<p class={clsx('mt-1 text-xs font-medium', kpi.tone)}>{kpi.sub}</p>
			</div>
		{/each}
	</section>

	<!-- chart + health -->
	<section class="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
		<div class={clsx(CARD_INTERACTIVE, 'reveal p-6 lg:col-span-2')} style="animation-delay: 320ms">
			<div class="mb-4 flex items-end justify-between">
				<div>
					<h2 class="text-base font-semibold tracking-tight">Salinity trend</h2>
					<p class="text-xs text-gray-400">Last 7 days · network average (g/L)</p>
				</div>
				<span class="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600"
					>Peak 3.2</span
				>
			</div>
			<svg viewBox="0 0 {W} {H}" class="h-56 w-full" role="img" aria-label="Salinity trend chart">
				<defs>
					<linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stop-color="#f59e0b" stop-opacity="0.28" />
						<stop offset="100%" stop-color="#f59e0b" stop-opacity="0" />
					</linearGradient>
				</defs>
				{#each [0.25, 0.5, 0.75] as g (g)}
					<line
						x1={PAD}
						x2={W - PAD}
						y1={PAD + g * (H - 2 * PAD)}
						y2={PAD + g * (H - 2 * PAD)}
						stroke="#1f1910"
						stroke-opacity="0.06"
					/>
				{/each}
				<path d={areaPath} fill="url(#fill)" />
				<path
					d={linePath}
					fill="none"
					stroke="#f59e0b"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				{#each pts as p, i (i)}
					<circle cx={p[0]} cy={p[1]} r="3" fill="#fff" stroke="#f59e0b" stroke-width="2" />
				{/each}
			</svg>
			<div class="mt-2 flex justify-between px-1 text-[11px] text-gray-400">
				{#each DAYS as d (d)}<span>{d}</span>{/each}
			</div>
		</div>

		<div
			class={clsx(CARD_INTERACTIVE, 'reveal flex flex-col items-center justify-center p-6')}
			style="animation-delay: 380ms"
		>
			<h2 class="self-start text-base font-semibold tracking-tight">Sensors online</h2>
			<div class="relative my-4 grid place-items-center">
				<svg viewBox="0 0 120 120" class="h-40 w-40 -rotate-90">
					<circle
						cx="60"
						cy="60"
						r="52"
						fill="none"
						stroke="#1f1910"
						stroke-opacity="0.08"
						stroke-width="10"
					/>
					<circle
						cx="60"
						cy="60"
						r="52"
						fill="none"
						stroke="#f59e0b"
						stroke-width="10"
						stroke-linecap="round"
						stroke-dasharray="{ringFill} {ringCirc}"
					/>
				</svg>
				<div class="absolute text-center">
					<p class="text-3xl font-semibold tracking-tight">{SENSORS_ONLINE}%</p>
					<p class="text-[11px] text-gray-400">24 / 25 devices</p>
				</div>
			</div>
			<p class="text-center text-xs text-gray-500">One sensor at Đá Bạc offline since 03:12</p>
		</div>
	</section>

	<!-- stations table -->
	<section
		class={clsx(CARD_INTERACTIVE, 'reveal mb-6 overflow-hidden')}
		style="animation-delay: 440ms"
		aria-label="Stations"
	>
		<div class="flex items-center justify-between px-6 pt-5 pb-3">
			<h2 class="text-base font-semibold tracking-tight">Stations</h2>
			<a
				href={resolve('/stations')}
				class="text-sm font-medium text-accent transition hover:underline">View all</a
			>
		</div>
		<div class="divide-y divide-gray-100/80">
			{#each stations as s (s.name)}
				<div class="flex items-center gap-4 px-6 py-3.5 transition hover:bg-cream/60">
					<span class={clsx('h-2.5 w-2.5 shrink-0 rounded-full', DOT[s.alert])} aria-hidden="true"
					></span>
					<span class="w-32 font-medium">{s.name}</span>
					<span class="hidden flex-1 text-sm text-gray-500 sm:block"
						>EC {s.ec} g/L · Level {s.level} m</span
					>
					<span class="ml-auto text-sm text-gray-400">Forecast</span>
					<span class="w-14 text-right font-semibold tracking-tight">{s.forecast}</span>
					<span
						class={clsx(
							'hidden w-20 rounded-full px-2.5 py-1 text-center text-xs font-medium capitalize md:block',
							SOFT[s.alert]
						)}
					>
						{s.alert}
					</span>
				</div>
			{/each}
		</div>
	</section>

	<!-- alerts -->
	<section
		class={clsx(CARD_INTERACTIVE, 'reveal p-6')}
		style="animation-delay: 500ms"
		aria-label="Recent alerts"
	>
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-base font-semibold tracking-tight">Recent alerts</h2>
			<span class="text-xs text-gray-400">{alerts.length} need attention</span>
		</div>
		{#if alerts.length}
			<ul class="flex flex-col gap-3">
				{#each alerts as a (a.station)}
					<li class="flex items-center gap-3">
						<span
							class={clsx('grid h-8 w-8 shrink-0 place-items-center rounded-full', SOFT[a.level])}
						>
							<span class={clsx('h-2 w-2 rounded-full', DOT[a.level])} aria-hidden="true"></span>
						</span>
						<div class="min-w-0">
							<p class="truncate text-sm font-medium">{a.station}</p>
							<p class="truncate text-xs text-gray-500">{a.text}</p>
						</div>
						<span
							class={clsx(
								'ml-auto shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize',
								SOFT[a.level]
							)}
						>
							{a.level}
						</span>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="text-sm text-gray-400">No active alerts. All stations within safe range.</p>
		{/if}
	</section>
</AppShell>

<style>
	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
	.reveal {
		animation: rise 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both;
	}
	@media (prefers-reduced-motion: reduce) {
		.reveal {
			animation: none;
		}
	}
</style>
