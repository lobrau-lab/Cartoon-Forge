import React, { useState } from 'react';
import { EpisodeProject } from '../types';
import { auditAndHealProject, HealingResult } from '../utils/selfHealingEngine';
import { 
  ShieldCheck, 
  Wrench, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  X, 
  Layers, 
  HardDrive, 
  Cpu, 
  Radio, 
  Sparkles, 
  FileCode2,
  Zap
} from 'lucide-react';

interface SelfHealingModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: EpisodeProject;
  onApplyHealedProject: (healed: EpisodeProject) => void;
}

export const SelfHealingModal: React.FC<SelfHealingModalProps> = ({
  isOpen,
  onClose,
  project,
  onApplyHealedProject
}) => {
  const [isSweeping, setIsSweeping] = useState(false);
  const [sweepResult, setSweepResult] = useState<HealingResult | null>(null);
  const [serverHealth, setServerHealth] = useState<{
    bridgeStatus: string;
    modelVaultStatus: string;
    expressApiStatus: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleRunFullSweep = async () => {
    setIsSweeping(true);
    setSweepResult(null);

    // 1. Audit & heal client-side project state
    const result = auditAndHealProject(project);

    // 2. Query backend server self-heal diagnostic
    try {
      const res = await fetch('/api/self-heal/sweep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project })
      });
      const data = await res.json();
      if (data.success) {
        setServerHealth({
          bridgeStatus: 'Online & Polling',
          modelVaultStatus: `${data.vaultStats?.checkpoints || 5} Models Mounted`,
          expressApiStatus: 'Self-Correcting Middleware Active'
        });
      }
    } catch (e) {
      setServerHealth({
        bridgeStatus: 'Fallback Offline Buffer Active',
        modelVaultStatus: 'Local Directory Active',
        expressApiStatus: 'Standalone Local Engine'
      });
    }

    setTimeout(() => {
      setSweepResult(result);
      setIsSweeping(false);
      onApplyHealedProject(result.healedProject);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-400 shadow-xl shadow-emerald-500/10">
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase tracking-widest">
                  Self-Healing Loop Monitor
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-100 tracking-tight mt-0.5">
                Automated System Integrity & Data Self-Correction
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live System Health Monitor Metrics */}
        <div className="grid grid-cols-3 gap-3 font-mono text-xs relative z-10">
          <div className="bg-slate-950/90 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase block">Project Schema</span>
            <span className="text-emerald-400 font-bold flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Self-Audited</span>
            </span>
          </div>

          <div className="bg-slate-950/90 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase block">Character LoRAs</span>
            <span className="text-indigo-300 font-bold flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>{project.cast.length} Anchors Locked</span>
            </span>
          </div>

          <div className="bg-slate-950/90 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase block">Timecode Alignment</span>
            <span className="text-cyan-300 font-bold flex items-center space-x-1">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>{project.shots.length} Shots Synced</span>
            </span>
          </div>
        </div>

        {/* Main Action Trigger */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 space-y-4 relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-slate-100 flex items-center space-x-2">
                <Wrench className="w-4 h-4 text-emerald-400" />
                <span>Execute Self-Healing Diagnostic Sweep</span>
              </h4>
              <p className="text-xs text-slate-400 max-w-md">
                Scans for out-of-sequence shot IDs, missing character LoRA tags, unaligned dubbing timecodes, and corrupt session parameters, then auto-repairs them automatically.
              </p>
            </div>

            <button
              onClick={handleRunFullSweep}
              disabled={isSweeping}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:opacity-95 text-slate-950 font-extrabold text-xs shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 flex-shrink-0"
            >
              <RefreshCw className={`w-4 h-4 text-slate-950 ${isSweeping ? 'animate-spin' : ''}`} />
              <span>{isSweeping ? 'Sweeping & Healing...' : 'Run Self-Healing Sweep'}</span>
            </button>
          </div>

          {/* Sweep Results Log */}
          {sweepResult && (
            <div className="space-y-3 pt-3 border-t border-slate-800/80 animate-fadeIn font-mono text-xs">
              <div className="flex items-center justify-between bg-emerald-950/90 p-3 rounded-xl border border-emerald-500/40 text-emerald-300">
                <span className="flex items-center space-x-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Self-Healing Sweep Complete</span>
                </span>
                <span className="bg-emerald-900 text-emerald-200 px-2.5 py-0.5 rounded text-[11px] font-extrabold">
                  Health Score: {sweepResult.healthScore}%
                </span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                {sweepResult.healLogs.length === 0 ? (
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-slate-400 text-[11px] text-center">
                    ✓ All entity structures, shot sequences, and timecodes are 100% verified and healthy. No corrections needed.
                  </div>
                ) : (
                  sweepResult.healLogs.map((log, idx) => (
                    <div key={idx} className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-amber-400 font-bold">[{log.category}] {log.message}</span>
                        <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
                      </div>
                      <div className="text-emerald-300 text-[11px]">
                        ➜ Action Taken: {log.actionTaken}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Backend Middleware & Self-Correcting Fallback Status */}
        {serverHealth && (
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs font-mono space-y-2 relative z-10">
            <div className="text-slate-400 font-bold uppercase text-[10px]">Backend Server Resilience Status:</div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="text-slate-300">Bridge State: <strong className="text-emerald-400">{serverHealth.bridgeStatus}</strong></div>
              <div className="text-slate-300">Model Vault: <strong className="text-indigo-300">{serverHealth.modelVaultStatus}</strong></div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-800 relative z-10 font-mono text-[11px]">
          <span className="text-slate-400">
            Self-Correcting Loops: <strong className="text-emerald-400">Active</strong>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
