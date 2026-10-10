import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  X, 
  Wrench, 
  Sparkles, 
  Layers, 
  Terminal, 
  Zap, 
  Heart,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { EpisodeProject } from '../types';
import { auditAndHealProject } from '../utils/selfHealingEngine';

interface SelfHealingFloatingWidgetProps {
  project: EpisodeProject;
  onApplyHealedProject: (healed: EpisodeProject) => void;
}

export interface RealTimeHealLog {
  id: string;
  category: string;
  message: string;
  actionTaken: string;
  timestamp: string;
  type: 'heal' | 'workaround' | 'fix';
}

export const SelfHealingFloatingWidget: React.FC<SelfHealingFloatingWidgetProps> = ({
  project,
  onApplyHealedProject
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [logs, setLogs] = useState<RealTimeHealLog[]>([]);
  const [repairedCount, setRepairedCount] = useState<number>(0);
  const [bypassedErrorsCount, setBypassedErrorsCount] = useState<number>(0);
  const [healthScore, setHealthScore] = useState<number>(100);
  const [isFlashActive, setIsFlashActive] = useState<boolean>(false);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  
  const consoleEndRef = useRef<HTMLDivElement | null>(null);

  // Load initial logs
  useEffect(() => {
    // Standard initial healthy diagnostic log
    setLogs([
      {
        id: 'init-1',
        category: 'Runtime',
        message: 'AI Autopilot Guard Core v3.4 initialized.',
        actionTaken: 'Listening for live mecha anime generation cycles and API pipelines.',
        timestamp: new Date().toLocaleTimeString(),
        type: 'heal'
      }
    ]);
  }, []);

  // Listen to Custom Events for real-time self-healing logs
  useEffect(() => {
    const handleHealLog = (e: Event) => {
      if (!isActive) return; // Do not register if guard is disabled

      const customEvent = e as CustomEvent<{
        category: string;
        message: string;
        actionTaken: string;
        timestamp: string;
        type?: 'heal' | 'workaround' | 'fix';
      }>;

      const { category, message, actionTaken, timestamp, type = 'heal' } = customEvent.detail;

      const newLog: RealTimeHealLog = {
        id: `log-${Date.now()}-${Math.random()}`,
        category,
        message,
        actionTaken,
        timestamp,
        type
      };

      setLogs(prev => [...prev.slice(-39), newLog]); // Keep last 40 logs
      
      if (type === 'workaround') {
        setBypassedErrorsCount(prev => prev + 1);
      } else {
        setRepairedCount(prev => prev + 1);
      }

      // Trigger temporary glowing effect
      setIsFlashActive(true);
      setTimeout(() => setIsFlashActive(false), 1500);
    };

    window.addEventListener('ai-self-heal-log', handleHealLog);
    return () => {
      window.removeEventListener('ai-self-heal-log', handleHealLog);
    };
  }, [isActive]);

  // Periodic auto-audit scan (every 10 seconds to keep structures fresh)
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setIsAuditing(true);
      setTimeout(() => {
        try {
          const result = auditAndHealProject(project);
          if (result.fixedIssuesCount > 0) {
            onApplyHealedProject(result.healedProject);
            
            // Log the automatic audit correction
            result.healLogs.forEach(log => {
              const event = new CustomEvent('ai-self-heal-log', {
                detail: {
                  category: log.category,
                  message: log.message,
                  actionTaken: log.actionTaken,
                  timestamp: log.timestamp,
                  type: 'heal' as const
                }
              });
              window.dispatchEvent(event);
            });
          }
          setHealthScore(result.healthScore);
        } catch (err) {
          console.error('[Background Audit Error]', err);
        } finally {
          setIsAuditing(false);
        }
      }, 600);
    }, 15000); // 15s scan

    return () => clearInterval(interval);
  }, [project, isActive, onApplyHealedProject]);

  // Scroll to bottom of log stream
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen]);

  // Trigger manual deep heal and repair of project data structures
  const handleDeepHealAndRepair = () => {
    setIsAuditing(true);
    setTimeout(() => {
      const result = auditAndHealProject(project);
      onApplyHealedProject(result.healedProject);
      setHealthScore(result.healthScore);
      setIsAuditing(false);

      const timestamp = new Date().toLocaleTimeString();
      const repairLog: RealTimeHealLog = {
        id: `repair-${Date.now()}`,
        category: 'Runtime',
        message: `Manual deep heal sweep finished. Checked ${project.shots.length} shots and ${project.cast.length} characters.`,
        actionTaken: result.fixedIssuesCount > 0 
          ? `Corrected ${result.fixedIssuesCount} inconsistencies successfully.` 
          : 'All mecha data modules are already 100% healthy.',
        timestamp,
        type: 'fix'
      };

      setLogs(prev => [...prev, repairLog]);
      if (result.fixedIssuesCount > 0) {
        setRepairedCount(prev => prev + result.fixedIssuesCount);
      }

      setIsFlashActive(true);
      setTimeout(() => setIsFlashActive(false), 1000);
    }, 800);
  };

  return (
    <div 
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        isOpen ? 'w-96' : 'w-auto'
      }`} 
      id="self-healing-autopilot-widget"
    >
      {/* 🛡️ Collapsed Trigger Bubble */}
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className={`relative p-3.5 rounded-full flex items-center justify-center border shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer ${
            isActive 
              ? 'bg-slate-900 border-emerald-500/50 text-emerald-400 shadow-emerald-500/20' 
              : 'bg-slate-950 border-slate-800 text-slate-500'
          } ${isFlashActive ? 'ring-4 ring-emerald-400/30 bg-emerald-950/40 text-emerald-300' : ''}`}
          title="Open AI Autopilot Self-Healing Monitor"
        >
          {/* Active Pulse Animation */}
          {isActive && (
            <span className="absolute top-0 right-0 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          )}
          <ShieldCheck className={`w-6 h-6 ${isAuditing ? 'animate-spin' : ''}`} />
          
          {/* Unread corrections counter overlay */}
          {(repairedCount + bypassedErrorsCount) > 0 && (
            <span className="absolute -bottom-1.5 -left-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border border-slate-950 font-mono shadow">
              {repairedCount + bypassedErrorsCount}
            </span>
          )}
        </button>
      ) : (
        /* 📟 Fully Expanded HUD Dashboard Overlay */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 overflow-hidden relative border-emerald-500/30 animate-fadeIn flex flex-col max-h-[500px]">
          {/* Neon Grid Ambient Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          
          {/* HUD Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 relative z-10">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-400">
                <ShieldCheck className={`w-4 h-4 ${isAuditing ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono flex items-center gap-1">
                  <span>AI Autopilot Shield</span>
                  {isActive && <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />}
                </h4>
                <p className="text-[10px] text-slate-400 font-sans">Real-time error healing &amp; bypass engine</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Toggle switch */}
              <button
                onClick={() => setIsActive(!isActive)}
                className={`text-[9px] font-mono font-bold px-2 py-1 rounded transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-emerald-950 border border-emerald-800 text-emerald-300' 
                    : 'bg-slate-950 border border-slate-850 text-slate-500'
                }`}
                title={isActive ? "Disable Auto-Healing" : "Enable Auto-Healing"}
              >
                {isActive ? 'ACTIVE' : 'MUTED'}
              </button>
              
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-0.5 bg-slate-800/50 hover:bg-slate-800 rounded-lg cursor-pointer transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2 font-mono text-[10px] relative z-10">
            <div className="bg-slate-950 border border-slate-850 p-2 rounded-xl text-center">
              <span className="text-slate-500 block uppercase text-[8px]">Repaired</span>
              <span className="text-emerald-400 font-bold block text-xs mt-0.5">{repairedCount}</span>
            </div>
            <div className="bg-slate-950 border border-slate-850 p-2 rounded-xl text-center">
              <span className="text-slate-500 block uppercase text-[8px]">Bypassed</span>
              <span className="text-cyan-400 font-bold block text-xs mt-0.5">{bypassedErrorsCount}</span>
            </div>
            <div className="bg-slate-950 border border-slate-850 p-2 rounded-xl text-center">
              <span className="text-slate-500 block uppercase text-[8px]">Integrity</span>
              <span className="text-amber-300 font-bold block text-xs mt-0.5">{healthScore}%</span>
            </div>
          </div>

          {/* Live Action Stream Terminal */}
          <div className="flex-1 overflow-hidden flex flex-col space-y-1.5">
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-500">
              <span className="flex items-center gap-1">
                <Terminal className="w-3 h-3 text-emerald-400 animate-pulse" />
                AUTO-HEAL DIAGNOSTIC FEED
              </span>
              <button 
                onClick={() => setLogs([])}
                className="hover:text-slate-400 hover:underline"
              >
                CLEAR
              </button>
            </div>

            <div className="bg-slate-950 rounded-2xl border border-slate-850 p-3 h-48 overflow-y-auto font-mono text-[9px] space-y-2 leading-relaxed scrollbar-thin select-none">
              {logs.length === 0 ? (
                <div className="text-slate-600 text-center py-10">Waiting for generation activities...</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="border-b border-slate-900/40 pb-1.5 animate-fadeIn">
                    <div className="flex justify-between items-center text-[8px] text-slate-500">
                      <span className={`font-bold uppercase ${
                        log.type === 'workaround' ? 'text-cyan-400' : (log.type === 'fix' ? 'text-amber-400' : 'text-emerald-400')
                      }`}>
                        [{log.category}]
                      </span>
                      <span>{log.timestamp}</span>
                    </div>
                    <p className="text-slate-300 mt-0.5">{log.message}</p>
                    <p className="text-emerald-300 mt-0.5 font-bold">➜ Action: {log.actionTaken}</p>
                  </div>
                ))
              )}
              <div ref={consoleEndRef} />
            </div>
          </div>

          {/* Quick Active Protection Banner & Action */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between relative z-10 text-[9px] font-mono">
            <span className="text-slate-400 flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-rose-500 animate-pulse shrink-0" />
              <span>Real-Time Healing Guard: <strong className={isActive ? "text-emerald-400" : "text-slate-500"}>{isActive ? "ACTIVE" : "MUTED"}</strong></span>
            </span>
            
            <button
              onClick={handleDeepHealAndRepair}
              disabled={isAuditing}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold shadow hover:shadow-emerald-500/10 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
            >
              <Wrench className={`w-3 h-3 text-slate-950 ${isAuditing ? 'animate-spin' : ''}`} />
              <span>Deep Scan</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
