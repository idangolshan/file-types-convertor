# AI-Powered File Converter

An intelligent browser-based image converter that uses AI to recommend optimal file formats and generate accessibility features.

## Features

- **Smart Format Conversion**: Convert between JPG, PNG, WebP, and GIF formats
- **AI-Powered Recommendations**: Get intelligent format suggestions based on image content
- **Alt Text Generation**: Automatically generate descriptive alt text for accessibility
- **Smart File Naming**: AI suggests meaningful filenames based on image content
- **Client-Side Processing**: All conversions happen in your browser - no uploads required
- **Beautiful UI**: Modern, gradient-based interface with drag-and-drop support
- **Real-Time Preview**: Side-by-side comparison of original and converted images

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