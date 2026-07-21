import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Clock, 
  Award, 
  Sparkles, 
  AlertTriangle, 
  Users, 
  BarChart3, 
  CheckCircle2, 
  RefreshCw,
  Zap,
  Target,
  FileSpreadsheet,
  ArrowRight
} from 'lucide-react';
import { api } from '../../services/api.js';
import { AnalyticsDashboardData, CandidateSuccessPrediction, PipelineStage } from '../../types/index.js';
import { Badge } from '../common/Badge.js';

interface AnalyticsDashboardViewProps {
  onSelectCandidate?: (candidateId: string) => void;
}

export const AnalyticsDashboardView: React.FC<AnalyticsDashboardViewProps> = ({ onSelectCandidate }) => {
  const [data, setData] = useState<AnalyticsDashboardData | null>(null);
  const [predictions, setPredictions] = useState<CandidateSuccessPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'BOTTLENECKS' | 'RECRUITERS' | 'PREDICTIONS'>('OVERVIEW');

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const [dashRes, predRes] = await Promise.all([
        api.getAnalyticsDashboard(),
        api.getSuccessPredictions(),
      ]);
      setData(dashRes);
      setPredictions(predRes);
    } catch (err) {
      console.error('Failed to load analytics dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs text-center space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
        <p className="text-xs font-semibold text-slate-600">Calculating hiring conversion rates & stage velocity metrics...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200/80 text-center text-slate-500 text-xs">
        Failed to load recruitment analytics data.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Hiring Insights Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase text-white tracking-wider">Gemini Executive Hiring Insights</h3>
              <p className="text-[11px] text-slate-300">Automated AI intelligence on pipeline conversion, bottlenecks & speed-to-hire</p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadAnalytics}
            className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-indigo-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Analytics
          </button>
        </div>

        {/* Executive Summary Statement */}
        <div className="p-3 bg-indigo-950/60 border border-indigo-800/50 rounded-xl text-xs text-indigo-100 font-medium leading-relaxed">
          "{data.aiInsights.summary}"
        </div>

        {/* 3 Grid Insights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* Key Insights List */}
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
            <h4 className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Pipeline Highlights
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {data.aiInsights.insights.map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-indigo-400 font-bold">•</span>
                  <span className="leading-tight">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Bottleneck Analysis */}
          <div className="p-3.5 bg-slate-900/80 border border-amber-900/40 rounded-xl space-y-2">
            <h4 className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Primary Bottleneck Alert
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {data.aiInsights.bottleneckAnalysis}
            </p>
          </div>

          {/* Recommendations */}
          <div className="p-3.5 bg-slate-900/80 border border-emerald-900/40 rounded-xl space-y-2">
            <h4 className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Actionable Recommendations
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {data.aiInsights.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span className="leading-tight">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Analytics Sub-Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'OVERVIEW'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Job Conversion Rates ({data.overallConversionRate}% Avg)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('BOTTLENECKS')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'BOTTLENECKS'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Stage Velocity & Bottlenecks ({data.bottleneckStage})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('RECRUITERS')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'RECRUITERS'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Recruiter Performance
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PREDICTIONS')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'PREDICTIONS'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-300" /> Success Predictions ({predictions.length})
        </button>
      </div>

      {/* Tab 1: Conversion Rates per Job */}
      {activeTab === 'OVERVIEW' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" /> Job Requisition Conversion Rates (Applied → Hired)
            </h4>
            <span className="text-xs text-slate-500 font-semibold">
              Overall Pipeline Conversion Rate: <span className="text-indigo-600 font-bold">{data.overallConversionRate}%</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <th className="py-3 px-4">Job Title & Client</th>
                  <th className="py-3 px-4">Total Applications</th>
                  <th className="py-3 px-4">Hired Count</th>
                  <th className="py-3 px-4">Conversion Rate</th>
                  <th className="py-3 px-4">Conversion Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data.jobConversionRates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No active job pipeline applications recorded.
                    </td>
                  </tr>
                ) : (
                  data.jobConversionRates.map((job) => (
                    <tr key={job.jobId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {job.jobTitle}
                        <p className="text-[11px] text-slate-400 font-normal">{job.clientName}</p>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">{job.totalApplications}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-700">{job.hiredCount}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                          job.conversionRate >= 20 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          job.conversionRate >= 10 ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {job.conversionRate}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 w-48">
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, job.conversionRate * 2)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Stage Velocity & Bottlenecks */}
      {activeTab === 'BOTTLENECKS' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" /> Pipeline Stage Velocity (Avg Days per Stage)
              </h4>
              <p className="text-xs text-slate-500">Average duration candidates spend before moving to next stage</p>
            </div>

            <div className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Primary Bottleneck: {data.bottleneckStage} ({data.stageDurations[data.bottleneckStage] || 0} Days)
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {Object.entries(data.stageDurations).map(([stage, avgDays]) => {
              const isBottleneck = stage === data.bottleneckStage;
              return (
                <div
                  key={stage}
                  className={`p-3.5 rounded-2xl border space-y-1 transition-all ${
                    isBottleneck
                      ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20 shadow-xs'
                      : 'bg-slate-50/80 border-slate-200'
                  }`}
                >
                  <p className="text-[11px] font-bold text-slate-700 truncate">{stage}</p>
                  <p className={`text-xl font-extrabold ${isBottleneck ? 'text-amber-900' : 'text-slate-900'}`}>
                    {avgDays} <span className="text-xs font-normal text-slate-500">days</span>
                  </p>
                  {isBottleneck && (
                    <span className="inline-block px-1.5 py-0.5 bg-amber-200 text-amber-950 rounded text-[9px] font-extrabold uppercase">
                      Bottleneck
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Recruiter Performance */}
      {activeTab === 'RECRUITERS' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" /> Recruiter Productivity & Performance Matrix
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <th className="py-3 px-4">Recruiter Name</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Candidates Added</th>
                  <th className="py-3 px-4">Applications Processed</th>
                  <th className="py-3 px-4">Hires Placed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data.recruiterPerformance.map((rec) => (
                  <tr key={rec.userId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{rec.userName}</td>
                    <td className="py-3.5 px-4"><Badge variant={rec.userRole as any}>{rec.userRole}</Badge></td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{rec.candidatesAdded}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{rec.applicationsManaged}</td>
                    <td className="py-3.5 px-4 font-extrabold text-emerald-700">{rec.hiresMade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Interview Success Predictions */}
      {activeTab === 'PREDICTIONS' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-500" /> Interview Success & Offer Likelihood Predictions
              </h4>
              <p className="text-xs text-slate-500">
                Lightweight AI prediction based on match score, pipeline velocity & skill match ratio
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {predictions.length === 0 ? (
              <div className="col-span-full py-8 text-center text-slate-400 text-xs">
                No active candidate pipeline applications to predict.
              </div>
            ) : (
              predictions.map((pred) => {
                let badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                if (pred.likelihood === 'MEDIUM') badgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
                else if (pred.likelihood === 'LOW') badgeClass = 'bg-rose-50 text-rose-800 border-rose-200';

                return (
                  <div
                    key={pred.appId}
                    className="p-4 bg-slate-50/80 border border-slate-200/90 rounded-2xl space-y-2.5 hover:border-indigo-300 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h5
                          onClick={() => onSelectCandidate && onSelectCandidate(pred.candidateId)}
                          className="font-bold text-slate-900 text-xs hover:text-indigo-600 cursor-pointer"
                        >
                          {pred.candidateName}
                        </h5>
                        <p className="text-[11px] text-slate-500 truncate">{pred.jobTitle}</p>
                      </div>

                      <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-extrabold shadow-2xs ${badgeClass}`}>
                        {pred.likelihood} ({pred.successProbability}%)
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Stage: <span className="font-semibold text-slate-800">{pred.currentStage}</span></span>
                      <span className="text-slate-500">AI Match: <span className="font-semibold text-indigo-600">{pred.aiMatchScore}%</span></span>
                    </div>

                    {pred.keyFactors.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/60 space-y-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Key Drivers:</p>
                        <ul className="text-[10px] text-slate-600 space-y-0.5">
                          {pred.keyFactors.map((k, i) => (
                            <li key={i} className="truncate">• {k}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
