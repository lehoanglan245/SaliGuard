<script lang="ts">
	import { clsx } from '$lib/clsx';
	import type { StationDetail } from '$lib/types';
	import { ALERT_LABEL, ALERT_STRIP, ALERT_BADGE, relativeTime } from '$lib/alert-ui';

	interface Props {
		station: StationDetail;
		onClick: () => void;
	}
	let { station, onClick }: Props = $props();

	const TREND_GLYPH = { up: '↑', down: '↓', flat: '→' } as const;
	const TREND_TONE = {
		up: 'text-red-600',
		down: 'text-green-600',
		flat: 'text-gray-400'
	} as const;

	const cardClass = clsx(
		'group w-full overflow-hidden rounded-2xl border border-white/60 bg-white text-left',
		'shadow-[0_1px_2px_rgba(31,25,16,0.04),0_16px_36px_-24px_rgba(31,25,16,0.25)]',
		'transition duration-300 hover:-translate-y-0.5',
		'hover:shadow-[0_1px_2px_rgba(31,25,16,0.05),0_28px_52px_-28px_rgba(31,25,16,0.32)]',
		'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
	);
</script>

<button type="button" onclick={onClick} class={cardClass}>
	<div class={clsx('h-1.5 w-full', ALERT_STRIP[station.alert])} aria-hidden="true"></div>
	<div class="flex flex-col gap-4 p-5">
		<div class="flex items-start justify-between gap-3">
			<div class="min-w-0">
				<p class="truncate text-base font-semibold tracking-tight">{station.name}</p>
				<p class="text-xs text-gray-500">{station.region}</p>
			</div>
			<span
				class={clsx(
					'shrink-0 rounded-full px-2.5 py-1 text-xs font-medium',
					ALERT_BADGE[station.alert]
				)}
			>
				{ALERT_LABEL[station.alert]}
			</span>
		</div>

		<div class="flex items-end justify-between">
			<div>
				<p class="text-3xl font-semibold tracking-tight">
					{station.ec}<span class="ml-1 text-base font-medium text-gray-400">g/L</span>
				</p>
				<p class="text-xs text-gray-400">Salinity (EC)</p>
			</div>
			<span class={clsx('text-lg font-semibold', TREND_TONE[station.trend])} aria-hidden="true">
				{TREND_GLYPH[station.trend]}
			</span>
		</div>

		<div
			class="flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-400"
		>
			<span>Updated {relativeTime(station.updated_at)}</span>
			<span class="flex items-center gap-2">
				<span class={station.battery < 25 ? 'text-red-600' : 'text-gray-500'}>
					{station.battery}%
				</span>
				<span class="flex items-end gap-0.5" aria-label="Signal {station.signal} of 4">
					{#each [1, 2, 3, 4] as bar (bar)}
						<span
							class={clsx(
								'w-0.5 rounded-sm',
								bar <= station.signal ? 'bg-gray-500' : 'bg-gray-200'
							)}
							style="height: {bar * 2 + 2}px"
						></span>
					{/each}
				</span>
			</span>
		</div>
	</div>
</button>
