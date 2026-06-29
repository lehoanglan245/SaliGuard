<script lang="ts">
	import { resolve } from '$app/paths';
	import { clsx } from '$lib/clsx';
	import { CARD } from '$lib/ui';
	import { ALERT_LABEL, ALERT_STRIP } from '$lib/alert-ui';
	import type { StationDetail } from '$lib/types';

	interface Props {
		stations: StationDetail[];
		selectedId?: string | null;
		onHover: (id: string | null) => void;
	}
	let { stations, selectedId = null, onHover }: Props = $props();
</script>

<div class={clsx(CARD, 'overflow-hidden')}>
	<div class="px-5 pt-4 pb-3">
		<h2 class="text-base font-semibold tracking-tight">Stations</h2>
		<p class="text-xs text-gray-400">Hover to locate · click to open</p>
	</div>
	<ul class="divide-y divide-gray-100/80">
		{#each stations as s (s.station_id)}
			<li>
				<a
					href={resolve(`/stations/${s.station_id}`)}
					onmouseenter={() => onHover(s.station_id)}
					onmouseleave={() => onHover(null)}
					onfocus={() => onHover(s.station_id)}
					onblur={() => onHover(null)}
					class={clsx(
						'flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-cream/60',
						s.station_id === selectedId && 'bg-cream/80'
					)}
				>
					<span
						class={clsx('h-2.5 w-2.5 shrink-0 rounded-full', ALERT_STRIP[s.alert])}
						aria-hidden="true"
					></span>
					<span class="min-w-0">
						<span class="block truncate text-sm font-medium">{s.name}</span>
						<span class="block text-xs text-gray-400">{s.region}</span>
					</span>
					<span class="ml-auto text-right">
						<span class="block text-sm font-semibold tracking-tight">{s.ec} g/L</span>
						<span class="block text-xs text-gray-400">{ALERT_LABEL[s.alert]}</span>
					</span>
				</a>
			</li>
		{/each}
	</ul>
</div>
