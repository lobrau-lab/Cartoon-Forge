import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Cpu, 
  Zap, 
  Play, 
  Pause, 
  RefreshCw, 
  HardDrive, 
  Send, 
  Radio, 
  CheckCircle2, 
  Clock, 
  FileCode, 
  Sliders, 
  MessageSquare,
  Sparkles,
  Bot,
  Activity,
  Layers,
  ChevronRight,
  ShieldCheck,
  FolderOpen
} from 'lucide-react';
import { EpisodeProject } from '../types';

interface GoAgentHarnessTerminalProps {
  project?: EpisodeProject;
  onUpdateProject?: (updates: Partial<EpisodeProject>) => void;
}

interface HarnessStatus {
  success: boolean;
  is_alive: boolean;
  loop_active: boolean;
  uptime_seconds: number;
  tick_counter: number;
  wait_interval_sec: number;
  active_model: string;
  active_server_url: string;
  loaded_model: {
    filename: string;
    path: string;
    sizeBytes: number;
    format: string;
    isLoaded: boolean;
  };
  discovered_models: Array<{
    filename: string;
    path: string;
    sizeBytes: number;
    format: string;
    isLoaded: boolean;
  }>;
  memory_allocated_mb: number;
  cpu_threads_active: number;
  go_version: string;
  harness_binary: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: string;
  source: string;
  message: string;
}

export const GoAgentHarnessTerminal: React.FC<GoAgentHarnessTerminalProps> = ({
  project,
  onUpdateProject
}) => {
  const [status, setStatus] = useState<HarnessStatus | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [selectedModelTarget, setSelectedModelTarget] = useState<string>('qwen2.5-7b-instruct-q4_k_m.gguf');
  const [waitIntervalInput, setWaitIntervalInput] = useState<number>(5);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Poll Go Agent Harness Status & Logs
  const fetchStatusAndLogs = async () => {
    try {
      const [statusRes, logsRes] = await Promise.all([
        fetch('/api/go-harness/status').then(r => r.json()).catch(() => null),
        fetch('/api/go-harness/logs').then(r => r.json()).catch(() => null)
      ]);

      if (statusRes && statusRes.success) {
        setStatus(statusRes);
        if (statusRes.active_model) {
          setSelectedModelTarget(statusRes.active_model);
        }
        if (statusRes.wait_interval_sec) {
          setWaitIntervalInput(statusRes.wait_interval_sec);
        }
      }

      if (logsRes && logsRes.logs) {
        setLogs(logsRes.logs);
      }
    } catch (err) {
      console.warn('Failed to fetch Go harness status:', err);
    }
  };

  useEffect(() => {
    fetchStatusAndLogs();
    const interval = setInterval(fetchStatusAndLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // Handle Pick Model
  const handleLoadModel = async (modelName: string) => {
    setIsExecuting(true);
    try {
      const isServer = modelName.startsWith('http://') || modelName.startsWith('https://');
      const res = await fetch('/api/go-harness/load-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelTarget: modelName, isServerEndpoint: isServer })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedModelTarget(modelName);
        fetchStatusAndLogs();
      }
    } catch (err) {
      console.error('Failed to load model in harness:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  // Handle Toggle Loop & Interval
  const handleToggleLoop = async (loopActive: boolean, intervalSec?: number) => {
    try {
      const res = await fetch('/api/go-harness/toggle-loop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loopActive,
          waitIntervalSec: intervalSec ?? waitIntervalInput
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchStatusAndLogs();
      }
    } catch (err) {
      console.error('Failed to toggle loop:', err);
    }
  };

  // Handle Interactive Command Prompt Send
  const handleSendCommand = async (cmdToSend?: string) => {
    const text = (cmdToSend || inputText).trim();
    if (!text) return;

    setInputText('');
    setIsExecuting(true);

    try {
      const res = await fetch('/api/go-harness/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: text,
          context: project ? `Series: ${project.seriesTitle} | Episode: ${project.title}` : 'Anime Studio Project'
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchStatusAndLogs();
      }
    } catch (err) {
      console.error('Command execution failed:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  const formatUptime = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner & Go Harness Status Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-500/40 p-2.5 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <Terminal className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-mono font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  GO BACKEND AGENT HARNESS 24/7
                </span>
                <span className="text-xs font-mono text-slate-400 border border-slate-800 bg-slate-900 px-2 py-0.5 rounded">
                  {status?.go_version || 'go1.22.2 linux/amd64'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-100 mt-1 flex items-center gap-2">
                <span>Real-Time Model Harness &amp; Command Prompt</span>
              </h2>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-xs text-slate-300 flex items-center space-x-2">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Uptime: <strong className="text-emerald-400">{formatUptime(status?.uptime_seconds || 0)}</strong></span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-xs text-slate-300 flex items-center space-x-2">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ticker Beats: <strong className="text-cyan-400">{status?.tick_counter || 0}</strong></span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-xs text-slate-300 flex items-center space-x-2">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>Mem: <strong className="text-purple-300">{status?.memory_allocated_mb || 148.5} MB</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Model Picker & 24/7 Loop Wait Behaviors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Model Picker from Disk File or Server */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
          <label className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <HardDrive className="w-4 h-4" />
              MODEL FILE / SERVER PICKER
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Pick straight out of disk/server</span>
          </label>
          <div className="flex items-center space-x-2">
            <select
              value={selectedModelTarget}
              onChange={(e) => handleLoadModel(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <optgroup label="Local Model Files (/models)">
                {(status?.discovered_models || []).map((m, idx) => (
                  <option key={idx} value={m.filename}>
                    {m.filename} ({(m.sizeBytes / 1024 / 1024 / 1024).toFixed(2)} GB, {m.format}) {m.isLoaded ? '★ LOADED' : ''}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Local Server Endpoints">
                <option value="http://127.0.0.1:8080">http://127.0.0.1:8080 (llama-server / GGUF)</option>
                <option value="http://127.0.0.1:8000">http://127.0.0.1:8000 (mlx_lm server)</option>
                <option value="http://127.0.0.1:11434">http://127.0.0.1:11434 (Ollama Server)</option>
              </optgroup>
            </select>
            <button
              onClick={() => handleLoadModel(selectedModelTarget)}
              disabled={isExecuting}
              className="px-3 py-2 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-xs font-mono font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isExecuting ? 'animate-spin' : ''}`} />
              <span>Load</span>
            </button>
          </div>
          <div className="text-[11px] font-mono text-slate-400 truncate">
            Active Loaded: <span className="text-cyan-300 font-bold">{status?.active_model || 'qwen2.5-7b-instruct-q4_k_m.gguf'}</span>
          </div>
        </div>

        {/* 24/7 Keep-Alive & Loop Wait Interval */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
          <label className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Radio className="w-4 h-4" />
              24/7 LOOP &amp; WAIT BEHAVIORS
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">
              {status?.loop_active ? 'LOOP ACTIVE' : 'LOOP PAUSED'}
            </span>
          </label>
          
          <div className="flex items-center space-x-3 pt-1">
            <button
              onClick={() => handleToggleLoop(!status?.loop_active)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-mono font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                status?.loop_active
                  ? 'bg-emerald-950 border-emerald-700 text-emerald-300 hover:bg-emerald-900'
                  : 'bg-rose-950 border-rose-800 text-rose-300 hover:bg-rose-900'
              }`}
            >
              {status?.loop_active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{status?.loop_active ? 'Pause Loop' : 'Resume 24/7 Loop'}</span>
            </button>

            <div className="flex-1 flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
              <span className="text-[10px] font-mono text-slate-400">Wait:</span>
              <input
                type="number"
                min={1}
                max={60}
                value={waitIntervalInput}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 5;
                  setWaitIntervalInput(val);
                  handleToggleLoop(status?.loop_active ?? true, val);
                }}
                className="w-12 bg-transparent text-xs font-mono text-cyan-300 font-bold focus:outline-none"
              />
              <span className="text-[10px] font-mono text-slate-400">sec</span>
            </div>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Ticker Routine: <span className="text-slate-300">time.NewTicker({waitIntervalInput}s) background goroutine</span>
          </div>
        </div>

        {/* Built-In Helper Agents Status */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
          <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5 text-purple-400">
            <Bot className="w-4 h-4" />
            BUILT-IN HELPER AGENTS
          </label>
          <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono pt-0.5">
            <span className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-purple-300 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Script Doctor
            </span>
            <span className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-cyan-300 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Keyframe Diffuser
            </span>
            <span className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-amber-300 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Kokoro Voice
            </span>
            <span className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Timeline Director
            </span>
          </div>
        </div>
      </div>

      {/* Main Command Prompt Window (Retro CRT / Hacker Terminal) */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Terminal Titlebar */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-xs font-mono text-slate-300 font-bold flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-emerald-400" />
              go-agent-harness --model={status?.active_model || 'qwen2.5-7b-instruct.gguf'} --port=8090
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-1.5 text-xs font-mono text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
              />
              <span>Auto-Scroll</span>
            </label>
            <button
              onClick={fetchStatusAndLogs}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1"
              title="Refresh Terminal Output"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Real-time Terminal Log Screen */}
        <div className="h-96 overflow-y-auto p-4 font-mono text-xs space-y-2 bg-slate-950/95 selection:bg-emerald-500 selection:text-slate-950">
          <div className="text-slate-500 pb-2 border-b border-slate-900 text-[11px]">
            # Go Agent Harness v2.4.0 (Interactive Command Prompt Active)<br/>
            # Loaded Model: {status?.active_model || 'qwen2.5-7b-instruct-q4_k_m.gguf'} | Loop: {status?.loop_active ? 'RUNNING 24/7' : 'PAUSED'}<br/>
            # Type commands below or click suggestions to talk to the loaded model in real time.
          </div>

          {logs.slice().reverse().map((logItem, idx) => {
            let lvlColor = 'text-slate-300';
            let bgGlow = '';

            if (logItem.level === 'EXEC') {
              lvlColor = 'text-cyan-400 font-bold';
              bgGlow = 'bg-cyan-950/30 border-l-2 border-cyan-500 pl-2';
            } else if (logItem.level === 'AGENT' || logItem.level === 'MODEL_RESPONSE') {
              lvlColor = 'text-emerald-400 font-bold';
              bgGlow = 'bg-emerald-950/30 border-l-2 border-emerald-500 pl-2 my-1.5 py-1';
            } else if (logItem.level === 'MODEL_PICKER') {
              lvlColor = 'text-purple-300 font-bold';
            } else if (logItem.level === 'WARN') {
              lvlColor = 'text-amber-400';
            }

            return (
              <div key={logItem.id || idx} className={`flex items-start space-x-2 ${bgGlow}`}>
                <span className="text-slate-600 select-none text-[10px] pt-0.5">{logItem.timestamp}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded border border-slate-800 bg-slate-900 ${lvlColor}`}>
                  {logItem.source || logItem.level}
                </span>
                <span className={`flex-1 whitespace-pre-wrap leading-relaxed ${lvlColor}`}>
                  {logItem.message}
                </span>
              </div>
            );
          })}
          <div ref={terminalEndRef} />
        </div>

        {/* Quick Suggestion Command Chips */}
        <div className="bg-slate-900/60 border-t border-slate-800 px-4 py-2 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Quick Commands:</span>
          <button
            onClick={() => handleSendCommand('/status')}
            disabled={isExecuting}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 rounded-lg text-[11px] font-mono cursor-pointer transition-all"
          >
            /status
          </button>
          <button
            onClick={() => handleSendCommand('/scan')}
            disabled={isExecuting}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-purple-300 rounded-lg text-[11px] font-mono cursor-pointer transition-all"
          >
            /scan models
          </button>
          <button
            onClick={() => handleSendCommand('Run script doctoring loop on active episode screenplay')}
            disabled={isExecuting}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 rounded-lg text-[11px] font-mono cursor-pointer transition-all"
          >
            Doctor Screenplay
          </button>
          <button
            onClick={() => handleSendCommand('Diffuse Sakuga keyframe shot at 24fps')}
            disabled={isExecuting}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-300 rounded-lg text-[11px] font-mono cursor-pointer transition-all"
          >
            Diffuse Keyframe
          </button>
          <button
            onClick={() => handleSendCommand('Synthesize Japanese character dialogue track')}
            disabled={isExecuting}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-rose-300 rounded-lg text-[11px] font-mono cursor-pointer transition-all"
          >
            Synthesize Dub
          </button>
        </div>

        {/* Interactive Input Box */}
        <div className="bg-slate-900 p-3 border-t border-slate-800 flex items-center space-x-3">
          <div className="text-emerald-400 font-mono font-bold text-sm flex items-center space-x-1">
            <ChevronRight className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>$</span>
          </div>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendCommand();
              }
            }}
            placeholder={`Talk to ${status?.active_model || 'model'} in real time as it orchestrates in the background...`}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={() => handleSendCommand()}
            disabled={isExecuting || !inputText.trim()}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-slate-950 font-mono font-bold text-xs rounded-xl flex items-center space-x-2 cursor-pointer transition-all disabled:opacity-50 shadow-md shadow-emerald-500/20"
          >
            {isExecuting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Execute</span>
          </button>
        </div>
      </div>
    </div>
  );
};
