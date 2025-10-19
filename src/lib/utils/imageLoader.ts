/**
 * Image Loading Utilities
 * Shared utilities for loading images from files with proper resource cleanup
 */

/**
 * Load an HTMLImageElement from a File object
 * Uses object URLs for memory efficiency and automatic cleanup
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
		// Use object URL instead of data URL (faster and more memory efficient)
		const objectUrl = URL.createObjectURL(file);

		img.onload = () => {
			// Clean up object URL immediately after loading to prevent memory leaks
			URL.revokeObjectURL(objectUrl);
			resolve(img);
		};

		img.onerror = () => {
			// Clean up object URL on error too
			URL.revokeObjectURL(objectUrl);
			reject(new Error('Image loading failed: Invalid or corrupted image file'));
		};

		img.src = objectUrl;
	});
}
