import React from 'react';
import { 
  HardDrive, 
  AlertTriangle, 
  Save, 
  Trash2, 
  X, 
  CheckCircle2, 
  RefreshCw,
  FileCode,
  ArrowRight
} from 'lucide-react';

interface AutoSaveDialogProps {
  isOpen: boolean;
  targetTabName: string;
  projectTitle: string;
  onSaveAndProceed: () => void;
  onDiscardAndProceed: () => void;
  onCancel: () => void;
}

export const AutoSaveDialog: React.FC<AutoSaveDialogProps> = ({
  isOpen,
  targetTabName,
  projectTitle,
  onSaveAndProceed,
  onDiscardAndProceed,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative overflow-hidden space-y-6">
        {/* Glow backdrop effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Title Bar */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-amber-950/80 border border-amber-500/50 text-amber-400 shadow-lg shadow-amber-500/10">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 uppercase tracking-wider">
                  Session Auto-Save Alert
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-100 tracking-tight mt-0.5">
                Unsynced Changes Pending
              </h3>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-all"
            title="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dialog Body Message */}
        <div className="space-y-4 text-xs text-slate-300 relative z-10">
          <p className="leading-relaxed">
            You are switching to the <strong className="text-cyan-300 uppercase tracking-wider">{targetTabName}</strong> tab, but you have unsaved edits in <strong className="text-slate-100 font-bold">"{projectTitle}"</strong> that have not been committed to your browser's local storage session cache.
          </p>

          <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 space-y-2 font-mono">
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/80 pb-2">
              <span className="flex items-center space-x-1.5">
                <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                <span>Session Storage Target:</span>
              </span>
              <span className="text-slate-200 font-bold">anime_suite_project</span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Sync Action Required:</span>
              <span className="text-amber-300 font-bold">Commit & Write Snapshot</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 italic">
            Would you like to auto-save these session changes now before switching tabs?
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2 border-t border-slate-800 relative z-10">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all text-center"
          >
            Stay on Current Tab
          </button>

          <button
            onClick={onDiscardAndProceed}
            className="px-4 py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Discard & Switch</span>
          </button>

          <button
            onClick={onSaveAndProceed}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-emerald-500 hover:opacity-95 text-white text-xs font-extrabold shadow-xl shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Auto-Save & Proceed</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
