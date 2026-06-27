<script lang="ts">
	import type { PageData } from './$types';
	import Sidebar from '$lib/components/sidebar.svelte';
	import StatCard from '$lib/components/stat-card.svelte';
	import GaugeCard from '$lib/components/gauge-card.svelte';
	import StationList from '$lib/components/station-list.svelte';
	import TrendChart from '$lib/components/trend-chart.svelte';
	import StatTile from '$lib/components/stat-tile.svelte';
	import AlertsFeed from '$lib/components/alerts-feed.svelte';
	import TopStations from '$lib/components/top-stations.svelte';
	import QuickActions from '$lib/components/quick-actions.svelte';
	import { MOCK_TREND, MOCK_PEAKS, MOCK_ALERT_FEED, QUICK_ACTIONS } from '$lib/mock';

	let { data }: { data: PageData } = $props();
	const s = $derived(data.summary);
</script>

<div class="flex min-h-screen bg-cream">
	<Sidebar />

	<main class="flex-1 p-6">
		{#if data.error}
			<p class="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
				Không tải được dữ liệu: {data.error}
			</p>
		{/if}

		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<StatCard
				title="Trạm an toàn"
				value="{s.safePct}%"
				caption="{s.greenCount}/{s.total} trạm ở mức xanh"
				linkLabel="Xem báo cáo"
			/>
			<StatCard
				title="Trạm rủi ro"
				value={String(s.atRiskCount)}
				caption="Đang ở mức vàng hoặc đỏ"
				linkLabel="Xem cảnh báo"
			/>
			<GaugeCard title="Sức khỏe hệ thống" percent={s.healthPct} linkLabel="Chi tiết" />

			<div class="lg:col-span-1"><StationList views={data.views} /></div>
			<div class="lg:col-span-2"><TrendChart series={MOCK_TREND} /></div>

			<StatTile
				label="Độ mặn đỉnh"
				value="{MOCK_PEAKS.peakSalinity.value} {MOCK_PEAKS.peakSalinity.unit}"
				sub="7 ngày qua"
			/>
			<StatTile
				label="Ngày cao nhất"
				value={MOCK_PEAKS.peakDay.label}
				sub={MOCK_PEAKS.peakDay.sub}
			/>
			<StatTile
				label="Trạm rủi ro nhất"
				value={MOCK_PEAKS.topRiskStation.name}
				sub={MOCK_PEAKS.topRiskStation.sub}
			/>

			<AlertsFeed items={MOCK_ALERT_FEED} />
			<TopStations items={s.topStations} />
			<QuickActions items={QUICK_ACTIONS} />
		</div>
	</main>
</div>
