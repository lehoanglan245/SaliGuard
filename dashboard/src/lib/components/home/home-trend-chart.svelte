<script lang="ts">
	import { clsx } from '$lib/clsx';
	import { CARD_INTERACTIVE } from '$lib/ui';

	const TREND = [0.6, 0.9, 1.4, 2.1, 3.2, 2.6, 1.8];
	const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
