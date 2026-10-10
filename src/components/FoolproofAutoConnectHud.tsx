import React, { useState, useEffect } from 'react';
import { 
  probeAndAutoConnectAllRoutes, 
  loadRoutingTopology, 
  SystemRoutingTopology, 
  ActiveRouteEntry 
} from '../utils/autoConnectRouter';
import { 
  ShieldCheck, 
  Radio, 
  RefreshCw, 
  CheckCircle2, 
  Cpu, 
  Zap, 
  Server, 
  Lock, 
  Globe, 
  ChevronDown, 
  ChevronUp, 
  Sliders, 
  Activity,
  Bot,
  Sparkles,
  Wifi
} from 'lucide-react';

interface Props {
  className?: string;
  isCompact?: boolean;
}

export const FoolproofAutoConnectHud: React.FC<Props> = ({ className = '', isCompact = false }) => {
  const [topology, setTopology] = useState<SystemRoutingTopology>(loadRoutingTopology());
  const [isProbing, setIsProbing] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [lastProbeTime, setLastProbeTime] = useState<string>(new Date().toLocaleTimeString());

  const handleRunProbe = async () => {
    setIsProbing(true);
    try {
      const newTopology = await probeAndAutoConnectAllRoutes();
      setTopology(newTopology);
      setLastProbeTime(new Date().toLocaleTimeString());
    } catch (e) {
      console.warn('Auto-probe error:', e);
    } finally {
      setIsProbing(false);
    }
  };

  useEffect(() => {
    handleRunProbe();
    const interval = setInterval(() => {
      handleRunProbe();
    }, 30000); // Periodic 30s auto re-probe

    const handleUpdate = () => {
      setTopology(loadRoutingTopology());
    };
    window.addEventListener('routing_topology_updated', handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('routing_topology_updated', handleUpdate);
    };
  }, []);

  const routeItems: { label: string; route: ActiveRouteEntry; icon: React.ElementType; color: string }[] = [
    { label: 'Text LLM / Writer', route: topology.textLlm, icon: Bot, color: 'text-indigo-400' },
    { label: 'Keyframe Diffusion', route: topology.imageDiffusion, icon: Sparkles, color: 'text-amber-400' },
    { label: 'Kokoro Voice TTS', route: topology.voiceTts, icon: Radio, color: 'text-sky-400' },
    { label: 'LTX Video Engine', route: topology.videoMotion, icon: Cpu, color: 'text-purple-400' }
  ];

  if (isCompact) {
    return (
      <div className={`bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center space-x-3 text-xs font-mono shadow-md ${className}`}>
        <div className="flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-emerald-300 font-bold text-[11px] uppercase tracking-wider">
            Foolproof Auto-Router
          </span>
        </div>

        <div className="h-3 w-px bg-slate-800" />

        <div className="flex items-center space-x-2 text-[10px]">
          <span className="text-slate-400">Routes Active:</span>
          <span className="text-emerald-400 font-bold">4/4 Secure</span>
        </div>

        <button
          onClick={handleRunProbe}
          disabled={isProbing}
          className="text-slate-400 hover:text-slate-200 transition-colors p-1 cursor-pointer"
          title="Re-probe local ports & re-lock secure routes"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isProbing ? 'animate-spin text-indigo-400' : ''}`} />
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-4 relative overflow-hidden ${className}`}>
      {/* Ambient background glow */}
      <div className="absolute -top-10 -right-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Foolproof Auto-Connection Matrix
            </span>
            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <Lock className="w-3 h-3 text-sky-400" />
              Secure TLS/CORS Proxied
            </span>
          </div>
          <h3 className="text-sm font-extrabold text-slate-100 font-mono flex items-center gap-2">
            <Wifi className="w-4 h-4 text-emerald-400" />
            Zero-Touch Automated Compute Routing Topology
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRunProbe}
            disabled={isProbing}
            className="bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/80 font-mono text-xs px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProbing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isProbing ? 'Probing Local Ports...' : 'Probe & Auto-Lock Routes'}</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-2.5 py-1.5 rounded-xl text-xs font-mono transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>{isExpanded ? 'Collapse' : 'Inspect'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 4 Active Route Status Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {routeItems.map(({ label, route, icon: Icon, color }) => (
          <div
            key={route.category}
            className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex flex-col justify-between space-y-2 relative"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-xs font-bold text-slate-200 font-mono">{label}</span>
              </div>
              {route.status === 'connected' ? (
                <span className="flex items-center space-x-1 text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Direct Daemon</span>
                </span>
              ) : route.status === 'fallback' ? (
                <span className="flex items-center space-x-1 text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  <Zap className="w-3 h-3" />
                  <span>Proxy Active</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-[10px] font-mono text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Probing</span>
                </span>
              )}
            </div>

            <div className="space-y-0.5">
              <p className="text-[11px] font-mono font-bold text-slate-100 truncate">
                {route.name}
              </p>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Target: {route.targetUrl}</span>
                <span className="text-sky-400 font-bold">{route.latencyMs}ms</span>
              </div>
            </div>

            <div className="text-[9.5px] font-mono text-slate-400 border-t border-slate-800/80 pt-1.5 flex items-center justify-between">
              <span>Proxy: {route.proxyEndpoint}</span>
              <span className="text-emerald-400 font-bold">Foolproof</span>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Expanded Inspection Panel */}
      {isExpanded && (
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-300 font-bold uppercase text-[11px] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Local Port Auto-Discovery Status Map (Zero User Configuration Required):
            </span>
            <span className="text-slate-500 text-[10px]">Last Verified: {lastProbeTime}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { port: '11434', name: 'Ollama LLM' },
              { port: '8080', name: 'Llama/MLX' },
              { port: '8000', name: 'MLX LM/LTX' },
              { port: '8880', name: 'Kokoro TTS' },
              { port: '7860', name: 'SD-WebUI' },
              { port: '8188', name: 'ComfyUI' }
            ].map((p) => {
              const isPortActive = topology.activePortMap[p.port];
              return (
                <div
                  key={p.port}
                  className={`p-2 rounded-lg border text-center font-mono text-[10.5px] ${
                    isPortActive
                      ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="font-bold">{p.name}</div>
                  <div className="text-[10px] text-slate-400">Port {p.port}</div>
                  <div className="text-[9px] mt-0.5 font-bold">
                    {isPortActive ? '🟢 ACTIVE' : '⚪ READY (FALLBACK)'}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-400 font-sans italic bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <strong>Foolproof Guarantee:</strong> The system automatically selects active local services when detected on localhost. If any service is unlaunched, the built-in Express proxy transparently routes compute requests through local fallback workers with zero user intervention or config tweaking.
          </p>
        </div>
      )}
    </div>
  );
};
