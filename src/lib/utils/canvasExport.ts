/**
 * Canvas Export Utilities
 * Functions for merging canvas layers and exporting to File/Blob
 */

/**
 * Merge two canvas layers into a single canvas
 * @param imageCanvas - Background image canvas
 * @param drawingCanvas - Drawing layer canvas
 * @returns Combined canvas with both layers
 */
export function mergeCanvasLayers(
	imageCanvas: HTMLCanvasElement,
	drawingCanvas: HTMLCanvasElement
): HTMLCanvasElement {
	if (!imageCanvas || !drawingCanvas) {
		throw new Error('Invalid canvas elements for merging');
	}

	if (imageCanvas.width === 0 || imageCanvas.height === 0) {
		throw new Error('Invalid canvas dimensions');
	}

	// Create a new canvas for the merged result
	const merged = document.createElement('canvas');
	merged.width = imageCanvas.width;
	merged.height = imageCanvas.height;

	const ctx = merged.getContext('2d');
	if (!ctx) {
		throw new Error('Failed to get canvas context for merging');
	}

	try {
		// Draw the image layer first (background)
		ctx.drawImage(imageCanvas, 0, 0);

		// Draw the drawing layer on top
		ctx.drawImage(drawingCanvas, 0, 0);
	} catch (error) {
		throw new Error(`Failed to merge canvas layers: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}

	return merged;
}

/**
 * Convert a canvas to a File object
 * @param canvas - Canvas to export
 * @param filename - Desired filename
 * @param mimeType - Output MIME type (default: image/png)
 * @param quality - Quality for lossy formats (0-1, default: 0.92)
 * @returns Promise resolving to File
 */
export async function canvasToFile(
	canvas: HTMLCanvasElement,
	filename: string,
	mimeType: string = 'image/png',
	quality: number = 0.92
): Promise<File> {
	if (!canvas || !filename) {
		throw new Error('Invalid parameters for canvas export');
	}

	if (canvas.width === 0 || canvas.height === 0) {
		throw new Error('Cannot export canvas with zero dimensions');
	}

	// Validate quality parameter
	if (quality < 0 || quality > 1) {
		throw new Error('Quality must be between 0 and 1');
	}

	return new Promise((resolve, reject) => {
		try {
			canvas.toBlob(
				(blob) => {
					if (blob) {
						const file = new File([blob], filename, { type: mimeType });
						resolve(file);
					} else {
						reject(new Error('Failed to export canvas to file - blob creation failed'));
					}
				},
				mimeType,
				quality
			);
		} catch (error) {
			reject(new Error(`Canvas export failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
		}
	});
}

/**
 * Convert a canvas to a Blob
 * @param canvas - Canvas to export
 * @param mimeType - Output MIME type (default: image/png)
 * @param quality - Quality for lossy formats (0-1, default: 0.92)
 * @returns Promise resolving to Blob
 */
export async function canvasToBlob(
	canvas: HTMLCanvasElement,
	mimeType: string = 'image/png',
	quality: number = 0.92
): Promise<Blob> {
	if (!canvas) {
		throw new Error('Invalid canvas for blob export');
	}

	if (canvas.width === 0 || canvas.height === 0) {
		throw new Error('Cannot export canvas with zero dimensions');
	}

	// Validate quality parameter
	if (quality < 0 || quality > 1) {
		throw new Error('Quality must be between 0 and 1');
	}

	return new Promise((resolve, reject) => {
		try {
			canvas.toBlob(
				(blob) => {
					if (blob) {
						resolve(blob);
					} else {
						reject(new Error('Failed to export canvas to blob - blob creation failed'));
					}
				},
				mimeType,
				quality
			);
		} catch (error) {
			reject(new Error(`Canvas blob export failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
		}
	});
}
