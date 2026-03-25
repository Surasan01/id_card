import { startTransition, useEffect, useState } from 'react';

import {
  ApiError,
  buildDownloadUrl,
  createBatch,
  createJob,
  fetchBatch,
  fetchBatches,
  fetchCatalogOptions,
  fetchJobs,
  fetchSession,
  getApiBaseUrl,
  login,
  logout,
  setServerUrlOverride,
  updateBatchSelection,
  updateRecord,
} from './api';
import { BatchBuilder } from './components/BatchBuilder';
import { GalleryPanel } from './components/GalleryPanel';
import { JobsPanel } from './components/JobsPanel';
import { LoginCard } from './components/LoginCard';
import { RecordEditor } from './components/RecordEditor';
import { RecordTable } from './components/RecordTable';
import type { BatchCreateRequest, CatalogOptions, GenerationBatch, GenerationBatchSummary, GenerationJob, GenerationRecord } from './types';

type TabId = 'create' | 'records' | 'jobs' | 'gallery' | 'settings';

const defaultBatchForm: BatchCreateRequest = {
  count: 6,
  versions: [],
  province_ids: [],
  scene_template_ids: [],
  use_llm: true,
};

export default function App() {
  const [accessCode, setAccessCode] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [catalogs, setCatalogs] = useState<CatalogOptions | null>(null);
  const [batches, setBatches] = useState<GenerationBatchSummary[]>([]);
  const [activeBatch, setActiveBatch] = useState<GenerationBatch | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [batchForm, setBatchForm] = useState<BatchCreateRequest>(defaultBatchForm);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingBatch, setLoadingBatch] = useState(false);
  const [savingRecord, setSavingRecord] = useState(false);
  const [submittingJob, setSubmittingJob] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('Waiting for input');
  const [activeTab, setActiveTab] = useState<TabId>('create');

  const selectedRecord = activeBatch?.records.find((record) => record.id === selectedRecordId) ?? null;

  useEffect(() => {
    setServerUrlOverride('');
    void bootstrap();
  }, []);

  useEffect(() => {
    if (!authenticated) {
      return undefined;
    }
    const hasRunningJob = jobs.some((job) => ['queued', 'running'].includes(job.status));
    if (!hasRunningJob) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      void refreshJobs();
      if (activeBatch) {
        void loadBatch(activeBatch.id);
      }
    }, 1500);
    return () => window.clearInterval(timer);
  }, [authenticated, jobs, activeBatch]);

  async function bootstrap() {
    try {
      const session = await fetchSession();
      if (!session.authenticated) {
        resetWorkspaceState();
        setAuthenticated(false);
        setStatusMessage('Ready');
        return;
      }
      setAuthenticated(true);
      await loadDashboard();
    } catch (error) {
      if (error instanceof ApiError) {
        setAuthenticated(true);
        setErrorMessage(readError(error));
        setStatusMessage('Connected, but dashboard loading failed');
      } else {
        resetWorkspaceState();
        setErrorMessage(readError(error));
        setStatusMessage('Cannot reach backend');
      }
    } finally {
      setSessionLoading(false);
    }
  }

  async function loadDashboard() {
    const [catalogsResult, batchesResult, jobsResult] = await Promise.allSettled([
      fetchCatalogOptions(),
      fetchBatches(),
      fetchJobs(),
    ]);

    const nextCatalogs = catalogsResult.status === 'fulfilled' ? catalogsResult.value : null;
    const nextBatches = batchesResult.status === 'fulfilled' ? batchesResult.value : [];
    const nextJobs = jobsResult.status === 'fulfilled' ? jobsResult.value : [];

    startTransition(() => {
      setCatalogs(nextCatalogs);
      setBatches(nextBatches);
      setJobs(nextJobs);
    });

    const failures = [catalogsResult, batchesResult, jobsResult]
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map((result) => readError(result.reason));

    if (failures.length > 0) {
      setErrorMessage(failures.join(' | '));
      setStatusMessage('Connected with partial data');
    } else {
      setErrorMessage('');
    }

    if (nextBatches[0]) {
      await loadBatch(nextBatches[0].id);
    }
  }

  async function loadBatch(batchId: string) {
    const batch = await fetchBatch(batchId);
    startTransition(() => {
      setActiveBatch(batch);
      setSelectedRecordId((current) => current ?? batch.records[0]?.id ?? null);
    });
  }

  async function refreshJobs() {
    const nextJobs = await fetchJobs();
    startTransition(() => setJobs(nextJobs));
  }

  function resetWorkspaceState() {
    setCatalogs(null);
    setBatches([]);
    setActiveBatch(null);
    setJobs([]);
    setSelectedRecordId(null);
  }

  async function handleLogin() {
    setLoadingLogin(true);
    setErrorMessage('');
    try {
      await login(accessCode);
      setAuthenticated(true);
      setStatusMessage('Session opened');
      await loadDashboard();
    } catch (error) {
      setErrorMessage(readError(error));
      setStatusMessage('Connected, but dashboard loading failed');
    } finally {
      setLoadingLogin(false);
      setSessionLoading(false);
    }
  }

  async function handleLogout() {
    await logout();
    resetWorkspaceState();
    setAuthenticated(false);
    setAccessCode('');
    setStatusMessage('Ready');
  }

  async function handleCreateBatch() {
    setLoadingBatch(true);
    setErrorMessage('');
    try {
      const batch = await createBatch(batchForm);
      startTransition(() => {
        setActiveBatch(batch);
        setSelectedRecordId(batch.records[0]?.id ?? null);
      });
      setBatches(await fetchBatches());
      setStatusMessage(`Created batch with ${batch.records.length} records`);
      setActiveTab('records');
    } catch (error) {
      setErrorMessage(readError(error));
    } finally {
      setLoadingBatch(false);
    }
  }

  async function handleSaveRecord(recordId: string, payload: Partial<GenerationRecord>) {
    setSavingRecord(true);
    setErrorMessage('');
    try {
      const updatedRecord = await updateRecord(recordId, payload);
      if (!activeBatch) {
        return;
      }
      startTransition(() => {
        setActiveBatch({
          ...activeBatch,
          records: activeBatch.records.map((record) => (record.id === updatedRecord.id ? updatedRecord : record)),
        });
      });
      setStatusMessage(`Saved record ${updatedRecord.synthetic_id}`);
    } catch (error) {
      setErrorMessage(readError(error));
    } finally {
      setSavingRecord(false);
    }
  }

  async function handleToggleRecord(record: GenerationRecord) {
    await handleSaveRecord(record.id, { selected_for_generation: !record.selected_for_generation });
    if (activeBatch) {
      await loadBatch(activeBatch.id);
    }
  }

  async function handleSelectAll() {
    if (!activeBatch) {
      return;
    }
    const updatedBatch = await updateBatchSelection(activeBatch.id, activeBatch.records.map((record) => record.id));
    startTransition(() => setActiveBatch(updatedBatch));
  }

  async function handleClearSelection() {
    if (!activeBatch) {
      return;
    }
    const updatedBatch = await updateBatchSelection(activeBatch.id, []);
    startTransition(() => setActiveBatch(updatedBatch));
  }

  async function handleGenerateSelected() {
    if (!activeBatch) {
      return;
    }
    setSubmittingJob(true);
    setErrorMessage('');
    try {
      const selectedIds = activeBatch.records.filter((record) => record.selected_for_generation).map((record) => record.id);
      const job = await createJob(activeBatch.id, selectedIds);
      setJobs((current) => [job, ...current]);
      setStatusMessage(`Queued ${job.total_items} selected records`);
      await loadBatch(activeBatch.id);
    } catch (error) {
      setErrorMessage(readError(error));
    } finally {
      setSubmittingJob(false);
    }
  }

  if (sessionLoading) {
    return <div className="loading-screen">Loading workspace...</div>;
  }

  if (!authenticated) {
    return (
      <div className="login-page">
        <LoginCard
          accessCode={accessCode}
          loading={loadingLogin}
          error={errorMessage}
          onAccessCodeChange={setAccessCode}
          onSubmit={handleLogin}
        />
      </div>
    );
  }

  const runningJobCount = jobs.filter((j) => ['queued', 'running'].includes(j.status)).length;

  const tabs: { id: TabId; icon: string; label: string; badge?: number }[] = [
    { id: 'create', icon: '\u2795', label: 'Create' },
    { id: 'records', icon: '\uD83D\uDCCB', label: 'Records', badge: activeBatch?.records.length },
    { id: 'jobs', icon: '\u26A1', label: 'Jobs', badge: runningJobCount || undefined },
    { id: 'gallery', icon: '\uD83D\uDDBC\uFE0F', label: 'Gallery' },
    { id: 'settings', icon: '\u2699\uFE0F', label: 'Settings' },
  ];

  return (
    <div className="app-layout">
      <header className="topbar">
        <div className="topbar-brand">
          <span className="brand-dot" />
          Thai ID Card Platform
        </div>

        <nav className="tab-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge ? <span className="tab-badge">{tab.badge}</span> : null}
            </button>
          ))}
        </nav>

        <div className="topbar-actions">
          <span className="topbar-status">{statusMessage}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => void handleLogout()}>Logout</button>
        </div>
      </header>

      <div className="content-area">
        {errorMessage ? <div className="error-banner global-error">{errorMessage}</div> : null}

        {activeTab === 'create' && (
          <div className="create-layout">
            <BatchBuilder catalogs={catalogs} form={batchForm} loading={loadingBatch} onChange={setBatchForm} onSubmit={handleCreateBatch} />
            <div className="batch-sidebar">
              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <h2>Batch History</h2>
                    <span className="subtitle">{batches.length} batches</span>
                  </div>
                </div>
                {batches.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">{'\uD83D\uDCE6'}</span>
                    No batches yet
                  </div>
                ) : (
                  <div className="batch-list">
                    {batches.map((batch) => (
                      <button
                        key={batch.id}
                        className={`batch-item${activeBatch?.id === batch.id ? ' active' : ''}`}
                        onClick={() => { void loadBatch(batch.id); setActiveTab('records'); }}
                      >
                        <span className="batch-id">{batch.id.slice(0, 8)}</span>
                        <span className="batch-meta">{batch.record_count} rows &middot; {batch.selected_count} selected</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'records' && (
          <div className="records-layout">
            <RecordTable
              batch={activeBatch}
              selectedRecordId={selectedRecordId}
              onSelectRecord={(record) => setSelectedRecordId(record.id)}
              onToggleRecord={(record) => void handleToggleRecord(record)}
              onSelectAll={() => void handleSelectAll()}
              onClearSelection={() => void handleClearSelection()}
              onGenerateSelected={() => void handleGenerateSelected()}
              busy={submittingJob || savingRecord}
            />
            <RecordEditor record={selectedRecord} saving={savingRecord} onSave={handleSaveRecord} />
          </div>
        )}

        {activeTab === 'jobs' && (
          <JobsPanel jobs={jobs} activeBatch={activeBatch} onRefresh={() => void refreshJobs()} />
        )}

        {activeTab === 'gallery' && (
          <GalleryPanel />
        )}

        {activeTab === 'settings' && (
          <div className="settings-layout">
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <h2>API Health</h2>
                  <span className="subtitle">Check the backend status</span>
                </div>
              </div>
              <a className="btn btn-secondary btn-sm" href={buildDownloadUrl('/health')} target="_blank" rel="noreferrer">
                Open /health endpoint
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function readError(error: unknown) {
  if (error instanceof ApiError) {
    return `${error.method} ${error.path} failed (${error.status}): ${error.message}`;
  }
  if (error instanceof TypeError) {
    return 'Cannot reach the backend server. Please try again later.';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unexpected error';
}
