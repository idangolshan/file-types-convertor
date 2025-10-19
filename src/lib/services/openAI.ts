/**
 * OpenAI Service
 * Handles all interactions with OpenAI's GPT-4o API
 */

import { RateLimiter } from '$lib/utils/rateLimiter';
import { optimizeImageForAI } from '$lib/utils/imageOptimizer';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o';

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

interface OpenAIAPIResponse {
	choices: Array<{
		message: {
			content: string;
		};
	}>;
}

/**
 * Check if AI features are available
 */
export function isAIEnabled(): boolean {
	return !!OPENAI_API_KEY && OPENAI_API_KEY !== 'your_api_key_here';
}

/**
 * Map OpenAI API error status codes to user-friendly messages
 */
function mapAPIErrorToUserMessage(status: number): string {
	const errorMessages: Record<number, string> = {
		429: 'Rate limit reached. Please try again later.',
		401: 'API authentication failed. Please check your API key.',
		400: 'Invalid request. Please try a different image.'
	};
	return errorMessages[status] || 'AI analysis temporarily unavailable. Please try again.';
}

/**
 * Validate AI analysis result structure
 */
function validateAIAnalysisResult(data: unknown): AIAnalysisResult {
	if (
		typeof data === 'object' &&
		data !== null &&
		'formatRecommendation' in data &&
		'reasoning' in data &&
		'alternatives' in data
	) {
		return data as AIAnalysisResult;
	}
	throw new Error('Invalid AI response format: Missing required fields');
}

/**
 * Validate alt text result structure
 */
function validateAltTextResult(data: unknown): AltTextResult {
	if (
		typeof data === 'object' &&
		data !== null &&
		'description' in data &&
		'suggestedFilename' in data
	) {
		return data as AltTextResult;
	}
	throw new Error('Invalid AI response format: Missing required fields');
}

/**
 * Convert image file to base64 data URL for OpenAI API
 */
async function fileToBase64DataURL(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			resolve(reader.result as string);
		};
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

/**
 * Get format recommendation from OpenAI
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
		throw new Error('AI features not enabled. Please add VITE_OPENAI_API_KEY to .env file');
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
	const base64DataURL = await fileToBase64DataURL(optimizedFile);

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

	const response = await fetch(OPENAI_API_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${OPENAI_API_KEY}`
		},
		body: JSON.stringify({
			model: MODEL,
			max_tokens: 1024,
			messages: [
				{
					role: 'user',
					content: [
						{
							type: 'image_url',
							image_url: {
								url: base64DataURL
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
		if (import.meta.env.DEV) console.error('OpenAI API error (getFormatRecommendation):', error);
		throw new Error(mapAPIErrorToUserMessage(response.status));
	}

	const data = (await response.json()) as OpenAIAPIResponse;
	if (!data.choices?.[0]?.message?.content) {
		throw new Error('Invalid API response structure');
	}

	const textContent = data.choices[0].message.content;

	// Parse JSON from response
	const jsonMatch = textContent.match(/\{[\s\S]*\}/);
	if (!jsonMatch) {
		throw new Error('No JSON found in AI response');
	}

	const parsed = JSON.parse(jsonMatch[0]);
	return validateAIAnalysisResult(parsed);
}

/**
 * Generate alt text and smart filename
 */
export async function generateAltText(file: File): Promise<AltTextResult> {
	if (!isAIEnabled()) {
		throw new Error('AI features not enabled. Please add VITE_OPENAI_API_KEY to .env file');
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
	const base64DataURL = await fileToBase64DataURL(optimizedFile);

	const prompt = `Analyze this image and provide:
1. A detailed, accessible alt text description (for screen readers)
2. A short, descriptive filename (lowercase, underscores, no special chars)

Format as JSON:
{
  "description": "Detailed alt text here...",
  "suggestedFilename": "descriptive_filename"
}`;

	const response = await fetch(OPENAI_API_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${OPENAI_API_KEY}`
		},
		body: JSON.stringify({
			model: MODEL,
			max_tokens: 512,
			messages: [
				{
					role: 'user',
					content: [
						{
							type: 'image_url',
							image_url: {
								url: base64DataURL
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
		if (import.meta.env.DEV) console.error('OpenAI API error (generateAltText):', error);
		throw new Error(mapAPIErrorToUserMessage(response.status));
	}

	const data = (await response.json()) as OpenAIAPIResponse;
	if (!data.choices?.[0]?.message?.content) {
		throw new Error('Invalid API response structure');
	}

	const textContent = data.choices[0].message.content;

	// Parse JSON from response
	const jsonMatch = textContent.match(/\{[\s\S]*\}/);
	if (!jsonMatch) {
		throw new Error('No JSON found in AI response');
	}

	const parsed = JSON.parse(jsonMatch[0]);
	return validateAltTextResult(parsed);
}
