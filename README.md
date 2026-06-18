# LiteParse API

> REST API wrapper around [LiteParse](https://github.com/run-llama/liteparse) for document parsing — extract text and structured JSON with bounding boxes from PDFs, Office documents, and images.

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/lbrenman/liteparse-api)

## Overview

LiteParse is a fast, open-source document parser built on PDFium + Tesseract OCR. This project wraps it in a simple Express REST API so you can POST documents and receive parsed text or structured JSON — no cloud dependencies, everything runs locally.

**Supported input formats:** PDF, DOCX, DOC, PPTX, PPT, XLSX, XLS, JPEG, PNG, GIF, WEBP, TIFF

**Endpoints:**
- `POST /parse` — extract text or structured JSON (with bounding boxes) from a document
- `POST /parse/screenshot` — generate base64-encoded PNG screenshots per page (great for LLM vision)
- `GET /health` — health check (no auth)
- `GET /api-docs` — Swagger UI (no auth)

## Prerequisites

- Node.js 20+
- LibreOffice — required for DOCX/PPTX/XLSX → PDF conversion (`apt-get install libreoffice`)
- ImageMagick — required for image → PDF conversion (`apt-get install imagemagick`)

> In Codespaces, both are installed automatically by `postCreateCommand`.

## Quick Start

### Option A — Codespaces (recommended)

1. Click the **Open in GitHub Codespaces** badge above
2. Wait for setup to complete — it automatically installs Node deps, LibreOffice, ImageMagick, and copies `.env.example` → `.env`
3. Open a terminal and run:
   ```bash
   npm run dev
   ```
4. Browse API docs at `http://localhost:3000/api-docs`
5. Set your API key in `.env` (default is `changeme`)

### Option B — Local

```bash
# Install system deps (Ubuntu/Debian)
sudo apt-get install libreoffice imagemagick

# Or on macOS
brew install --cask libreoffice
brew install imagemagick

# Install Node deps
npm install

# Configure env
cp .env.example .env
# Edit .env and set API_KEY

# Start
npm run dev
```

### Option C — Docker

```bash
cp .env.example .env
# Edit .env and set API_KEY

docker compose -f docker-compose.full.yml up --build
```

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

All `/parse` endpoints require an API key:

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

### Parse a DOCX file

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

Response includes base64-encoded PNG per page:
```json
{
  "data": {
    "filename": "document.pdf",
    "page_count": 3,
    "pages": [
      { "page": 1, "format": "png", "data": "iVBORw0KGgo..." },
      { "page": 2, "format": "png", "data": "iVBORw0KGgo..." }
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
| `ocr_language` | string | No | `eng` | Tesseract language code |
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

## Notes on Office Documents

DOCX, PPTX, and XLSX files are first converted to PDF via LibreOffice before parsing. Make sure LibreOffice is installed. In Codespaces it's installed automatically.

## Development

```bash
npm run dev     # Start with nodemon (auto-restart on file changes)
npm start       # Start without nodemon
```
