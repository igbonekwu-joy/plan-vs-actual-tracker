import { useEffect, useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest, ApiError } from '../api/client';
import { Category } from '../api/types';

export default function CategoriesPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<Category[]>('/categories', { token });
      setCategories(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest<Category>('/categories', { method: 'POST', token, body: { name: name.trim() } });
      setName('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create category.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>Categories</h2>
        <p>The buckets your spending gets sorted into — Marketing, Payroll, Tools, whatever fits how you budget.</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <h3>Add a category</h3>
        <form onSubmit={handleSubmit} className="field-row">
          <div className="field">
            <label htmlFor="cat-name">Name</label>
            <input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Marketing"
            />
          </div>
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add category'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Your categories</h3>
        {loading ? (
          <p className="empty-state">Loading…</p>
        ) : categories.length === 0 ? (
          <p className="empty-state">No categories yet. Add one above to get started.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Name</th></tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c._id}><td>{c.name}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
