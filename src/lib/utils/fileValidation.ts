/**
 * File Validation Utilities
 * Validates file types using magic bytes to prevent MIME type spoofing
 */

/**
 * Validate image file using magic bytes (file signatures)
 * This prevents MIME type spoofing attacks
 */
export async function validateImageFile(file: File): Promise<boolean> {
	// Read first 12 bytes to check magic numbers
	const buffer = await file.slice(0, 12).arrayBuffer();
	const bytes = new Uint8Array(buffer);

	// Check magic bytes for common image formats
	// JPEG: FF D8 FF
	if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
		return true;
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
		return true;
	}

	// GIF: 47 49 46 38 (GIF8)
	if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
		return true;
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
		return true;
	}

	return false;
}
