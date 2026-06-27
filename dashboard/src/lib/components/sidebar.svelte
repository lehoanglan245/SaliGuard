<script lang="ts">
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

<aside class="flex h-full w-64 flex-col gap-6 bg-card p-6">
	<div class="flex items-center gap-2">
		<span class="h-7 w-7 rounded-full bg-accent" aria-hidden="true"></span>
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
</aside>
