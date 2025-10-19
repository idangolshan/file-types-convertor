/**
 * Image Analysis Utilities
 * Analyzes image characteristics locally before AI processing
 */

import { loadImageFromFile } from '$lib/utils/imageLoader';

// Configuration constants for color estimation
const COLOR_SAMPLE_RATE = 10; // Sample every Nth pixel for performance
const MAX_COLORS_THRESHOLD = 10_000; // Early exit for highly colorful images
const MAX_RGB_COLORS = 16_777_216; // 256^3 - theoretical maximum RGB colors

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
	// Load image from file (handles memory cleanup internally)
	const img = await loadImageFromFile(file);

	// Create canvas to analyze pixels
	const canvas = document.createElement('canvas');
	canvas.width = img.width;
	canvas.height = img.height;

	// Optimize for pixel reading operations (checkTransparency, estimateColorCount)
	const ctx = canvas.getContext('2d', { willReadFrequently: true });
	if (!ctx) {
		throw new Error('Image analysis failed: Canvas context unavailable');
	}

	// Draw image
	ctx.drawImage(img, 0, 0);

	// Get image data
	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

	// Analyze characteristics
	const hasTransparency = checkTransparency(imageData);
	const colorCount = estimateColorCount(imageData);

	return {
		hasTransparency,
		colorCount,
		dimensions: {
			width: img.width,
			height: img.height
		},
		fileSize: file.size,
		aspectRatio: img.width / img.height
	};
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

	for (let i = 0; i < data.length; i += 4 * COLOR_SAMPLE_RATE) {
		const r = data[i];
		const g = data[i + 1];
		const b = data[i + 2];
		const colorKey = `${r},${g},${b}`;
		colors.add(colorKey);

		// Stop if we've found a lot of colors (indicates photo/complex image)
		if (colors.size > MAX_COLORS_THRESHOLD) {
			return MAX_COLORS_THRESHOLD;
		}
	}

	// Estimate total colors based on sample
	return Math.min(colors.size * COLOR_SAMPLE_RATE, MAX_RGB_COLORS);
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
