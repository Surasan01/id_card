import { useEffect, useState } from 'react';

import { buildDownloadUrl, fetchAllAssets } from '../api';
import type { GeneratedAsset } from '../types';

const PAGE_SIZE = 48;

export function GalleryPanel() {
  const [assets, setAssets] = useState<GeneratedAsset[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lightboxAsset, setLightboxAsset] = useState<GeneratedAsset | null>(null);

  useEffect(() => {
    void load(0);
  }, []);

  async function load(nextSkip: number) {
    setLoading(true);
    setError('');
    try {
      const result = await fetchAllAssets(nextSkip, PAGE_SIZE);
      if (nextSkip === 0) {
        setAssets(result.items);
      } else {
        setAssets((prev) => [...prev, ...result.items]);
      }
      setTotal(result.total);
      setSkip(nextSkip + result.items.length);
    } catch {
      setError('Failed to load images.');
    } finally {
      setLoading(false);
    }
  }

  const hasMore = assets.length < total;

  return (
    <div className="gallery-layout">
      {total > 0 && (
        <div className="downloads-bar">
          <span className="download-label">{'\uD83D\uDCE5'} Download all {total} images</span>
          <a href={buildDownloadUrl('/downloads/all/metadata.csv')} target="_blank" rel="noreferrer">
            CSV
          </a>
          <a href={buildDownloadUrl('/downloads/all/images.zip')} target="_blank" rel="noreferrer">
            Images ZIP
          </a>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <h2>Image Gallery</h2>
            <span className="subtitle">{total} total images</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => void load(0)} disabled={loading}>
            Refresh
          </button>
        </div>

        {error ? <div className="error-banner">{error}</div> : null}

        {assets.length === 0 && !loading ? (
          <div className="empty-state">
            <span className="empty-icon">{'\uD83D\uDDBC\uFE0F'}</span>
            No images generated yet.
          </div>
        ) : (
          <>
            <div className="gallery-grid">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  className="gallery-card"
                  onClick={() => setLightboxAsset(asset)}
                  title={asset.file_name}
                >
                  <img
                    src={buildDownloadUrl(`/downloads/assets/${asset.id}`)}
                    alt={asset.file_name}
                    className="gallery-card-img"
                    loading="lazy"
                  />
                  <div className="gallery-card-meta">
                    <span className="gallery-card-name">{asset.file_name}</span>
                    <span className="gallery-card-date">{new Date(asset.created_at).toLocaleDateString()}</span>
                  </div>
                </button>
              ))}
            </div>

            {hasMore && (
              <div className="gallery-load-more">
                <button className="btn btn-secondary" onClick={() => void load(skip)} disabled={loading}>
                  {loading ? 'Loading…' : `Load more (${total - assets.length} remaining)`}
                </button>
              </div>
            )}

            {loading && assets.length === 0 && (
              <div className="gallery-loading">Loading images…</div>
            )}
          </>
        )}
      </div>

      {lightboxAsset && (
        <div className="lightbox-overlay" onClick={() => setLightboxAsset(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={buildDownloadUrl(`/downloads/assets/${lightboxAsset.id}`)}
              alt={lightboxAsset.file_name}
              className="lightbox-img"
            />
            <div className="lightbox-info">
              <p className="lightbox-filename">{lightboxAsset.file_name}</p>
              <p className="lightbox-prompt">{lightboxAsset.prompt}</p>
              <div className="lightbox-meta-row">
                <span>Batch: {lightboxAsset.batch_id.slice(0, 8)}</span>
                <span>Job: {lightboxAsset.job_id.slice(0, 8)}</span>
                <span>{new Date(lightboxAsset.created_at).toLocaleString()}</span>
              </div>
              <a
                className="btn btn-secondary btn-sm"
                href={buildDownloadUrl(`/downloads/assets/${lightboxAsset.id}`)}
                download={lightboxAsset.file_name}
              >
                Download
              </a>
            </div>
            <button className="lightbox-close" onClick={() => setLightboxAsset(null)}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
