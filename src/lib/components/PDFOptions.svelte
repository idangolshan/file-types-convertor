<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let pageSize: 'A4' | 'original' = 'original';
	export let orientation: 'portrait' | 'landscape' = 'portrait';

	const dispatch = createEventDispatcher<{
		change: { pageSize: 'A4' | 'original'; orientation: 'portrait' | 'landscape' };
	}>();

	function handleChange() {
		dispatch('change', { pageSize, orientation });
	}
</script>

<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
	<h4 class="text-sm font-semibold text-blue-900">PDF Options</h4>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<!-- Page Size Selector -->
		<div>
			<label for="pageSize" class="block text-sm font-medium text-gray-700 mb-2">
				Page Size
			</label>
			<select
				id="pageSize"
				bind:value={pageSize}
				on:change={handleChange}
				class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
			>
				<option value="original">Original Image Size</option>
				<option value="A4">A4 Paper</option>
			</select>
		</div>

		<!-- Orientation Selector (only for A4) -->
		<div>
			<label for="orientation" class="block text-sm font-medium text-gray-700 mb-2">
				Orientation
			</label>
			<select
				id="orientation"
				bind:value={orientation}
				on:change={handleChange}
				disabled={pageSize !== 'A4'}
				class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
			>
				<option value="portrait">Portrait</option>
				<option value="landscape">Landscape</option>
			</select>
		</div>
	</div>

	<!-- Info text -->
	<p class="text-xs text-gray-600">
		{#if pageSize === 'A4'}
			<span class="font-medium">ℹ️ Note:</span> Image will be scaled to fit A4 page while maintaining
			aspect ratio.
		{:else}
			<span class="font-medium">ℹ️ Note:</span> PDF page will match the original image dimensions.
		{/if}
	</p>
</div>
