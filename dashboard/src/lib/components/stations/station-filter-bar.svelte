<script lang="ts">
	import { clsx } from '$lib/clsx';

	interface Props {
		regions: string[];
		onFilter: (region: string | null, query: string) => void;
	}
	let { regions, onFilter }: Props = $props();

	let query = $state('');
	let region = $state('all');
	let timer: ReturnType<typeof setTimeout> | undefined;

	function emit() {
		onFilter(region === 'all' ? null : region, query.trim());
	}

	function onQueryInput() {
		clearTimeout(timer);
		timer = setTimeout(emit, 300);
	}

	function onRegionChange() {
		emit();
	}

	$effect(() => () => clearTimeout(timer));

	const pill = clsx(
		'rounded-full border bg-white/80 px-4 py-2 text-sm backdrop-blur transition',
		'focus-visible:outline-2 focus-visible:outline-accent'
	);
</script>

<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
	<div class="relative flex-1">
		<svg
			viewBox="0 0 24 24"
			class="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-400"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			aria-hidden="true"
		>
			<circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" stroke-linecap="round" />
		</svg>
		<label class="sr-only" for="station-search">Search stations</label>
		<input
			id="station-search"
			type="search"
			bind:value={query}
			oninput={onQueryInput}
			placeholder="Search stations…"
			class={clsx(pill, 'w-full border-gray-200 pr-4 pl-10')}
		/>
	</div>

	<label class="sr-only" for="region-filter">Filter by region</label>
	<select
		id="region-filter"
		bind:value={region}
		onchange={onRegionChange}
		class={clsx(
			pill,
			region === 'all' ? 'border-gray-200 text-gray-700' : 'border-accent text-accent'
		)}
	>
		<option value="all">All regions</option>
		{#each regions as r (r)}
			<option value={r}>{r}</option>
		{/each}
	</select>
</div>
