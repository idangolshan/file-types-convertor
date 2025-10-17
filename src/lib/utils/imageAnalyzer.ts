/**
 * Image Analysis Utilities
 * Analyzes image characteristics locally before AI processing
 */

export interface ImageCharacteristics {
	hasTransparency: boolean;
	colorCount: number;
	dimensions: { width: number; height: number };
	fileSize: number;
	aspectRatio: number;
}

/**
 * Analyze image characteristics from a File
 */
export async function analyzeImage(file: File): Promise<ImageCharacteristics> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		const reader = new FileReader();

		reader.onload = (e) => {
			if (!e.target?.result) {
				reject(new Error('Failed to read file'));
				return;
			}

			img.onload = async () => {
				try {
					// Create canvas to analyze pixels
					const canvas = document.createElement('canvas');
					canvas.width = img.width;
					canvas.height = img.height;

					const ctx = canvas.getContext('2d', { willReadFrequently: true });
					if (!ctx) {
						reject(new Error('Failed to get canvas context'));
						return;
					}

					// Draw image
					ctx.drawImage(img, 0, 0);

					// Get image data
					const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

					// Analyze characteristics
					const hasTransparency = checkTransparency(imageData);
					const colorCount = estimateColorCount(imageData);

					resolve({
						hasTransparency,
						colorCount,
						dimensions: {
							width: img.width,
							height: img.height
						},
						fileSize: file.size,
						aspectRatio: img.width / img.height
					});
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
 * Check if image has transparency
 */
function checkTransparency(imageData: ImageData): boolean {
	const data = imageData.data;

	// Check alpha channel (every 4th byte)
	for (let i = 3; i < data.length; i += 4) {
		if (data[i] < 255) {
			return true; // Found a transparent/semi-transparent pixel
		}
	}

	return false;
}

/**
 * Estimate unique color count (sampled for performance)
 */
function estimateColorCount(imageData: ImageData): number {
	const data = imageData.data;
	const colors = new Set<string>();
	const sampleRate = 10; // Sample every 10th pixel for performance

	for (let i = 0; i < data.length; i += 4 * sampleRate) {
		const r = data[i];
		const g = data[i + 1];
		const b = data[i + 2];
		const colorKey = `${r},${g},${b}`;
		colors.add(colorKey);

		// Stop if we've found a lot of colors (indicates photo/complex image)
		if (colors.size > 10000) {
			return 10000; // Return early for highly colorful images
		}
	}

	// Estimate total colors based on sample
	return Math.min(colors.size * sampleRate, 16777216); // Cap at max RGB colors
}

/**
 * Get simple heuristic recommendation (fast, no AI)
 */
export function getHeuristicRecommendation(chars: ImageCharacteristics): {
	format: string;
	reason: string;
} {
	// Has transparency? Must use PNG or WebP
	if (chars.hasTransparency) {
		return {
			format: 'PNG',
			reason: 'Image has transparency - JPEG does not support alpha channel'
		};
	}

	// Few colors (< 256)? Likely graphic/logo
	if (chars.colorCount < 256) {
		return {
			format: 'PNG',
			reason: 'Low color count suggests graphic or logo - PNG is ideal'
		};
	}

	// Many colors? Likely photo
	if (chars.colorCount > 5000) {
		return {
			format: 'JPEG',
			reason: 'High color count suggests photograph - JPEG offers good compression'
		};
	}

	// Default to WebP as best all-around format
	return {
		format: 'WebP',
		reason: 'WebP offers excellent compression for this type of image'
	};
}
