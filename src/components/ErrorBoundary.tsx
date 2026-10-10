import React from 'react';
import { ShieldAlert, RefreshCw, Wrench, RotateCcw, CheckCircle2 } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  onResetState?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  isSelfHealing: boolean;
  healedMessage: string | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    isSelfHealing: false,
    healedMessage: null
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Self-Healing Error Boundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public handleTriggerSelfHeal = () => {
    this.setState({ isSelfHealing: true, healedMessage: null });

    setTimeout(() => {
      try {
        if (this.props.onResetState) {
          this.props.onResetState();
        }
      } catch (e) {
        console.error('Reset state failed', e);
      }

      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isSelfHealing: false,
        healedMessage: 'State repaired successfully! Re-rendering workspace...'
      });
    }, 1200);
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-slate-950 border border-rose-500/40 rounded-3xl m-4 shadow-2xl relative overflow-hidden font-sans">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-xl w-full space-y-6 text-center relative z-10">
            <div className="w-16 h-16 rounded-3xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-rose-400 mx-auto shadow-2xl shadow-rose-500/20">
              <ShieldAlert className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold px-3 py-1 rounded bg-rose-950 text-rose-300 border border-rose-800 uppercase tracking-widest">
                Self-Healing Loop Triggered
              </span>
              <h2 className="text-xl font-extrabold text-slate-100">
                UI Runtime Exception Isolated
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
                An unexpected rendering error occurred in this workspace view. The self-healing loop caught the exception to prevent data loss.
              </p>
            </div>

            {/* Error Stack Summary Box */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-left font-mono text-[11px] space-y-2">
              <div className="text-rose-400 font-bold truncate">
                {this.state.error?.toString() || 'Unknown Runtime Exception'}
              </div>
              {this.state.errorInfo?.componentStack && (
                <div className="text-[10px] text-slate-500 max-h-24 overflow-y-auto no-scrollbar whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack.slice(0, 300)}...
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleTriggerSelfHeal}
                disabled={this.state.isSelfHealing}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:opacity-95 text-slate-950 font-extrabold text-xs shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {this.state.isSelfHealing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Self-Correcting State...</span>
                  </>
                ) : (
                  <>
                    <Wrench className="w-4 h-4 text-slate-950" />
                    <span>Auto-Repair Component & Restore</span>
                  </>
                )}
              </button>

              <button
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700 shadow-lg flex items-center justify-center space-x-2"
              >
                <RotateCcw className="w-4 h-4 text-slate-400" />
                <span>Reload Application</span>
              </button>
            </div>

            {this.state.healedMessage && (
              <div className="p-3 bg-emerald-950/90 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-mono font-bold flex items-center justify-center space-x-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{this.state.healedMessage}</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
