<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { clearSession } from '$lib/auth';
	import LogoIcon from '$lib/components/logo-icon.svelte';

	function logout() {
		clearSession();
		goto(resolve('/login'));
	}

	const NAV_ITEMS = [
		{ label: 'Tổng quan', active: true },
		{ label: 'Trạm đo', active: false },
		{ label: 'Bản đồ', active: false },
		{ label: 'Cảnh báo', active: false },
		{ label: 'Lịch sử', active: false },
		{ label: 'Báo cáo', active: false },
		{ label: 'Xuất dữ liệu', active: false }
	];
</script>

<aside class="hidden h-full w-64 flex-col gap-6 bg-card p-6 lg:flex">
	<div class="flex items-center gap-2">
		<LogoIcon class="h-7 w-7 shrink-0" />
		<span class="text-lg font-semibold">SaliGuard</span>
	</div>

	<label class="sr-only" for="sidebar-search">Tìm kiếm</label>
	<input
		id="sidebar-search"
		type="search"
		placeholder="Tìm kiếm"
		class="rounded-lg border border-gray-200 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-accent"
	/>

	<nav aria-label="Điều hướng chính">
		<ul class="flex flex-col gap-1">
			{#each NAV_ITEMS as item (item.label)}
				<li>
					<a
						href="#{item.label}"
						aria-current={item.active ? 'page' : undefined}
						class={item.active
							? 'block rounded-lg bg-accent-soft px-3 py-2 text-sm font-medium text-accent'
							: 'block rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50'}
					>
						{item.label}
					</a>
				</li>
			{/each}
		</ul>
	</nav>

	<button
		type="button"
		onclick={logout}
		class="mt-auto flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-accent"
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
		Đăng xuất
	</button>
</aside>
