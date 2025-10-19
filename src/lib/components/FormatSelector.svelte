<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let sourceFormat: string = '';
	export let selectedFormat: string = '';
	export let aiRecommendation: string | null = null;

	const dispatch = createEventDispatcher<{ select: string }>();

	// Available image formats
	const formats = [
		{ value: 'image/jpeg', label: 'JPG', ext: '.jpg' },
		{ value: 'image/png', label: 'PNG', ext: '.png' },
		{ value: 'image/webp', label: 'WebP', ext: '.webp' },
		{ value: 'image/gif', label: 'GIF', ext: '.gif' }
	];

	// Filter out the source format from available conversions
	$: availableFormats = formats.filter((f) => f.value !== sourceFormat);

	function selectFormat(format: string) {
		selectedFormat = format;
		dispatch('select', format);
	}

	/**
	 * Get file size indicator based on source and target formats
	 */
	function getSizeIndicator(source: string, target: string): string {
		const lossy = ['image/jpeg', 'image/webp'];
		const lossless = ['image/png', 'image/gif'];

		// Lossy to lossless = larger
		if (lossy.includes(source) && lossless.includes(target)) {
			return '📈 Larger';
		}

		// Lossless to lossy = smaller
		if (lossless.includes(source) && lossy.includes(target)) {
			return '📉 Smaller';
		}

		// PNG/GIF to WebP = smaller
		if ((source === 'image/png' || source === 'image/gif') && target === 'image/webp') {
			return '📉 Smaller';
		}

		// JPG to WebP = smaller
		if (source === 'image/jpeg' && target === 'image/webp') {
			return '📉 Smaller';
		}

		// Same category or similar size
		return '📊 Similar';
	}

	/**
	 * Check if this format is AI recommended
	 */
	function isRecommended(formatValue: string): boolean {
		if (!aiRecommendation) return false;
		const formatName = formats.find((f) => f.value === formatValue)?.label;
		return formatName?.toUpperCase() === aiRecommendation.toUpperCase();
	}
</script>

<div class="w-full">
	<h3 class="text-lg font-semibold text-gray-800 mb-4">Convert to:</h3>

	<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
		{#each availableFormats as format}
			<button
				type="button"
				class="relative p-4 border-2 rounded-lg transition-all duration-200 {selectedFormat === format.value
					? 'border-blue-500 bg-blue-50 text-blue-700'
					: isRecommended(format.value)
						? 'border-purple-400 bg-purple-50 text-purple-700 hover:border-purple-500'
						: 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'}"
				on:click={() => selectFormat(format.value)}
			>
				<!-- Recommended Badge -->
				{#if isRecommended(format.value)}
					<span
						class="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-md"
					>
						✨ Recommended
					</span>
				{/if}

				<div class="flex flex-col items-center gap-2">
					<div class="text-2xl font-bold">{format.label}</div>
					<div class="text-xs text-gray-500">{format.ext}</div>

					<!-- Size Indicator -->
					<div class="text-xs font-medium {
						getSizeIndicator(sourceFormat, format.value).includes('Smaller') ? 'text-green-600' :
						getSizeIndicator(sourceFormat, format.value).includes('Larger') ? 'text-orange-600' :
						'text-gray-500'
					}">
						{getSizeIndicator(sourceFormat, format.value)}
					</div>
				</div>
			</button>
		{/each}
	</div>

	<!-- Size Estimates Disclaimer -->
	<div class="mt-3 p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
		<span class="font-medium">ℹ️ Note:</span> Size indicators are general estimates. Actual file size depends on image content, quality settings, and compression. Precise results shown after conversion.
	</div>

	{#if selectedFormat}
		<div class="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
			<p class="text-sm text-green-800">
				<span class="font-semibold">Selected:</span>
				{formats.find((f) => f.value === selectedFormat)?.label}
			</p>
		</div>
	{/if}
</div>
