<script lang="ts">
	import uPlot from 'uplot';
	import 'uplot/dist/uPlot.min.css';
	import type { HistoryPoint } from './types';

	let { history }: { history: HistoryPoint[] } = $props();

	let wrap = $state<HTMLDivElement>();
	const HEIGHT = 240;

	$effect(() => {
		const el = wrap;
		if (!el) return;

		const xs = history.map((h) => new Date(h.ts).getTime() / 1000);
		const ys = history.map((h) => h.ec);

		const opts: uPlot.Options = {
			width: el.clientWidth || 600,
			height: HEIGHT,
			scales: { x: { time: true } },
			legend: { show: false },
			cursor: { points: { size: 6 } },
			series: [
				{},
				{
					label: 'EC (g/L)',
					stroke: '#f59e0b',
					width: 2.5,
					fill: 'rgba(245,158,11,0.14)',
					points: { show: false }
				}
			],
			axes: [
				{
					stroke: '#9ca3af',
					grid: { stroke: 'rgba(31,25,16,0.05)', width: 1 },
					ticks: { stroke: 'rgba(31,25,16,0.1)', width: 1 }
				},
				{
					stroke: '#9ca3af',
					size: 44,
					grid: { stroke: 'rgba(31,25,16,0.05)', width: 1 },
					ticks: { stroke: 'rgba(31,25,16,0.1)', width: 1 }
				}
			]
		};

		const chart = new uPlot(opts, [xs, ys], el);
		const ro = new ResizeObserver(() => chart.setSize({ width: el.clientWidth, height: HEIGHT }));
		ro.observe(el);

		return () => {
			ro.disconnect();
			chart.destroy();
		};
	});
</script>

<div bind:this={wrap} class="w-full"></div>
