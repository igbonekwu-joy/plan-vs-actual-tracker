import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import CategoriesPage from './pages/CategoriesPage';
import PlansPage from './pages/PlansPage';
import ActualsPage from './pages/ActualsPage';
import LocksPage from './pages/LocksPage';
import ReportPage from './pages/ReportPage';
import NavRail, { Tab } from './components/NavRail';

export default function App() {
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>('report');

  if (!token) return <AuthPage />;

  return (
    <div className="app-shell">
      <NavRail active={tab} onChange={setTab} />
      <main className="main">
        {tab === 'report' && <ReportPage />}
        {tab === 'plans' && <PlansPage />}
        {tab === 'actuals' && <ActualsPage />}
        {tab === 'categories' && <CategoriesPage />}
        {tab === 'locks' && <LocksPage />}
      </main>
    </div>
  );
}
