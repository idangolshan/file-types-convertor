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
	// Create a new canvas for the merged result
	const merged = document.createElement('canvas');
	merged.width = imageCanvas.width;
	merged.height = imageCanvas.height;

	const ctx = merged.getContext('2d');
	if (!ctx) {
		throw new Error('Failed to get canvas context for merging');
	}

	// Draw the image layer first (background)
	ctx.drawImage(imageCanvas, 0, 0);

	// Draw the drawing layer on top
	ctx.drawImage(drawingCanvas, 0, 0);

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
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (blob) {
					const file = new File([blob], filename, { type: mimeType });
					resolve(file);
				} else {
					reject(new Error('Failed to export canvas to file'));
				}
			},
			mimeType,
			quality
		);
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
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (blob) {
					resolve(blob);
				} else {
					reject(new Error('Failed to export canvas to blob'));
				}
			},
			mimeType,
			quality
		);
	});
}
