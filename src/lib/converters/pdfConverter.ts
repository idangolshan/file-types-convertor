/**
 * PDF Converter Module
 * Handles conversion of images to PDF format using pdf-lib
 */

import { PDFDocument } from 'pdf-lib';

export interface PDFConversionOptions {
	pageSize?: 'A4' | 'original'; // Page size preset
	orientation?: 'portrait' | 'landscape'; // Page orientation
	quality?: number; // Image quality (0-1) before embedding
}

/**
 * PDF conversion constants
 * All dimension values are in PDF points (1 point = 1/72 inch)
 */
const PDF_CONSTANTS = {
	/** Maximum file size allowed for conversion (100MB) to prevent browser memory issues */
	MAX_FILE_SIZE: 100 * 1024 * 1024,

	/** Default JPEG quality for canvas-to-PNG conversion (0.92 = high quality, reasonable file size) */
	DEFAULT_QUALITY: 0.92,

	/** Minimum allowed quality value */
	MIN_QUALITY: 0,

	/** Maximum allowed quality value */
	MAX_QUALITY: 1,

	/** Supported image MIME types for PDF conversion */
	SUPPORTED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'] as const
} as const;

/**
 * A4 page dimensions in PDF points (1 point = 1/72 inch)
 * Based on ISO 216 standard: A4 = 210mm × 297mm
 * Conversion: 210mm = 595.28 points, 297mm = 841.89 points
 */
const A4_DIMENSIONS = {
	portrait: { width: 595.28, height: 841.89 },
	landscape: { width: 841.89, height: 595.28 }
} as const;

/**
 * Converts an image file to a PDF document.
 *
 * The image is embedded into a PDF with configurable page size and orientation.
 * For formats not natively supported by pdf-lib (WebP, GIF, BMP), the image
 * is first converted to PNG via canvas before embedding.
 *
 * @param file - The image file to convert (JPEG, PNG, WebP, GIF, or BMP)
 * @param options - PDF generation options
 * @param options.pageSize - Page size: 'A4' or 'original' (default: 'original')
 * @param options.orientation - Page orientation: 'portrait' or 'landscape' (default: 'portrait')
 * @param options.quality - Image quality for canvas conversion: 0-1 (default: 0.92)
 *
 * @returns Promise resolving to a PDF Blob with MIME type 'application/pdf'
 *
 * @throws {Error} If file type is not a supported image format
 * @throws {Error} If file size exceeds 100MB
 * @throws {Error} If quality value is not between 0 and 1
 * @throws {Error} If image loading or PDF generation fails
 *
 * @example
 * ```typescript
 * // Convert with default options (original size, portrait)
 * const pdfBlob = await convertImageToPDF(imageFile);
 *
 * // Convert to A4 landscape with custom quality
 * const pdfBlob = await convertImageToPDF(imageFile, {
 *   pageSize: 'A4',
 *   orientation: 'landscape',
 *   quality: 0.85
 * });
 *
 * // Download the PDF
 * downloadBlob(pdfBlob, 'converted.pdf');
 * ```
 */
export async function convertImageToPDF(
	file: File,
	options: PDFConversionOptions = {}
): Promise<Blob> {
	// Validate file type
	if (!PDF_CONSTANTS.SUPPORTED_TYPES.includes(file.type as any)) {
		throw new Error(
			`Invalid file type "${file.type}". PDF conversion only supports image files (JPEG, PNG, WebP, GIF, BMP).`
		);
	}

	// Validate file size
	if (file.size > PDF_CONSTANTS.MAX_FILE_SIZE) {
		const sizeMB = (file.size / 1024 / 1024).toFixed(2);
		const maxSizeMB = (PDF_CONSTANTS.MAX_FILE_SIZE / 1024 / 1024).toFixed(0);
		throw new Error(
			`File too large (${sizeMB}MB). Maximum file size for PDF conversion is ${maxSizeMB}MB.`
		);
	}

	const {
		pageSize = 'original',
		orientation = 'portrait',
		quality = PDF_CONSTANTS.DEFAULT_QUALITY
	} = options;

	// Validate quality parameter
	if (quality < PDF_CONSTANTS.MIN_QUALITY || quality > PDF_CONSTANTS.MAX_QUALITY) {
		throw new Error(
			`Invalid quality value ${quality}. Quality must be between ${PDF_CONSTANTS.MIN_QUALITY} and ${PDF_CONSTANTS.MAX_QUALITY}.`
		);
	}

	// Create a new PDF document
	const pdfDoc = await PDFDocument.create();

	// Read the image file
	const imageBytes = await file.arrayBuffer();

	// Embed the image based on its type
	let image;
	const mimeType = file.type;

	try {
		if (mimeType === 'image/png') {
			image = await pdfDoc.embedPng(imageBytes);
		} else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
			image = await pdfDoc.embedJpg(imageBytes);
		} else {
			// For other formats (WebP, GIF), convert to PNG first via canvas
			image = await embedImageViaCanvas(pdfDoc, file, quality);
		}
	} catch (error) {
		throw new Error(
			`PDF conversion failed: Unable to embed ${mimeType} image. ${error instanceof Error ? error.message : ''}`
		);
	}

	// Get image dimensions
	const imageDims = image.scale(1);

	// Determine page dimensions
	let pageWidth: number;
	let pageHeight: number;

	if (pageSize === 'A4') {
		const a4 = A4_DIMENSIONS[orientation];
		pageWidth = a4.width;
		pageHeight = a4.height;
	} else {
		// Use original image dimensions
		pageWidth = imageDims.width;
		pageHeight = imageDims.height;
	}

	// Add a page with calculated dimensions
	const page = pdfDoc.addPage([pageWidth, pageHeight]);

	// Calculate scaling to fit image on page while maintaining aspect ratio
	const scaleX = pageWidth / imageDims.width;
	const scaleY = pageHeight / imageDims.height;
	const scale = Math.min(scaleX, scaleY);

	const scaledWidth = imageDims.width * scale;
	const scaledHeight = imageDims.height * scale;

	// Center the image on the page
	const x = (pageWidth - scaledWidth) / 2;
	const y = (pageHeight - scaledHeight) / 2;

	// Draw the image on the page
	page.drawImage(image, {
		x,
		y,
		width: scaledWidth,
		height: scaledHeight
	});

	// Serialize the PDF to bytes
	const pdfBytes = await pdfDoc.save();

	// Convert to Blob (create new Uint8Array to satisfy TypeScript strict mode)
	return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
}

/**
 * Converts an image file to PNG format via canvas and embeds it in a PDF document.
 *
 * This helper function is used for image formats not natively supported by pdf-lib
 * (WebP, GIF, BMP). It loads the image, renders it to a canvas, converts to PNG,
 * and then embeds the PNG into the PDF document.
 *
 * @param pdfDoc - The PDF document to embed the image into
 * @param file - The image file to convert and embed
 * @param quality - PNG compression quality (0-1)
 *
 * @returns Promise resolving to the embedded PDF image object
 *
 * @throws {Error} If image fails to load
 * @throws {Error} If canvas context creation fails
 * @throws {Error} If canvas-to-PNG conversion fails
 * @throws {Error} If PNG embedding into PDF fails
 *
 * @internal This is a helper function not exported from the module
 */
async function embedImageViaCanvas(
	pdfDoc: PDFDocument,
	file: File,
	quality: number
): Promise<any> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		const url = URL.createObjectURL(file);

		img.onload = async () => {
			URL.revokeObjectURL(url);

			// Create canvas
			const canvas = document.createElement('canvas');
			canvas.width = img.width;
			canvas.height = img.height;

			const ctx = canvas.getContext('2d');
			if (!ctx) {
				reject(
					new Error('Failed to create canvas context. Your browser may not support this feature.')
				);
				return;
			}

			// Draw image on canvas
			ctx.drawImage(img, 0, 0);

			// Convert to PNG blob
			canvas.toBlob(
				async (blob) => {
					if (!blob) {
						reject(
							new Error(
								'Failed to convert image to PNG format. The image may be corrupted or too large.'
							)
						);
						return;
					}

					try {
						const pngBytes = await blob.arrayBuffer();
						const embeddedImage = await pdfDoc.embedPng(pngBytes);
						resolve(embeddedImage);
					} catch (error) {
						reject(error);
					}
				},
				'image/png',
				quality
			);
		};

		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(
				new Error('Failed to load image for PDF conversion. The file may be corrupted or invalid.')
			);
		};

		img.src = url;
	});
}
