/**
 * Drawing Engine
 * Core rendering engine for vector-based canvas drawing
 */

import type { DrawingElement, Point, PathElement, RectElement, CircleElement, ArrowElement, TextElement } from '$lib/types/drawing';

/**
 * Render a single drawing element onto the canvas
 */
export function renderElement(ctx: CanvasRenderingContext2D, element: DrawingElement): void {
	ctx.save();

	switch (element.type) {
		case 'path':
			renderPath(ctx, element);
			break;
		case 'rectangle':
			renderRectangle(ctx, element);
			break;
		case 'circle':
			renderCircle(ctx, element);
			break;
		case 'arrow':
			renderArrow(ctx, element);
			break;
		case 'text':
			renderText(ctx, element);
			break;
	}

	ctx.restore();
}

/**
 * Render all elements onto the canvas (clear and redraw)
 */
export function renderAllElements(ctx: CanvasRenderingContext2D, elements: DrawingElement[]): void {
	// Clear the canvas
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	// Render each element
	for (const element of elements) {
		renderElement(ctx, element);
	}
}

/**
 * Render a freehand path with smooth curves
 */
function renderPath(ctx: CanvasRenderingContext2D, path: PathElement): void {
	if (path.points.length < 2) return;

	ctx.strokeStyle = path.color;
	ctx.lineWidth = path.thickness;
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';

	ctx.beginPath();
	ctx.moveTo(path.points[0].x, path.points[0].y);

	// Use quadratic curves for smoothness
	for (let i = 1; i < path.points.length - 1; i++) {
		const currentPoint = path.points[i];
		const nextPoint = path.points[i + 1];

		// Calculate control point (midpoint)
		const controlX = (currentPoint.x + nextPoint.x) / 2;
		const controlY = (currentPoint.y + nextPoint.y) / 2;

		ctx.quadraticCurveTo(currentPoint.x, currentPoint.y, controlX, controlY);
	}

	// Draw the last point
	const lastPoint = path.points[path.points.length - 1];
	ctx.lineTo(lastPoint.x, lastPoint.y);

	ctx.stroke();
}

/**
 * Render a rectangle shape
 */
function renderRectangle(ctx: CanvasRenderingContext2D, rect: RectElement): void {
	ctx.strokeStyle = rect.color;
	ctx.lineWidth = rect.thickness;

	// Fill if specified
	if (rect.fill) {
		ctx.fillStyle = rect.fill;
		ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
	}

	// Stroke the outline
	ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
}

/**
 * Render a circle shape
 */
function renderCircle(ctx: CanvasRenderingContext2D, circle: CircleElement): void {
	ctx.strokeStyle = circle.color;
	ctx.lineWidth = circle.thickness;

	ctx.beginPath();
	ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);

	// Fill if specified
	if (circle.fill) {
		ctx.fillStyle = circle.fill;
		ctx.fill();
	}

	ctx.stroke();
}

/**
 * Render an arrow with arrowhead
 */
function renderArrow(ctx: CanvasRenderingContext2D, arrow: ArrowElement): void {
	ctx.strokeStyle = arrow.color;
	ctx.fillStyle = arrow.color;
	ctx.lineWidth = arrow.thickness;
	ctx.lineCap = 'round';

	// Draw the main line
	ctx.beginPath();
	ctx.moveTo(arrow.startX, arrow.startY);
	ctx.lineTo(arrow.endX, arrow.endY);
	ctx.stroke();

	// Draw the arrowhead
	const angle = Math.atan2(arrow.endY - arrow.startY, arrow.endX - arrow.startX);
	const headLength = 15 + arrow.thickness; // Arrowhead size

	ctx.beginPath();
	ctx.moveTo(arrow.endX, arrow.endY);
	ctx.lineTo(
		arrow.endX - headLength * Math.cos(angle - Math.PI / 6),
		arrow.endY - headLength * Math.sin(angle - Math.PI / 6)
	);
	ctx.lineTo(
		arrow.endX - headLength * Math.cos(angle + Math.PI / 6),
		arrow.endY - headLength * Math.sin(angle + Math.PI / 6)
	);
	ctx.closePath();
	ctx.fill();
}

/**
 * Render text annotation
 */
function renderText(ctx: CanvasRenderingContext2D, text: TextElement): void {
	ctx.fillStyle = text.color;
	ctx.font = `${text.fontSize}px ${text.fontFamily}`;
	ctx.textBaseline = 'top';

	ctx.fillText(text.text, text.x, text.y);
}

/**
 * Get the drawing element at a specific point (for hit detection)
 * Returns the topmost element under the cursor
 */
export function getElementAtPoint(
	x: number,
	y: number,
	elements: DrawingElement[]
): DrawingElement | null {
	// Iterate in reverse (top to bottom in rendering order)
	for (let i = elements.length - 1; i >= 0; i--) {
		const element = elements[i];

		if (isPointInElement(x, y, element)) {
			return element;
		}
	}

	return null;
}

/**
 * Check if a point is inside an element's bounding box/area
 */
function isPointInElement(x: number, y: number, element: DrawingElement): boolean {
	const hitMargin = 10; // Extra margin for easier selection

	switch (element.type) {
		case 'path':
			// Check if point is near any segment of the path
			for (let i = 0; i < element.points.length - 1; i++) {
				const p1 = element.points[i];
				const p2 = element.points[i + 1];

				if (isPointNearLine(x, y, p1.x, p1.y, p2.x, p2.y, element.thickness + hitMargin)) {
					return true;
				}
			}
			return false;

		case 'rectangle':
			return (
				x >= element.x - hitMargin &&
				x <= element.x + element.width + hitMargin &&
				y >= element.y - hitMargin &&
				y <= element.y + element.height + hitMargin
			);

		case 'circle':
			const distance = Math.sqrt(Math.pow(x - element.x, 2) + Math.pow(y - element.y, 2));
			return Math.abs(distance - element.radius) <= element.thickness + hitMargin;

		case 'arrow':
			return isPointNearLine(
				x,
				y,
				element.startX,
				element.startY,
				element.endX,
				element.endY,
				element.thickness + hitMargin
			);

		case 'text':
			// Simple bounding box for text (approximate)
			const textWidth = element.text.length * element.fontSize * 0.6; // Rough estimate
			const textHeight = element.fontSize;
			return (
				x >= element.x - hitMargin &&
				x <= element.x + textWidth + hitMargin &&
				y >= element.y - hitMargin &&
				y <= element.y + textHeight + hitMargin
			);

		default:
			return false;
	}
}

/**
 * Check if a point is near a line segment (for hit detection)
 */
function isPointNearLine(
	px: number,
	py: number,
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	threshold: number
): boolean {
	// Calculate distance from point to line segment
	const A = px - x1;
	const B = py - y1;
	const C = x2 - x1;
	const D = y2 - y1;

	const dot = A * C + B * D;
	const lenSq = C * C + D * D;
	let param = -1;

	if (lenSq !== 0) {
		param = dot / lenSq;
	}

	let xx, yy;

	if (param < 0) {
		xx = x1;
		yy = y1;
	} else if (param > 1) {
		xx = x2;
		yy = y2;
	} else {
		xx = x1 + param * C;
		yy = y1 + param * D;
	}

	const dx = px - xx;
	const dy = py - yy;
	const distance = Math.sqrt(dx * dx + dy * dy);

	return distance <= threshold;
}
