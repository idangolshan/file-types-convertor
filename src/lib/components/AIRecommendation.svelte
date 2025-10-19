<script lang="ts">
	import type { AIAnalysisResult } from '$lib/services/openAI';

	export let recommendation: AIAnalysisResult | null = null;
	export let isLoading: boolean = false;
	export let error: string = '';
	export let altText: string = '';
	export let suggestedFilename: string = '';
	export let hasTransparency: boolean = false;

	function copyAltText() {
		if (altText) {
			navigator.clipboard.writeText(altText);
			// Could add a toast notification here
		}
	}
</script>

<div class="space-y-4">
	<!-- AI Format Recommendation -->
	{#if isLoading}
		<div class="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
			<div class="flex items-center gap-3">
				<div
					class="inline-block w-6 h-6 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"
				></div>
				<div>
					<h3 class="text-lg font-semibold text-purple-900">AI Analyzing Image...</h3>
					<p class="text-sm text-purple-700">Getting smart recommendations</p>
				</div>
			</div>
		</div>
	{:else if error}
		<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
			<div class="flex items-start gap-3">
				<span class="text-2xl">⚠️</span>
				<div>
					<h4 class="font-semibold text-yellow-900">AI Analysis Unavailable</h4>
					<p class="text-sm text-yellow-700 mt-1">{error}</p>
					<p class="text-xs text-yellow-600 mt-2">
						Tip: Add your OpenAI API key to enable AI features
					</p>
				</div>
			</div>
		</div>
	{:else if recommendation}
		<div class="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
			<div class="flex items-start gap-3">
				<span class="text-3xl">🤖</span>
				<div class="flex-1">
					<h3 class="text-lg font-semibold text-purple-900 mb-2">
						AI Recommends: {recommendation.formatRecommendation}
					</h3>

					<div class="space-y-3">
						<!-- Reasoning -->
						<div class="text-sm text-purple-800">
							<p class="font-medium mb-1">Why this format:</p>
							<p class="text-purple-700">{recommendation.reasoning}</p>
						</div>

						<!-- WebP Benefits Tooltip -->
						{#if recommendation.formatRecommendation.toUpperCase() === 'WEBP'}
							<div class="bg-blue-50 border border-blue-200 rounded p-3">
								<p class="text-sm text-blue-800">
									<strong>💡 Why WebP?</strong>
									WebP keeps the same quality as JPG, but with 30–80% smaller file size. Supported
									in all modern browsers (Chrome, Firefox, Edge, Safari 14+).
								</p>
								{#if hasTransparency}
									<p class="text-xs text-blue-700 mt-2">
										ℹ️ WebP also supports transparency, making it a great alternative to PNG with much
										smaller file sizes.
									</p>
								{/if}
							</div>
						{/if}

						<!-- Alternatives -->
						{#if recommendation.alternatives && recommendation.alternatives.length > 0}
							<div class="text-sm">
								<p class="font-medium text-purple-800 mb-1">Alternatives:</p>
								<div class="flex gap-2">
									{#each recommendation.alternatives as alt}
										<span
											class="px-3 py-1 bg-white border border-purple-300 rounded-full text-purple-700 text-xs font-medium"
										>
											{alt}
										</span>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Warnings -->
						{#if recommendation.warnings && recommendation.warnings.length > 0}
							<div class="text-sm bg-yellow-50 border border-yellow-200 rounded p-3">
								<p class="font-medium text-yellow-900 mb-1">⚠️ Consider:</p>
								<ul class="list-disc list-inside text-yellow-700 space-y-1">
									{#each recommendation.warnings as warning}
										<li>{warning}</li>
									{/each}
								</ul>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Alt Text & Smart Naming -->
	{#if altText || suggestedFilename}
		<div class="bg-green-50 border border-green-200 rounded-lg p-6">
			<div class="flex items-start gap-3">
				<span class="text-2xl">✨</span>
				<div class="flex-1 space-y-4">
					<!-- Alt Text -->
					{#if altText}
						<div>
							<div class="flex items-center justify-between mb-2">
								<h4 class="font-semibold text-green-900">AI-Generated Alt Text</h4>
								<button
									type="button"
									on:click={copyAltText}
									class="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition-colors"
								>
									Copy
								</button>
							</div>
							<p class="text-sm text-green-800 bg-white border border-green-200 rounded p-3">
								"{altText}"
							</p>
						</div>
					{/if}

					<!-- Smart Filename -->
					{#if suggestedFilename}
						<div>
							<h4 class="font-semibold text-green-900 mb-2">Smart Filename</h4>
							<p class="text-sm text-green-800 bg-white border border-green-200 rounded p-3 font-mono">
								{suggestedFilename}.{recommendation?.formatRecommendation.toLowerCase() || 'jpg'}
							</p>
							<p class="text-xs text-green-600 mt-1">
								Will be used automatically when you download
							</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
