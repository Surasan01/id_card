import type { CatalogOptions, BatchCreateRequest } from '../types';

type BatchBuilderProps = {
  catalogs: CatalogOptions | null;
  form: BatchCreateRequest;
  loading: boolean;
  onChange: (next: BatchCreateRequest) => void;
  onSubmit: () => void;
};

function toggleNumberInList(values: number[], value: number) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function BatchBuilder({ catalogs, form, loading, onChange, onSubmit }: BatchBuilderProps) {
  const provinces = catalogs?.provinces ?? [];
  const sceneTemplates = catalogs?.scene_templates ?? [];

  return (
    <div className="card builder-form">
      <div className="card-header">
        <div className="card-title">
          <h2>New Batch</h2>
          <span className="subtitle">Configure and generate draft records</span>
        </div>
        <span className={`badge ${catalogs ? 'badge-success' : 'badge-default'}`}>
          {catalogs ? 'Ready' : 'Loading...'}
        </span>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label className="form-label">Number of cases</label>
          <input
            className="form-input"
            type="number"
            min={1}
            max={100}
            value={form.count}
            onChange={(event) => onChange({ ...form, count: Number(event.target.value) || 1 })}
          />
        </div>
        <div className="form-field" style={{ justifyContent: 'flex-end' }}>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={form.use_llm}
              onChange={(event) => onChange({ ...form, use_llm: event.target.checked })}
            />
            <span>Use Lightning LLM</span>
          </label>
        </div>
      </div>

      <div className="chip-section">
        <h3>Template versions</h3>
        <div className="chip-grid">
          {(catalogs?.versions ?? []).map((version) => (
            <button
              type="button"
              className={`chip${form.versions.includes(version) ? ' active' : ''}`}
              key={version}
              onClick={() => onChange({ ...form, versions: toggleNumberInList(form.versions, version) })}
            >
              v{version}
            </button>
          ))}
        </div>
      </div>

      <div className="form-row">
        <div className="chip-section">
          <h3>Scene styles</h3>
          <div className="option-grid">
            {sceneTemplates.slice(0, 12).map((scene) => (
              <label
                key={scene.id}
                className={`option-item${form.scene_template_ids.includes(scene.id) ? ' selected' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={form.scene_template_ids.includes(scene.id)}
                  onChange={() =>
                    onChange({
                      ...form,
                      scene_template_ids: toggleNumberInList(form.scene_template_ids, scene.id),
                    })
                  }
                />
                <div className="option-text">
                  <strong>{scene.device_type} &middot; {scene.placement_type}</strong>
                  <small>{scene.description}</small>
                </div>
              </label>
            ))}
          </div>
        </div>
        <div className="chip-section">
          <h3>Province filters</h3>
          <div className="option-grid two-col">
            {provinces.slice(0, 18).map((province) => (
              <label
                key={province.id}
                className={`option-item${form.province_ids.includes(province.id) ? ' selected' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={form.province_ids.includes(province.id)}
                  onChange={() =>
                    onChange({
                      ...form,
                      province_ids: toggleNumberInList(form.province_ids, province.id),
                    })
                  }
                />
                <div className="option-text">
                  <strong>{province.name}</strong>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="card-actions" style={{ marginTop: 4 }}>
        <button className="btn btn-primary" onClick={onSubmit} disabled={loading || !catalogs}>
          {loading ? 'Creating...' : 'Create draft batch'}
        </button>
        <button className="btn btn-ghost" onClick={() => onChange({ count: 6, versions: [], province_ids: [], scene_template_ids: [], use_llm: true })}>
          Reset filters
        </button>
      </div>
    </div>
  );
}
