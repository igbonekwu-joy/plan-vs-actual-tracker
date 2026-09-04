import { useEffect, useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest, ApiError } from '../api/client';
import { PaginatedResponse, Pagination } from '../api/types';

const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function LocksPage() {
  const { token } = useAuth();
  const [lockedMonths, setLockedMonths] = useState<string[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [month, setMonth] = useState(currentMonth());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<PaginatedResponse<string>>(`/locks?page=${page}&pageSize=${pageSize}`, { token });
      setLockedMonths(data.items);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load locks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLock = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest('/locks', { method: 'POST', token, body: { month } });
      if (page !== 1) setPage(1);
      else await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not lock month.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnlock = async (m: string) => {
    setError(null);
    try {
      await apiRequest(`/locks/${m}`, { method: 'DELETE', token });
      if (pagination?.page && lockedMonths.length === 1 && pagination.page > 1) {
        setPage(pagination.page - 1);
      } else await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not unlock month.');
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>Locking</h2>
        <p>Lock a finalized month to freeze its plans and actuals. The API rejects edits to locked months, not just the UI.</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <h3>Lock a month</h3>
        <form onSubmit={handleLock} className="field-row">
          <div className="field">
            <label htmlFor="lock-month">Month</label>
            <input id="lock-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? 'Locking…' : 'Lock month'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Locked months</h3>
        {loading ? (
          <p className="empty-state">Loading…</p>
        ) : lockedMonths.length === 0 ? (
          <p className="empty-state">No months are locked.</p>
        ) : (
          <>
            <div className="chip-row">
              {lockedMonths.map((m) => (
                <span className="chip mono" key={m}>
                  {m}
                  <button aria-label={`Unlock ${m}`} onClick={() => handleUnlock(m)}>×</button>
                </span>
              ))}
            </div>
            {pagination && pagination.totalPages > 1 && (
              <div className="report-pagination" aria-label="Locks pagination">
                <span className="report-pagination-status">Page {pagination.page} of {pagination.totalPages}</span>
                <div className="report-pagination-buttons">
                  <button className="report-pagination-button" type="button" onClick={() => setPage((current) => current - 1)} disabled={!pagination.hasPrevious}>
                    Previous
                  </button>
                  <button className="report-pagination-button" type="button" onClick={() => setPage((current) => current + 1)} disabled={!pagination.hasNext}>
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
