/**
 * Image Converter Module
 * Handles conversion between different image formats using Canvas API
 */

import { loadImageFromFile } from '$lib/utils/imageLoader';

export interface ConversionOptions {
	quality?: number; // 0-1 for JPEG/WebP
	width?: number; // Optional resize width
	height?: number; // Optional resize height
}

// Supported output formats
const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

/**
 * Convert an image file to a different format
 * @param file - The original image file
 * @param targetFormat - Target MIME type (e.g., 'image/png', 'image/jpeg')
 * @param options - Optional conversion settings
 * @returns Promise<Blob> - The converted image as a Blob
 */
export async function convertImage(
	file: File,
	targetFormat: string,
	options: ConversionOptions = {}
): Promise<Blob> {
	// Validate inputs
	if (!SUPPORTED_FORMATS.includes(targetFormat as any)) {
		throw new Error(
			`Image conversion failed: Unsupported format "${targetFormat}". Supported formats: ${SUPPORTED_FORMATS.join(', ')}`
		);
	}

	const { quality = 0.92, width, height } = options;

	if (quality < 0 || quality > 1) {
		throw new Error(
			`Image conversion failed: Invalid quality value ${quality}. Must be between 0 and 1.`
		);
	}

	// Load image from file (handles memory cleanup internally)
	const img = await loadImageFromFile(file);

	return new Promise((resolve, reject) => {
		try {
			// Calculate dimensions
			let targetWidth = width || img.width;
			let targetHeight = height || img.height;

			// Maintain aspect ratio if only one dimension is specified
			if (width && !height) {
				targetHeight = (img.height / img.width) * width;
			} else if (height && !width) {
				targetWidth = (img.width / img.height) * height;
			}

			// Create canvas
			const canvas = document.createElement('canvas');
			canvas.width = targetWidth;
			canvas.height = targetHeight;

			const ctx = canvas.getContext('2d');
			if (!ctx) {
				reject(
					new Error(
						'Image conversion failed: Canvas context unavailable (browser compatibility issue)'
					)
				);
				return;
			}

			// Draw image on canvas
			ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

			// Convert to blob with target format
			canvas.toBlob(
				(blob) => {
					if (blob) {
						resolve(blob);
					} else {
						reject(new Error(`Image conversion failed: Unable to encode as ${targetFormat}`));
					}
				},
				targetFormat,
				quality
			);
		} catch (error) {
			reject(error);
		}
	});
}

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMimeType(mimeType: string): string {
	const extensions: Record<string, string> = {
		'image/jpeg': '.jpg',
		'image/png': '.png',
		'image/webp': '.webp',
		'image/gif': '.gif'
	};
	return extensions[mimeType] || '.jpg';
}

/**
 * Generate download filename
 */
export function generateDownloadFilename(originalFilename: string, targetFormat: string): string {
	const nameWithoutExt = originalFilename.replace(/\.[^/.]+$/, '');
	const newExt = getExtensionFromMimeType(targetFormat);
	return `${nameWithoutExt}_converted${newExt}`;
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}
