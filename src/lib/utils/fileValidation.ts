/**
 * File Validation Utilities
 * Validates file types using magic bytes to prevent MIME type spoofing
 */

export type ImageFormat = 'jpeg' | 'png' | 'gif' | 'webp';

export interface ValidationResult {
	isValid: boolean;
	detectedFormat?: ImageFormat;
	expectedMimeType?: string;
}

/**
 * Validate image file using magic bytes (file signatures)
 * This prevents MIME type spoofing attacks by checking file headers
 *
 * @param file - The File object to validate
 * @returns Promise resolving to validation result with detected format
 *
 * @example
 * const result = await validateImageFile(uploadedFile);
 * if (!result.isValid) {
 *   alert('Invalid image file');
 * } else if (result.detectedFormat !== 'jpeg') {
 *   console.log('Detected format:', result.detectedFormat);
 * }
 */
export async function validateImageFile(file: File): Promise<ValidationResult> {
	// Read first 12 bytes to check magic numbers
	const buffer = await file.slice(0, 12).arrayBuffer();
	const bytes = new Uint8Array(buffer);

	// Check magic bytes for common image formats
	// JPEG: FF D8 FF
	if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
		return { isValid: true, detectedFormat: 'jpeg', expectedMimeType: 'image/jpeg' };
	}

	// PNG: 89 50 4E 47 0D 0A 1A 0A
	if (
		bytes[0] === 0x89 &&
		bytes[1] === 0x50 &&
		bytes[2] === 0x4e &&
		bytes[3] === 0x47 &&
		bytes[4] === 0x0d &&
		bytes[5] === 0x0a &&
		bytes[6] === 0x1a &&
		bytes[7] === 0x0a
	) {
		return { isValid: true, detectedFormat: 'png', expectedMimeType: 'image/png' };
	}

	// GIF: 47 49 46 38 (GIF8)
	if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
		return { isValid: true, detectedFormat: 'gif', expectedMimeType: 'image/gif' };
	}

	// WebP: 52 49 46 46 ... 57 45 42 50 (RIFF....WEBP)
	if (
		bytes[0] === 0x52 &&
		bytes[1] === 0x49 &&
		bytes[2] === 0x46 &&
		bytes[3] === 0x46 &&
		bytes[8] === 0x57 &&
		bytes[9] === 0x45 &&
		bytes[10] === 0x42 &&
		bytes[11] === 0x50
	) {
		return { isValid: true, detectedFormat: 'webp', expectedMimeType: 'image/webp' };
	}

	return { isValid: false };
}
