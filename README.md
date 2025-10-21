# AI-Powered File Converter

An intelligent browser-based image converter that uses AI to recommend optimal file formats, generate accessibility features, and export to PDF documents.

## Features

- **Smart Format Conversion**: Convert between JPG, PNG, WebP, GIF formats, or export to PDF
- **PDF Export**: Convert images to professional PDF documents with configurable page sizes and orientations
- **AI-Powered Recommendations**: Get intelligent format suggestions based on image content
- **Alt Text Generation**: Automatically generate descriptive alt text for accessibility
- **Smart File Naming**: AI suggests meaningful filenames based on image content
- **Client-Side Processing**: All conversions happen in your browser - no uploads required
- **Beautiful UI**: Modern, gradient-based interface with drag-and-drop support
- **Real-Time Preview**: Side-by-side comparison of original and converted images (including PDF preview)

## Screenshot

<img width="1657" height="866" alt="Image" src="https://github.com/user-attachments/assets/d4ebdf39-33e3-4c75-90a8-0953dad5f47b" />

## Setup

### Prerequisites

- Node.js 24+ (required for Tailwind CSS v4)
- OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)

### Installation

```sh
# Clone the repository
git clone https://github.com/idangolshan/file-types-convertor.git
cd file-types-convertor

# Install dependencies
npm install

# Configure AI features (optional)
cp .env.example .env
# Edit .env and add your OpenAI API key:
# VITE_OPENAI_API_KEY=sk-...
```

### Running the App

```sh
# Start development server
npm run dev

# The app will be available at http://localhost:5175
```

## AI Features Setup

The app works without an API key, but to enable AI-powered recommendations:

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Copy `.env.example` to `.env`
3. Add your key: `VITE_OPENAI_API_KEY=sk-...`
4. Restart the dev server

AI features include:
- Format recommendations based on image characteristics
- Reasoning for suggested formats
- Alternative format options
- Accessibility-focused alt text
- SEO-friendly filename suggestions

## PDF Conversion

Convert any image to a professional PDF document with flexible layout options.

### Supported Input Formats
- JPEG/JPG
- PNG (preserves transparency)
- WebP
- GIF (converts to static image)
- BMP

### Page Size Options
- **Original Image Size**: PDF page matches image dimensions
- **A4 Paper**: Standard A4 size (210mm × 297mm / 8.27" × 11.69")
  - Portrait orientation (default)
  - Landscape orientation

### Features
- **Automatic Scaling**: Images are automatically scaled to fit the page while maintaining aspect ratio
- **Center Alignment**: Images are centered on the page for professional appearance
- **Quality Control**: Configurable image quality (default: 0.92 for optimal balance)
- **File Size Limit**: Maximum 100MB input file size to ensure browser stability
- **Browser-Based**: All PDF generation happens client-side using pdf-lib
- **Preview Support**: View PDF inline before downloading

### Technical Details
- Uses `pdf-lib` for client-side PDF generation
- For WebP/GIF/BMP: Images are converted to PNG via canvas before embedding
- PNG and JPEG images are embedded directly for best quality
- No server required - complete privacy and security

## Tech Stack

This project is built with modern web technologies:

- **Framework**: [SvelteKit 2](https://kit.svelte.dev/) with Svelte 5 (using new runes syntax)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Build Tool**: [Vite 7](https://vitejs.dev/)
- **Image Conversion**: Canvas API (browser-native)
- **PDF Generation**: [pdf-lib](https://pdf-lib.js.org/) - Client-side PDF creation
- **AI Integration**: [OpenAI API](https://platform.openai.com/) (GPT-4o with vision)
- **Language**: TypeScript
- **Node Version**: Requires Node 24+

### Key Dependencies
- `pdf-lib`: PDF document creation and manipulation
- `openai`: AI-powered format recommendations and alt text generation

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Author:
[Idan Golshan](https://github.com/idangolshan)