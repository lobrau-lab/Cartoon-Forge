import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Server, 
  Cpu, 
  Film, 
  Bot, 
  Sparkles, 
  Radio, 
  Clock, 
  Layers, 
  ExternalLink, 
  Sliders, 
  Zap, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  Plus, 
  Trash2, 
  Edit2, 
  Terminal, 
  ShieldCheck, 
  Settings2,
  HardDrive
} from 'lucide-react';
import { 
  ServiceTelemetry, 
  ServiceDiagnosticModel,
  loadConfiguredServices, 
  saveConfiguredServices, 
  pingService, 
  probeAllServices, 
  configureForInstalledOllamaAndLtx2, 
  exportDiagnosticsReport 
} from '../utils/serviceDiagnosticsEngine';

export const LocalConnectionDiagnosticsPanel: React.FC = () => {
  const [services, setServices] = useState<ServiceTelemetry[]>(() => loadConfiguredServices());
  const [isProbingAll, setIsProbingAll] = useState<boolean>(false);
  const [autoPingInterval, setAutoPingInterval] = useState<number>(10); // seconds, 0 = off
  const [secondsUntilNextPing, setSecondsUntilNextPing] = useState<number>(10);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'dense'>('cards');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showAddCustomModal, setShowAddCustomModal] = useState<boolean>(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editingUrl, setEditingUrl] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: 'success' | 'info' } | null>(null);
  const [showConsoleLogs, setShowConsoleLogs] = useState<boolean>(false);
  const [consoleLogs, setConsoleLogs] = useState<Array<{ id: string; time: string; text: string; type: 'info' | 'success' | 'warn' | 'error' }>>([
    { id: '1', time: new Date().toLocaleTimeString(), text: 'Connection Diagnostics Engine initialized. Ready for telemetry stream.', type: 'info' }
  ]);

  // Form state for adding custom service
  const [customName, setCustomName] = useState('');
  const [customUrl, setCustomUrl] = useState('http://127.0.0.1:');
  const [customType, setCustomType] = useState<'custom' | 'ollama' | 'ltx-video' | 'diffusion' | 'voice_tts'>('custom');
  const [customCategory, setCustomCategory] = useState<'text_llm' | 'video_motion' | 'image_diffusion' | 'voice_tts' | 'custom'>('custom');

  const addLog = (text: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    setConsoleLogs(prev => [
      { id: Math.random().toString(36).substring(2, 9), time: new Date().toLocaleTimeString(), text, type },
      ...prev.slice(0, 49)
    ]);
  };

  const showToast = (title: string, desc: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    showToast('Copied to Clipboard', label, 'info');
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Run ping on single service
  const handlePingSingle = async (service: ServiceTelemetry) => {
    addLog(`[PING] Pinging ${service.name} at ${service.url}...`, 'info');
    const updated = await pingService(service);
    setServices(prev => {
      const next = prev.map(s => (s.id === updated.id ? updated : s));
      saveConfiguredServices(next);
      return next;
    });

    if (updated.status === 'online') {
      addLog(`[OK] ${service.name} responded in ${updated.currentLatencyMs}ms (${updated.models.length} models detected).`, 'success');
    } else {
      addLog(`[FAIL] ${service.name} offline: ${updated.statusMessage}`, 'error');
    }
  };

  // Run batch probe on all services
  const handleProbeAll = async () => {
    setIsProbingAll(true);
    addLog(`[BATCH PROBE] Initiating simultaneous diagnostic sweep on ${services.length} services...`, 'info');
    try {
      const updated = await probeAllServices(services);
      setServices(updated);
      const onlineCount = updated.filter(s => s.status === 'online').length;
      addLog(`[BATCH COMPLETE] ${onlineCount}/${updated.length} services responded with valid handshake.`, onlineCount === updated.length ? 'success' : 'warn');
      showToast('Diagnostics Complete', `${onlineCount} of ${updated.length} services operational`, onlineCount === updated.length ? 'success' : 'info');
    } catch (e: any) {
      addLog(`[PROBE ERROR] Failed batch probe: ${e.message}`, 'error');
    } finally {
      setIsProbingAll(false);
      setSecondsUntilNextPing(autoPingInterval);
    }
  };

  // Preset configuration for installed LTX-2 & Ollama
  const handleApplyOllamaAndLtx2Preset = async () => {
    addLog('[CONFIG] Applying optimized settings for installed Ollama & LTX-2 video stack...', 'info');
    const { services: updated, ollamaModel, ltx2Model } = configureForInstalledOllamaAndLtx2(services);
    setServices(updated);
    showToast('Ollama & LTX-2 Configured', `Active text: ${ollamaModel}, Active video: ${ltx2Model}`, 'success');
    addLog(`[CONFIG COMPLETE] Linked Ollama (port 11434, ${ollamaModel}) and LTX-2 (port 8000, ${ltx2Model}). Running immediate diagnostics...`, 'success');
    
    // Immediately probe to verify
    setIsProbingAll(true);
    try {
      const verified = await probeAllServices(updated);
      setServices(verified);
    } finally {
      setIsProbingAll(false);
    }
  };

  // Auto-ping timer effect
  useEffect(() => {
    if (autoPingInterval <= 0) return;

    const timer = setInterval(() => {
      setSecondsUntilNextPing(prev => {
        if (prev <= 1) {
          handleProbeAll();
          return autoPingInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoPingInterval, services]);

  // Initial load probe
  useEffect(() => {
    handleProbeAll();
  }, []);

  // Save edited URL
  const handleSaveUrl = (serviceId: string) => {
    if (!editingUrl.trim()) return;
    const cleanUrl = editingUrl.trim().replace(/\/+$/, '');
    const updated = services.map(s => {
      if (s.id === serviceId) {
        return { ...s, url: cleanUrl };
      }
      return s;
    });
    setServices(updated);
    saveConfiguredServices(updated);
    setEditingServiceId(null);
    showToast('Service URL Updated', cleanUrl, 'success');
    addLog(`[CONFIG UPDATE] Updated URL for ${serviceId} to ${cleanUrl}. Pinging new endpoint...`, 'info');
    const target = updated.find(s => s.id === serviceId);
    if (target) {
      handlePingSingle(target);
    }
  };

  // Add custom service
  const handleAddCustomService = () => {
    if (!customName.trim() || !customUrl.trim()) return;
    const newService: ServiceTelemetry = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      serviceType: customType,
      category: customCategory,
      url: customUrl.trim().replace(/\/+$/, ''),
      enabled: true,
      isCustom: true,
      status: 'standby',
      statusMessage: 'Ready for initial diagnostic handshake',
      httpStatus: null,
      currentLatencyMs: 0,
      minLatencyMs: 0,
      maxLatencyMs: 0,
      avgLatencyMs: 0,
      jitterMs: 0,
      latencyHistory: [],
      uptimePct: 100,
      uptimeSeconds: 0,
      totalPings: 0,
      successfulPings: 0,
      failedPings: 0,
      consecutiveSuccesses: 0,
      consecutiveFailures: 0,
      lastSeen: 'Never',
      firstSeen: new Date().toLocaleTimeString(),
      models: [],
      activeModel: '',
      serverVersion: 'Custom Server',
      serverSpecs: 'User-defined local endpoint',
      endpointsTested: []
    };

    const updated = [...services, newService];
    setServices(updated);
    saveConfiguredServices(updated);
    setShowAddCustomModal(false);
    setCustomName('');
    setCustomUrl('http://127.0.0.1:');
    showToast('Custom Service Added', newService.name, 'success');
    addLog(`[CUSTOM SERVICE ADDED] ${newService.name} (${newService.url}). Pinging...`, 'info');
    handlePingSingle(newService);
  };

  // Remove custom service
  const handleRemoveCustomService = (serviceId: string) => {
    const updated = services.filter(s => s.id !== serviceId);
    setServices(updated);
    saveConfiguredServices(updated);
    showToast('Service Removed', 'Removed endpoint from diagnostic registry', 'info');
    addLog(`[SERVICE REMOVED] Removed service ${serviceId}`, 'info');
  };

  // Set active model for service
  const handleSetActiveModel = (service: ServiceTelemetry, modelName: string) => {
    const updated = services.map(s => {
      if (s.id === service.id) {
        return { ...s, activeModel: modelName };
      }
      return s;
    });
    setServices(updated);
    saveConfiguredServices(updated);

    // Sync with app-wide localStorage
    if (service.serviceType === 'ollama') {
      localStorage.setItem('ollama_active_model', modelName);
      localStorage.setItem('active_text_model', 'ollama');
    } else if (service.serviceType === 'ltx-video') {
      localStorage.setItem('active_video_model', modelName);
      localStorage.setItem('local_video_endpoint', service.url);
    } else if (service.serviceType === 'diffusion') {
      localStorage.setItem('local_diffusion_model', modelName);
      localStorage.setItem('active_image_model', modelName);
    }

    showToast('Active Model Bound', `${modelName} selected for ${service.name}`, 'success');
    addLog(`[MODEL SELECT] Bound active model "${modelName}" to ${service.name}`, 'success');
  };

  // Filter services
  const filteredServices = services.filter(s => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'ollama') return s.serviceType === 'ollama';
    if (selectedCategory === 'ltx-video') return s.serviceType === 'ltx-video';
    if (selectedCategory === 'diffusion') return s.serviceType === 'diffusion';
    if (selectedCategory === 'voice_tts') return s.serviceType === 'voice_tts';
    if (selectedCategory === 'custom') return s.isCustom;
    return true;
  });

  // Cluster calculations
  const onlineServices = services.filter(s => s.status === 'online');
  const avgClusterLatency = onlineServices.length > 0
    ? parseFloat((onlineServices.reduce((sum, s) => sum + s.currentLatencyMs, 0) / onlineServices.length).toFixed(1))
    : 0;
  const avgClusterUptime = services.length > 0
    ? parseFloat((services.reduce((sum, s) => sum + s.uptimePct, 0) / services.length).toFixed(1))
    : 100;

  // Latency color helper
  const getLatencyColor = (ms: number, status: string) => {
    if (status === 'offline') return 'text-rose-400 bg-rose-950/60 border-rose-800/60';
    if (ms <= 15) return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60';
    if (ms <= 50) return 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60';
    if (ms <= 150) return 'text-amber-400 bg-amber-950/60 border-amber-800/60';
    return 'text-rose-400 bg-rose-950/60 border-rose-800/60';
  };

  // Sparkline renderer
  const renderSparkline = (history: Array<{ latencyMs: number; status: 'ok' | 'error' }>) => {
    if (!history || history.length === 0) {
      return (
        <div className="h-9 w-full flex items-center justify-center text-[10px] text-slate-500 font-mono">
          No ping history yet
        </div>
      );
    }

    const maxVal = Math.max(...history.map(h => h.latencyMs), 25);
    const minVal = Math.max(0, Math.min(...history.map(h => h.latencyMs), 0));
    const range = maxVal - minVal || 1;
    const width = 140;
    const height = 32;

    const points = history.map((pt, i) => {
      const x = (i / Math.max(history.length - 1, 1)) * width;
      const normalizedY = 1 - (pt.latencyMs - minVal) / range;
      const y = Math.max(4, Math.min(height - 4, normalizedY * height));
      return { x, y, pt };
    });

    const pathData = points.reduce((acc, p, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, '');

    return (
      <div className="flex items-center space-x-2">
        <svg width={width} height={height} className="overflow-visible">
          <defs>
            <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          {points.length > 1 && (
            <path
              d={`${pathData} L ${width} ${height} L 0 ${height} Z`}
              fill="url(#sparkGradient)"
            />
          )}
          <path
            d={pathData}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={idx === points.length - 1 ? 3 : 1.5}
              className={p.pt.status === 'error' ? 'fill-rose-500' : 'fill-emerald-400'}
            />
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div id="local-connection-diagnostics" className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 border border-emerald-500/60 text-slate-100 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="text-xs font-bold font-mono">{toastMessage.title}</div>
            <div className="text-[11px] text-slate-400">{toastMessage.desc}</div>
          </div>
        </div>
      )}

      {/* Main Diagnostic Hub Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] bg-emerald-950 text-emerald-400 font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-emerald-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Cluster Diagnostics &amp; Telemetry
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                LTX-2 &amp; Ollama Synced
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Activity className="w-6 h-6 text-emerald-400" />
              <span>Connection Diagnostic &amp; Service Availability Matrix</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Provides real-time millisecond-precision round-trip latency, jitter analysis, uninterrupted session uptime tracking, and live model discovery for every configured local endpoint — optimized for your installed <strong>Ollama text LLM</strong> and <strong>LTX-2 video generation engine</strong>.
            </p>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            
            {/* 1-Click LTX-2 + Ollama Setup Button */}
            <button
              onClick={handleApplyOllamaAndLtx2Preset}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:opacity-95 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-98 transition-all cursor-pointer"
              title="Automatically sets URLs and binds installed LTX-2 and Ollama models"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Configure Installed LTX-2 &amp; Ollama</span>
            </button>

            {/* Run Probe All Button */}
            <button
              onClick={handleProbeAll}
              disabled={isProbingAll}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs shadow active:scale-98 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isProbingAll ? 'animate-spin text-indigo-400' : ''}`} />
              <span>{isProbingAll ? 'Pinging Services...' : 'Ping All Services'}</span>
            </button>

            {/* Add Custom Endpoint */}
            <button
              onClick={() => setShowAddCustomModal(true)}
              className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 font-bold text-xs transition-all cursor-pointer"
              title="Add a custom local port or server URL"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Add URL</span>
            </button>

            {/* Export Diagnostics */}
            <button
              onClick={() => handleCopy(exportDiagnosticsReport(services), 'Diagnostic JSON Report')}
              className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 font-mono text-xs transition-all cursor-pointer"
              title="Copy complete JSON telemetry report"
            >
              {copiedText === 'Diagnostic JSON Report' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Cluster Telemetry Stats Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              Cluster Fleet Status
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-xl font-bold font-mono text-white">
                {onlineServices.length} / {services.length}
              </span>
              <span className="text-[11px] font-bold text-emerald-400">
                {onlineServices.length === services.length ? 'ALL ONLINE' : `${services.length - onlineServices.length} Offline`}
              </span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1 mt-2 overflow-hidden">
              <div 
                className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${(onlineServices.length / Math.max(1, services.length)) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Avg Cluster Latency
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-xl font-bold font-mono text-cyan-300">
                {avgClusterLatency} ms
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {avgClusterLatency <= 15 ? 'ULTRA-FAST' : 'NORMAL'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-sans mt-2">
              Average round-trip response time
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Cluster Uptime
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-xl font-bold font-mono text-indigo-300">
                {avgClusterUptime}%
              </span>
              <span className="text-[10px] font-mono text-emerald-400">STABLE</span>
            </div>
            <span className="text-[10px] text-slate-500 font-sans mt-2">
              Cumulative session packet delivery
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <RefreshCw className={`w-3.5 h-3.5 ${autoPingInterval > 0 ? 'text-amber-400 animate-spin' : 'text-slate-500'}`} />
                Auto-Ping Interval
              </span>
              {autoPingInterval > 0 && (
                <span className="text-[10px] font-mono text-amber-400 font-bold">
                  {secondsUntilNextPing}s
                </span>
              )}
            </div>
            <div className="flex gap-1.5 mt-1.5">
              {[
                { label: 'Off', val: 0 },
                { label: '5s', val: 5 },
                { label: '10s', val: 10 },
                { label: '30s', val: 30 }
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => {
                    setAutoPingInterval(opt.val);
                    setSecondsUntilNextPing(opt.val);
                  }}
                  className={`flex-1 py-1 text-[10px] font-mono font-bold rounded border transition-all ${
                    autoPingInterval === opt.val
                      ? 'bg-amber-950 text-amber-300 border-amber-600'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <span className="text-[9px] text-slate-500 font-mono mt-1">
              {autoPingInterval > 0 ? `Auto-probing every ${autoPingInterval}s` : 'Auto-ping disabled'}
            </span>
          </div>

        </div>
      </div>

      {/* Filter Chips & View Mode Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/70 border border-slate-800/80 p-3 rounded-xl">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-mono text-slate-400 mr-1.5 uppercase font-bold">Filter By:</span>
          {[
            { id: 'all', label: 'All Services', count: services.length },
            { id: 'ollama', label: 'Ollama LLM (Port 11434)', count: services.filter(s => s.serviceType === 'ollama').length },
            { id: 'ltx-video', label: 'LTX-2 Video (Port 8000)', count: services.filter(s => s.serviceType === 'ltx-video').length },
            { id: 'diffusion', label: 'FLUX Diffusion (Port 8080)', count: services.filter(s => s.serviceType === 'diffusion').length },
            { id: 'voice_tts', label: 'Kokoro Voice (Port 8880)', count: services.filter(s => s.serviceType === 'voice_tts').length },
            { id: 'custom', label: 'Custom', count: services.filter(s => s.isCustom).length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                selectedCategory === tab.id
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === tab.id ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowConsoleLogs(!showConsoleLogs)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-all flex items-center gap-1.5 ${
              showConsoleLogs
                ? 'bg-indigo-950 text-indigo-300 border-indigo-500/50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Telemetry Log ({consoleLogs.length})</span>
          </button>
        </div>
      </div>

      {/* Live Console Logs Accordion (if open) */}
      {showConsoleLogs && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-2 animate-fadeIn shadow-2xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-slate-300 font-bold flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              Live Diagnostic Probe Log
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setConsoleLogs([])}
                className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors px-2 py-0.5 bg-slate-900 rounded border border-slate-800"
              >
                Clear
              </button>
              <button
                onClick={() => handleCopy(consoleLogs.map(l => `[${l.time}] ${l.text}`).join('\n'), 'Diagnostic Log')}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors px-2 py-0.5 bg-indigo-950/50 rounded border border-indigo-900"
              >
                Copy Log
              </button>
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1 text-[11px] pr-2 scrollbar-thin">
            {consoleLogs.map(log => (
              <div key={log.id} className="flex items-start space-x-2">
                <span className="text-slate-500 shrink-0 select-none">[{log.time}]</span>
                <span className={`break-all ${
                  log.type === 'success' ? 'text-emerald-400' :
                  log.type === 'error' ? 'text-rose-400' :
                  log.type === 'warn' ? 'text-amber-400' : 'text-slate-300'
                }`}>
                  {log.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Service Cards Grid */}
      <div className="grid grid-cols-1 gap-5">
        {filteredServices.map(service => {
          const isOllama = service.serviceType === 'ollama';
          const isLtx = service.serviceType === 'ltx-video';
          const isOnline = service.status === 'online';
          const isPinging = service.status === 'pinging';
          const isEditing = editingServiceId === service.id;

          const ServiceIcon = isOllama ? Bot : isLtx ? Film : service.serviceType === 'diffusion' ? Sparkles : service.serviceType === 'voice_tts' ? Radio : Server;

          return (
            <div
              key={service.id}
              className={`bg-slate-900/90 border rounded-2xl p-5 space-y-5 transition-all shadow-xl relative overflow-hidden ${
                isOnline 
                  ? 'border-slate-800 hover:border-slate-700' 
                  : 'border-rose-900/40 bg-gradient-to-br from-slate-900 to-rose-950/20'
              }`}
            >
              {/* Subtle ambient lighting */}
              <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
                isOnline ? (isOllama ? 'bg-indigo-500/5' : isLtx ? 'bg-purple-500/5' : 'bg-emerald-500/5') : 'bg-rose-500/5'
              }`} />

              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div className="flex items-start sm:items-center space-x-3.5">
                  <div className={`p-3 rounded-xl border ${
                    isOnline 
                      ? (isOllama ? 'bg-indigo-950/80 border-indigo-800/60 text-indigo-400' : isLtx ? 'bg-purple-950/80 border-purple-800/60 text-purple-400' : 'bg-emerald-950/80 border-emerald-800/60 text-emerald-400')
                      : 'bg-rose-950/80 border-rose-800/60 text-rose-400'
                  }`}>
                    <ServiceIcon className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2.5">
                      <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <span>{service.name}</span>
                        {(isOllama || isLtx) && (
                          <span className="text-[9px] bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-mono font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            INSTALLED PRESET
                          </span>
                        )}
                      </h3>
                    </div>

                    {/* Inline URL Display & Edit */}
                    <div className="flex items-center space-x-2 text-xs font-mono">
                      {isEditing ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editingUrl}
                            onChange={(e) => setEditingUrl(e.target.value)}
                            placeholder="http://127.0.0.1:port"
                            className="bg-slate-950 text-slate-200 border border-indigo-500 rounded px-2.5 py-1 text-xs font-mono focus:outline-none w-64"
                          />
                          <button
                            onClick={() => handleSaveUrl(service.id)}
                            className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded text-xs"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingServiceId(null)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-400">{service.url}</span>
                          <button
                            onClick={() => {
                              setEditingServiceId(service.id);
                              setEditingUrl(service.url);
                            }}
                            className="text-slate-500 hover:text-slate-300 p-0.5 transition-colors"
                            title="Edit Service URL"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-slate-600">|</span>
                          <span className="text-slate-500 text-[11px]">{service.serverVersion || 'REST Protocol'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Badges & Ping Controls */}
                <div className="flex items-center space-x-3 self-end sm:self-center">
                  
                  {/* Status Indicator */}
                  <div className={`px-3 py-1.5 rounded-xl border flex items-center space-x-2 font-mono text-xs font-bold ${
                    isPinging 
                      ? 'bg-cyan-950/80 border-cyan-800 text-cyan-300 animate-pulse'
                      : isOnline 
                      ? 'bg-emerald-950/80 border-emerald-800 text-emerald-400' 
                      : 'bg-rose-950/80 border-rose-800 text-rose-400'
                  }`}>
                    {isPinging ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                        <span>Pinging...</span>
                      </>
                    ) : isOnline ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>ONLINE (200 OK)</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>OFFLINE</span>
                      </>
                    )}
                  </div>

                  {/* Individual Ping Button */}
                  <button
                    onClick={() => handlePingSingle(service)}
                    disabled={isPinging}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    title="Ping this endpoint immediately"
                  >
                    <RefreshCw className={`w-4 h-4 ${isPinging ? 'animate-spin text-cyan-400' : ''}`} />
                  </button>

                  {/* Custom Service Delete Button */}
                  {service.isCustom && (
                    <button
                      onClick={() => handleRemoveCustomService(service.id)}
                      className="p-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-900/60 rounded-xl transition-all cursor-pointer"
                      title="Delete this custom service"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Middle Section: Granular Latency, Jitter, Uptime & Sparkline */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. Granular Latency Matrix */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Latency &amp; Jitter Telemetry
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${getLatencyColor(service.currentLatencyMs, service.status)}`}>
                      {service.currentLatencyMs} ms
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center pt-1 border-t border-slate-900">
                    <div className="bg-slate-900/70 p-1.5 rounded border border-slate-850">
                      <div className="text-[9px] text-slate-500 font-mono uppercase">Min</div>
                      <div className="text-xs font-bold font-mono text-emerald-400">{service.minLatencyMs}ms</div>
                    </div>
                    <div className="bg-slate-900/70 p-1.5 rounded border border-slate-850">
                      <div className="text-[9px] text-slate-500 font-mono uppercase">Avg</div>
                      <div className="text-xs font-bold font-mono text-cyan-400">{service.avgLatencyMs}ms</div>
                    </div>
                    <div className="bg-slate-900/70 p-1.5 rounded border border-slate-850">
                      <div className="text-[9px] text-slate-500 font-mono uppercase">Max</div>
                      <div className="text-xs font-bold font-mono text-amber-400">{service.maxLatencyMs}ms</div>
                    </div>
                    <div className="bg-slate-900/70 p-1.5 rounded border border-slate-850">
                      <div className="text-[9px] text-slate-500 font-mono uppercase">Jitter</div>
                      <div className="text-xs font-bold font-mono text-purple-400">±{service.jitterMs}ms</div>
                    </div>
                  </div>

                  {/* Sparkline Graph */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-500">
                      <span>Recent 20 Pings:</span>
                      <span className="text-emerald-400 font-semibold">{service.statusMessage}</span>
                    </div>
                    {renderSparkline(service.latencyHistory)}
                  </div>
                </div>

                {/* 2. Uptime & Reliability */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3 flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                      Uptime &amp; Reliability
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                      {service.uptimePct}% Uptime
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-850">
                      <div
                        className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${service.uptimePct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-500">
                      <span>0%</span>
                      <span>50%</span>
                      <span className="text-emerald-400 font-bold">100% Target</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-900">
                    <div>
                      <span className="text-slate-500 block">Pings Delivered:</span>
                      <strong className="text-slate-200">{service.successfulPings} / {service.totalPings} ({service.failedPings} drops)</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Streak / Last Seen:</span>
                      <strong className="text-emerald-400">{service.consecutiveSuccesses} ok | {service.lastSeen}</strong>
                    </div>
                  </div>
                </div>

                {/* 3. Server Specs & Handshake Endpoints */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2.5 text-xs font-mono flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                      Hardware &amp; API Routes
                    </span>
                    <span className="text-[10px] text-slate-500">{service.serverSpecs ? 'Accelerated' : 'Standard'}</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[11px] text-slate-300 leading-tight">
                      <strong>Engine Profile:</strong> {service.serverSpecs || 'Local HTTP Worker Daemon'}
                    </div>
                    <div className="space-y-0.5 pt-1">
                      <span className="text-[10px] text-slate-500 block">Handshake Endpoints:</span>
                      <div className="flex flex-wrap gap-1">
                        {service.endpointsTested.map((ep, idx) => (
                          <span key={idx} className="text-[9px] bg-slate-900 text-slate-300 px-1.5 py-0.5 rounded border border-slate-800 font-mono">
                            {ep.replace(/http:\/\/127\.0\.0\.1:\d+/, '') || '/'}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {service.recommendedFix && !isOnline && (
                    <div className="bg-rose-950/30 border border-rose-900/50 p-2 rounded text-[10px] text-rose-300 leading-snug">
                      <strong>Startup Tip:</strong> {service.recommendedFix}
                    </div>
                  )}
                </div>

              </div>

              {/* Bottom Section: Model Availability & Active Model Binding */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wide">
                      Model Availability &amp; Local Checkpoint Registry
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 font-bold">
                      {service.models.length} Available
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                    <span>Active Target:</span>
                    <strong className="text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-900">
                      {service.activeModel || (service.models[0]?.name || 'Auto')}
                    </strong>
                  </div>
                </div>

                {service.models.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {service.models.map((model) => {
                      const isActive = service.activeModel === model.name || service.activeModel === model.id;

                      return (
                        <div
                          key={model.id}
                          onClick={() => handleSetActiveModel(service, model.name || model.id)}
                          className={`p-2.5 rounded-xl border flex flex-col justify-between space-y-1.5 cursor-pointer transition-all ${
                            isActive
                              ? 'bg-indigo-950/60 border-indigo-500 text-indigo-100 shadow-md ring-1 ring-indigo-500/40'
                              : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <span className="text-xs font-bold font-mono truncate" title={model.name}>
                              {model.name}
                            </span>
                            {isActive ? (
                              <span className="text-[9px] bg-emerald-950 text-emerald-300 font-mono font-bold px-1.5 py-0.5 rounded border border-emerald-800 shrink-0">
                                ACTIVE
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-500 font-mono shrink-0">
                                Click to Bind
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                            <span>{model.size || '3.4 GB'}</span>
                            <span className="text-cyan-400">{model.quant || 'FP16'}</span>
                            <span>{model.format || 'GGUF'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg text-xs font-mono text-slate-400 flex items-center justify-between">
                    <span>No models reported over API tags. Model discovery will re-run automatically when service boots.</span>
                    <button
                      onClick={() => handlePingSingle(service)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
                    >
                      Scan Models
                    </button>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Add Custom Endpoint Modal */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                Add Local Service Endpoint
              </h3>
              <button
                onClick={() => setShowAddCustomModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold uppercase">Service Name</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Local LTX-Video ComfyUI Node"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold uppercase">Endpoint URL</label>
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="http://127.0.0.1:8188"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold uppercase">Service Engine</label>
                  <select
                    value={customType}
                    onChange={(e: any) => setCustomType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="custom">Generic REST</option>
                    <option value="ollama">Ollama API</option>
                    <option value="ltx-video">LTX-2 Video Engine</option>
                    <option value="diffusion">ComfyUI / Diffuser</option>
                    <option value="voice_tts">Kokoro Voice</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold uppercase">Category</label>
                  <select
                    value={customCategory}
                    onChange={(e: any) => setCustomCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="video_motion">Video Motion</option>
                    <option value="text_llm">Text LLM</option>
                    <option value="image_diffusion">Image Diffusion</option>
                    <option value="voice_tts">Voice Dubbing</option>
                    <option value="custom">Custom Utility</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowAddCustomModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomService}
                disabled={!customName.trim() || !customUrl.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold disabled:opacity-50"
              >
                Add &amp; Probe Endpoint
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
