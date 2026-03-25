import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import App from './App';

vi.stubGlobal(
  'fetch',
  vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/auth/session')) {
      return new Response(JSON.stringify({ authenticated: false, expires_at: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }),
);

describe('App', () => {
  it('renders the login screen when there is no session', async () => {
    window.localStorage.clear();
    render(<App />);
    await waitFor(() => expect(screen.getByText('Access code')).toBeInTheDocument());
    expect(screen.getByText('Server ngrok URL')).toBeInTheDocument();
    expect(screen.getByText('Unlock workspace')).toBeInTheDocument();
  });
});
