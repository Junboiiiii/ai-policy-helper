'use client';
import React from 'react';
import { apiIngest, apiMetrics } from '@/lib/api';

type Metrics = {
  total_docs?: number;
  total_chunks?: number;
  avg_retrieval_latency_ms?: number;
  avg_generation_latency_ms?: number;
  embedding_model?: string;
  llm_model?: string;
};

function MetricCard({ label, value, unit, color }: { label: string; value: string | number; unit?: string; color?: string }) {
  return (
    <div className="metric-card">
      <div className="metric-value" style={{ color: color || '#111' }}>
        {value}<span className="metric-unit">{unit}</span>
      </div>
      <div className="metric-label">{label}</div>
    </div>
  );
}

export default function AdminPanel() {
  const [metrics, setMetrics] = React.useState<Metrics | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [ingestResult, setIngestResult] = React.useState<{ docs: number; chunks: number } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const refresh = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const m = await apiMetrics();
      setMetrics(m);
    } catch (e: any) {
      if (!silent) setError('Failed to load metrics');
    } finally {
      setRefreshing(false);
    }
  };

  const ingest = async () => {
    setBusy(true);
    setError(null);
    setSuccessMsg(null);
    setIngestResult(null);
    try {
      const result = await apiIngest();
      setIngestResult({ docs: result.indexed_docs, chunks: result.indexed_chunks });
      setSuccessMsg(`Indexed ${result.indexed_docs} docs and ${result.indexed_chunks} chunks`);
      await refresh(true);
    } catch (e: any) {
      setError(e?.message || 'Ingestion failed. Check backend logs.');
    } finally {
      setBusy(false);
    }
  };

  React.useEffect(() => { refresh(true); }, []);

  return (
    <>
      <style>{`
        .admin-container { background: #fff; border: 1px solid #e8e8e8; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
        .admin-header { padding: 16px 20px; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; justify-content: space-between; }
        .admin-title { font-size: 14px; font-weight: 600; color: #111; letter-spacing: -0.01em; }
        .admin-subtitle { font-size: 12px; color: #999; }
        .admin-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
        .admin-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .btn-primary { padding: 9px 16px; background: #111; color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; letter-spacing: -0.01em; display: flex; align-items: center; gap: 6px; }
        .btn-primary:hover:not(:disabled) { background: #333; }
        .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
        .btn-secondary { padding: 9px 16px; background: #fff; color: #111; border: 1px solid #ddd; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; letter-spacing: -0.01em; display: flex; align-items: center; gap: 6px; }
        .btn-secondary:hover:not(:disabled) { background: #f5f5f5; border-color: #bbb; }
        .btn-secondary:disabled { opacity: 0.45; cursor: not-allowed; }
        .spinner { width: 12px; height: 12px; border: 2px solid currentColor; border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .success-banner { padding: 10px 14px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; font-size: 13px; color: #166534; display: flex; align-items: center; gap: 8px; animation: fadeUp 0.2s ease; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .error-banner { padding: 10px 14px; background: #fff5f5; border: 1px solid #fecaca; border-radius: 8px; font-size: 13px; color: #c0392b; display: flex; justify-content: space-between; align-items: center; }
        .error-banner button { background: none; border: none; color: #c0392b; cursor: pointer; font-size: 16px; line-height: 1; padding: 0; }
        .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .metric-card { padding: 12px 14px; background: #fafafa; border: 1px solid #f0f0f0; border-radius: 10px; }
        .metric-value { font-size: 22px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.1; }
        .metric-unit { font-size: 12px; font-weight: 400; color: #999; margin-left: 2px; }
        .metric-label { font-size: 11px; color: #999; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.04em; }
        .metrics-model { padding: 10px 14px; background: #f8f8f8; border: 1px solid #f0f0f0; border-radius: 10px; display: flex; flex-direction: column; gap: 5px; }
        .model-row { display: flex; justify-content: space-between; align-items: center; font-size: 12px; }
        .model-key { color: #999; }
        .model-value { color: #111; font-weight: 500; font-family: monospace; font-size: 11px; background: #efefef; padding: 2px 6px; border-radius: 4px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .metrics-loading { display: flex; align-items: center; gap: 8px; color: #bbb; font-size: 13px; padding: 8px 0; }
      `}</style>

      <div className="admin-container">
        <div className="admin-header">
          <div>
            <div className="admin-title">Admin Panel</div>
            <div className="admin-subtitle">Manage document ingestion and view system metrics</div>
          </div>
        </div>

        <div className="admin-body">
          <div className="admin-actions">
            <button className="btn-primary" onClick={ingest} disabled={busy}>
              {busy ? <><span className="spinner" /> Indexing…</> : '⬆ Ingest sample docs'}
            </button>
            <button className="btn-secondary" onClick={() => refresh()} disabled={refreshing}>
              {refreshing ? <><span className="spinner" /> Refreshing…</> : '↻ Refresh metrics'}
            </button>
          </div>

          {successMsg && (
            <div className="success-banner">
              ✓ {successMsg}
            </div>
          )}

          {error && (
            <div className="error-banner">
              <span>⚠ {error}</span>
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}

          {metrics ? (
            <>
              <div className="metrics-grid">
                <MetricCard
                  label="Documents"
                  value={metrics.total_docs ?? 0}
                  color="#111"
                />
                <MetricCard
                  label="Chunks"
                  value={metrics.total_chunks ?? 0}
                  color="#111"
                />
                <MetricCard
                  label="Retrieval"
                  value={metrics.avg_retrieval_latency_ms?.toFixed(1) ?? '—'}
                  unit="ms"
                  color={
                    (metrics.avg_retrieval_latency_ms ?? 0) > 100 ? '#e67e22' : '#16a34a'
                  }
                />
              </div>

              <div className="metrics-model">
                <div className="model-row">
                  <span className="model-key">Embedding model</span>
                  <span className="model-value">{metrics.embedding_model ?? '—'}</span>
                </div>
                <div className="model-row">
                  <span className="model-key">LLM model</span>
                  <span className="model-value">{metrics.llm_model ?? '—'}</span>
                </div>
                <div className="model-row">
                  <span className="model-key">Avg generation</span>
                  <span className="model-value">{metrics.avg_generation_latency_ms?.toFixed(0) ?? '—'} ms</span>
                </div>
              </div>
            </>
          ) : (
            <div className="metrics-loading">
              <span className="spinner" style={{ borderColor: '#ddd', borderTopColor: 'transparent' }} />
              Loading metrics…
            </div>
          )}
        </div>
      </div>
    </>
  );
}
