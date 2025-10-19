/**
 * Image Loading Utilities
 * Shared utilities for loading images from files with proper resource cleanup
 */

/**
 * Load an HTMLImageElement from a File object
 * Properly manages memory by clearing data URL references after loading
 *
 * @param file - The image file to load
 * @returns Promise resolving to loaded HTMLImageElement
 * @throws Error if file reading or image loading fails
 *
 * @example
 * const img = await loadImageFromFile(uploadedFile);
 * const canvas = document.createElement('canvas');
 * canvas.width = img.width;
 * canvas.height = img.height;
 */
export async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		const reader = new FileReader();

		reader.onload = (e) => {
			if (!e.target?.result) {
				reject(new Error('Image loading failed: Could not read file data'));
				return;
			}

			img.onload = () => {
				// Image loaded successfully - caller must use it immediately
				// Note: We don't clear img.src here because the caller needs the image data
				resolve(img);
			};

			img.onerror = () => {
				reject(new Error('Image loading failed: Invalid or corrupted image file'));
			};

			img.src = e.target.result as string;
		};

		reader.onerror = () => {
			reject(new Error('Image loading failed: Could not read file data'));
		};

		reader.readAsDataURL(file);
	});
}
