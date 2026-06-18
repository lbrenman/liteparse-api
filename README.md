# LiteParse API

> REST API wrapper around [LiteParse](https://github.com/run-llama/liteparse) for document parsing — extract text and structured JSON with bounding boxes from PDFs, Office documents, and images.

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/lbrenman/liteparse-api)

## Overview

LiteParse is a fast, open-source document parser built on PDFium + Tesseract OCR. This project wraps it in a simple Express REST API so you can POST documents and receive parsed text or structured JSON — no cloud dependencies, everything runs locally.

**Supported input formats:** PDF, DOCX, DOC, PPTX, PPT, XLSX, XLS, JPEG, PNG, GIF, WEBP, TIFF

**Endpoints:**
- `POST /parse` — extract text or structured JSON (with bounding boxes) from a document
- `POST /parse/screenshot` — generate base64-encoded PNG screenshots per page (useful for LLM vision)
- `GET /health` — health check (no auth)
- `GET /api-docs` — Swagger UI (no auth)

## Prerequisites

- Node.js 20+
- LibreOffice — required for DOCX/PPTX/XLSX → PDF conversion
- ImageMagick — required for image → PDF conversion

> In Codespaces, both are installed automatically by `postCreateCommand` in `.devcontainer/devcontainer.json`.

## Quick Start

### Option A — Codespaces (recommended)

1. Click the **Open in GitHub Codespaces** badge above
2. Wait for setup — `postCreateCommand` automatically runs:
   - `sudo apt-get update && sudo apt-get install -y libreoffice imagemagick`
   - `npm install`
   - Copies `.env.example` → `.env`
   - Creates `/tmp/liteparse-uploads/`
3. Open a terminal and run:
   ```bash
   npm run dev
   ```
4. Browse to `http://localhost:3000/api-docs` for the Swagger UI
5. Edit `.env` to set a strong `API_KEY` (default is `changeme`)

> **Note:** If you open the Codespace and `postCreateCommand` has not yet finished, wait for it to complete before running `npm run dev`.

### Option B — Local (Ubuntu/Debian)

```bash
# Install system dependencies
sudo apt-get update && sudo apt-get install -y libreoffice imagemagick

# Install Node dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and set API_KEY

# Create upload temp directory
mkdir -p /tmp/liteparse-uploads

# Start
npm run dev
```

### Option C — Local (macOS)

```bash
# Install system dependencies
brew install --cask libreoffice
brew install imagemagick

# Install Node dependencies
npm install

# Configure environment
cp .env.example .env

# Create upload temp directory
mkdir -p /tmp/liteparse-uploads

# Start
npm run dev
```

### Option D — Docker

```bash
cp .env.example .env
# Edit .env and set API_KEY

docker compose -f docker-compose.full.yml up --build
```

The Dockerfile installs LibreOffice and ImageMagick automatically.

## Troubleshooting: LibreOffice Install in Codespaces

The Codespace base image (`javascript-node:20`) uses a minimal Debian mirror that may not have `libreoffice` available without first running `apt-get update`. If you get `E: Unable to locate package libreoffice`, run:

```bash
sudo apt-get update && sudo apt-get install -y libreoffice imagemagick
```

This is handled automatically by `postCreateCommand` on first Codespace creation, but if you're setting up manually or the postCreate step failed, run it yourself.

> LibreOffice is a large package (~300MB). Installation takes 2–3 minutes in Codespaces.

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `3000` |
| `API_VERSION` | Version returned by /health | `1.0.0` |
| `AUTH_MODE` | `apikey` or `none` | `apikey` |
| `API_KEY` | API key required in `x-api-key` header | `changeme` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms | `900000` (15 min) |
| `RATE_LIMIT_MAX` | Max requests per window per IP | `100` |
| `MAX_FILE_SIZE_MB` | Maximum upload size in MB | `50` |

## Authentication

All `/parse` endpoints require an API key header:

```
x-api-key: your-api-key-here
```

Set `AUTH_MODE=none` in `.env` to disable auth during development.

The `/health` and `/api-docs` endpoints are always unauthenticated.

## API Endpoints

### Health
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | Service health check |

### Parse
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/parse` | Yes | Parse a document → text or JSON |
| POST | `/parse/screenshot` | Yes | Generate page screenshots → base64 PNG |

### Docs
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api-docs` | No | Swagger UI |

## Usage Examples

### Parse a PDF (text output)

```bash
curl -X POST http://localhost:3000/parse \
  -H "x-api-key: changeme" \
  -F "file=@document.pdf" \
  -F "format=text"
```

### Parse a PDF (structured JSON with bounding boxes)

```bash
curl -X POST http://localhost:3000/parse \
  -H "x-api-key: changeme" \
  -F "file=@document.pdf" \
  -F "format=json"
```

### Parse specific pages only

```bash
curl -X POST http://localhost:3000/parse \
  -H "x-api-key: changeme" \
  -F "file=@document.pdf" \
  -F "format=text" \
  -F "target_pages=1-3,5"
```

### Parse without OCR

```bash
curl -X POST http://localhost:3000/parse \
  -H "x-api-key: changeme" \
  -F "file=@document.pdf" \
  -F "no_ocr=true"
```

### Parse a DOCX file (requires LibreOffice)

```bash
curl -X POST http://localhost:3000/parse \
  -H "x-api-key: changeme" \
  -F "file=@report.docx" \
  -F "format=text"
```

### Generate screenshots

```bash
curl -X POST http://localhost:3000/parse/screenshot \
  -H "x-api-key: changeme" \
  -F "file=@document.pdf" \
  -F "dpi=200"
```

Response:
```json
{
  "data": {
    "filename": "document.pdf",
    "page_count": 3,
    "pages": [
      { "page": 1, "width": 1224, "height": 1584, "format": "png", "data": "iVBORw0KGgo..." },
      { "page": 2, "width": 1224, "height": 1584, "format": "png", "data": "iVBORw0KGgo..." }
    ]
  }
}
```

## Form Parameters — POST /parse

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `file` | file | Yes | — | Document to parse |
| `format` | string | No | `text` | `text` or `json` |
| `no_ocr` | string | No | `false` | Set `true` to disable OCR |
| `ocr_language` | string | No | `eng` | Tesseract language code (e.g. `fra`, `deu`) |
| `max_pages` | integer | No | `1000` | Max pages to parse |
| `target_pages` | string | No | all | Page range e.g. `1-5,10` |
| `password` | string | No | — | Password for encrypted PDFs |

## Form Parameters — POST /parse/screenshot

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `file` | file | Yes | — | PDF to screenshot |
| `target_pages` | string | No | all | Pages e.g. `1,3,5` |
| `dpi` | integer | No | `150` | Rendering DPI |
| `password` | string | No | — | Password for encrypted PDFs |

## Project Structure

```
liteparse-api/
├── .devcontainer/
│   └── devcontainer.json      # Codespaces config — installs LibreOffice + ImageMagick
├── src/
│   ├── index.js               # Entry point
│   ├── app.js                 # Express app setup
│   ├── routes/
│   │   ├── health.js          # GET /health
│   │   ├── apidocs.js         # GET /api-docs (Swagger UI)
│   │   └── parse.js           # POST /parse, POST /parse/screenshot
│   ├── controllers/
│   │   └── parse.js           # LiteParse integration logic
│   └── middleware/
│       └── auth.js            # API key auth
├── openapi.yaml               # OpenAPI 3.0 spec
├── Dockerfile                 # Includes LibreOffice + ImageMagick
├── docker-compose.full.yml    # Full stack for local Docker use
├── .env.example
├── .gitignore
├── package.json               # type: "module" (ESM) — required by @llamaindex/liteparse
└── README.md
```

## Notes

**ESM only:** The `@llamaindex/liteparse` package is ESM-only (`"type": "module"`). This project is configured accordingly — all source files use `import`/`export` syntax.

**Tesseract is bundled:** OCR works out of the box with no extra setup. LibreOffice and ImageMagick are only needed for non-PDF input formats.

## Development

```bash
npm run dev    # Start with nodemon (auto-restart on changes)
npm start      # Start without nodemon
```
