import React, { useMemo, useState } from 'react';
import AttendancePage from './components/AttendancePage';
import Dashboard from './components/Dashboard';
import EvaluationPage from './components/EvaluationPage';
import FormationPage from './components/FormationPage';
import MemberManagement from './components/MemberManagement';

const pages = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'members', label: 'Members' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'formation', label: 'Formation' },
  { id: 'evaluation', label: 'Evaluation' },
];

const App = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [accessToken, setAccessToken] = useState('');
  const [currentMember, setCurrentMember] = useState('');

  const content = useMemo(() => {
    switch (activePage) {
      case 'members':
        return <MemberManagement accessToken={accessToken} />;
      case 'attendance':
        return <AttendancePage accessToken={accessToken} />;
      case 'formation':
        return <FormationPage accessToken={accessToken} />;
      case 'evaluation':
        return <EvaluationPage accessToken={accessToken} />;
      default:
        return <Dashboard accessToken={accessToken} currentMember={currentMember} />;
    }
  }, [activePage, accessToken, currentMember]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">CheckTeam Football</h1>
            <p className="text-xs text-slate-500">Attendance & Activity Tracker</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs font-semibold text-slate-500">
              OAuth Token
              <input
                type="password"
                value={accessToken}
                onChange={(event) => setAccessToken(event.target.value)}
                className="mt-1 w-full min-w-[200px] rounded border border-slate-300 px-3 py-2 text-xs"
                placeholder="Paste access token"
              />
            </label>
            <label className="text-xs font-semibold text-slate-500">
              Member View
              <input
                type="text"
                value={currentMember}
                onChange={(event) => setCurrentMember(event.target.value)}
                className="mt-1 w-full min-w-[160px] rounded border border-slate-300 px-3 py-2 text-xs"
                placeholder="e.g., Kim"
              />
            </label>
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-2">
          {pages.map((page) => (
            <button
              key={page.id}
              type="button"
              onClick={() => setActivePage(page.id)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                activePage === page.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {page.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-6">{content}</main>
    </div>
  );
};

export default App;
