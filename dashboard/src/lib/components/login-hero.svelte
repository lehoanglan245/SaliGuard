<!--
	Decorative left hero for the login page. Salinity/water theme built only from
	inline SVG + gradients. Palette: navy #1e3a5f, teal #2a9d8f, dusty-blue #6b8caf
	(dominant) with gold #d4a437 + cream #f4f1ea + sage #87a96b as low-opacity accents.
	Five decorative elements only: 3 organic blobs, 1 contour-line group, 1 grain overlay.
-->
<section
	class="relative hidden flex-col justify-between overflow-hidden p-12 text-[#f4f1ea] lg:flex"
>
	<svg
		class="absolute inset-0 h-full w-full"
		viewBox="0 0 600 900"
		preserveAspectRatio="xMidYMid slice"
		aria-hidden="true"
	>
		<defs>
			<linearGradient id="hero-base" x1="0" y1="0" x2="0.85" y2="1">
				<stop offset="0%" stop-color="#1e3a5f" />
				<stop offset="62%" stop-color="#235a63" />
				<stop offset="100%" stop-color="#2a9d8f" />
			</linearGradient>
			<filter id="hero-grain" x="0" y="0" width="100%" height="100%">
				<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
				<feColorMatrix type="saturate" values="0" />
			</filter>
		</defs>

		<!-- base gradient -->
		<rect width="600" height="900" fill="url(#hero-base)" />

		<!-- blob 1: dusty-blue, upper right, off-center -->
		<path
			d="M438 -70 C560 -30 632 96 588 232 C552 344 430 372 352 300 C286 238 250 96 318 6 C354 -42 396 -84 438 -70 Z"
			fill="#6b8caf"
			opacity="0.20"
		/>
		<!-- blob 2: teal, lower left, larger -->
		<path
			d="M-80 980 C-30 836 120 802 250 838 C372 872 410 760 372 648 C334 540 196 520 92 590 C-44 682 -150 800 -80 980 Z"
			fill="#2a9d8f"
			opacity="0.26"
		/>
		<!-- blob 3: sage, small mid-right accent -->
		<path
			d="M612 540 C660 588 642 686 566 706 C508 720 470 660 488 600 C504 548 568 496 612 540 Z"
			fill="#87a96b"
			opacity="0.12"
		/>

		<!-- contour / salinity lines: gold strokes, varying opacity -->
		<g fill="none" stroke="#d4a437" stroke-linecap="round">
			<path
				d="M-40 300 C140 240 300 360 470 296 C560 262 620 286 660 270"
				stroke-width="1.5"
				opacity="0.55"
			/>
			<path
				d="M-40 348 C150 292 300 408 480 344 C566 314 624 336 660 322"
				stroke-width="1.25"
				opacity="0.32"
			/>
			<path
				d="M-40 414 C170 360 296 470 500 410 C580 388 628 404 660 396"
				stroke-width="1"
				opacity="0.18"
			/>
			<path d="M-40 690 C160 642 320 736 520 676" stroke-width="1.25" opacity="0.22" />
		</g>

		<!-- grain overlay to kill the flat gradient look -->
		<rect width="600" height="900" filter="url(#hero-grain)" opacity="0.04" />
	</svg>

	<!-- content sits above decoration -->
	<div class="relative flex items-center gap-2">
		<span class="h-7 w-7 rounded-full bg-[#f4f1ea]/90" aria-hidden="true"></span>
		<span class="text-lg font-semibold">SaliGuard</span>
	</div>

	<div class="relative max-w-lg" style="font-family: 'Lora', serif;">
		<h2 class="text-[2.8rem] font-semibold leading-tight">Stay ahead of saltwater intrusion</h2>
		<ul class="mt-7 flex flex-col gap-4 text-[1.31rem] font-medium text-[#f4f1ea]/90">
			<li class="flex items-center gap-2.5">
				<span class="h-2 w-2 rounded-full bg-[#d4a437]" aria-hidden="true"></span>
				24–72 hour salinity forecasts
			</li>
			<li class="flex items-center gap-2.5">
				<span class="h-2 w-2 rounded-full bg-[#d4a437]" aria-hidden="true"></span>
				Alerts at the 1 & 4 g/L thresholds
			</li>
			<li class="flex items-center gap-2.5">
				<span class="h-2 w-2 rounded-full bg-[#d4a437]" aria-hidden="true"></span>
				Live data from field sensors
			</li>
		</ul>
	</div>

	<p class="relative text-xs text-[#f4f1ea]/70">Hải Phòng · 2026</p>
</section>
