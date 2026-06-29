<script lang="ts">
	import { clsx } from '$lib/clsx';
	import { CARD_INTERACTIVE } from '$lib/ui';

	interface Props {
		greenCount: number;
		total: number;
		safePct: number;
		atRisk: number;
		peak: number;
		avgLevel: number;
	}
	let { greenCount, total, safePct, atRisk, peak, avgLevel }: Props = $props();

	const kpis = $derived([
		{
			label: 'Safe stations',
			value: `${greenCount} / ${total}`,
			sub: `${safePct}% of network`,
			tone: 'text-green-600'
		},
		{ label: 'At risk', value: String(atRisk), sub: 'Yellow or red', tone: 'text-amber-600' },
		{
			label: 'Peak salinity',
			value: peak.toFixed(1),
			unit: 'g/L',
			sub: '24h forecast',
			tone: 'text-red-600'
		},
		{
			label: 'Avg water level',
			value: avgLevel.toFixed(1),
			unit: 'm',
			sub: 'Across network',
			tone: 'text-gray-500'
		}
	]);
</script>

<section class="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Key metrics">
	{#each kpis as kpi, i (kpi.label)}
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
