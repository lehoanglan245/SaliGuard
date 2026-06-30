<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { clsx } from '$lib/clsx';
	import logo from '$lib/assets/logo.png';
	import { markOnboardingDone, getSession } from '$lib/auth';
	import { saveProfile } from '$lib/profile';
	import { PUBLIC_API_URL } from '$env/static/public';

	let step = $state(0);

	// Step 1 — location
	let province = $state('');
	let district = $state('');
	let commune = $state('');

	// Steps 2–7
	let farmType = $state('');
	let farmArea = $state('');
	let waterSource = $state('');
	let alertThreshold = $state('');
	let leadTime = $state('');
	let experience = $state('');

	const TOTAL = 7;

	const progress = $derived(step <= 0 ? 0 : step > TOTAL ? 100 : Math.round((step / TOTAL) * 100));

	const canNext = $derived.by(() => {
		switch (step) {
			case 1:
				return !!(province.trim() && district.trim());
			case 2:
				return !!farmType;
			case 3:
				return !!farmArea;
			case 4:
				return !!waterSource;
			case 5:
				return !!alertThreshold;
			case 6:
				return !!leadTime;
			case 7:
				return !!experience;
			default:
				return true;
		}
	});

	function next() {
		step = Math.min(step + 1, TOTAL + 1);
	}
	function back() {
		if (step > 0) step--;
	}
	async function finish() {
		markOnboardingDone();
		saveProfile({
			province,
			district,
			commune,
			farmType,
			farmArea,
			waterSource,
			alertThreshold,
			leadTime,
			experience
		});
		const session = getSession();
		if (session?.email) {
			fetch(`${PUBLIC_API_URL}/api/users`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: session.email,
					province,
					district,
					commune,
					farm_type: farmType,
					farm_area: farmArea,
					water_source: waterSource,
					alert_threshold: alertThreshold,
					lead_time: leadTime,
					experience
				})
			}).catch((err: unknown) => console.warn('[onboarding] failed to save profile', err));
		}
		goto(resolve('/'));
	}

	const FARM_TYPES = [
		{ id: 'rice', label: 'Lúa nước', desc: 'Lúa tẻ, lúa nếp, lúa mùa', icon: '🌾' },
		{ id: 'veggie', label: 'Rau màu', desc: 'Rau xanh, hoa màu các loại', icon: '🥬' },
		{ id: 'fruit', label: 'Cây ăn quả', desc: 'Nhãn, vải, mít, thanh long…', icon: '🌳' },
		{ id: 'aqua', label: 'Thủy sản', desc: 'Nuôi tôm, cá, ngao, hàu', icon: '🦐' },
		{ id: 'mixed', label: 'Kết hợp nhiều loại', desc: 'Nhiều loại hình canh tác', icon: '🌿' }
	];

	const AREAS = [
		{ id: 'xs', label: 'Dưới 0.5 ha', desc: 'Quy mô hộ gia đình nhỏ' },
		{ id: 'sm', label: '0.5 – 2 ha', desc: 'Quy mô hộ sản xuất' },
		{ id: 'md', label: '2 – 5 ha', desc: 'Quy mô trang trại vừa' },
		{ id: 'lg', label: 'Trên 5 ha', desc: 'Trang trại quy mô lớn' }
	];

	const WATER = [
		{
			id: 'canal',
			label: 'Kênh mương thủy lợi',
			desc: 'Nước dẫn qua hệ thống nội đồng',
			icon: '🏞️'
		},
		{
			id: 'river',
			label: 'Sông / Hồ / Đầm',
			desc: 'Lấy nước trực tiếp từ nguồn mặt',
			icon: '🌊'
		},
		{ id: 'well', label: 'Giếng khoan / đào', desc: 'Bơm nước ngầm lên tưới tiêu', icon: '💧' },
		{
			id: 'multi',
			label: 'Nhiều nguồn phối hợp',
			desc: 'Kết hợp từ 2 nguồn trở lên',
			icon: '🔀'
		}
	];

	const THRESHOLDS = [
		{
			id: 'sensitive',
			label: 'Nhạy cao — EC ≥ 0.5 g/L',
			desc: 'Phù hợp rau màu, cây non, thủy sản giá trị cao. Sẽ nhận nhiều thông báo hơn.',
			dot: 'bg-green-400'
		},
		{
			id: 'standard',
			label: 'Tiêu chuẩn — EC ≥ 1 g/L',
			desc: 'Ngưỡng an toàn chung cho lúa và cây ngắn ngày.',
			dot: 'bg-yellow-400'
		},
		{
			id: 'critical',
			label: 'Khẩn cấp — EC > 4 g/L',
			desc: 'Chỉ cảnh báo khi vào vùng nguy hiểm rõ ràng, cần đóng cống ngay.',
			dot: 'bg-red-500'
		}
	];

	const LEAD = [
		{ id: '24h', label: '24 giờ trước', desc: 'Dự báo gần, độ chính xác cao nhất' },
		{ id: '48h', label: '48 giờ trước', desc: 'Đủ thời gian chuẩn bị bơm nước, điều tiết' },
		{ id: '72h', label: '72 giờ trước', desc: 'Lên kế hoạch thu hoạch, phòng bị dài hạn hơn' }
	];

	const EXP = [
		{ id: 'never', label: 'Chưa bao giờ bị ảnh hưởng', desc: 'Khu vực hiếm có mặn xâm nhập' },
		{
			id: 'mild',
			label: 'Bị ảnh hưởng nhẹ vài lần',
			desc: 'Có xảy ra nhưng thiệt hại không đáng kể'
		},
		{ id: 'heavy', label: 'Đã thiệt hại nặng', desc: 'Mất mùa hoặc buộc phải bỏ vụ vì mặn' }
	];

	const PROVINCES = [
		'Hải Phòng',
		'Nam Định',
		'Ninh Bình',
		'Thanh Hóa',
		'Nghệ An',
		'Hà Tĩnh',
		'Quảng Bình',
		'Thừa Thiên Huế',
		'Đà Nẵng',
		'Bến Tre',
		'Tiền Giang',
		'Long An',
		'Trà Vinh',
		'Sóc Trăng',
		'Cà Mau',
		'Kiên Giang',
		'Bạc Liêu'
	];

	const summary = $derived([
		{
			label: 'Địa chỉ',
			value: [province, district, commune].filter(Boolean).join(', ') || '—'
		},
		{
			label: 'Loại canh tác',
			value: FARM_TYPES.find((f) => f.id === farmType)?.label ?? '—'
		},
		{ label: 'Diện tích', value: AREAS.find((a) => a.id === farmArea)?.label ?? '—' },
		{ label: 'Nguồn nước', value: WATER.find((w) => w.id === waterSource)?.label ?? '—' },
		{
			label: 'Ngưỡng cảnh báo',
			value: THRESHOLDS.find((t) => t.id === alertThreshold)?.label ?? '—'
		},
		{ label: 'Cảnh báo trước', value: LEAD.find((l) => l.id === leadTime)?.label ?? '—' },
		{ label: 'Kinh nghiệm mặn', value: EXP.find((e) => e.id === experience)?.label ?? '—' }
	]);

	function cardCls(selected: boolean) {
		return clsx(
			'w-full rounded-xl border p-4 text-left transition-all focus-visible:outline-2 focus-visible:outline-accent',
			selected
				? 'border-accent bg-accent/10 ring-1 ring-accent/20'
				: 'border-gray-200/70 bg-white hover:border-gray-300 hover:bg-gray-50/60'
		);
	}

	function inputCls() {
		return 'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-accent';
	}
</script>

<div class="min-h-screen bg-cream font-[Inter] text-gray-900">
	<!-- Ambient blobs -->
	<div class="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
		<div
			class="absolute -top-24 -right-20 h-[28rem] w-[28rem] rounded-full opacity-50 blur-3xl"
			style="background: radial-gradient(circle, #d9efe9 0%, transparent 70%);"
		></div>
		<div
			class="absolute bottom-0 -left-32 h-[24rem] w-[24rem] rounded-full opacity-40 blur-3xl"
			style="background: radial-gradient(circle, #fde9c8 0%, transparent 70%);"
		></div>
	</div>

	<!-- Top bar -->
	<header class="relative z-10 flex items-center gap-2.5 px-8 py-5">
		<img src={logo} alt="SaliGuard" class="h-9 w-9 rounded-full object-cover" />
		<span class="text-base font-semibold tracking-tight">SaliGuard</span>
	</header>

	<!-- Progress bar -->
	{#if step > 0 && step <= TOTAL}
		<div class="relative z-10 px-8">
			<div class="mx-auto max-w-lg">
				<div class="h-1 rounded-full bg-gray-100">
					<div
						class="h-full rounded-full bg-accent transition-all duration-500"
						style="width: {progress}%"
					></div>
				</div>
				<p class="mt-1.5 text-xs text-gray-400">Bước {step} / {TOTAL}</p>
			</div>
		</div>
	{/if}

	<!-- Content -->
	<main class="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center px-6 py-10">
		<div class="w-full max-w-lg">
			<!-- ─── Step 0: Welcome ─── -->
			{#if step === 0}
				<div class="text-center">
					<img
						src={logo}
						alt=""
						class="mx-auto mb-6 h-20 w-20 rounded-full object-cover shadow-sm"
						aria-hidden="true"
					/>
					<h1 class="text-3xl font-semibold tracking-tight">Chào mừng đến SaliGuard</h1>
					<p class="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-gray-500">
						Chúng tôi cần thêm vài thông tin để cài đặt cảnh báo phù hợp với vùng canh tác của bạn.
						Chỉ mất khoảng <strong class="text-gray-900">2 phút</strong>.
					</p>
					<button
						type="button"
						onclick={next}
						class="mt-8 rounded-xl bg-accent px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 focus-visible:outline-2 focus-visible:outline-accent"
					>
						Bắt đầu khảo sát
					</button>
				</div>

				<!-- ─── Step 1: Location ─── -->
			{:else if step === 1}
				<div>
					<h2 class="text-2xl font-semibold tracking-tight">Vùng canh tác của bạn ở đâu?</h2>
					<p class="mt-1.5 text-sm text-gray-500">
						Giúp chúng tôi xác định trạm đo gần nhất và hiệu chỉnh dự báo cho khu vực.
					</p>

					<div class="mt-6 flex flex-col gap-4">
						<div>
							<label for="province" class="mb-1.5 block text-sm font-medium text-gray-700">
								Tỉnh / Thành phố <span class="text-red-400">*</span>
							</label>
							<input
								id="province"
								type="text"
								list="province-list"
								bind:value={province}
								placeholder="Hải Phòng, Nam Định, Bến Tre…"
								class={inputCls()}
							/>
							<datalist id="province-list">
								{#each PROVINCES as p (p)}
									<option value={p}></option>
								{/each}
							</datalist>
						</div>

						<div>
							<label for="district" class="mb-1.5 block text-sm font-medium text-gray-700">
								Quận / Huyện <span class="text-red-400">*</span>
							</label>
							<input
								id="district"
								type="text"
								bind:value={district}
								placeholder="Ví dụ: Huyện Kiến Thụy"
								class={inputCls()}
							/>
						</div>

						<div>
							<label for="commune" class="mb-1.5 block text-sm font-medium text-gray-700">
								Xã / Phường
								<span class="ml-1 text-xs font-normal text-gray-400">(tùy chọn)</span>
							</label>
							<input
								id="commune"
								type="text"
								bind:value={commune}
								placeholder="Ví dụ: Xã Đại Hợp"
								class={inputCls()}
							/>
						</div>

						<div
							class="flex items-center gap-2.5 rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-3.5 text-sm text-gray-400"
						>
							<svg
								viewBox="0 0 24 24"
								class="h-4 w-4 shrink-0"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								aria-hidden="true"
							>
								<path d="M9 3 3 6v15l6-3 6 3 6-3V3l-6 3-6-3Z" /><path d="M9 3v15M15 6v15" />
							</svg>
							Bản đồ Google Maps sẽ được tích hợp để xác định vị trí chính xác.
						</div>
					</div>
				</div>

				<!-- ─── Step 2: Farm type ─── -->
			{:else if step === 2}
				<div>
					<h2 class="text-2xl font-semibold tracking-tight">Loại hình canh tác chính?</h2>
					<p class="mt-1.5 text-sm text-gray-500">
						Mỗi loại cây trồng có ngưỡng chịu mặn khác nhau — thông tin này giúp chúng tôi điều
						chỉnh dự báo chính xác hơn.
					</p>

					<div class="mt-5 grid grid-cols-2 gap-3">
						{#each FARM_TYPES as item (item.id)}
							<button
								type="button"
								class={cardCls(farmType === item.id)}
								onclick={() => (farmType = item.id)}
								aria-pressed={farmType === item.id}
							>
								<span class="mb-1.5 block text-2xl" aria-hidden="true">{item.icon}</span>
								<span class="block text-sm font-semibold text-gray-900">{item.label}</span>
								<span class="mt-0.5 block text-xs text-gray-500">{item.desc}</span>
							</button>
						{/each}
					</div>
				</div>

				<!-- ─── Step 3: Farm area ─── -->
			{:else if step === 3}
				<div>
					<h2 class="text-2xl font-semibold tracking-tight">Tổng diện tích canh tác?</h2>
					<p class="mt-1.5 text-sm text-gray-500">
						Diện tích ảnh hưởng đến mức độ ưu tiên cảnh báo và tần suất kiểm tra.
					</p>

					<div class="mt-5 flex flex-col gap-3">
						{#each AREAS as item (item.id)}
							<button
								type="button"
								class={cardCls(farmArea === item.id)}
								onclick={() => (farmArea = item.id)}
								aria-pressed={farmArea === item.id}
							>
								<span class="text-sm font-semibold text-gray-900">{item.label}</span>
								<span class="ml-2 text-xs text-gray-500">{item.desc}</span>
							</button>
						{/each}
					</div>
				</div>

				<!-- ─── Step 4: Water source ─── -->
			{:else if step === 4}
				<div>
					<h2 class="text-2xl font-semibold tracking-tight">Nguồn nước tưới tiêu?</h2>
					<p class="mt-1.5 text-sm text-gray-500">
						Mặn xâm nhập qua kênh rạch và nguồn nước mặt nhanh hơn qua giếng — giúp chúng tôi đánh
						giá mức độ rủi ro đúng hơn.
					</p>

					<div class="mt-5 grid grid-cols-2 gap-3">
						{#each WATER as item (item.id)}
							<button
								type="button"
								class={cardCls(waterSource === item.id)}
								onclick={() => (waterSource = item.id)}
								aria-pressed={waterSource === item.id}
							>
								<span class="mb-1.5 block text-2xl" aria-hidden="true">{item.icon}</span>
								<span class="block text-sm font-semibold text-gray-900">{item.label}</span>
								<span class="mt-0.5 block text-xs text-gray-500">{item.desc}</span>
							</button>
						{/each}
					</div>
				</div>

				<!-- ─── Step 5: Alert threshold ─── -->
			{:else if step === 5}
				<div>
					<h2 class="text-2xl font-semibold tracking-tight">Bạn muốn nhận cảnh báo từ mức nào?</h2>
					<p class="mt-1.5 text-sm text-gray-500">
						Ngưỡng EC (độ mặn) tối thiểu để hệ thống gửi thông báo đến bạn.
					</p>

					<div class="mt-5 flex flex-col gap-3">
						{#each THRESHOLDS as item (item.id)}
							<button
								type="button"
								class={cardCls(alertThreshold === item.id)}
								onclick={() => (alertThreshold = item.id)}
								aria-pressed={alertThreshold === item.id}
							>
								<div class="flex items-start gap-3">
									<span
										class={clsx('mt-0.5 h-3 w-3 shrink-0 rounded-full', item.dot)}
										aria-hidden="true"
									></span>
									<div>
										<span class="block text-sm font-semibold text-gray-900">{item.label}</span>
										<span class="mt-0.5 block text-xs leading-relaxed text-gray-500"
											>{item.desc}</span
										>
									</div>
								</div>
							</button>
						{/each}
					</div>
				</div>

				<!-- ─── Step 6: Lead time ─── -->
			{:else if step === 6}
				<div>
					<h2 class="text-2xl font-semibold tracking-tight">Muốn nhận cảnh báo trước bao lâu?</h2>
					<p class="mt-1.5 text-sm text-gray-500">
						Dự báo càng xa thì độ chính xác giảm nhưng bạn có nhiều thời gian chuẩn bị hơn.
					</p>

					<div class="mt-5 flex flex-col gap-3">
						{#each LEAD as item (item.id)}
							<button
								type="button"
								class={cardCls(leadTime === item.id)}
								onclick={() => (leadTime = item.id)}
								aria-pressed={leadTime === item.id}
							>
								<span class="text-sm font-semibold text-gray-900">{item.label}</span>
								<span class="ml-2 text-xs text-gray-500">{item.desc}</span>
							</button>
						{/each}
					</div>
				</div>

				<!-- ─── Step 7: Experience ─── -->
			{:else if step === 7}
				<div>
					<h2 class="text-2xl font-semibold tracking-tight">
						Kinh nghiệm với xâm nhập mặn của bạn?
					</h2>
					<p class="mt-1.5 text-sm text-gray-500">
						Giúp chúng tôi hiểu mức độ quen thuộc của bạn với rủi ro mặn để điều chỉnh nội dung cảnh
						báo phù hợp.
					</p>

					<div class="mt-5 flex flex-col gap-3">
						{#each EXP as item (item.id)}
							<button
								type="button"
								class={cardCls(experience === item.id)}
								onclick={() => (experience = item.id)}
								aria-pressed={experience === item.id}
							>
								<span class="block text-sm font-semibold text-gray-900">{item.label}</span>
								<span class="mt-0.5 block text-xs text-gray-500">{item.desc}</span>
							</button>
						{/each}
					</div>
				</div>

				<!-- ─── Step 8: Summary ─── -->
			{:else if step > TOTAL}
				<div>
					<div class="mb-6 flex items-center gap-3">
						<span
							class="grid h-10 w-10 place-items-center rounded-full bg-green-100 text-green-600"
							aria-hidden="true"
						>
							<svg
								viewBox="0 0 24 24"
								class="h-5 w-5"
								fill="none"
								stroke="currentColor"
								stroke-width="2.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M20 6 9 17l-5-5" />
							</svg>
						</span>
						<div>
							<h2 class="text-2xl font-semibold tracking-tight">Xác nhận thông tin</h2>
							<p class="text-sm text-gray-500">Kiểm tra lại trước khi bắt đầu sử dụng.</p>
						</div>
					</div>

					<dl class="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
						{#each summary as row (row.label)}
							<div class="flex items-baseline gap-4 px-5 py-3.5">
								<dt class="w-36 shrink-0 text-xs text-gray-400">{row.label}</dt>
								<dd class="flex-1 text-sm font-medium text-gray-900">{row.value}</dd>
							</div>
						{/each}
					</dl>

					<p class="mt-4 text-xs text-gray-400">
						Bạn có thể thay đổi những thông tin này bất cứ lúc nào trong phần Cài đặt.
					</p>

					<div class="mt-6 flex items-center gap-3">
						<button
							type="button"
							onclick={back}
							class="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-accent"
						>
							Quay lại
						</button>
						<button
							type="button"
							onclick={finish}
							class="flex-1 rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 focus-visible:outline-2 focus-visible:outline-accent"
						>
							Bắt đầu sử dụng SaliGuard
						</button>
					</div>
				</div>
			{/if}

			<!-- Navigation (steps 1–7) -->
			{#if step > 0 && step <= TOTAL}
				<div class="mt-8 flex items-center justify-between">
					<button
						type="button"
						onclick={back}
						class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-accent"
					>
						<svg
							viewBox="0 0 24 24"
							class="h-4 w-4"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<path d="m15 18-6-6 6-6" />
						</svg>
						Quay lại
					</button>

					<button
						type="button"
						onclick={next}
						disabled={!canNext}
						class={clsx(
							'flex items-center gap-1.5 rounded-xl px-6 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-accent',
							canNext
								? 'bg-accent text-white shadow-sm hover:bg-accent/90'
								: 'cursor-not-allowed bg-gray-100 text-gray-400'
						)}
					>
						{step === TOTAL ? 'Xem tóm tắt' : 'Tiếp theo'}
						<svg
							viewBox="0 0 24 24"
							class="h-4 w-4"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<path d="m9 18 6-6-6-6" />
						</svg>
					</button>
				</div>
			{/if}
		</div>
	</main>
</div>
