# AI Policy & Product Helper

A local-first RAG (Retrieval-Augmented Generation) system that answers company policy questions with citations. Built with FastAPI, Next.js, and Qdrant.

## Quick Start
```bash
cp .env.example .env
# Add your OpenRouter API key to .env
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/docs
- Qdrant UI: http://localhost:6333

## Architecture
```
User → Next.js (3000)
           ↓
       FastAPI (8000)
           ↓           ↓
      Qdrant (6333)  OpenRouter LLM
           ↑
     /data/*.md docs
```

1. **Ingest** — docs are split into chunks, embedded with `all-MiniLM-L6-v2`, stored in Qdrant
2. **Retrieve** — user query is embedded, top-k similar chunks fetched from Qdrant
3. **Generate** — GPT-4o-mini answers the query grounded in retrieved chunks with citations

## Setup

### With Docker (recommended)
```bash
cp .env.example .env        # copy env file
# edit .env and set OPENROUTER_API_KEY
docker compose up --build   # boots frontend + backend + qdrant
```

### Without Docker
```bash
# Backend
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --app-dir backend

# Frontend
cd frontend && npm install && npm run dev
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `LLM_PROVIDER` | `openrouter` | `openrouter` or `stub` |
| `OPENROUTER_API_KEY` | — | Required for real LLM responses |
| `LLM_MODEL` | `openai/gpt-4o-mini` | Any OpenRouter model string |
| `VECTOR_STORE` | `qdrant` | `qdrant` or `memory` |
| `CHUNK_SIZE` | `100` | Words per chunk |
| `CHUNK_OVERLAP` | `20` | Overlap between chunks |

## Running Tests
```bash
docker compose run --rm -e VECTOR_STORE=memory -e LLM_PROVIDER=stub backend pytest -v
```

All 10 tests should pass in under 5 seconds.

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check → `{"status":"ok"}` |
| `/api/metrics` | GET | Latency counters + model info |
| `/api/ingest` | POST | Ingest docs from `/data` folder |
| `/api/ask` | POST | RAG query with citations |

## Trade-offs & Decisions

- **Local embeddings** — uses `sentence-transformers/all-MiniLM-L6-v2` (CPU, 90MB) instead of OpenAI embeddings. Keeps the system fully local and free to run, with good semantic quality for policy docs.
- **Chunk size 100 words** — policy docs are short (20-50 words per section). Large chunks (700 words default) caused the same section to repeat. Smaller chunks give better retrieval precision.
- **Deterministic chunk IDs** — SHA1 hash of text content converted to UUID ensures the same chunk is never stored twice in Qdrant, even across multiple ingest calls.
- **CPU-only PyTorch** — avoids downloading 3GB of CUDA libraries since no GPU is available in the container.

## What I'd Ship Next

- **Streaming responses** — stream LLM tokens via SSE for faster perceived response time
- **Re-ranking with MMR** — Maximal Marginal Relevance to improve diversity of retrieved chunks
- **PDPA compliance** — mask IC numbers and addresses as noted in `Compliance_Notes.md`
- **Feedback logging** — thumbs up/down per answer to build an eval dataset
- **Upload via UI** — drag-and-drop doc ingestion instead of only reading from `/data`
- **Eval script** — automated accuracy check against known Q&A pairs