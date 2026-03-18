import pytest

# ── Health & Metrics ──────────────────────────────────────────────

def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

def test_metrics_structure(client):
    r = client.get("/api/metrics")
    assert r.status_code == 200
    body = r.json()
    assert "total_chunks" in body
    assert "avg_retrieval_latency_ms" in body
    assert "avg_generation_latency_ms" in body
    assert "llm_model" in body

# ── Ingest ────────────────────────────────────────────────────────

def test_ingest_returns_counts(client):
    r = client.post("/api/ingest")
    assert r.status_code == 200
    body = r.json()
    assert "indexed_docs" in body
    assert "indexed_chunks" in body
    assert body["indexed_chunks"] > 0

def test_ingest_idempotent(client):
    r1 = client.post("/api/ingest")
    r2 = client.post("/api/ingest")
    assert r1.status_code == 200
    assert r2.status_code == 200
    # second ingest should not double the chunk count
    assert r2.json()["indexed_chunks"] == r1.json()["indexed_chunks"]

# ── Ask / RAG ─────────────────────────────────────────────────────

def test_ask_returns_required_fields(client):
    client.post("/api/ingest")
    r = client.post("/api/ask", json={"query": "What is the return policy?"})
    assert r.status_code == 200
    body = r.json()
    assert "answer" in body
    assert "citations" in body
    assert "chunks" in body
    assert isinstance(body["citations"], list)

def test_ask_citations_have_title_and_section(client):
    client.post("/api/ingest")
    r = client.post("/api/ask", json={"query": "What is the return policy?"})
    assert r.status_code == 200
    citations = r.json()["citations"]
    assert len(citations) > 0
    for c in citations:
        assert "title" in c
        assert "section" in c
        assert "text" in c

def test_ask_damaged_blender_cites_correct_docs(client):
    client.post("/api/ingest")
    r = client.post("/api/ask", json={
        "query": "Can a customer return a damaged blender after 20 days?"
    })
    assert r.status_code == 200
    titles = [c["title"] for c in r.json()["citations"]]
    assert any("Return" in t or "Refund" in t for t in titles), \
        f"Expected Returns doc in citations, got: {titles}"
    assert any("Warrant" in t for t in titles), \
        f"Expected Warranty doc in citations, got: {titles}"

def test_ask_east_malaysia_cites_shipping_doc(client):
    client.post("/api/ingest")
    r = client.post("/api/ask", json={
        "query": "What is the shipping SLA to East Malaysia for bulky items?"
    })
    assert r.status_code == 200
    titles = [c["title"] for c in r.json()["citations"]]
    assert any("Deliver" in t or "Shipping" in t for t in titles), \
        f"Expected Delivery doc in citations, got: {titles}"

def test_ask_empty_query_returns_400(client):
    r = client.post("/api/ask", json={"query": ""})
    assert r.status_code in (400, 422)

def test_ask_no_body_returns_422(client):
    r = client.post("/api/ask", json={})
    assert r.status_code == 422