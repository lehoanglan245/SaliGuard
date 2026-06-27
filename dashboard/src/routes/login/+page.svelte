<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { clsx } from '$lib/clsx';
	import { login } from '$lib/auth';
	import { loginSchema } from '$lib/schema';
	import { loginForm } from './login.remote';

	let showPassword = $state(false);
	let authError = $state<string | null>(null);
	let submitting = $state(false);

	const busy = $derived(loginForm.pending > 0 || submitting);

	const inputClass = clsx(
		'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm',
		'focus-visible:outline-2 focus-visible:outline-accent aria-[invalid]:border-red-400'
	);
	const buttonClass = clsx(
		'flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5',
		'text-sm font-medium text-white hover:bg-amber-600 focus-visible:outline-2',
		'focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50'
	);

	function fieldError(issues: { message: string }[] | undefined): string | null {
		return issues && issues.length > 0 ? issues[0].message : null;
	}
</script>

<svelte:head><title>Đăng nhập — SaliGuard</title></svelte:head>

<main class="flex min-h-screen items-center justify-center bg-cream px-4 py-12">
	<div class="w-full max-w-sm">
		<div class="mb-8 flex flex-col items-center gap-2 text-center">
			<span class="h-10 w-10 rounded-full bg-accent" aria-hidden="true"></span>
			<h1 class="text-2xl font-semibold">SaliGuard</h1>
			<p class="text-sm text-gray-500">Hệ thống cảnh báo sớm xâm nhập mặn</p>
		</div>

		<form
			novalidate
			class="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-sm"
			{...loginForm.preflight(loginSchema).enhance(async (form) => {
				authError = null;
				await form.submit();
				if (!form.result?.ok) return;
				submitting = true;
				const email = String(form.fields.email.value() ?? '');
				const password = String(form.fields.password.value() ?? '');
				const result = await login(email, password);
				submitting = false;
				if (result.ok) {
					await goto(resolve('/'));
				} else {
					authError = result.error ?? 'Đăng nhập thất bại';
				}
			})}
		>
			{#if authError}
				<p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
					{authError}
				</p>
			{/if}

			<div class="flex flex-col gap-1">
				<label class="text-sm font-medium" for="email">Email</label>
				<input
					{...loginForm.fields.email.as('text')}
					id="email"
					type="email"
					autocomplete="email"
					placeholder="admin@saliguard.vn"
					class={inputClass}
				/>
				{#if fieldError(loginForm.fields.email.issues())}
					<p class="text-xs text-red-600">{fieldError(loginForm.fields.email.issues())}</p>
				{/if}
			</div>

			<div class="flex flex-col gap-1">
				<label class="text-sm font-medium" for="password">Mật khẩu</label>
				<div class="relative">
					<input
						{...loginForm.fields.password.as('text')}
						id="password"
						type={showPassword ? 'text' : 'password'}
						autocomplete="current-password"
						placeholder="••••••••"
						class={clsx(inputClass, 'pr-10')}
					/>
					<button
						type="button"
						onclick={() => (showPassword = !showPassword)}
						aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
						aria-pressed={showPassword}
						class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-accent"
					>
						{#if showPassword}
							<svg
								viewBox="0 0 24 24"
								class="h-5 w-5"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								aria-hidden="true"
							>
								<path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" stroke-linecap="round" />
								<path
									d="M9.4 5.2A9.5 9.5 0 0 1 12 5c5 0 9 4.5 9 7a13 13 0 0 1-2.2 2.9M6.3 6.3A13 13 0 0 0 3 12c0 2.5 4 7 9 7a9.3 9.3 0 0 0 3-.5"
									stroke-linecap="round"
								/>
							</svg>
						{:else}
							<svg
								viewBox="0 0 24 24"
								class="h-5 w-5"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								aria-hidden="true"
							>
								<path
									d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
								<circle cx="12" cy="12" r="3" />
							</svg>
						{/if}
					</button>
				</div>
				{#if fieldError(loginForm.fields.password.issues())}
					<p class="text-xs text-red-600">{fieldError(loginForm.fields.password.issues())}</p>
				{/if}
			</div>

			<button type="submit" disabled={busy} class={buttonClass}>
				{#if busy}
					<svg
						viewBox="0 0 24 24"
						class="h-4 w-4 animate-spin"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						aria-hidden="true"
					>
						<path d="M21 12a9 9 0 1 1-6.2-8.6" stroke-linecap="round" />
					</svg>
					Đang đăng nhập…
				{:else}
					Đăng nhập
				{/if}
			</button>
		</form>

		<p class="mt-4 text-center text-xs text-gray-400">admin@saliguard.vn / saliguard123</p>
	</div>
</main>
