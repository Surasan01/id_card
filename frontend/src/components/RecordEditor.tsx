import { useEffect, useState } from 'react';

import type { GenerationRecord } from '../types';

type RecordEditorProps = {
  record: GenerationRecord | null;
  saving: boolean;
  onSave: (recordId: string, payload: Partial<GenerationRecord>) => Promise<void>;
};

export function RecordEditor({ record, saving, onSave }: RecordEditorProps) {
  const [draft, setDraft] = useState<Partial<GenerationRecord>>({});

  useEffect(() => {
    if (!record) {
      setDraft({});
      return;
    }
    setDraft({
      thai_prefix: record.thai_prefix,
      thai_first_name: record.thai_first_name,
      thai_last_name: record.thai_last_name,
      english_prefix: record.english_prefix,
      english_first_name: record.english_first_name,
      english_last_name: record.english_last_name,
      religion: record.religion,
      address: record.address,
      portrait_description: record.portrait_description,
      scene_description: record.scene_description,
      version: record.version,
    });
  }, [record]);

  if (!record) {
    return (
      <div className="card editor-card">
        <div className="editor-empty">
          <span className="empty-icon">{'\u270F\uFE0F'}</span>
          <p>Select a row to edit its details</p>
        </div>
      </div>
    );
  }

  const updateField = (field: keyof GenerationRecord, value: string | number) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className="card editor-card">
      <div className="card-header">
        <div className="card-title">
          <h2>Edit Record</h2>
          <span className="subtitle">{record.synthetic_id}</span>
        </div>
        <span className="badge badge-default">v{record.version}</span>
      </div>

      <div className="editor-grid">
        <div className="form-field">
          <label className="form-label">Thai prefix</label>
          <input className="form-input" value={String(draft.thai_prefix ?? '')} onChange={(event) => updateField('thai_prefix', event.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label">English prefix</label>
          <input className="form-input" value={String(draft.english_prefix ?? '')} onChange={(event) => updateField('english_prefix', event.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label">Thai first name</label>
          <input className="form-input" value={String(draft.thai_first_name ?? '')} onChange={(event) => updateField('thai_first_name', event.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label">English first name</label>
          <input className="form-input" value={String(draft.english_first_name ?? '')} onChange={(event) => updateField('english_first_name', event.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label">Thai last name</label>
          <input className="form-input" value={String(draft.thai_last_name ?? '')} onChange={(event) => updateField('thai_last_name', event.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label">English last name</label>
          <input className="form-input" value={String(draft.english_last_name ?? '')} onChange={(event) => updateField('english_last_name', event.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label">Religion</label>
          <input className="form-input" value={String(draft.religion ?? '')} onChange={(event) => updateField('religion', event.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label">Version</label>
          <input className="form-input" type="number" min={1} max={10} value={Number(draft.version ?? 1)} onChange={(event) => updateField('version', Number(event.target.value))} />
        </div>
        <div className="form-field full-width">
          <label className="form-label">Address</label>
          <textarea className="form-input" value={String(draft.address ?? '')} onChange={(event) => updateField('address', event.target.value)} rows={2} />
        </div>
        <div className="form-field full-width">
          <label className="form-label">Portrait description</label>
          <textarea className="form-input" value={String(draft.portrait_description ?? '')} onChange={(event) => updateField('portrait_description', event.target.value)} rows={2} />
        </div>
        <div className="form-field full-width">
          <label className="form-label">Scene description</label>
          <textarea className="form-input" value={String(draft.scene_description ?? '')} onChange={(event) => updateField('scene_description', event.target.value)} rows={3} />
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <button className="btn btn-primary" onClick={() => onSave(record.id, draft)} disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
