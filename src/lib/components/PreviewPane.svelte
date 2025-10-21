<script lang="ts">
	import { onMount } from 'svelte';

	export let originalFile: File | null = null;
	export let convertedBlob: Blob | null = null;
	export let isConverting: boolean = false;

	let originalPreview: string = '';
	let convertedPreview: string = '';

	// Check if converted output is a PDF
	$: isPDF = convertedBlob?.type === 'application/pdf';

	// Calculate size difference percentage
	$: sizeDiff =
		originalFile && convertedBlob
			? ((convertedBlob.size - originalFile.size) / originalFile.size) * 100
			: 0;

	// Generate preview URL for original file
	$: if (originalFile) {
		// Revoke old URL to prevent memory leaks
		if (originalPreview) URL.revokeObjectURL(originalPreview);
		originalPreview = URL.createObjectURL(originalFile);
	}

	// Generate preview URL for converted file
	$: if (convertedBlob) {
		// Revoke old URL to prevent memory leaks
		if (convertedPreview) URL.revokeObjectURL(convertedPreview);
		convertedPreview = URL.createObjectURL(convertedBlob);
	}

	// Cleanup on unmount
	onMount(() => {
		return () => {
			if (originalPreview) URL.revokeObjectURL(originalPreview);
			if (convertedPreview) URL.revokeObjectURL(convertedPreview);
		};
	});
</script>

<div class="w-full">
	<h3 class="text-lg font-semibold text-gray-800 mb-4">Preview</h3>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<!-- Original Image -->
		<div class="space-y-2">
			<h4 class="text-sm font-medium text-gray-600">Original</h4>
			<div
				class="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-300"
			>
				{#if originalPreview}
					<img
						src={originalPreview}
						alt="Original"
						class="w-full h-full object-contain"
					/>
					<div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
						<p class="text-xs truncate">{originalFile?.name}</p>
						<p class="text-xs">{((originalFile?.size || 0) / 1024).toFixed(2)} KB</p>
					</div>
				{:else}
					<div class="flex items-center justify-center h-full text-gray-400">
						<p>No image selected</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Converted Output -->
		<div class="space-y-2">
			<h4 class="text-sm font-medium text-gray-600">
				{isPDF ? 'Converted PDF' : 'Converted'}
			</h4>
			<div
				class="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 {convertedBlob
					? 'border-green-500'
					: 'border-gray-300'}"
			>
				{#if isConverting}
					<div class="flex items-center justify-center h-full">
						<div class="text-center">
							<div
								class="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
							></div>
							<p class="mt-4 text-gray-600">Converting...</p>
						</div>
					</div>
				{:else if convertedPreview && isPDF}
					<!-- PDF Preview using iframe -->
					<iframe
						src={convertedPreview}
						title="PDF Preview"
						class="w-full h-full border-0"
					></iframe>
					<div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
						<p class="text-xs">PDF Document</p>
						<p class="text-xs">{((convertedBlob?.size || 0) / 1024).toFixed(2)} KB</p>
					</div>
				{:else if convertedPreview}
					<!-- Image Preview -->
					<img
						src={convertedPreview}
						alt="Converted"
						class="w-full h-full object-contain"
					/>
					<div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
						<p class="text-xs">Converted image</p>
						<p class="text-xs">{((convertedBlob?.size || 0) / 1024).toFixed(2)} KB</p>
					</div>
				{:else}
					<div class="flex items-center justify-center h-full text-gray-400">
						<p>Converted output will appear here</p>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Size Comparison -->
	{#if originalFile && convertedBlob}
		<div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-semibold text-blue-900">Size Comparison</p>
					<p class="text-xs text-blue-700">
						Original: {((originalFile.size || 0) / 1024).toFixed(2)} KB → Converted: {(
							(convertedBlob.size || 0) / 1024
						).toFixed(2)} KB
					</p>
				</div>
				<div class="text-right">
						<p
						class="text-sm font-bold {sizeDiff > 0 ? 'text-red-600' : 'text-green-600'}"
					>
						{sizeDiff > 0 ? '+' : ''}{sizeDiff.toFixed(1)}%
					</p>
				</div>
			</div>
		</div>
	{/if}
</div>

