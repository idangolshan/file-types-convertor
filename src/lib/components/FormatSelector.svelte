<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let sourceFormat: string = '';
	export let selectedFormat: string = '';

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
</script>

<div class="w-full">
	<h3 class="text-lg font-semibold text-gray-800 mb-4">Convert to:</h3>

	<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
		{#each availableFormats as format}
			<button
				type="button"
				class="p-4 border-2 rounded-lg transition-all duration-200 {selectedFormat === format.value
					? 'border-blue-500 bg-blue-50 text-blue-700'
					: 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'}"
				on:click={() => selectFormat(format.value)}
			>
				<div class="flex flex-col items-center gap-2">
					<div class="text-2xl font-bold">{format.label}</div>
					<div class="text-xs text-gray-500">{format.ext}</div>
				</div>
			</button>
		{/each}
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
