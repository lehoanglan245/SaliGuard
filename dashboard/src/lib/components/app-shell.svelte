<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { clearSession } from '$lib/auth';

	let { children }: { children: Snippet } = $props();

	const path = $derived(page.url.pathname);
	const navLink = 'rounded-full px-3.5 py-1.5 text-sm text-gray-500 transition hover:text-gray-900';
	const navActive =
		'rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-gray-900 shadow-sm';
	const navMuted = 'rounded-full px-3.5 py-1.5 text-sm text-gray-300 select-none';

	function logout() {
		clearSession();
		goto(resolve('/login'));
	}
</script>

<div class="relative min-h-screen overflow-hidden bg-cream font-[Inter] text-gray-900">
	<!-- shared ambient background -->
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

	<!-- shared glass top bar -->
	<header class="sticky top-0 z-30 border-b border-black/[0.04] bg-white/70 backdrop-blur-xl">
		<div class="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3.5">
			<a href={resolve('/')} class="flex items-center gap-2">
				<span class="h-7 w-7 rounded-full bg-accent" aria-hidden="true"></span>
				<span class="text-[15px] font-semibold tracking-tight">SaliGuard</span>
			</a>
			<nav class="ml-4 hidden items-center gap-1 md:flex" aria-label="Primary">
				<a
					href={resolve('/')}
					class={path === '/' ? navActive : navLink}
					aria-current={path === '/' ? 'page' : undefined}>Overview</a
				>
				<a
					href={resolve('/stations')}
					class={path.startsWith('/stations') ? navActive : navLink}
					aria-current={path.startsWith('/stations') ? 'page' : undefined}>Stations</a
				>
				<span class={navMuted}>Map</span>
				<span class={navMuted}>Alerts</span>
				<span class={navMuted}>Reports</span>
			</nav>
			<div class="ml-auto flex items-center gap-3">
				<div
					class="hidden items-center gap-2 rounded-full border border-gray-200/70 bg-white/70 px-3.5 py-1.5 sm:flex"
				>
					<svg
						viewBox="0 0 24 24"
						class="h-4 w-4 text-gray-400"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						aria-hidden="true"
					>
						<circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" stroke-linecap="round" />
					</svg>
					<span class="text-sm text-gray-400">Search stations…</span>
				</div>
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
		{@render children()}
	</main>
</div>
