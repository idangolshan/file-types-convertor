<script lang="ts">
	import UploadZone from '$lib/components/UploadZone.svelte';
	import FormatSelector from '$lib/components/FormatSelector.svelte';
	import PreviewPane from '$lib/components/PreviewPane.svelte';
	import AIRecommendation from '$lib/components/AIRecommendation.svelte';
	import ImageEditor from '$lib/components/ImageEditor.svelte';
	import PDFOptions from '$lib/components/PDFOptions.svelte';
	import {
		convertImage,
		generateDownloadFilename,
		downloadBlob
	} from '$lib/converters/imageConverter';
	import { convertImageToPDF } from '$lib/converters/pdfConverter';
	import { analyzeImage } from '$lib/utils/imageAnalyzer';
	import {
		isAIEnabled,
		getFormatRecommendation,
		generateAltText,
		type AIAnalysisResult,
		type AltTextResult
	} from '$lib/services/openAI';
	import { getExtensionFromMimeType } from '$lib/converters/imageConverter';

	let selectedFile: File | null = null;
	let targetFormat: string = '';
	let convertedBlob: Blob | null = null;
	let isConverting: boolean = false;
	let errorMessage: string = '';

	// Editor state
	let isEditing: boolean = false;
	let editedFile: File | null = null;

	// PDF conversion state
	let pdfPageSize: 'A4' | 'original' = 'original';
	let pdfOrientation: 'portrait' | 'landscape' = 'portrait';

	// AI features
	let aiRecommendation: AIAnalysisResult | null = null;
	let altTextData: AltTextResult | null = null;
	let isAnalyzing: boolean = false;
	let aiError: string = '';
	let hasTransparency: boolean = false;

	async function handleFileUpload(event: CustomEvent<File>) {
		selectedFile = event.detail;
		targetFormat = ''; // Reset format selection when new file is uploaded
		convertedBlob = null; // Reset converted image
		errorMessage = '';
		editedFile = null; // Reset edited file
		aiRecommendation = null;
		altTextData = null;
		aiError = '';

		// Only log in development mode
		const DEBUG = import.meta.env.DEV;
		if (DEBUG) console.log('File uploaded:', selectedFile.name, selectedFile.type);

		// Start AI analysis if enabled
		if (isAIEnabled()) {
			analyzeWithAI(selectedFile);
		} else {
			aiError = 'AI features disabled. Add VITE_OPENAI_API_KEY to your .env file to enable.';
		}
	}

	function handleStartEdit() {
		isEditing = true;
	}

	function handleEditorSave(file: File) {
		editedFile = file;
		selectedFile = file; // Use edited version for conversion
		isEditing = false;

		// Re-run AI analysis on edited image
		if (isAIEnabled()) {
			analyzeWithAI(file);
		}
	}

	function handleEditorCancel() {
		isEditing = false;
	}

	async function analyzeWithAI(file: File) {
		isAnalyzing = true;
		aiError = '';

		try {
			// Analyze image characteristics locally
			const characteristics = await analyzeImage(file);

			// Store transparency info for UI
			hasTransparency = characteristics.hasTransparency;

			// Get AI recommendations and alt text in parallel
			const [recommendation, altText] = await Promise.all([
				getFormatRecommendation(file, characteristics),
				generateAltText(file)
			]);

			aiRecommendation = recommendation;
			altTextData = altText;

			// Only log in development mode
			const DEBUG = import.meta.env.DEV;
			if (DEBUG) console.log('AI Analysis complete');
		} catch (error) {
			aiError = error instanceof Error ? error.message : 'AI analysis failed';
			// Only log in development mode
			const DEBUG = import.meta.env.DEV;
			if (DEBUG) console.error('AI analysis error:', error);
		} finally {
			isAnalyzing = false;
		}
	}

	function handleFormatSelect(event: CustomEvent<string>) {
		targetFormat = event.detail;
		convertedBlob = null; // Reset converted image when format changes
		errorMessage = '';
		// Only log in development mode
		const DEBUG = import.meta.env.DEV;
		if (DEBUG) console.log('Target format:', targetFormat);
	}

	function handlePDFOptionsChange(
		event: CustomEvent<{ pageSize: 'A4' | 'original'; orientation: 'portrait' | 'landscape' }>
	) {
		pdfPageSize = event.detail.pageSize;
		pdfOrientation = event.detail.orientation;
		convertedBlob = null; // Reset converted output when options change
	}

	async function handleConvert() {
		if (!selectedFile || !targetFormat) return;

		isConverting = true;
		errorMessage = '';

		try {
			// Route to appropriate converter based on target format
			if (targetFormat === 'application/pdf') {
				convertedBlob = await convertImageToPDF(selectedFile, {
					pageSize: pdfPageSize,
					orientation: pdfOrientation,
					quality: 0.92
				});
			} else {
				convertedBlob = await convertImage(selectedFile, targetFormat, {
					quality: 0.92
				});
			}
			// Only log in development mode
			const DEBUG = import.meta.env.DEV;
			if (DEBUG) console.log('Conversion successful!');
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Conversion failed';
			// Only log in development mode
			const DEBUG = import.meta.env.DEV;
			if (DEBUG) console.error('Conversion error:', error);
		} finally {
			isConverting = false;
		}
	}

	function handleDownload() {
		if (!convertedBlob || !selectedFile) return;

		// Use smart filename if available, otherwise use default
		let filename: string;
		if (altTextData?.suggestedFilename) {
			const ext = getExtensionFromMimeType(targetFormat);
			filename = `${altTextData.suggestedFilename}${ext}`;
		} else {
			filename = generateDownloadFilename(selectedFile.name, targetFormat);
		}

		downloadBlob(convertedBlob, filename);
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
	<div class="max-w-4xl mx-auto">
		<!-- Header -->
		<div class="text-center mb-12">
			<h1 class="text-5xl font-bold text-gray-900 mb-4">
				AI-Powered File Converter
			</h1>
			<p class="text-xl text-gray-700">Transform your files with intelligent recommendations</p>
		</div>

		<!-- Upload Zone -->
		<UploadZone on:upload={handleFileUpload} />

		<!-- Image Editor (Full-screen overlay) -->
		{#if isEditing && selectedFile}
			<ImageEditor
				originalFile={selectedFile}
				onSave={handleEditorSave}
				onCancel={handleEditorCancel}
			/>
		{/if}

		<!-- Preview, Format Selector & File Info -->
		{#if selectedFile}
			<div class="mt-8 space-y-6">
				<!-- AI Recommendation Card -->
				<AIRecommendation
					recommendation={aiRecommendation}
					isLoading={isAnalyzing}
					error={aiError}
					altText={altTextData?.description || ''}
					suggestedFilename={altTextData?.suggestedFilename || ''}
					hasTransparency={hasTransparency}
				/>

				<!-- Preview Pane Card -->
				<div class="bg-white rounded-lg shadow-lg p-6">
					<PreviewPane
						originalFile={selectedFile}
						convertedBlob={convertedBlob}
						isConverting={isConverting}
					/>
				</div>

				<!-- Edit Image Button -->
				<div class="flex justify-center">
					<button
						type="button"
						on:click={handleStartEdit}
						class="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
					>
						<span class="text-xl">✏️</span>
						Edit Image
					</button>
				</div>

				<!-- Format Selector Card -->
				<div class="bg-white rounded-lg shadow-lg p-6">
					<FormatSelector
						sourceFormat={selectedFile.type}
						selectedFormat={targetFormat}
						aiRecommendation={aiRecommendation?.formatRecommendation || null}
						on:select={handleFormatSelect}
					/>
				</div>

				<!-- PDF Options (only shown when PDF is selected) -->
				{#if targetFormat === 'application/pdf'}
					<PDFOptions
						pageSize={pdfPageSize}
						orientation={pdfOrientation}
						on:change={handlePDFOptionsChange}
					/>
				{/if}

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
