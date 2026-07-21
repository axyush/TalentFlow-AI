import React, { useState, useEffect } from 'react';
import { 
  Application, 
  PipelineStage, 
  Candidate,
  RecommendedCandidate
} from '../../types/index.js';
import { Badge } from '../common/Badge.js';
import { Modal } from '../common/Modal.js';
import { api } from '../../services/api.js';
import { 
  User, 
  ArrowRight, 
  Clock, 
  FileText, 
  MessageSquare, 
  History, 
  ChevronRight,
  MoreVertical,
  Sparkles,
  CheckCircle2,
  XCircle,
  GripVertical,
  Filter,
  ArrowUpDown,
  RefreshCw,
  AlertTriangle,
  Plus,
  Check,
  Award,
  Zap
} from 'lucide-react';

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

const STAGE_COLORS: Record<PipelineStage, { bg: string; text: string; border: string; indicator: string }> = {
  Applied: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', indicator: 'bg-slate-400' },
  Screening: { bg: 'bg-blue-50/60', text: 'text-blue-700', border: 'border-blue-200/80', indicator: 'bg-blue-500' },
  Interview: { bg: 'bg-indigo-50/60', text: 'text-indigo-700', border: 'border-indigo-200/80', indicator: 'bg-indigo-500' },
  'Technical Round': { bg: 'bg-purple-50/60', text: 'text-purple-700', border: 'border-purple-200/80', indicator: 'bg-purple-500' },
  'HR Round': { bg: 'bg-amber-50/60', text: 'text-amber-800', border: 'border-amber-200/80', indicator: 'bg-amber-500' },
  Offer: { bg: 'bg-emerald-50/60', text: 'text-emerald-800', border: 'border-emerald-200/80', indicator: 'bg-emerald-500' },
  Hired: { bg: 'bg-green-50/80', text: 'text-green-800', border: 'border-green-300', indicator: 'bg-green-600' },
  Rejected: { bg: 'bg-rose-50/60', text: 'text-rose-800', border: 'border-rose-200/80', indicator: 'bg-rose-500' },
};

interface KanbanBoardProps {
  jobId?: string;
  applications: Application[];
  onUpdateStage: (appId: string, newStage: PipelineStage, notes?: string) => Promise<void>;
  onSelectCandidate?: (candidateId: string) => void;
  onRefreshApplications?: () => void;
  isLoading?: boolean;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  jobId,
  applications,
  onUpdateStage,
  onSelectCandidate,
  onRefreshApplications,
  isLoading = false,
}) => {
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [dropOverStage, setDropOverStage] = useState<PipelineStage | null>(null);

  // Sorting & Filtering State
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);
  const [sortByScore, setSortByScore] = useState<'desc' | 'asc' | 'none'>('desc');

  // Stage move modal state
  const [selectedAppForMove, setSelectedAppForMove] = useState<Application | null>(null);
  const [modalNewStage, setModalNewStage] = useState<PipelineStage>('Screening');
  const [stageNotes, setStageNotes] = useState('');
  const [isSubmittingStage, setIsSubmittingStage] = useState(false);

  // Application history modal state
  const [selectedAppForHistory, setSelectedAppForHistory] = useState<Application | null>(null);

  // AI Analysis Modal State
  const [selectedAppForAI, setSelectedAppForAI] = useState<Application | null>(null);
  const [isRescoring, setIsRescoring] = useState(false);

  // Recommended Candidates Panel State
  const [showRecommendedModal, setShowRecommendedModal] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendedCandidate[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [attachingCandId, setAttachingCandId] = useState<string | null>(null);

  const loadRecommendedCandidates = async () => {
    if (!jobId) return;
    setIsLoadingRecs(true);
    try {
      const recs = await api.getRecommendedCandidates(jobId, 6);
      setRecommendations(recs);
    } catch (err) {
      console.error('Failed to load recommended candidates:', err);
    } finally {
      setIsLoadingRecs(false);
    }
  };

  const handleOpenRecommended = () => {
    setShowRecommendedModal(true);
    loadRecommendedCandidates();
  };

  const handleAttachRecommendedCandidate = async (candidateId: string) => {
    if (!jobId) return;
    setAttachingCandId(candidateId);
    try {
      await api.createApplication(candidateId, jobId);
      if (onRefreshApplications) onRefreshApplications();
      // Reload recommendations list
      await loadRecommendedCandidates();
    } catch (err: any) {
      alert(err.message || 'Error attaching candidate');
    } finally {
      setAttachingCandId(null);
    }
  };

  const handleRescore = async () => {
    if (!selectedAppForAI) return;
    setIsRescoring(true);
    try {
      const updated = await api.rescoreApplication(selectedAppForAI.id);
      setSelectedAppForAI(updated);
      if (onRefreshApplications) onRefreshApplications();
    } catch (err: any) {
      alert(err.message || 'Error recomputed AI score');
    } finally {
      setIsRescoring(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, app: Application) => {
    setDraggedAppId(app.id);
    e.dataTransfer.setData('text/plain', JSON.stringify({ appId: app.id, currentStage: app.currentStage }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dropOverStage !== stage) {
      setDropOverStage(stage);
    }
  };

  const handleDragLeave = (e: React.DragEvent, stage: PipelineStage) => {
    if (dropOverStage === stage) {
      setDropOverStage(null);
    }
  };

  const handleDrop = (e: React.DragEvent, destinationStage: PipelineStage) => {
    e.preventDefault();
    setDropOverStage(null);

    const dataRaw = e.dataTransfer.getData('text/plain');
    if (!dataRaw) return;

    try {
      const data = JSON.parse(dataRaw);
      const app = applications.find((a) => a.id === data.appId);
      if (app && app.currentStage !== destinationStage) {
        openMoveModal(app, destinationStage);
      }
    } catch (err) {
      console.error('Failed to parse drag drop data:', err);
    } finally {
      setDraggedAppId(null);
    }
  };

  const openMoveModal = (app: Application, targetStage: PipelineStage) => {
    setSelectedAppForMove(app);
    setModalNewStage(targetStage);
    setStageNotes('');
  };

  const handleConfirmStageChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppForMove) return;

    setIsSubmittingStage(true);
    try {
      await onUpdateStage(selectedAppForMove.id, modalNewStage, stageNotes);
      setSelectedAppForMove(null);
      setStageNotes('');
    } catch (err: any) {
      alert(err.message || 'Error updating candidate stage');
    } finally {
      setIsSubmittingStage(false);
    }
  };

  // Helper to filter and sort apps per column
  const getProcessedAppsForStage = (stage: PipelineStage) => {
    let stageApps = applications.filter((a) => a.currentStage === stage);

    if (minScoreFilter > 0) {
      stageApps = stageApps.filter((a) => a.aiScore >= minScoreFilter);
    }

    if (sortByScore === 'desc') {
      stageApps.sort((a, b) => b.aiScore - a.aiScore);
    } else if (sortByScore === 'asc') {
      stageApps.sort((a, b) => a.aiScore - b.aiScore);
    }

    return stageApps;
  };

  return (
    <div className="w-full h-full flex flex-col space-y-3">
      {/* Top AI Sorting & Filtering Toolbar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-indigo-500" />
            <span>AI Match Score Filter:</span>
          </div>
          <div className="flex items-center gap-1">
            {[0, 60, 75, 85].map((score) => (
              <button
                key={score}
                type="button"
                onClick={() => setMinScoreFilter(score)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  minScoreFilter === score
                    ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {score === 0 ? 'All' : `${score}%+`}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" />
            <span>Sort Column:</span>
          </div>
          <select
            value={sortByScore}
            onChange={(e) => setSortByScore(e.target.value as any)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="desc">Highest AI Match First</option>
            <option value="asc">Lowest AI Match First</option>
            <option value="none">Default (Recent Updated)</option>
          </select>

          {jobId && (
            <button
              type="button"
              onClick={handleOpenRecommended}
              className="px-3 py-1.5 bg-gradient-to-r from-indigo-900 to-slate-900 hover:from-indigo-800 hover:to-slate-800 text-white rounded-xl font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Top AI Recommendations
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board Horizontal Scroll Container */}
      <div className="flex-1 overflow-x-auto pb-6">
        <div className="flex gap-4 min-w-max px-1 pt-1">
          {STAGES.map((stage) => {
            const stageApps = getProcessedAppsForStage(stage);
            const rawCount = applications.filter((a) => a.currentStage === stage).length;
            const style = STAGE_COLORS[stage];
            const isDropTarget = dropOverStage === stage;

            return (
              <div
                key={stage}
                onDragOver={(e) => handleDragOver(e, stage)}
                onDragLeave={(e) => handleDragLeave(e, stage)}
                onDrop={(e) => handleDrop(e, stage)}
                className={`w-72 flex-shrink-0 flex flex-col rounded-2xl border ${
                  isDropTarget 
                    ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-md' 
                    : `${style.border} ${style.bg}`
                } transition-all duration-200 max-h-[calc(100vh-230px)]`}
              >
                {/* Column Header */}
                <div className="p-3.5 border-b border-slate-200/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${style.indicator}`} />
                    <h3 className={`text-xs font-bold ${style.text} tracking-wide uppercase`}>
                      {stage}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 bg-white/80 border border-slate-200 rounded-full text-xs font-semibold text-slate-700 shadow-2xs">
                    {stageApps.length} {minScoreFilter > 0 ? `(${rawCount})` : ''}
                  </span>
                </div>

                {/* Candidate Cards List */}
                <div className="p-2.5 space-y-2.5 overflow-y-auto flex-1 custom-scrollbar">
                  {stageApps.length === 0 ? (
                    <div className="h-28 border-2 border-dashed border-slate-200/80 rounded-xl flex items-center justify-center p-3 text-center">
                      <p className="text-[11px] text-slate-400 font-medium">
                        Drag candidate here to move to <span className="font-semibold text-slate-600">{stage}</span>
                      </p>
                    </div>
                  ) : (
                    stageApps.map((app) => {
                      const score = app.aiScore;
                      let scoreBadgeColor = 'bg-slate-100 border-slate-200 text-slate-700';
                      if (score >= 80) scoreBadgeColor = 'bg-emerald-50 border-emerald-200 text-emerald-800';
                      else if (score >= 60) scoreBadgeColor = 'bg-amber-50 border-amber-200 text-amber-800';
                      else if (score > 0) scoreBadgeColor = 'bg-rose-50 border-rose-200 text-rose-800';

                      return (
                        <div
                          key={app.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, app)}
                          className={`p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all cursor-grab active:cursor-grabbing group relative ${
                            draggedAppId === app.id ? 'opacity-40 border-dashed border-indigo-400' : ''
                          }`}
                        >
                          {/* Drag indicator icon */}
                          <div className="absolute top-2.5 right-2 text-slate-300 group-hover:text-slate-400">
                            <GripVertical className="w-3.5 h-3.5" />
                          </div>

                          {/* Candidate Name & Title */}
                          <div className="pr-4">
                            <h4 
                              onClick={() => onSelectCandidate && onSelectCandidate(app.candidateId)}
                              className="font-bold text-slate-900 text-xs hover:text-indigo-600 cursor-pointer transition-colors flex items-center gap-1"
                            >
                              {app.candidateName}
                            </h4>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">{app.candidateEmail}</p>
                          </div>

                          {/* AI Match Score Badge & Success Prediction */}
                          <div className="mt-2.5 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => setSelectedAppForAI(app)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold shadow-2xs hover:scale-105 transition-transform cursor-pointer ${scoreBadgeColor}`}
                            >
                              <Sparkles className="w-3 h-3 text-indigo-500" />
                              Match: {score}%
                            </button>

                            {/* Interview Success Likelihood Pill */}
                            <span
                              title={`Predicted likelihood of progressing to job offer based on AI score & stage velocity`}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                                score >= 75
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : score >= 55
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}
                            >
                              Offer Likelihood: {score >= 75 ? 'HIGH' : score >= 55 ? 'MEDIUM' : 'LOW'}
                            </span>
                          </div>

                          {/* Short Rationale Snippet if available */}
                          {app.aiAnalysis?.rationale && (
                            <p className="mt-2 text-[10px] text-slate-500 italic line-clamp-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                              "{app.aiAnalysis.rationale}"
                            </p>
                          )}

                          {/* Skill Gap Alert Pill if fit under 75% */}
                          {app.aiAnalysis?.recommendation && score < 75 && (
                            <div className="mt-2 p-1.5 bg-amber-50/80 border border-amber-200/80 rounded-lg text-[10px] text-amber-900 flex items-start gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                              <span className="font-medium line-clamp-2">{app.aiAnalysis.recommendation}</span>
                            </div>
                          )}

                          {/* History and Quick Stage Advance Bar */}
                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <button
                              type="button"
                              onClick={() => setSelectedAppForHistory(app)}
                              className="text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-medium cursor-pointer"
                            >
                              <History className="w-3 h-3" /> {app.history.length} events
                            </button>

                            <div className="flex items-center gap-1">
                              <select
                                value={app.currentStage}
                                onChange={(e) => {
                                  const newS = e.target.value as PipelineStage;
                                  if (newS !== app.currentStage) {
                                    openMoveModal(app, newS);
                                  }
                                }}
                                className="px-2 py-1 bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700 rounded-lg hover:bg-slate-100 focus:outline-none cursor-pointer"
                              >
                                {STAGES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Match Detail & Skill Gap Modal */}
      {selectedAppForAI && (
        <Modal
          isOpen={!!selectedAppForAI}
          onClose={() => setSelectedAppForAI(null)}
          title={`AI Candidate Compatibility Breakdown`}
          subtitle={`Candidate: ${selectedAppForAI.candidateName} • Position: ${selectedAppForAI.jobTitle}`}
        >
          <div className="space-y-5">
            {/* Top Score Banner */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-xl font-extrabold text-indigo-300">
                  {selectedAppForAI.aiScore}%
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-tight uppercase">
                    AI Match Rating: {selectedAppForAI.aiAnalysis?.experienceFit || (selectedAppForAI.aiScore >= 75 ? 'Strong Fit' : 'Moderate Fit')}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Evaluated by Gemini 3.6 Flash against job requirement specs
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRescore}
                disabled={isRescoring}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRescoring ? 'animate-spin' : ''}`} />
                {isRescoring ? 'Re-evaluating...' : 'Re-evaluate AI Score'}
              </button>
            </div>

            {/* Rationale Section */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Match Executive Rationale
              </h5>
              <p className="text-xs text-slate-700 leading-relaxed italic">
                "{selectedAppForAI.aiAnalysis?.rationale || 'Candidate evaluated for technical skills, domain background, and experience duration fit.'}"
              </p>
            </div>

            {/* Matched vs Missing Skills Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Matched Skills */}
              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2">
                <h5 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Matched Skills ({selectedAppForAI.aiAnalysis?.matchedSkills?.length || 0})
                </h5>
                <div className="flex flex-wrap gap-1">
                  {selectedAppForAI.aiAnalysis?.matchedSkills && selectedAppForAI.aiAnalysis.matchedSkills.length > 0 ? (
                    selectedAppForAI.aiAnalysis.matchedSkills.map((sk) => (
                      <span key={sk} className="px-2 py-0.5 bg-emerald-100 border border-emerald-200 text-emerald-900 rounded text-[11px] font-medium">
                        {sk}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-emerald-700 italic">No direct skill matches detected</span>
                  )}
                </div>
              </div>

              {/* Missing Skills */}
              <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-2">
                <h5 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-amber-600" /> Missing / Skill Gaps ({selectedAppForAI.aiAnalysis?.missingSkills?.length || 0})
                </h5>
                <div className="flex flex-wrap gap-1">
                  {selectedAppForAI.aiAnalysis?.missingSkills && selectedAppForAI.aiAnalysis.missingSkills.length > 0 ? (
                    selectedAppForAI.aiAnalysis.missingSkills.map((sk) => (
                      <span key={sk} className="px-2 py-0.5 bg-amber-100 border border-amber-200 text-amber-900 rounded text-[11px] font-medium">
                        {sk}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-amber-700 italic">No critical skill gaps identified</span>
                  )}
                </div>
              </div>
            </div>

            {/* Skill Gap Actionable Recommendation */}
            {selectedAppForAI.aiAnalysis?.recommendation && (
              <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-1">
                <h5 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-600" /> Skill Gap Action Recommendation
                </h5>
                <p className="text-xs text-indigo-900 font-medium">
                  {selectedAppForAI.aiAnalysis.recommendation}
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setSelectedAppForAI(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-700 cursor-pointer"
              >
                Close Analysis
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Recommended Candidates Modal for Job */}
      {showRecommendedModal && (
        <Modal
          isOpen={showRecommendedModal}
          onClose={() => setShowRecommendedModal(false)}
          title="AI Recommended Candidates Pool"
          subtitle="Top unassigned talent matched to job requirements via Gemini AI"
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {isLoadingRecs ? (
              <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
                <span>Evaluating candidate database against job specs with Gemini AI...</span>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl">
                <p className="text-xs text-slate-500 font-medium">
                  All available unassigned candidates have already been added to this job pipeline.
                </p>
              </div>
            ) : (
              recommendations.map((rec) => (
                <div
                  key={rec.candidate.id}
                  className="p-4 bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl shadow-2xs space-y-2.5 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        {rec.candidate.name}
                        <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-[10px] font-bold">
                          {rec.matchScore}% Match
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500">{rec.candidate.email} • {rec.candidate.location || 'Remote'}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAttachRecommendedCandidate(rec.candidate.id)}
                      disabled={attachingCandId === rec.candidate.id}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {attachingCandId === rec.candidate.id ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" /> 1-Click Attach to Job
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-xl border border-slate-100">
                    "{rec.rationale}"
                  </p>

                  <div className="flex flex-wrap items-center gap-1 text-xs">
                    <span className="text-[10px] text-slate-400 font-semibold mr-1">Matched:</span>
                    {rec.matchedSkills.map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-[10px] font-medium">
                        {s}
                      </span>
                    ))}
                    {rec.missingSkills.length > 0 && (
                      <>
                        <span className="text-[10px] text-slate-400 font-semibold mx-1">Gaps:</span>
                        {rec.missingSkills.map((s) => (
                          <span key={s} className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded text-[10px] font-medium">
                            {s}
                          </span>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              ))
            )}

            <div className="pt-2 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setShowRecommendedModal(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-700 cursor-pointer"
              >
                Close Recommendations
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Stage Change Modal with Notes Input */}
      {selectedAppForMove && (
        <Modal
          isOpen={!!selectedAppForMove}
          onClose={() => setSelectedAppForMove(null)}
          title="Update Candidate Stage"
          subtitle={`Move ${selectedAppForMove.candidateName} to ${modalNewStage}`}
        >
          <form onSubmit={handleConfirmStageChange} className="space-y-4">
            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-indigo-900/60 font-medium block">Current Stage</span>
                <span className="font-bold text-indigo-900">{selectedAppForMove.currentStage}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-indigo-400" />
              <div>
                <span className="text-indigo-900/60 font-medium block">New Target Stage</span>
                <span className="font-bold text-indigo-600">{modalNewStage}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Stage
              </label>
              <select
                value={modalNewStage}
                onChange={(e) => setModalNewStage(e.target.value as PipelineStage)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Transition Notes / Interview Feedback (Optional)
              </label>
              <textarea
                rows={3}
                value={stageNotes}
                onChange={(e) => setStageNotes(e.target.value)}
                placeholder="e.g., Passed technical test with 85/100. Scheduling HR round..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedAppForMove(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingStage}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md disabled:opacity-50"
              >
                {isSubmittingStage ? 'Updating Stage...' : 'Confirm Stage Move'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Application Stage History Modal */}
      {selectedAppForHistory && (
        <Modal
          isOpen={!!selectedAppForHistory}
          onClose={() => setSelectedAppForHistory(null)}
          title={`Stage History • ${selectedAppForHistory.candidateName}`}
          subtitle={`Position: ${selectedAppForHistory.jobTitle} (${selectedAppForHistory.clientName})`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <span className="font-medium text-slate-500">Current Stage:</span>
              <Badge variant={selectedAppForHistory.currentStage}>
                {selectedAppForHistory.currentStage}
              </Badge>
            </div>

            <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200">
              {selectedAppForHistory.history.map((hist, i) => (
                <div key={i} className="relative pl-7 space-y-1">
                  <div className="absolute left-1.5 top-1 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-white" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{hist.stage}</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(hist.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">Changed by: {hist.changedBy}</p>
                  {hist.notes && (
                    <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1">
                      "{hist.notes}"
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setSelectedAppForHistory(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-700 cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
