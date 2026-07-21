import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  Briefcase, 
  Users, 
  FileText, 
  Plus, 
  ArrowUpRight, 
  Activity, 
  ShieldCheck,
  Sparkles,
  Layers,
  LayoutGrid
} from 'lucide-react';
import { api } from '../services/api.js';
import { Client, Job, Candidate, Application, AuditLog, PipelineStage } from '../types/index.js';
import { Badge } from '../components/common/Badge.js';
import { useAuth } from '../context/AuthContext.js';
import { AnalyticsDashboardView } from '../components/analytics/AnalyticsDashboardView.js';

interface DashboardProps {
  onNavigate: (tab: 'candidates' | 'jobs' | 'clients' | 'audit') => void;
  onOpenCreateCandidate: () => void;
  onOpenCreateJob: () => void;
  onOpenCreateClient: () => void;
}

const STAGES: PipelineStage[] = [
  'Applied',
  'Screening',
  'Interview',
  'Technical Round',
  'HR Round',
  'Offer',
  'Hired',
  'Rejected',
];

export const DashboardPage: React.FC<DashboardProps> = ({
  onNavigate,
  onOpenCreateCandidate,
  onOpenCreateJob,
  onOpenCreateClient,
}) => {
  const { isAdmin } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setIsLoading(true);
      try {
        const [cliRes, jobRes, candRes, appRes] = await Promise.all([
          api.getClients({ pageSize: 100 }),
          api.getJobs({ pageSize: 100 }),
          api.getCandidates({ pageSize: 100 }),
          api.getApplications({ pageSize: 100 }),
        ]);

        setClients(cliRes.data);
        setJobs(jobRes.data);
        setCandidates(candRes.data);
        setApplications(appRes.data);

        if (isAdmin) {
          const auditRes = await api.getAuditLogs({ page: 1, pageSize: 6 });
          setLogs(auditRes.data);
        }
      } catch (err) {
        console.error('Error loading dashboard metrics', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, [isAdmin]);

  const activeClients = clients.filter((c) => c.status === 'ACTIVE').length;
  const openJobs = jobs.filter((j) => j.status === 'OPEN').length;
  const totalCandidates = candidates.length;
  const activeApps = applications.length;

  // Pipeline stage breakdown count
  const stageCounts = STAGES.reduce((acc, stage) => {
    acc[stage] = applications.filter((a) => a.currentStage === stage).length;
    return acc;
  }, {} as Record<PipelineStage, number>);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div className="relative z-10 space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            TalentFlow AI Recruitment Command Center
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Active Recruitment Pipeline Overview
          </h2>
          <p className="text-sm text-slate-300">
            Track candidates progressing through hiring stages, manage client requisitions, and execute candidate sourcing.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenCreateCandidate}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all"
          >
            <Plus className="w-4 h-4" /> Add Candidate
          </button>
          <button
            onClick={onOpenCreateJob}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all"
          >
            <Plus className="w-4 h-4" /> Post Job
          </button>
          {isAdmin && (
            <button
              onClick={onOpenCreateClient}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all"
            >
              <Plus className="w-4 h-4" /> New Client
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('clients')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Clients
            </span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-slate-900">{isLoading ? '...' : activeClients}</p>
            <span className="text-xs text-slate-500 flex items-center gap-0.5">
              Total {clients.length} <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('jobs')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Open Job Postings
            </span>
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl group-hover:scale-105 transition-transform">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-slate-900">{isLoading ? '...' : openJobs}</p>
            <span className="text-xs text-slate-500 flex items-center gap-0.5">
              Total {jobs.length} <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('candidates')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Candidates Database
            </span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-slate-900">{isLoading ? '...' : totalCandidates}</p>
            <span className="text-xs text-slate-500 flex items-center gap-0.5">
              Profiles <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('jobs')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Applications
            </span>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-slate-900">{isLoading ? '...' : activeApps}</p>
            <span className="text-xs text-slate-500 flex items-center gap-0.5">
              In Pipeline <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Executive Recruitment Analytics & AI Insights */}
      <AnalyticsDashboardView onSelectCandidate={() => onNavigate('candidates')} />

      {/* Live Pipeline Stage Distribution Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">Pipeline Stage Distribution</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {applications.length} Total Candidate Applications
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-1">
          {STAGES.map((stg) => {
            const count = stageCounts[stg] || 0;
            const pct = applications.length > 0 ? Math.round((count / applications.length) * 100) : 0;
            return (
              <div
                key={stg}
                onClick={() => onNavigate('jobs')}
                className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer"
              >
                <p className="text-[11px] font-bold text-slate-600 truncate">{stg}</p>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-lg font-bold text-slate-900">{count}</span>
                  <span className="text-[10px] text-slate-400">{pct}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Section: Active Applications & Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Pipeline Applications */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Recent Pipeline Movements</h3>
              <p className="text-xs text-slate-500">Candidates currently progressing across hiring stages</p>
            </div>
            <button
              onClick={() => onNavigate('jobs')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Open Job Pipelines <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
            {applications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No active applications found.</div>
            ) : (
              applications.slice(0, 5).map((app) => (
                <div key={app.id} className="p-3.5 hover:bg-slate-50/80 transition-colors flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">{app.candidateName}</p>
                    <p className="text-xs text-slate-500">
                      Applied for <span className="font-medium text-slate-700">{app.jobTitle}</span> at{' '}
                      <span className="font-medium text-slate-700">{app.clientName}</span>
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant={app.currentStage}>{app.currentStage}</Badge>
                    <p className="text-[11px] text-slate-400">
                      Updated {new Date(app.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Sidebar Widget: Recent Audit Trail */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-base">System Audit Trail</h3>
            </div>
            {isAdmin && (
              <button
                onClick={() => onNavigate('audit')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Full Log
              </button>
            )}
          </div>

          <div className="space-y-3">
            {isAdmin && logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="p-2.5 bg-slate-50/80 border border-slate-100 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-800">
                    <span>{log.userName}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-sans leading-tight">{log.details}</p>
                </div>
              ))
            ) : (
              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/80">
                  <p className="font-semibold text-indigo-950 mb-0.5">Recruitment Pipeline Active</p>
                  <p className="text-indigo-800/80">Candidates can be dragged across 8 hiring stages with full audit logging and notes.</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Role Security
                  </div>
                  <p className="text-slate-500 text-[11px]">Recruiters and Admins manage candidate pipelines with full stage history.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
