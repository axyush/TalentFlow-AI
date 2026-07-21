import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Sidebar, NavTab } from './components/layout/Sidebar.js';
import { Header } from './components/layout/Header.js';

import { LoginPage } from './pages/LoginPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { CandidatesPage } from './pages/CandidatesPage.js';
import { JobsPage } from './pages/JobsPage.js';
import { ClientsPage } from './pages/ClientsPage.js';
import { AuditLogsPage } from './pages/AuditLogsPage.js';
import { ErrorBoundary } from './components/common/ErrorBoundary.js';

const MainLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Quick Action Modal Triggers
  const [triggerCreateCandidate, setTriggerCreateCandidate] = useState(false);
  const [triggerCreateJob, setTriggerCreateJob] = useState(false);
  const [triggerCreateClient, setTriggerCreateClient] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 font-medium tracking-wide">
            Loading TalentFlow AI Workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const getPageHeaderProps = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'Dashboard Overview',
          subtitle: `Welcome back, ${user.name} (${user.role})`,
        };
      case 'candidates':
        return {
          title: 'Candidates Management',
          subtitle: 'Talent database and applicant profiles',
        };
      case 'jobs':
        return {
          title: 'Job Openings',
          subtitle: 'Active client position requisitions and postings',
        };
      case 'clients':
        return {
          title: 'Client Accounts',
          subtitle: 'Corporate clients and hiring stakeholders',
        };
      case 'audit':
        return {
          title: 'Audit Logs',
          subtitle: 'System activities and role compliance records',
        };
      default:
        return { title: 'TalentFlow AI', subtitle: '' };
    }
  };

  const headerProps = getPageHeaderProps();

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden antialiased text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title={headerProps.title} subtitle={headerProps.subtitle} />

        <main className="flex-1 overflow-y-auto bg-slate-50/60">
          {activeTab === 'dashboard' && (
            <DashboardPage
              onNavigate={setActiveTab}
              onOpenCreateCandidate={() => {
                setActiveTab('candidates');
                setTriggerCreateCandidate(true);
              }}
              onOpenCreateJob={() => {
                setActiveTab('jobs');
                setTriggerCreateJob(true);
              }}
              onOpenCreateClient={() => {
                setActiveTab('clients');
                setTriggerCreateClient(true);
              }}
            />
          )}

          {activeTab === 'candidates' && (
            <CandidatesPage
              isCreateOpen={triggerCreateCandidate}
              onCloseCreateModal={() => setTriggerCreateCandidate(false)}
            />
          )}

          {activeTab === 'jobs' && (
            <JobsPage
              isCreateOpen={triggerCreateJob}
              onCloseCreateModal={() => setTriggerCreateJob(false)}
            />
          )}

          {activeTab === 'clients' && (
            <ClientsPage
              isCreateOpen={triggerCreateClient}
              onCloseCreateModal={() => setTriggerCreateClient(false)}
            />
          )}

          {activeTab === 'audit' && <AuditLogsPage />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ErrorBoundary>
  );
}
