<script lang="ts">
	import UploadZone from '$lib/components/UploadZone.svelte';
	import FormatSelector from '$lib/components/FormatSelector.svelte';
	import PreviewPane from '$lib/components/PreviewPane.svelte';
	import {
		convertImage,
		generateDownloadFilename,
		downloadBlob
	} from '$lib/converters/imageConverter';

	let selectedFile: File | null = null;
	let targetFormat: string = '';
	let convertedBlob: Blob | null = null;
	let isConverting: boolean = false;
	let errorMessage: string = '';

	function handleFileUpload(event: CustomEvent<File>) {
		selectedFile = event.detail;
		targetFormat = ''; // Reset format selection when new file is uploaded
		convertedBlob = null; // Reset converted image
		errorMessage = '';
		console.log('File uploaded:', selectedFile);
	}

	function handleFormatSelect(event: CustomEvent<string>) {
		targetFormat = event.detail;
		convertedBlob = null; // Reset converted image when format changes
		errorMessage = '';
		console.log('Target format:', targetFormat);
	}

	async function handleConvert() {
		if (!selectedFile || !targetFormat) return;

		isConverting = true;
		errorMessage = '';

		try {
			convertedBlob = await convertImage(selectedFile, targetFormat, {
				quality: 0.92
			});
			console.log('Conversion successful!', convertedBlob);
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Conversion failed';
			console.error('Conversion error:', error);
		} finally {
			isConverting = false;
		}
	}

	function handleDownload() {
		if (!convertedBlob || !selectedFile) return;

		const filename = generateDownloadFilename(selectedFile.name, targetFormat);
		downloadBlob(convertedBlob, filename);
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
	<div class="max-w-4xl mx-auto">
		<!-- Header -->
		<div class="text-center mb-12">
			<h1 class="text-5xl font-bold text-gray-900 mb-4">File Converter</h1>
			<p class="text-xl text-gray-700">Transform your files with ease</p>
		</div>

		<!-- Upload Zone -->
		<UploadZone on:upload={handleFileUpload} />

		<!-- Preview, Format Selector & File Info -->
		{#if selectedFile}
			<div class="mt-8 space-y-6">
				<!-- Preview Pane Card -->
				<div class="bg-white rounded-lg shadow-lg p-6">
					<PreviewPane
						originalFile={selectedFile}
						convertedBlob={convertedBlob}
						isConverting={isConverting}
					/>
				</div>

				<!-- Format Selector Card -->
				<div class="bg-white rounded-lg shadow-lg p-6">
					<FormatSelector
						sourceFormat={selectedFile.type}
						selectedFormat={targetFormat}
						on:select={handleFormatSelect}
					/>
				</div>

				<!-- Action Buttons -->
				{#if targetFormat}
					<div class="flex gap-4">
						<button
							type="button"
							on:click={handleConvert}
							disabled={isConverting}
							class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 px-8 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
						>
							{#if isConverting}
								<span class="flex items-center justify-center gap-2">
									<div
										class="inline-block w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"
									></div>
									Converting...
								</span>
							{:else}
								Convert Image
							{/if}
						</button>

						{#if convertedBlob}
							<button
								type="button"
								on:click={handleDownload}
								class="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-8 rounded-lg transition-colors duration-200"
							>
								Download Converted File
							</button>
						{/if}
					</div>
				{/if}

				<!-- Error Message -->
				{#if errorMessage}
					<div class="bg-red-50 border border-red-200 rounded-lg p-4">
						<p class="text-red-800 font-semibold">Error:</p>
						<p class="text-red-700">{errorMessage}</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
