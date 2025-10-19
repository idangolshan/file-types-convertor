<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type {
		DrawingElement,
		DrawingTool,
		Point,
		PathElement,
		RectElement,
		CircleElement,
		ArrowElement,
		TextElement
	} from '$lib/types/drawing';
	import { renderAllElements, getElementAtPoint } from '$lib/utils/drawingEngine';
	import { mergeCanvasLayers, canvasToFile } from '$lib/utils/canvasExport';

	// Props
	export let originalFile: File;
	export let onSave: (editedFile: File) => void;
	export let onCancel: () => void;

	// Canvas refs
	let imageCanvas: HTMLCanvasElement;
	let drawingCanvas: HTMLCanvasElement;
	let imageCtx: CanvasRenderingContext2D | null = null;
	let drawingCtx: CanvasRenderingContext2D | null = null;

	// Drawing state (vector-based)
	let drawingElements: DrawingElement[] = [];
	let history: DrawingElement[][] = [[]];
	let historyIndex = 0;

	// Tool state
	let currentTool: DrawingTool = 'pen';
	let currentColor = '#000000';
	let currentThickness = 3;

	// Drawing interaction state
	let isDrawing = false;
	let currentElement: DrawingElement | null = null;
	let startPoint: Point | null = null;

	// Text input state
	let showTextInput = false;
	let textInputX = 0;
	let textInputY = 0;
	let textInputValue = '';

	// Touch gesture state
	let lastTouchDistance = 0;

	/**
	 * Initialize canvases and load image
	 */
	onMount(async () => {
		// Load the image
		const img = await loadImageFromFile(originalFile);

		// Set canvas dimensions to match image
		const width = img.width;
		const height = img.height;

		imageCanvas.width = width;
		imageCanvas.height = height;
		drawingCanvas.width = width;
		drawingCanvas.height = height;

		// Get contexts
		imageCtx = imageCanvas.getContext('2d');
		drawingCtx = drawingCanvas.getContext('2d');

		if (!imageCtx || !drawingCtx) {
			throw new Error('Failed to get canvas contexts');
		}

		// Draw the image on the image layer
		imageCtx.drawImage(img, 0, 0);

		// Set up keyboard shortcuts
		window.addEventListener('keydown', handleKeyDown);
	});

	onDestroy(() => {
		window.removeEventListener('keydown', handleKeyDown);
	});

	/**
	 * Load image from File
	 */
	function loadImageFromFile(file: File): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			const reader = new FileReader();

			reader.onload = (e) => {
				if (!e.target?.result) {
					reject(new Error('Failed to read file'));
					return;
				}

				img.onload = () => resolve(img);
				img.onerror = () => reject(new Error('Failed to load image'));
				img.src = e.target.result as string;
			};

			reader.onerror = () => reject(new Error('Failed to read file'));
			reader.readAsDataURL(file);
		});
	}

	/**
	 * Get canvas coordinates from pointer event
	 */
	function getCanvasPoint(e: PointerEvent | MouseEvent): Point {
		const rect = drawingCanvas.getBoundingClientRect();
		const scaleX = drawingCanvas.width / rect.width;
		const scaleY = drawingCanvas.height / rect.height;

		return {
			x: (e.clientX - rect.left) * scaleX,
			y: (e.clientY - rect.top) * scaleY
		};
	}

	/**
	 * Handle pointer down (start drawing)
	 */
	function handlePointerDown(e: PointerEvent) {
		e.preventDefault();
		isDrawing = true;
		const point = getCanvasPoint(e);
		startPoint = point;

		if (currentTool === 'pen') {
			// Start a new path
			currentElement = {
				type: 'path',
				id: crypto.randomUUID(),
				points: [point],
				color: currentColor,
				thickness: currentThickness
			} as PathElement;
		} else if (currentTool === 'rectangle') {
			// Start a rectangle
			currentElement = {
				type: 'rectangle',
				id: crypto.randomUUID(),
				x: point.x,
				y: point.y,
				width: 0,
				height: 0,
				color: currentColor,
				thickness: currentThickness
			} as RectElement;
		} else if (currentTool === 'circle') {
			// Start a circle
			currentElement = {
				type: 'circle',
				id: crypto.randomUUID(),
				x: point.x,
				y: point.y,
				radius: 0,
				color: currentColor,
				thickness: currentThickness
			} as CircleElement;
		} else if (currentTool === 'arrow') {
			// Start an arrow
			currentElement = {
				type: 'arrow',
				id: crypto.randomUUID(),
				startX: point.x,
				startY: point.y,
				endX: point.x,
				endY: point.y,
				color: currentColor,
				thickness: currentThickness
			} as ArrowElement;
		} else if (currentTool === 'text') {
			// Show text input at click position
			textInputX = e.clientX;
			textInputY = e.clientY;
			textInputValue = '';
			showTextInput = true;
			isDrawing = false;
		} else if (currentTool === 'eraser') {
			// Erase element at point
			handleEraser(point);
			isDrawing = false;
		}
	}

	/**
	 * Handle pointer move (continue drawing)
	 */
	function handlePointerMove(e: PointerEvent) {
		if (!isDrawing || !currentElement || !drawingCtx) return;

		const point = getCanvasPoint(e);

		if (currentTool === 'pen' && currentElement.type === 'path') {
			// Add point to path
			currentElement.points.push(point);
		} else if (currentTool === 'rectangle' && currentElement.type === 'rectangle' && startPoint) {
			// Update rectangle dimensions
			currentElement.width = point.x - startPoint.x;
			currentElement.height = point.y - startPoint.y;
		} else if (currentTool === 'circle' && currentElement.type === 'circle' && startPoint) {
			// Update circle radius
			const dx = point.x - startPoint.x;
			const dy = point.y - startPoint.y;
			currentElement.radius = Math.sqrt(dx * dx + dy * dy);
		} else if (currentTool === 'arrow' && currentElement.type === 'arrow') {
			// Update arrow end point
			currentElement.endX = point.x;
			currentElement.endY = point.y;
		}

		// Render all elements including current one
		renderAllElements(drawingCtx, [...drawingElements, currentElement]);
	}

	/**
	 * Handle pointer up (finish drawing)
	 */
	function handlePointerUp(e: PointerEvent) {
		if (!isDrawing || !currentElement || !drawingCtx) return;

		// Add the completed element to the drawing elements
		drawingElements = [...drawingElements, currentElement];

		// Save state for undo/redo
		saveState();

		// Reset drawing state
		currentElement = null;
		startPoint = null;
		isDrawing = false;

		// Render final state
		renderAllElements(drawingCtx, drawingElements);
	}

	/**
	 * Handle eraser tool
	 */
	function handleEraser(point: Point) {
		const element = getElementAtPoint(point.x, point.y, drawingElements);

		if (element && drawingCtx) {
			// Remove the element
			drawingElements = drawingElements.filter((e) => e.id !== element.id);
			saveState();
			renderAllElements(drawingCtx, drawingElements);
		}
	}

	/**
	 * Handle text input submission
	 */
	function handleTextSubmit() {
		if (!textInputValue.trim() || !startPoint || !drawingCtx) {
			showTextInput = false;
			return;
		}

		const textElement: TextElement = {
			type: 'text',
			id: crypto.randomUUID(),
			x: startPoint.x,
			y: startPoint.y,
			text: textInputValue,
			color: currentColor,
			fontSize: currentThickness * 8, // Scale font size with thickness
			fontFamily: 'Arial, sans-serif'
		};

		drawingElements = [...drawingElements, textElement];
		saveState();
		renderAllElements(drawingCtx, drawingElements);

		showTextInput = false;
		textInputValue = '';
	}

	/**
	 * Save current state to history (for undo/redo)
	 */
	function saveState() {
		// Remove any "future" history if we're not at the end
		history = history.slice(0, historyIndex + 1);

		// Add current state (deep copy)
		history = [...history, JSON.parse(JSON.stringify(drawingElements))];
		historyIndex++;

		// Limit history to 50 entries to prevent memory bloat
		if (history.length > 50) {
			history = history.slice(1);
			historyIndex--;
		}
	}

	/**
	 * Undo last action
	 */
	function undo() {
		if (historyIndex > 0 && drawingCtx) {
			historyIndex--;
			drawingElements = JSON.parse(JSON.stringify(history[historyIndex]));
			renderAllElements(drawingCtx, drawingElements);
		}
	}

	/**
	 * Redo last undone action
	 */
	function redo() {
		if (historyIndex < history.length - 1 && drawingCtx) {
			historyIndex++;
			drawingElements = JSON.parse(JSON.stringify(history[historyIndex]));
			renderAllElements(drawingCtx, drawingElements);
		}
	}

	/**
	 * Clear all drawings
	 */
	function clearAll() {
		if (!drawingCtx) return;

		drawingElements = [];
		saveState();
		renderAllElements(drawingCtx, drawingElements);
	}

	/**
	 * Handle keyboard shortcuts
	 */
	function handleKeyDown(e: KeyboardEvent) {
		// Undo/Redo
		if (e.ctrlKey && e.key === 'z') {
			e.preventDefault();
			undo();
		}
		if (e.ctrlKey && e.key === 'y') {
			e.preventDefault();
			redo();
		}

		// Tool shortcuts (only if not typing in text input)
		if (!showTextInput) {
			if (e.key === 'p') currentTool = 'pen';
			if (e.key === 'r') currentTool = 'rectangle';
			if (e.key === 'c') currentTool = 'circle';
			if (e.key === 'a') currentTool = 'arrow';
			if (e.key === 't') currentTool = 'text';
			if (e.key === 'e') currentTool = 'eraser';
		}

		// Escape to cancel text input
		if (e.key === 'Escape' && showTextInput) {
			showTextInput = false;
		}

		// Enter to submit text
		if (e.key === 'Enter' && showTextInput) {
			handleTextSubmit();
		}
	}

	/**
	 * Handle touch gestures
	 */
	function handleTouchStart(e: TouchEvent) {
		if (e.touches.length === 2) {
			// Start pinch gesture
			lastTouchDistance = getTouchDistance(e.touches[0], e.touches[1]);
		}
	}

	function handleTouchMove(e: TouchEvent) {
		// Pinch-to-zoom could be implemented here if needed
		// For now, we handle single-touch drawing via Pointer Events
	}

	function handleTouchEnd(e: TouchEvent) {
		// Reset touch gesture state
		lastTouchDistance = 0;
	}

	function getTouchDistance(touch1: Touch, touch2: Touch): number {
		const dx = touch2.clientX - touch1.clientX;
		const dy = touch2.clientY - touch1.clientY;
		return Math.sqrt(dx * dx + dy * dy);
	}

	/**
	 * Apply edits and export
	 */
	async function handleApply() {
		try {
			// Merge the two canvas layers
			const merged = mergeCanvasLayers(imageCanvas, drawingCanvas);

			// Export to File
			const filename = originalFile.name.replace(/\.[^/.]+$/, '_edited.png');
			const editedFile = await canvasToFile(merged, filename, 'image/png');

			// Callback to parent
			onSave(editedFile);
		} catch (error) {
			console.error('Failed to export edited image:', error);
			alert('Failed to export edited image. Please try again.');
		}
	}

	/**
	 * Cancel editing
	 */
	function handleCancelClick() {
		onCancel();
	}

	/**
	 * Focus input action (Svelte action)
	 */
	function focusInput(node: HTMLInputElement) {
		node.focus();
	}
</script>

<div class="editor-overlay">
	<div class="editor-container">
		<!-- Toolbar -->
		<div class="toolbar">
			<div class="toolbar-section">
				<h3 class="toolbar-title">Tools</h3>
				<div class="tool-buttons">
					<button
						class="tool-btn"
						class:active={currentTool === 'pen'}
						on:click={() => (currentTool = 'pen')}
						title="Pen (P)"
					>
						✏️ Pen
					</button>
					<button
						class="tool-btn"
						class:active={currentTool === 'rectangle'}
						on:click={() => (currentTool = 'rectangle')}
						title="Rectangle (R)"
					>
						⬜ Rect
					</button>
					<button
						class="tool-btn"
						class:active={currentTool === 'circle'}
						on:click={() => (currentTool = 'circle')}
						title="Circle (C)"
					>
						⭕ Circle
					</button>
					<button
						class="tool-btn"
						class:active={currentTool === 'arrow'}
						on:click={() => (currentTool = 'arrow')}
						title="Arrow (A)"
					>
						➡️ Arrow
					</button>
					<button
						class="tool-btn"
						class:active={currentTool === 'text'}
						on:click={() => (currentTool = 'text')}
						title="Text (T)"
					>
						🔤 Text
					</button>
					<button
						class="tool-btn"
						class:active={currentTool === 'eraser'}
						on:click={() => (currentTool = 'eraser')}
						title="Eraser (E)"
					>
						🗑️ Eraser
					</button>
				</div>
			</div>

			<div class="toolbar-section">
				<h3 class="toolbar-title">Color</h3>
				<input type="color" bind:value={currentColor} class="color-picker" />
			</div>

			<div class="toolbar-section">
				<h3 class="toolbar-title">Thickness: {currentThickness}px</h3>
				<input
					type="range"
					min="1"
					max="20"
					bind:value={currentThickness}
					class="thickness-slider"
				/>
			</div>

			<div class="toolbar-section">
				<div class="action-buttons">
					<button on:click={undo} disabled={historyIndex === 0} class="action-btn" title="Undo (Ctrl+Z)">
						↶ Undo
					</button>
					<button
						on:click={redo}
						disabled={historyIndex === history.length - 1}
						class="action-btn"
						title="Redo (Ctrl+Y)"
					>
						↷ Redo
					</button>
					<button on:click={clearAll} class="action-btn danger">
						🗑️ Clear All
					</button>
				</div>
			</div>
		</div>

		<!-- Canvas Container -->
		<div class="canvas-wrapper">
			<canvas bind:this={imageCanvas} class="image-layer"></canvas>
			<canvas
				bind:this={drawingCanvas}
				class="drawing-layer"
				class:cursor-crosshair={currentTool !== 'eraser'}
				class:cursor-pointer={currentTool === 'eraser'}
				on:pointerdown={handlePointerDown}
				on:pointermove={handlePointerMove}
				on:pointerup={handlePointerUp}
				on:touchstart|preventDefault={handleTouchStart}
				on:touchmove|preventDefault={handleTouchMove}
				on:touchend={handleTouchEnd}
			></canvas>
		</div>

		<!-- Text Input Modal -->
		{#if showTextInput}
			<div
				class="text-input-modal"
				style="left: {textInputX}px; top: {textInputY}px;"
			>
				<input
					type="text"
					bind:value={textInputValue}
					placeholder="Enter text..."
					class="text-input"
					on:keydown={(e) => {
						if (e.key === 'Enter') handleTextSubmit();
						if (e.key === 'Escape') (showTextInput = false);
					}}
					use:focusInput
				/>
				<div class="text-input-actions">
					<button on:click={handleTextSubmit} class="btn-sm btn-primary">Add</button>
					<button on:click={() => (showTextInput = false)} class="btn-sm">Cancel</button>
				</div>
			</div>
		{/if}

		<!-- Bottom Actions -->
		<div class="bottom-actions">
			<button on:click={handleCancelClick} class="btn-secondary">
				Cancel
			</button>
			<button on:click={handleApply} class="btn-primary">
				Apply & Continue
			</button>
		</div>
	</div>
</div>

<style>
	.editor-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.9);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 20px;
	}

	.editor-container {
		background: white;
		border-radius: 12px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
		max-width: 1200px;
		width: 100%;
		max-height: 95vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.toolbar {
		display: flex;
		gap: 24px;
		padding: 16px 20px;
		background: #f8f9fa;
		border-bottom: 2px solid #e9ecef;
		flex-wrap: wrap;
		align-items: center;
	}

	.toolbar-section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.toolbar-title {
		font-size: 12px;
		font-weight: 600;
		color: #6c757d;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin: 0;
	}

	.tool-buttons {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.tool-btn {
		padding: 8px 12px;
		border: 2px solid #dee2e6;
		background: white;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
		transition: all 0.2s;
	}

	.tool-btn:hover {
		background: #e9ecef;
		border-color: #adb5bd;
	}

	.tool-btn.active {
		background: #0d6efd;
		color: white;
		border-color: #0d6efd;
	}

	.color-picker {
		width: 60px;
		height: 40px;
		border: 2px solid #dee2e6;
		border-radius: 6px;
		cursor: pointer;
	}

	.thickness-slider {
		width: 150px;
	}

	.action-buttons {
		display: flex;
		gap: 8px;
	}

	.action-btn {
		padding: 8px 12px;
		border: 2px solid #dee2e6;
		background: white;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
		transition: all 0.2s;
	}

	.action-btn:hover:not(:disabled) {
		background: #e9ecef;
	}

	.action-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.action-btn.danger {
		color: #dc3545;
		border-color: #dc3545;
	}

	.action-btn.danger:hover {
		background: #dc3545;
		color: white;
	}

	.canvas-wrapper {
		position: relative;
		flex: 1;
		overflow: auto;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f8f9fa;
		min-height: 400px;
	}

	.image-layer {
		position: absolute;
		border: 1px solid #dee2e6;
	}

	.drawing-layer {
		position: absolute;
		touch-action: none;
		border: 1px solid #dee2e6;
	}

	.cursor-crosshair {
		cursor: crosshair;
	}

	.cursor-pointer {
		cursor: pointer;
	}

	.text-input-modal {
		position: fixed;
		background: white;
		border: 2px solid #0d6efd;
		border-radius: 8px;
		padding: 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: 1001;
	}

	.text-input {
		padding: 8px;
		border: 1px solid #dee2e6;
		border-radius: 4px;
		font-size: 14px;
		width: 200px;
		margin-bottom: 8px;
	}

	.text-input-actions {
		display: flex;
		gap: 8px;
	}

	.btn-sm {
		padding: 6px 12px;
		border: 1px solid #dee2e6;
		background: white;
		border-radius: 4px;
		cursor: pointer;
		font-size: 13px;
	}

	.btn-sm.btn-primary {
		background: #0d6efd;
		color: white;
		border-color: #0d6efd;
	}

	.bottom-actions {
		padding: 16px 20px;
		background: #f8f9fa;
		border-top: 2px solid #e9ecef;
		display: flex;
		gap: 12px;
		justify-content: flex-end;
	}

	.btn-secondary {
		padding: 12px 24px;
		border: 2px solid #6c757d;
		background: white;
		color: #6c757d;
		border-radius: 8px;
		cursor: pointer;
		font-size: 16px;
		font-weight: 600;
		transition: all 0.2s;
	}

	.btn-secondary:hover {
		background: #6c757d;
		color: white;
	}

	.btn-primary {
		padding: 12px 24px;
		border: 2px solid #0d6efd;
		background: #0d6efd;
		color: white;
		border-radius: 8px;
		cursor: pointer;
		font-size: 16px;
		font-weight: 600;
		transition: all 0.2s;
	}

	.btn-primary:hover {
		background: #0b5ed7;
		border-color: #0b5ed7;
	}
</style>
