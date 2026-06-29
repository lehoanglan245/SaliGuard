<script lang="ts">
	import { reveal } from '$lib/actions/reveal';

	interface Props {
		total: number;
	}
	let { total }: Props = $props();
</script>

<div use:reveal class="mb-10">
	<p class="text-sm font-medium tracking-wide text-gray-400">Sunday · June 28, 2026 · Hải Phòng</p>
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
