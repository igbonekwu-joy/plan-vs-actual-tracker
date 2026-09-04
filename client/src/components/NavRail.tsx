import { useAuth } from '../context/AuthContext';

export type Tab = 'categories' | 'plans' | 'actuals' | 'locks' | 'report';

const TABS: { id: Tab; label: string }[] = [
  { id: 'report', label: 'Report' },
  { id: 'plans', label: 'Plans' },
  { id: 'actuals', label: 'Actuals' },
  { id: 'categories', label: 'Categories' },
  { id: 'locks', label: 'Locking' },
];

export default function NavRail({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const { email, logout } = useAuth();

  return (
    <nav className="rail">
      <div className="rail-brand">
        <h1>Plan vs Actual</h1>
        <p>Budget tracker</p>
      </div>
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`rail-tab ${active === t.id ? 'active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
      <div className="rail-footer">
        <div className="rail-user">{email}</div>
        <button className="link-btn" onClick={logout}>Log out</button>
      </div>
    </nav>
  );
}
