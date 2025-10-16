<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{ upload: File }>();

	let isDragging = false;
	let fileInput: HTMLInputElement;

	// Supported file types for initial version (images)
	const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
	const maxFileSize = 10 * 1024 * 1024; // 10MB

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;

		const files = e.dataTransfer?.files;
		if (files && files.length > 0) {
			handleFile(files[0]);
		}
	}

	function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		const files = target.files;
		if (files && files.length > 0) {
			handleFile(files[0]);
		}
	}

	function handleFile(file: File) {
		// Validate file type
		if (!acceptedTypes.includes(file.type)) {
			alert(`Unsupported file type. Please upload: ${acceptedTypes.join(', ')}`);
			return;
		}

		// Validate file size
		if (file.size > maxFileSize) {
			alert(`File is too large. Maximum size is ${maxFileSize / 1024 / 1024}MB`);
			return;
		}

		// Dispatch the file to parent component
		dispatch('upload', file);
	}

	function openFileDialog() {
		fileInput.click();
	}
</script>

<div
	class="relative w-full p-12 border-2 border-dashed rounded-xl bg-white hover:bg-gray-50 transition-all duration-200 cursor-pointer flex items-center justify-center min-h-[320px] {isDragging
		? 'border-blue-500 bg-blue-50 scale-[1.02]'
		: 'border-gray-300'}"
	on:dragover={handleDragOver}
	on:dragleave={handleDragLeave}
	on:drop={handleDrop}
	on:click={openFileDialog}
	on:keydown={(e) => e.key === 'Enter' && openFileDialog()}
	role="button"
	tabindex="0"
>
	<div class="flex flex-col items-center gap-4 pointer-events-none">
		<div class="transition-colors {isDragging ? 'text-blue-500' : 'text-gray-400'}">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="w-16 h-16"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
				/>
			</svg>
		</div>

		<h3 class="text-xl font-semibold transition-colors {isDragging ? 'text-blue-600' : 'text-gray-700'}">
			{#if isDragging}
				Drop your file here
			{:else}
				Drag & drop your file here
			{/if}
		</h3>

		<p class="text-sm text-gray-500">or click to browse</p>

		<div class="mt-4 text-center">
			<p class="text-sm text-gray-500">Supported: JPG, PNG, WebP, GIF</p>
			<p class="text-xs text-gray-400">Maximum size: 10MB</p>
		</div>
	</div>

	<input
		type="file"
		bind:this={fileInput}
		on:change={handleFileSelect}
		accept={acceptedTypes.join(',')}
		class="hidden"
		aria-label="File upload input"
	/>
</div>
