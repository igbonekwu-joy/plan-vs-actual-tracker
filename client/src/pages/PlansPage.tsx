import { useEffect, useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest, ApiError } from '../api/client';
import { Category, PaginatedResponse, Pagination, Plan, categoryName } from '../api/types';

const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function PlansPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [categoryId, setCategoryId] = useState('');
  const [month, setMonth] = useState(currentMonth());
  const [targetAmount, setTargetAmount] = useState('');
  const [rangeStart, setRangeStart] = useState(currentMonth());
  const [rangeEnd, setRangeEnd] = useState(currentMonth());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = async () => {
    const data = await apiRequest<Category[]>('/categories', { token });
    setCategories(data);
    if (data.length > 0 && !categoryId) setCategoryId(data[0]._id);
  };

  const loadPlans = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<PaginatedResponse<Plan>>(
        `/plans?startMonth=${rangeStart}&endMonth=${rangeEnd}&page=${page}&pageSize=${pageSize}`,
        { token },
      );
      setPlans(data.items);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCategories(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setPage(1); }, [rangeStart, rangeEnd]);
  useEffect(() => { loadPlans(); }, [rangeStart, rangeEnd, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!categoryId || !month || targetAmount === '') return;
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest('/plans', {
        method: 'PUT',
        token,
        body: { categoryId, month, targetAmount: Number(targetAmount) },
      });
      setTargetAmount('');
      await loadPlans();
    } catch (err) {
      if (err instanceof ApiError && err.status === 423) {
        setError(`${month} is locked — this plan can't be changed.`);
      } else {
        setError(err instanceof ApiError ? err.message : 'Could not save plan.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>Plans</h2>
        <p>Set a monthly target per category. Saving again for the same category and month updates it.</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <h3>Set a target</h3>
        {categories.length === 0 ? (
          <p className="empty-state">Add a category first before setting a target.</p>
        ) : (
          <form onSubmit={handleSubmit} className="field-row">
            <div className="field">
              <label htmlFor="plan-category">Category</label>
              <select id="plan-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="plan-month">Month</label>
              <input id="plan-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="plan-amount">Target amount</label>
              <input
                id="plan-amount"
                type="number"
                min={0}
                step="0.01"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <button className="btn" type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save target'}
            </button>
          </form>
        )}
      </div>

      <div className="card">
        <div className="section-toolbar">
          <h3 style={{ marginBottom: 0 }}>Plans by range</h3>
          <div className="field-row" style={{ alignItems: 'center' }}>
            <div className="field">
              <label htmlFor="range-start">From</label>
              <input id="range-start" type="month" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="range-end">To</label>
              <input id="range-end" type="month" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} />
            </div>
          </div>
        </div>

        {loading ? (
          <p className="empty-state">Loading…</p>
        ) : plans.length === 0 ? (
          <p className="empty-state">No plans set for this range yet.</p>
        ) : (
          <>
            <table>
              <thead>
                <tr><th>Month</th><th>Category</th><th style={{ textAlign: 'right' }}>Target</th></tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p._id}>
                    <td className="mono">{p.month}</td>
                    <td>{categoryName(p.categoryId)}</td>
                    <td className="num">{p.targetAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pagination && pagination.totalPages > 1 && (
              <div className="report-pagination" aria-label="Plans pagination">
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
