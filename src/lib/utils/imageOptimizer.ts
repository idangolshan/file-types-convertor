/**
 * Image Optimizer Utility
 * Optimizes images for AI processing to reduce bandwidth and API costs
 */

/**
 * Load image from file
 */
function loadImage(file: File): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		const reader = new FileReader();

		reader.onload = (e) => {
			if (!e.target?.result) {
				reject(new Error('Failed to read file'));
				return;
			}

			img.onload = () => resolve(img);
			img.onerror = () => reject(new Error('Failed to load image'));
			img.src = e.target.result as string;
		};

		reader.onerror = () => reject(new Error('Failed to read file'));
		reader.readAsDataURL(file);
	});
}

/**
 * Optimize image for AI processing
 * Resizes large images to reduce bandwidth and API costs
 */
export async function optimizeImageForAI(file: File): Promise<File> {
	const MAX_DIMENSION = 2000; // Max width/height for AI processing

	// Load the image
	const img = await loadImage(file);

	// Check if resize is needed
	if (img.width <= MAX_DIMENSION && img.height <= MAX_DIMENSION) {
		return file; // No resize needed
	}

	// Calculate new dimensions maintaining aspect ratio
	const scale = Math.min(MAX_DIMENSION / img.width, MAX_DIMENSION / img.height);
	const newWidth = Math.floor(img.width * scale);
	const newHeight = Math.floor(img.height * scale);

	// Create canvas and resize
	const canvas = document.createElement('canvas');
	canvas.width = newWidth;
	canvas.height = newHeight;

	const ctx = canvas.getContext('2d');
	if (!ctx) {
		throw new Error('Failed to get canvas context');
	}

	ctx.drawImage(img, 0, 0, newWidth, newHeight);

	// Convert to blob
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (blob) {
					// Create a new File from the blob
					const optimizedFile = new File([blob], file.name, { type: file.type });
					resolve(optimizedFile);
				} else {
					reject(new Error('Failed to optimize image'));
				}
			},
			file.type,
			0.85 // Quality
		);
	});
}
