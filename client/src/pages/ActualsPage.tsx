import { useEffect, useState, FormEvent, ChangeEvent, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest, ApiError } from '../api/client';
import { Category, Actual, categoryName } from '../api/types';

const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function ActualsPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [actuals, setActuals] = useState<Actual[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [month, setMonth] = useState(currentMonth());
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [rangeStart, setRangeStart] = useState(currentMonth());
  const [rangeEnd, setRangeEnd] = useState(currentMonth());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadCategories = async () => {
    const data = await apiRequest<Category[]>('/categories', { token });
    setCategories(data);
    if (data.length > 0 && !categoryId) setCategoryId(data[0]._id);
  };

  const loadActuals = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<Actual[]>(
        `/actuals?startMonth=${rangeStart}&endMonth=${rangeEnd}`,
        { token },
      );
      setActuals(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load actuals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCategories(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { loadActuals(); }, [rangeStart, rangeEnd]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!categoryId || !month || amount === '') return;
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest('/actuals', {
        method: 'POST',
        token,
        body: { categoryId, month, amount: Number(amount), note: note || undefined },
      });
      setAmount('');
      setNote('');
      await loadActuals();
    } catch (err) {
      if (err instanceof ApiError && err.status === 423) {
        setError(`${month} is locked — this entry can't be added.`);
      } else {
        setError(err instanceof ApiError ? err.message : 'Could not save entry.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportMessage(null);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiRequest<{ imported: number }>('/actuals/import', {
        method: 'POST',
        token,
        body: formData,
        isFormData: true,
      });
      setImportMessage(`Imported ${res.imported} row${res.imported === 1 ? '' : 's'}.`);
      await loadActuals();
    } catch (err) {
      if (err instanceof ApiError && err.status === 423) {
        setError(err.message);
      } else {
        setError(err instanceof ApiError ? err.message : 'Import failed.');
      }
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>Actuals</h2>
        <p>Log what you actually spent — one entry at a time, or all at once from a CSV.</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <h3>Log an entry</h3>
        {categories.length === 0 ? (
          <p className="empty-state">Add a category first before logging spend.</p>
        ) : (
          <form onSubmit={handleSubmit} className="field-row">
            <div className="field">
              <label htmlFor="act-category">Category</label>
              <select id="act-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="act-month">Month</label>
              <input id="act-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="act-amount">Amount</label>
              <input
                id="act-amount"
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="field">
              <label htmlFor="act-note">Note (optional)</label>
              <input id="act-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
            </div>
            <button className="btn" type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Log entry'}
            </button>
          </form>
        )}
      </div>

      <div className="card">
        <h3>Import from CSV</h3>
        <p className="hint" style={{ marginTop: 0, marginBottom: 12 }}>
          Columns: <code className="mono">month,category,amount</code> — months as YYYY-MM, categories must already exist.
        </p>
        <div className="file-input-wrap">
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} disabled={importing} />
        </div>
        {importing && <p className="hint">Importing…</p>}
        {importMessage && <p className="hint" style={{ color: 'var(--positive)' }}>{importMessage}</p>}
      </div>

      <div className="card">
        <div className="section-toolbar">
          <h3 style={{ marginBottom: 0 }}>Entries by range</h3>
          <div className="field-row" style={{ alignItems: 'center' }}>
            <div className="field">
              <label htmlFor="act-range-start">From</label>
              <input id="act-range-start" type="month" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="act-range-end">To</label>
              <input id="act-range-end" type="month" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} />
            </div>
          </div>
        </div>

        {loading ? (
          <p className="empty-state">Loading…</p>
        ) : actuals.length === 0 ? (
          <p className="empty-state">No entries logged for this range yet.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Month</th><th>Category</th><th>Note</th><th style={{ textAlign: 'right' }}>Amount</th></tr>
            </thead>
            <tbody>
              {actuals.map((a) => (
                <tr key={a._id}>
                  <td className="mono">{a.month}</td>
                  <td>{categoryName(a.categoryId)}</td>
                  <td style={{ color: 'var(--ink-soft)' }}>{a.note || '—'}</td>
                  <td className="num">{a.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
