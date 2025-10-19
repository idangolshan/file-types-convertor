/**
 * Drawing Types
 * Vector-based element definitions for the image editor
 */

export type Point = {
	x: number;
	y: number;
};

export type DrawingTool = 'pen' | 'rectangle' | 'circle' | 'arrow' | 'text' | 'eraser';

/**
 * Freehand path element (pen/brush tool)
 */
export type PathElement = {
	type: 'path';
	id: string;
	points: Point[];
	color: string;
	thickness: number;
};

/**
 * Rectangle shape element
 */
export type RectElement = {
	type: 'rectangle';
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
	color: string;
	thickness: number;
	fill?: string;
};

/**
 * Circle shape element
 */
export type CircleElement = {
	type: 'circle';
	id: string;
	x: number;
	y: number;
	radius: number;
	color: string;
	thickness: number;
	fill?: string;
};

/**
 * Arrow element
 */
export type ArrowElement = {
	type: 'arrow';
	id: string;
	startX: number;
	startY: number;
	endX: number;
	endY: number;
	color: string;
	thickness: number;
};

/**
 * Text annotation element
 */
export type TextElement = {
	type: 'text';
	id: string;
	x: number;
	y: number;
	text: string;
	color: string;
	fontSize: number;
	fontFamily: string;
};

/**
 * Union type for all drawing elements
 */
export type DrawingElement =
	| PathElement
	| RectElement
	| CircleElement
	| ArrowElement
	| TextElement;
