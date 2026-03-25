type LoginCardProps = {
  accessCode: string;
  loading: boolean;
  error: string;
  onAccessCodeChange: (value: string) => void;
  onSubmit: () => void;
};

export function LoginCard({
  accessCode,
  loading,
  error,
  onAccessCodeChange,
  onSubmit,
}: LoginCardProps) {
  return (
    <div className="login-container">
      <div className="login-brand">
        <div className="brand-icon">{'\uD83C\uDFB4'}</div>
        <h1>Thai ID Card Platform</h1>
        <p>Enter access code to unlock the admin workspace</p>
      </div>

      <div className="login-card">
        <div className="form-field">
          <label className="form-label">Access code</label>
          <input
            className="form-input"
            type="password"
            value={accessCode}
            onChange={(event) => onAccessCodeChange(event.target.value)}
            placeholder="Enter admin access code"
            onKeyDown={(event) => { if (event.key === 'Enter' && accessCode.trim()) onSubmit(); }}
          />
        </div>

        {error ? <div className="error-banner">{error}</div> : null}

        <button className="btn btn-primary btn-full" onClick={onSubmit} disabled={loading || !accessCode.trim()}>
          {loading ? 'Signing in...' : 'Unlock workspace'}
        </button>
      </div>
    </div>
  );
}
