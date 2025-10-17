/**
 * Claude AI Service
 * Handles all interactions with Anthropic's Claude API
 */

import { RateLimiter } from '$lib/utils/rateLimiter';
import { optimizeImageForAI } from '$lib/utils/imageOptimizer';

const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-3-5-sonnet-20241022';

// Rate limiter: 5 requests per minute
const aiRateLimiter = new RateLimiter(5, 60000);

export interface AIAnalysisResult {
	formatRecommendation: string;
	reasoning: string;
	alternatives: string[];
	warnings?: string[];
}

export interface AltTextResult {
	description: string;
	suggestedFilename: string;
}

/**
 * Check if AI features are available
 */
export function isAIEnabled(): boolean {
	return !!CLAUDE_API_KEY && CLAUDE_API_KEY !== 'your_api_key_here';
}

/**
 * Convert image file to base64 for Claude API
 */
async function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const base64 = (reader.result as string).split(',')[1];
			resolve(base64);
		};
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

/**
 * Get format recommendation from Claude
 */
export async function getFormatRecommendation(
	file: File,
	imageCharacteristics: {
		hasTransparency: boolean;
		colorCount: number;
		dimensions: { width: number; height: number };
		fileSize: number;
	}
): Promise<AIAnalysisResult> {
	if (!isAIEnabled()) {
		throw new Error('AI features not enabled. Please add VITE_CLAUDE_API_KEY to .env file');
	}

	// Check rate limit
	if (!aiRateLimiter.checkLimit()) {
		const seconds = aiRateLimiter.getTimeUntilReset();
		throw new Error(
			`Rate limit exceeded. Please wait ${seconds} seconds before analyzing another image.`
		);
	}

	// Optimize image for AI processing (resize if needed)
	const optimizedFile = await optimizeImageForAI(file);
	const base64Image = await fileToBase64(optimizedFile);

	const prompt = `Analyze this image and recommend the best file format for conversion.

Image characteristics:
- Has transparency: ${imageCharacteristics.hasTransparency}
- Approximate unique colors: ${imageCharacteristics.colorCount}
- Dimensions: ${imageCharacteristics.dimensions.width}x${imageCharacteristics.dimensions.height}
- Current size: ${(imageCharacteristics.fileSize / 1024).toFixed(2)} KB
- Current format: ${file.type}

Available formats: JPEG, PNG, WebP, GIF

Provide:
1. Primary recommendation (just the format name)
2. Clear reasoning (2-3 bullet points)
3. Alternative format suggestions
4. Any warnings or considerations

Format your response as JSON:
{
  "formatRecommendation": "FORMAT",
  "reasoning": "Why this format is best...",
  "alternatives": ["format1", "format2"],
  "warnings": ["warning1 if any"]
}`;

	const response = await fetch(CLAUDE_API_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-api-key': CLAUDE_API_KEY,
			'anthropic-version': '2023-06-01'
		},
		body: JSON.stringify({
			model: MODEL,
			max_tokens: 1024,
			messages: [
				{
					role: 'user',
					content: [
						{
							type: 'image',
							source: {
								type: 'base64',
								media_type: file.type,
								data: base64Image
							}
						},
						{
							type: 'text',
							text: prompt
						}
					]
				}
			]
		})
	});

	if (!response.ok) {
		const error = await response.json();
		// Log full error for debugging (only visible in dev console)
		const DEBUG = import.meta.env.DEV;
		if (DEBUG) console.error('Claude API error (getFormatRecommendation):', error);

		// Return sanitized error message to user
		const userMessage =
			response.status === 429
				? 'Rate limit reached. Please try again later.'
				: response.status === 401
					? 'API authentication failed. Please check your API key.'
					: response.status === 400
						? 'Invalid request. Please try a different image.'
						: 'AI analysis temporarily unavailable. Please try again.';

		throw new Error(userMessage);
	}

	const data = await response.json();
	const textContent = data.content[0].text;

	// Parse JSON from response
	const jsonMatch = textContent.match(/\{[\s\S]*\}/);
	if (jsonMatch) {
		return JSON.parse(jsonMatch[0]);
	}

	throw new Error('Failed to parse AI response');
}

/**
 * Generate alt text and smart filename
 */
export async function generateAltText(file: File): Promise<AltTextResult> {
	if (!isAIEnabled()) {
		throw new Error('AI features not enabled. Please add VITE_CLAUDE_API_KEY to .env file');
	}

	// Check rate limit
	if (!aiRateLimiter.checkLimit()) {
		const seconds = aiRateLimiter.getTimeUntilReset();
		throw new Error(
			`Rate limit exceeded. Please wait ${seconds} seconds before analyzing another image.`
		);
	}

	// Optimize image for AI processing (resize if needed)
	const optimizedFile = await optimizeImageForAI(file);
	const base64Image = await fileToBase64(optimizedFile);

	const prompt = `Analyze this image and provide:
1. A detailed, accessible alt text description (for screen readers)
2. A short, descriptive filename (lowercase, underscores, no special chars)

Format as JSON:
{
  "description": "Detailed alt text here...",
  "suggestedFilename": "descriptive_filename"
}`;

	const response = await fetch(CLAUDE_API_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-api-key': CLAUDE_API_KEY,
			'anthropic-version': '2023-06-01'
		},
		body: JSON.stringify({
			model: MODEL,
			max_tokens: 512,
			messages: [
				{
					role: 'user',
					content: [
						{
							type: 'image',
							source: {
								type: 'base64',
								media_type: file.type,
								data: base64Image
							}
						},
						{
							type: 'text',
							text: prompt
						}
					]
				}
			]
		})
	});

	if (!response.ok) {
		const error = await response.json();
		// Log full error for debugging (only visible in dev console)
		const DEBUG = import.meta.env.DEV;
		if (DEBUG) console.error('Claude API error (generateAltText):', error);

		// Return sanitized error message to user
		const userMessage =
			response.status === 429
				? 'Rate limit reached. Please try again later.'
				: response.status === 401
					? 'API authentication failed. Please check your API key.'
					: response.status === 400
						? 'Invalid request. Please try a different image.'
						: 'AI analysis temporarily unavailable. Please try again.';

		throw new Error(userMessage);
	}

	const data = await response.json();
	const textContent = data.content[0].text;

	// Parse JSON from response
	const jsonMatch = textContent.match(/\{[\s\S]*\}/);
	if (jsonMatch) {
		return JSON.parse(jsonMatch[0]);
	}

	throw new Error('Failed to parse AI response');
}
