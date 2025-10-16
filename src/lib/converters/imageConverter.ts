/**
 * Image Converter Module
 * Handles conversion between different image formats using Canvas API
 */

export interface ConversionOptions {
	quality?: number; // 0-1 for JPEG/WebP
	width?: number; // Optional resize width
	height?: number; // Optional resize height
}

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
	const { quality = 0.92, width, height } = options;

	return new Promise((resolve, reject) => {
		// Create an image element
		const img = new Image();
		const reader = new FileReader();

		reader.onload = (e) => {
			if (!e.target?.result) {
				reject(new Error('Failed to read file'));
				return;
			}

			img.onload = () => {
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
						reject(new Error('Failed to get canvas context'));
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
								reject(new Error('Failed to convert image'));
							}
						},
						targetFormat,
						quality
					);
				} catch (error) {
					reject(error);
				}
			};

			img.onerror = () => {
				reject(new Error('Failed to load image'));
			};

			img.src = e.target.result as string;
		};

		reader.onerror = () => {
			reject(new Error('Failed to read file'));
		};

		reader.readAsDataURL(file);
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
