# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a browser-based file converter application built with SvelteKit 5, focusing on client-side image format conversion. The app uses the Canvas API for in-browser image processing without requiring a backend server.

## Development Commands

```bash
# Start development server (with HMR)
npm run dev

# Type checking
npm run check

# Type checking in watch mode
npm run check:watch

# Production build
npm run build

# Preview production build locally
npm run preview
```

## Tech Stack & Configuration

- **Framework**: SvelteKit 2 with Svelte 5 (using new runes syntax)
- **Styling**: Tailwind CSS v4 (note: uses `@import "tailwindcss"` syntax, not v3 directives)
- **Build Tool**: Vite 7
- **TypeScript**: Enabled throughout
- **Node Version**: Requires Node 24+

### Important: Tailwind v4 Differences

This project uses Tailwind CSS v4, which has different syntax requirements:

1. **CSS Import**: Use `@import "tailwindcss"` in `src/app.css` (NOT `@tailwind` directives)
2. **Vite Plugin**: Configured in `vite.config.ts` with `@tailwindcss/vite`
3. **No @apply in Svelte Components**: Tailwind v4 has restrictions on `@apply` usage. Always use utility classes directly in HTML/template sections rather than in `<style>` blocks
4. **No {@const} at Component Root**: Svelte 5 requires `{@const}` tags to be immediate children of control flow blocks. Use reactive statements (`$:`) in the script section instead

## Architecture

### Directory Structure

```
src/
├── lib/
│   ├── components/        # Reusable Svelte components
│   │   ├── UploadZone.svelte
│   │   ├── FormatSelector.svelte
│   │   ├── PreviewPane.svelte
│   │   └── AIRecommendation.svelte
│   ├── converters/        # Conversion logic modules
│   │   └── imageConverter.ts
│   ├── services/          # External API integrations
│   │   └── claudeAI.ts
│   └── utils/             # Helper utilities
│       └── imageAnalyzer.ts
├── routes/
│   ├── +layout.svelte    # Root layout (imports app.css)
│   └── +page.svelte      # Main application page
└── app.css               # Global styles (Tailwind import)
```

### Component Communication Pattern

The app follows a unidirectional data flow:

1. **+page.svelte** (main coordinator):
   - Manages all state (selectedFile, targetFormat, convertedBlob, isConverting)
   - Handles events from child components
   - Calls converter functions
   - Passes data down to presentational components

2. **Child components** dispatch CustomEvents upward:
   ```typescript
   // Example from UploadZone
   dispatch('upload', file);

   // Consumed in parent
   on:upload={handleFileUpload}
   ```

3. **No global state management** - all state lives in the page component and is passed via props

### Image Conversion Flow

The conversion pipeline in `src/lib/converters/imageConverter.ts`:

1. **File → FileReader**: Reads File as Data URL
2. **Data URL → Image Element**: Loads into HTMLImageElement
3. **Image → Canvas**: Draws image onto canvas (handles resizing)
4. **Canvas → Blob**: Uses `canvas.toBlob()` with target MIME type and quality
5. **Blob → Download**: Creates object URL for download

Key aspects:
- All conversion happens client-side (no server required)
- Quality parameter: 0-1 (default 0.92)
- Automatic aspect ratio preservation when resizing
- Memory leak prevention: Always revoke object URLs in cleanup

### Memory Management

Critical patterns for browser-based file handling:

```typescript
// In PreviewPane.svelte
$: if (originalFile) {
  if (originalPreview) URL.revokeObjectURL(originalPreview); // Clean up old URL
  originalPreview = URL.createObjectURL(originalFile);
}

// Always use onMount cleanup
onMount(() => {
  return () => {
    if (originalPreview) URL.revokeObjectURL(originalPreview);
  };
});
```

## Svelte 5 Specific Patterns

This project uses Svelte 5's new syntax:

### Reactive Statements
```typescript
// Use $: for derived values
$: sizeDiff = originalFile && convertedBlob
  ? ((convertedBlob.size - originalFile.size) / originalFile.size) * 100
  : 0;
```

### Props
```typescript
// Component props use export let
export let originalFile: File | null = null;
export let convertedBlob: Blob | null = null;
```

### Event Dispatching
```typescript
import { createEventDispatcher } from 'svelte';
const dispatch = createEventDispatcher<{ upload: File }>();
dispatch('upload', file);
```

## Styling Guidelines

1. **Use Tailwind utilities directly in markup** - avoid `<style>` blocks with `@apply`
2. **Conditional classes**: Use Svelte's class directive
   ```svelte
   <div class="base-classes {condition ? 'true-classes' : 'false-classes'}">
   ```
3. **Dynamic classes**: Build class strings in template expressions
4. **Animations**: Tailwind's built-in utilities (animate-spin, transition-all, etc.)

## Adding New File Format Support

To add support for a new image format:

1. Update `FormatSelector.svelte`:
   ```typescript
   const formats = [
     // ... existing formats
     { value: 'image/newformat', label: 'NEWFORMAT', ext: '.newext' }
   ];
   ```

2. Update `imageConverter.ts`:
   ```typescript
   export function getExtensionFromMimeType(mimeType: string): string {
     const extensions: Record<string, string> = {
       // ... existing mappings
       'image/newformat': '.newext'
     };
     return extensions[mimeType] || '.jpg';
   }
   ```

3. Update `UploadZone.svelte` to accept the new type:
   ```typescript
   const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/newformat'];
   ```

Note: Canvas API supports only web-standard formats (JPEG, PNG, WebP). For formats like AVIF or advanced compression, you'd need WASM libraries (e.g., Squoosh codecs).

## Common Patterns

### File Validation
```typescript
// Type validation
if (!acceptedTypes.includes(file.type)) {
  alert('Unsupported file type');
  return;
}

// Size validation
if (file.size > maxFileSize) {
  alert('File too large');
  return;
}
```

### Error Handling
```typescript
try {
  convertedBlob = await convertImage(selectedFile, targetFormat, { quality: 0.92 });
} catch (error) {
  errorMessage = error instanceof Error ? error.message : 'Conversion failed';
} finally {
  isConverting = false;
}
```

### Loading States
Components that trigger async operations should manage loading state and disable user interaction during processing.

## Extension Points

The architecture is designed for easy extension:

1. **New converters**: Add modules to `src/lib/converters/`
2. **New components**: Add to `src/lib/components/`
3. **Conversion options**: Extend `ConversionOptions` interface in `imageConverter.ts`
4. **Settings UI**: Add `ConversionSettings.svelte` component for quality/size controls
5. **Batch processing**: Extend state to handle `File[]` instead of single `File`

## Performance Considerations

- Canvas operations are synchronous and block the main thread
- Large images (>10MB) may cause UI freezing during conversion
- Consider Web Workers for conversion in the future
- Object URLs must be revoked to prevent memory leaks
- Preview images are kept at original size (consider downscaling for performance)

## AI Features

The app includes AI-powered features using OpenAI's GPT-4o with vision capabilities.

### Environment Setup

Create a `.env` file in the project root:
```bash
VITE_OPENAI_API_KEY=sk-...
```

The app gracefully degrades when no API key is provided.

### AI Architecture

**Two-Stage Analysis Pipeline**:

1. **Local Analysis** (`src/lib/utils/imageAnalyzer.ts`):
   - Runs first, no API calls needed
   - Detects transparency using alpha channel analysis
   - Estimates color count via pixel sampling
   - Provides heuristic recommendations as fallback

2. **AI Enhancement** (`src/lib/services/openAI.ts`):
   - Runs in parallel with format recommendation and alt text generation
   - Uses OpenAI GPT-4o API with base64-encoded images
   - Returns structured JSON responses

### AI Features Flow

```typescript
// In +page.svelte
async function handleFileUpload(event: CustomEvent<File>) {
  selectedFile = event.detail;

  if (isAIEnabled()) {
    // 1. Local analysis (fast, synchronous)
    const characteristics = await analyzeImage(selectedFile);

    // 2. Parallel AI calls (slower, requires API)
    const [recommendation, altText] = await Promise.all([
      getFormatRecommendation(file, characteristics),
      generateAltText(file)
    ]);
  }
}
```

### AI Service Patterns

**API Call Structure**:
```typescript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENAI_API_KEY}`
  },
  body: JSON.stringify({
    model: 'gpt-4o',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: base64DataURL } },
        { type: 'text', text: prompt }
      ]
    }]
  })
});
```

**Response Parsing**:
```typescript
const data = await response.json();
const textContent = data.choices[0].message.content;
const jsonMatch = textContent.match(/\{[\s\S]*\}/);
return JSON.parse(jsonMatch[0]);
```

### Image Analysis Utilities

**Transparency Detection**:
```typescript
function checkTransparency(imageData: ImageData): boolean {
  const data = imageData.data;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) return true; // Found semi-transparent pixel
  }
  return false;
}
```

**Color Estimation** (sampled for performance):
```typescript
function estimateColorCount(imageData: ImageData): number {
  const colors = new Set<string>();
  const sampleRate = 10; // Every 10th pixel

  for (let i = 0; i < data.length; i += 4 * sampleRate) {
    colors.add(`${data[i]},${data[i+1]},${data[i+2]}`);
    if (colors.size > 10000) return 10000; // Early exit
  }

  return Math.min(colors.size * sampleRate, 16777216);
}
```

### AI Component

**AIRecommendation.svelte** displays three states:
1. **Loading**: Spinner with "AI Analyzing Image..."
2. **Error**: Warning banner with setup instructions
3. **Success**: Gradient cards showing recommendation, alt text, and smart filename

**Props**:
```typescript
export let recommendation: AIAnalysisResult | null = null;
export let isLoading: boolean = false;
export let error: string = '';
export let altText: string = '';
export let suggestedFilename: string = '';
```

### Smart Filename Integration

The download handler automatically uses AI-suggested filenames:
```typescript
function handleDownload() {
  let filename: string;
  if (altTextData?.suggestedFilename) {
    const ext = getExtensionFromMimeType(targetFormat);
    filename = `${altTextData.suggestedFilename}${ext}`;
  } else {
    filename = generateDownloadFilename(selectedFile.name, targetFormat);
  }
  downloadBlob(convertedBlob, filename);
}
```

## Known Limitations

- GIF conversion loses animation (converts to static first frame)
- No support for RAW camera formats (requires specialized libraries)
- Canvas quality may not match professional tools for some formats
- Browser memory limits apply (typically ~2GB per tab)
- AI features require API key and internet connection
- Large images may take several seconds for AI analysis

1. First think through the problem, read the codebase for relevant files, and write a plan to tasks/todo.md.
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Finally, add a review section to the todo.md file with a summary of the changes you made and any other relevant information.
8. DO NOT BE LAZY. NEVER BE LAZY. IF THERE IS A BUG FIND THE ROOT CAUSE AND FIX IT. NO TEMPORARY FIXES. YOU ARE A SENIOR DEVELOPER. NEVER BE LAZY
9. MAKE ALL FIXES AND CODE CHANGES AS SIMPLE AS HUMANLY POSSIBLE. THEY SHOULD ONLY IMPACT NECESSARY CODE RELEVANT TO THE TASK AND NOTHING ELSE. IT SHOULD IMPACT AS LITTLE CODE AS POSSIBLE. YOUR GOAL IS TO NOT INTRODUCE ANY BUGS. IT'S ALL ABOUT SIMPLICITY


CRITICAL: When debugging, you MUST trace through the ENTIRE code flow step by step. No assumptions. No shortcuts.