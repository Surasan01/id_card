import type { GenerationBatch, GenerationRecord } from '../types';

type RecordTableProps = {
  batch: GenerationBatch | null;
  selectedRecordId: string | null;
  onSelectRecord: (record: GenerationRecord) => void;
  onToggleRecord: (record: GenerationRecord) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onGenerateSelected: () => void;
  busy: boolean;
};

export function RecordTable({
  batch,
  selectedRecordId,
  onSelectRecord,
  onToggleRecord,
  onSelectAll,
  onClearSelection,
  onGenerateSelected,
  busy,
}: RecordTableProps) {
  const records = batch?.records ?? [];

  if (!batch) {
    return (
      <div className="card">
        <div className="empty-state">
          <span className="empty-icon">{'\uD83D\uDCCB'}</span>
          No batch selected. Create or select a batch first.
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <h2>Records</h2>
          <span className="subtitle">Batch {batch.id.slice(0, 8)} &middot; {records.length} rows</span>
        </div>
        <span className="badge badge-primary">{batch.selected_count} selected</span>
      </div>

      <div className="table-toolbar">
        <button className="btn btn-ghost btn-sm" onClick={onSelectAll} disabled={busy}>
          Select all
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onClearSelection} disabled={busy}>
          Clear
        </button>
        <button className="btn btn-primary btn-sm" onClick={onGenerateSelected} disabled={!batch.selected_count || busy}>
          {'\u26A1'} Generate ({batch.selected_count})
        </button>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th style={{ width: 40 }}></th>
              <th>ID</th>
              <th>Thai name</th>
              <th>English name</th>
              <th>Ver</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => {
              const isEditing = selectedRecordId === record.id;
              return (
                <tr key={record.id} className={isEditing ? 'selected-row' : ''} onClick={() => onSelectRecord(record)} style={{ cursor: 'pointer' }}>
                  <td>
                    <input
                      type="checkbox"
                      checked={record.selected_for_generation}
                      onChange={(event) => {
                        event.stopPropagation();
                        onToggleRecord(record);
                      }}
                    />
                  </td>
                  <td className="cell-id">{record.synthetic_id}</td>
                  <td className="cell-name">{`${record.thai_prefix} ${record.thai_first_name} ${record.thai_last_name}`}</td>
                  <td className="cell-name-secondary">{`${record.english_prefix} ${record.english_first_name} ${record.english_last_name}`}</td>
                  <td className="cell-version">v{record.version}</td>
                  <td>
                    <span className={`status-pill ${record.generation_status}`}>{record.generation_status}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
