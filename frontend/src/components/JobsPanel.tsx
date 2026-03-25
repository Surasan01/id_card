import { useState } from 'react';

import { buildDownloadUrl, fetchJobAssets } from '../api';
import type { GeneratedAsset, GenerationBatch, GenerationJob } from '../types';

type JobsPanelProps = {
  jobs: GenerationJob[];
  activeBatch: GenerationBatch | null;
  onRefresh: () => void;
};

export function JobsPanel({ jobs, activeBatch, onRefresh }: JobsPanelProps) {
  return (
    <div className="jobs-layout">
      {activeBatch ? (
        <div className="downloads-bar">
          <span className="download-label">{'\uD83D\uDCE5'} Downloads for batch {activeBatch.id.slice(0, 8)}</span>
          <a href={buildDownloadUrl(`/downloads/batches/${activeBatch.id}/metadata.csv`)} target="_blank" rel="noreferrer">
            CSV
          </a>
          <a href={buildDownloadUrl(`/downloads/batches/${activeBatch.id}/metadata.json`)} target="_blank" rel="noreferrer">
            JSON
          </a>
          <a href={buildDownloadUrl(`/downloads/batches/${activeBatch.id}/images.zip`)} target="_blank" rel="noreferrer">
            Images ZIP
          </a>
        </div>
      ) : null}

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <h2>Generation Jobs</h2>
            <span className="subtitle">{jobs.length} total jobs</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onRefresh}>
            Refresh
          </button>
        </div>

        {jobs.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">{'\u26A1'}</span>
            No jobs yet. Select records and generate to start.
          </div>
        ) : (
          <div className="jobs-grid">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function JobCard({ job }: { job: GenerationJob }) {
  const [expanded, setExpanded] = useState(false);
  const [imagesOpen, setImagesOpen] = useState(false);
  const [assets, setAssets] = useState<GeneratedAsset[] | null>(null);
  const [loadingImages, setLoadingImages] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const pct = job.total_items > 0 ? Math.round((job.completed_items / job.total_items) * 100) : 0;
  const isDone = job.status === 'completed' || job.status === 'completed_with_errors';
  const isFailed = job.status === 'failed';

  async function toggleImages() {
    if (imagesOpen) {
      setImagesOpen(false);
      return;
    }
    setImagesOpen(true);
    if (assets !== null) return;
    setLoadingImages(true);
    try {
      const result = await fetchJobAssets(job.id);
      setAssets(result);
    } finally {
      setLoadingImages(false);
    }
  }

  return (
    <article className="job-card">
      <div className="job-card-header">
        <span className="job-id">{job.id.slice(0, 8)}</span>
        <span className={`status-pill ${job.status}`}>{job.status}</span>
      </div>

      <div className="job-progress">
        <div className="progress-bar">
          <div
            className={`progress-fill${isDone ? ' done' : ''}${isFailed ? ' error' : ''}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="job-progress-text">
          <span>{job.completed_items}/{job.total_items} items</span>
          <span>{pct}%</span>
        </div>
      </div>

      <p className="job-meta">Batch: {job.batch_id.slice(0, 8)}</p>

      {job.error ? <div className="job-error">{job.error}</div> : null}

      <div className="job-actions-row">
        {job.items.length > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Hide items' : `Show ${job.items.length} items`}
          </button>
        )}
        {job.completed_items > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={() => void toggleImages()}>
            {'\uD83D\uDDBC\uFE0F'} {imagesOpen ? 'Hide images' : `Images (${job.completed_items})`}
          </button>
        )}
      </div>

      {expanded && (
        <ul className="job-items-list">
          {job.items.map((item) => (
            <li key={item.id}>
              <span className="item-id">{item.record_id.slice(0, 8)}</span>
              <span className={`status-pill ${item.status}`}>{item.status}</span>
            </li>
          ))}
        </ul>
      )}

      {imagesOpen && (
        <div className="job-image-gallery">
          {loadingImages ? (
            <div className="gallery-loading">Loading images…</div>
          ) : assets && assets.length > 0 ? (
            <div className="gallery-thumb-grid">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  className="gallery-thumb-btn"
                  onClick={() => setLightboxSrc(buildDownloadUrl(`/downloads/assets/${asset.id}`))}
                  title={asset.file_name}
                >
                  <img
                    src={buildDownloadUrl(`/downloads/assets/${asset.id}`)}
                    alt={asset.file_name}
                    className="gallery-thumb-img"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="gallery-empty">No images yet</div>
          )}
        </div>
      )}

      {lightboxSrc && (
        <div className="lightbox-overlay" onClick={() => setLightboxSrc(null)}>
          <img src={lightboxSrc} alt="Preview" className="lightbox-img" />
          <button className="lightbox-close" onClick={() => setLightboxSrc(null)}>✕</button>
        </div>
      )}
    </article>
  );
}
