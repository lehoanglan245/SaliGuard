<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { clsx } from '$lib/clsx';
	import { login, loginAsGuest } from '$lib/auth';
	import { loginSchema } from '$lib/schema';
	import { loginForm } from './login.remote';
	import LoginHero from '$lib/components/login-hero.svelte';

	const COUNTRY_CODES = ['+84', '+91', '+1'];

	let countryCode = $state('+84');
	let showPassword = $state(false);
	let authError = $state<string | null>(null);
	let notice = $state<string | null>(null);
	let submitting = $state(false);

	const busy = $derived(loginForm.pending > 0 || submitting);

	const inputClass = clsx(
		'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm transition',
		'focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-accent',
		'aria-[invalid]:border-red-400'
	);
	const loginButtonClass = clsx(
		'flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-medium',
		'text-white shadow-sm transition duration-200 hover:bg-amber-600 active:scale-[0.99]',
		'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50'
	);
	const socialButtonClass = clsx(
		'flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5',
		'text-sm font-medium text-gray-700 transition hover:bg-gray-50 active:scale-[0.99]',
		'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
	);
	const cardClass = clsx(
		'rounded-3xl border border-white/70 bg-card/90 p-6 backdrop-blur-xl sm:p-8',
		'shadow-[0_1px_2px_rgba(31,25,16,0.04),0_28px_56px_-30px_rgba(31,25,16,0.3)]'
	);

	function fieldError(issues: { message: string }[] | undefined): string | null {
		return issues && issues.length > 0 ? issues[0].message : null;
	}

	function guest() {
		loginAsGuest();
		goto(resolve('/'));
	}
</script>

<svelte:head><title>Sign in — SaliGuard</title></svelte:head>

<main class="grid min-h-screen bg-cream font-[Inter] text-gray-900 lg:grid-cols-2">
	<!-- Brand hero panel (landscape only) -->
	<LoginHero />

	<!-- Form panel -->
	<section class="relative flex items-center justify-center overflow-hidden px-4 py-12">
		<!-- soft ambient background so the glass card has something to blur -->
		<div class="pointer-events-none absolute inset-0" aria-hidden="true">
			<div
				class="absolute -top-24 -right-16 h-[28rem] w-[28rem] rounded-full opacity-60 blur-3xl"
				style="background: radial-gradient(circle, #fde9c8 0%, transparent 70%);"
			></div>
			<div
				class="absolute -bottom-24 -left-10 h-[24rem] w-[24rem] rounded-full opacity-50 blur-3xl"
				style="background: radial-gradient(circle, #d9efe9 0%, transparent 70%);"
			></div>
		</div>

		<div class="reveal relative w-full max-w-md">
			<div class="mb-6 flex flex-col items-center gap-1 text-center lg:hidden">
				<span class="h-10 w-10 rounded-full bg-accent" aria-hidden="true"></span>
				<h1 class="text-2xl font-semibold tracking-tight">SaliGuard</h1>
				<p class="text-sm text-gray-500">Early saltwater intrusion warning</p>
			</div>

			<div class={cardClass}>
				<h2 class="mb-1 text-2xl font-semibold tracking-tight">Sign in</h2>
				<p class="mb-6 text-sm text-gray-500">Welcome back. Access your salinity dashboard.</p>

				<form
					novalidate
					class="flex flex-col gap-4"
					{...loginForm.preflight(loginSchema).enhance(async (form) => {
						authError = null;
						notice = null;
						await form.submit();
						if (!form.result?.ok) return;
						submitting = true;
						const email = String(form.fields.email.value() ?? '');
						const phone = String(form.fields.phone.value() ?? '');
						const password = String(form.fields.password.value() ?? '');
						const result = await login({ email, phone, password });
						submitting = false;
						if (result.ok) {
							await goto(resolve('/'));
						} else {
							authError = result.error ?? 'Sign-in failed';
						}
					})}
				>
					{#if authError}
						<p class="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700" role="alert">
							{authError}
						</p>
					{/if}

					<div class="flex flex-col gap-1.5">
						<label class="text-sm font-medium" for="phone">Phone number</label>
						<div class="flex gap-2">
							<label class="sr-only" for="country-code">Country code</label>
							<select
								id="country-code"
								bind:value={countryCode}
								class="rounded-xl border border-gray-200 bg-white px-2.5 py-2.5 text-sm transition focus-visible:outline-2 focus-visible:outline-accent"
							>
								{#each COUNTRY_CODES as code (code)}
									<option value={code}>{code}</option>
								{/each}
							</select>
							<input
								{...loginForm.fields.phone.as('text')}
								id="phone"
								type="tel"
								inputmode="numeric"
								autocomplete="tel-national"
								placeholder="0912345678"
								class={inputClass}
							/>
						</div>
						{#if fieldError(loginForm.fields.phone.issues())}
							<p class="text-xs text-red-600">{fieldError(loginForm.fields.phone.issues())}</p>
						{/if}
					</div>

					<div class="flex flex-col gap-1.5">
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

					<div class="flex flex-col gap-1.5">
						<label class="text-sm font-medium" for="password">Password</label>
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
								aria-label={showPassword ? 'Hide password' : 'Show password'}
								aria-pressed={showPassword}
								class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 transition hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-accent"
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

					<button type="submit" disabled={busy} class={loginButtonClass}>
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
							Signing in…
						{:else}
							Sign in
						{/if}
					</button>
				</form>

				<p class="mt-4 text-center text-sm text-gray-500">
					Don't have an account?
					<button
						type="button"
						onclick={() => (notice = 'Registration isn’t available yet.')}
						class="font-medium text-accent transition hover:underline focus-visible:outline-2 focus-visible:outline-accent"
					>
						Sign up
					</button>
				</p>

				<div class="my-5 flex items-center gap-3 text-xs text-gray-400">
					<span class="h-px flex-1 bg-gray-200" aria-hidden="true"></span>
					or
					<span class="h-px flex-1 bg-gray-200" aria-hidden="true"></span>
				</div>

				{#if notice}
					<p
						class="mb-3 rounded-xl bg-accent-soft px-3.5 py-2.5 text-xs text-amber-800"
						role="status"
					>
						{notice}
					</p>
				{/if}

				<div class="flex flex-col gap-2">
					<button
						type="button"
						onclick={() => (notice = 'Google sign-in isn’t available yet.')}
						class={socialButtonClass}
					>
						<svg viewBox="0 0 24 24" class="h-4 w-4" aria-hidden="true">
							<path
								fill="#EA4335"
								d="M12 11v3.8h5.3c-.2 1.4-1.6 4-5.3 4-3.2 0-5.8-2.6-5.8-5.8S8.8 7.2 12 7.2c1.8 0 3 .8 3.7 1.4l2.5-2.4C16.6 4.7 14.5 3.8 12 3.8 6.9 3.8 2.8 7.9 2.8 13S6.9 22.2 12 22.2c5.3 0 8.8-3.7 8.8-9 0-.6 0-1-.1-1.4z"
							/>
						</svg>
						Continue with Google
					</button>
					<button
						type="button"
						onclick={() => (notice = 'Apple sign-in isn’t available yet.')}
						class={socialButtonClass}
					>
						<svg viewBox="0 0 24 24" class="h-4 w-4" fill="currentColor" aria-hidden="true">
							<path
								d="M16.4 12.8c0-2.2 1.8-3.3 1.9-3.3-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.6.8-3.3.8-.7 0-1.7-.8-2.8-.8-1.4 0-2.8.8-3.5 2.1-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.6 2.2 2.7 2.2 1.1 0 1.5-.7 2.8-.7s1.6.7 2.8.7c1.1 0 1.9-1 2.6-2 .8-1.2 1.2-2.3 1.2-2.4-.1 0-2.3-.9-2.3-3.6zM14.3 6.3c.6-.7 1-1.7.9-2.7-.9 0-1.9.6-2.5 1.3-.6.6-1 1.6-.9 2.6 1 .1 1.9-.5 2.5-1.2z"
							/>
						</svg>
						Continue with Apple
					</button>
					<button
						type="button"
						onclick={guest}
						class="mt-1 text-center text-sm text-gray-500 underline transition hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-accent"
					>
						Continue as guest
					</button>
				</div>
			</div>

			<p class="mt-4 text-center text-xs text-gray-400">
				admin@saliguard.vn or 0912345678 / saliguard123
			</p>
		</div>
	</section>
</main>

<style>
	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
	.reveal {
		animation: rise 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both;
	}
	@media (prefers-reduced-motion: reduce) {
		.reveal {
			animation: none;
		}
	}
</style>
