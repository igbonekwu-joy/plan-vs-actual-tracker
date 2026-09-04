import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { apiRequest, ApiError } from '../api/client';
import { ReportResponse } from '../api/types';

const currentMonth = () => new Date().toISOString().slice(0, 7);
const monthsAgo = (n: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 7);
};

function formatNumber(v: number | '-') {
  if (v === '-') return '-';
  return v.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

function formatPercent(v: number | '-') {
  if (v === '-') return '-';
  return `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;
}

export default function ReportPage() {
  const { token } = useAuth();
  const [rangeStart, setRangeStart] = useState(monthsAgo(2));
  const [rangeEnd, setRangeEnd] = useState(currentMonth());
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<ReportResponse>(
        `/report?startMonth=${rangeStart}&endMonth=${rangeEnd}&page=${page}&pageSize=${pageSize}`,
        { token },
      );
      setReport(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); }, [rangeStart, rangeEnd]);
  useEffect(() => { load(); }, [rangeStart, rangeEnd, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const chartData = report?.chart.labels.map((label, i) => ({
    month: label,
    variance: report.chart.data[i],
  })) ?? [];

  return (
    <>
      <div className="page-header">
        <h2>Report</h2>
        <p>Plan vs actual, side by side, for the range you choose. A missing entry shows as a dash — treated as not yet logged, not as zero.</p>
      </div>

      <div className="card">
        <div className="section-toolbar">
          <h3 style={{ marginBottom: 0 }}>Date range</h3>
          <div className="field-row" style={{ alignItems: 'center' }}>
            <div className="field">
              <label htmlFor="rep-start">From</label>
              <input id="rep-start" type="month" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="rep-end">To</label>
              <input id="rep-end" type="month" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="card"><p className="empty-state">Loading…</p></div>
      ) : !report || report.rows.length === 0 ? (
        <div className="card"><p className="empty-state">No plans or actuals in this range yet.</p></div>
      ) : (
        <>
          <div className="card">
            <h3>Monthly net variance</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#DCE3DA" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#4A5A50' }} axisLine={{ stroke: '#C7D0C5' }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#4A5A50' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: number) => [value.toLocaleString(undefined, { minimumFractionDigits: 2 }), 'Net variance']}
                  contentStyle={{ fontSize: 13, borderRadius: 4, border: '1px solid #C7D0C5' }}
                />
                <Bar dataKey="variance" radius={[3, 3, 0, 0]}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.variance <= 0 ? '#2F6D46' : '#B23A2D'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3>Plan vs actual</h3>
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Category</th>
                  <th style={{ textAlign: 'right' }}>Plan</th>
                  <th style={{ textAlign: 'right' }}>Actual</th>
                  <th style={{ textAlign: 'right' }}>Variance</th>
                  <th style={{ textAlign: 'right' }}>Variance %</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((r) => (
                  <tr key={`${r.categoryId}-${r.month}`}>
                    <td className="mono">{r.month}</td>
                    <td>{r.category}</td>
                    <td className="num">{formatNumber(r.plan)}</td>
                    <td className={`num ${r.actual === '-' ? 'dash' : ''}`}>{formatNumber(r.actual)}</td>
                    <td className={`num ${r.variance === '-' ? 'dash' : r.variance < 0 ? 'positive' : r.variance > 0 ? 'negative' : ''}`}>
                      {formatNumber(r.variance)}
                    </td>
                    <td className={`num ${r.variancePercent === '-' ? 'dash' : r.variancePercent < 0 ? 'positive' : r.variancePercent > 0 ? 'negative' : ''}`}>
                      {formatPercent(r.variancePercent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {report.pagination.totalPages > 1 && (
              <div className="report-pagination" aria-label="Report pagination">
                <span className="report-pagination-status">
                  Page {report.pagination.page} of {report.pagination.totalPages}
                </span>
                <div className="report-pagination-buttons">
                  <button className="report-pagination-button" type="button" onClick={() => setPage((current) => current - 1)} disabled={!report.pagination.hasPrevious}>
                    Previous
                  </button>
                  <button className="report-pagination-button" type="button" onClick={() => setPage((current) => current + 1)} disabled={!report.pagination.hasNext}>
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
