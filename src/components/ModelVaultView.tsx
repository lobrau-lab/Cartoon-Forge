import React, { useState, useEffect } from 'react';
import { ModelCheckpointItem, LoraItem, HubModelItem } from '../types';
import { 
  detectHardwareCapabilities, 
  loadHardwareConfig, 
  saveHardwareConfig, 
  runDeviceBenchmark, 
  DeviceHardwareConfig, 
  HardwareDetectionResult 
} from '../utils/hardwareEngine';
import { 
  HardDrive, 
  Cpu, 
  Sparkles, 
  FolderDown, 
  Plus, 
  CheckCircle2, 
  Copy, 
  Download, 
  RefreshCw, 
  Layers, 
  Radio, 
  FileCode2, 
  FolderArchive, 
  ExternalLink,
  Sliders,
  ShieldCheck,
  Tag,
  Zap,
  Info,
  Globe,
  Play,
  Check,
  Loader2,
  Box,
  Gauge,
  Activity,
  Pause,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface ModelVaultViewProps {
  onCopyTriggerWord?: (trigger: string) => void;
}

export const ModelVaultView: React.FC<ModelVaultViewProps> = ({
  onCopyTriggerWord
}) => {
  const [activeTab, setActiveTab] = useState<'hub' | 'checkpoints' | 'loras' | 'register' | 'directories' | 'hardware'>('hub');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Hardware Device Config & Benchmark State
  const [hwConfig, setHwConfig] = useState<DeviceHardwareConfig>(loadHardwareConfig());
  const [hwCapabilities, setHwCapabilities] = useState<HardwareDetectionResult | null>(null);
  const [isBenchmarking, setIsBenchmarking] = useState<boolean>(false);
  const [benchmarkResult, setBenchmarkResult] = useState<{
    tflops: number;
    memoryBandwidthGbs: number;
    latencyMs: number;
    status: string;
  } | null>(null);

  // Model Vault State
  const [checkpoints, setCheckpoints] = useState<ModelCheckpointItem[]>([]);
  const [loras, setLoras] = useState<LoraItem[]>([]);
  const [hubCatalog, setHubCatalog] = useState<HubModelItem[]>([]);
  const [hubProviderFilter, setHubProviderFilter] = useState<string>('all');
  const [hubTypeFilter, setHubTypeFilter] = useState<string>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null);

  // Background Auto-Fetch State
  const [autoFetchState, setAutoFetchState] = useState<any>(null);
  const [isAutoFetchExpanded, setIsAutoFetchExpanded] = useState<boolean>(true);

  // Test Inference State
  const [testInferenceModel, setTestInferenceModel] = useState<HubModelItem | null>(null);
  const [testPrompt, setTestPrompt] = useState<string>('Dynamic anime scene with vibrant cel shading');
  const [isTestingInference, setIsTestingInference] = useState<boolean>(false);
  const [inferenceResult, setInferenceResult] = useState<any>(null);
  const [directories, setDirectories] = useState({
    basePath: "/models",
    checkpointsPath: "/models/checkpoints",
    lorasPath: "/models/loras",
    ttsPath: "/models/tts",
    vaePath: "/models/vae",
    clipPath: "/models/clip"
  });
  const [gpuSpecs, setGpuSpecs] = useState({
    detectedGpu: "NVIDIA GeForce RTX 4090 (24GB VRAM)",
    availableVramGb: 24,
    allocatedVramGb: 14.2,
    quantizationMode: "FP16 / GGUF Q4_K_M Offload Supported"
  });

  // Registration Form State
  const [registerType, setRegisterType] = useState<'checkpoint' | 'lora'>('lora');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('style');
  const [formFilename, setFormFilename] = useState('');
  const [formTriggerWord, setFormTriggerWord] = useState('');
  const [formRecommendedWeight, setFormRecommendedWeight] = useState('0.85');
  const [formBaseModel, setFormBaseModel] = useState('Wan 2.1 / SDXL');
  const [formDescription, setFormDescription] = useState('');
  const [regStatus, setRegStatus] = useState<string | null>(null);

  // Dynamic Hot-Swap Memory Monitor State
  const [swapperLogs, setSwapperLogs] = useState<string[]>([]);
  const [isSwappingModelId, setIsSwappingModelId] = useState<string | null>(null);

  // Fetch Vault & Hub Catalog on Load
  const fetchVault = async () => {
    try {
      const res = await fetch('/api/models/vault');
      const data = await res.json();
      if (data.success && data.vault) {
        setCheckpoints(data.vault.checkpoints || []);
        setLoras(data.vault.loras || []);
        if (data.vault.directoryStructure) setDirectories(data.vault.directoryStructure);
        if (data.vault.gpuVramSpecs) setGpuSpecs(data.vault.gpuVramSpecs);
      }
    } catch (e) {
      console.error('Failed to fetch model vault', e);
    }
  };

  const fetchHubCatalog = async () => {
    try {
      const res = await fetch('/api/models/hub');
      const data = await res.json();
      if (data.success && data.catalog) {
        setHubCatalog(data.catalog);
      }
    } catch (e) {
      console.error('Failed to fetch hub catalog', e);
    }
  };

  const fetchAutoFetchStatus = async () => {
    try {
      const res = await fetch('/api/models/auto-fetch/status');
      const data = await res.json();
      if (data.success && data.state) {
        setAutoFetchState(data.state);
        // If downloading or mounting is active, trigger dynamic catalog/vault reload
        if (data.state.status === 'completed' || data.state.activeModelId) {
          fetchVault();
          fetchHubCatalog();
        }
      }
    } catch (e) {
      console.error('Failed to fetch auto-fetch status', e);
    }
  };

  const fetchSwapperLogs = async () => {
    try {
      const res = await fetch('/api/models/hot-swap/logs');
      const data = await res.json();
      if (data.success) {
        setSwapperLogs(data.logs || []);
        if (data.gpuVramSpecs) {
          setGpuSpecs(data.gpuVramSpecs);
        }
      }
    } catch (e) {
      console.error('Failed to fetch swapper logs', e);
    }
  };

  const handleHotSwap = async (modelId: string, action: 'mount' | 'unmount') => {
    setIsSwappingModelId(modelId);
    try {
      const res = await fetch('/api/models/hot-swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId, action })
      });
      const data = await res.json();
      if (data.success) {
        setCheckpoints(data.vault.checkpoints || []);
        setLoras(data.vault.loras || []);
        setSwapperLogs(data.logs || []);
        if (data.vault.gpuVramSpecs) setGpuSpecs(data.vault.gpuVramSpecs);
      }
    } catch (e) {
      console.error('Failed to trigger hot-swap', e);
    } finally {
      setIsSwappingModelId(null);
    }
  };

  useEffect(() => {
    fetchVault();
    fetchHubCatalog();
    fetchSwapperLogs();
    detectHardwareCapabilities().then(caps => setHwCapabilities(caps));
    
    // Setup background polling for first-launch model acquisition and swapper logs
    fetchAutoFetchStatus();
    const interval = setInterval(() => {
      fetchAutoFetchStatus();
      fetchSwapperLogs();
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleStartAutoFetch = async () => {
    try {
      await fetch('/api/models/auto-fetch/start', { method: 'POST' });
      fetchAutoFetchStatus();
    } catch (e) {
      console.error('Failed to start auto-fetch', e);
    }
  };

  const handlePauseAutoFetch = async () => {
    try {
      await fetch('/api/models/auto-fetch/pause', { method: 'POST' });
      fetchAutoFetchStatus();
    } catch (e) {
      console.error('Failed to pause auto-fetch', e);
    }
  };

  const handleResetAutoFetch = async () => {
    try {
      await fetch('/api/models/auto-fetch/reset', { method: 'POST' });
      fetchAutoFetchStatus();
    } catch (e) {
      console.error('Failed to reset auto-fetch', e);
    }
  };

  const handleUpdateHardwareConfig = (newCfg: DeviceHardwareConfig) => {
    setHwConfig(newCfg);
    saveHardwareConfig(newCfg);
  };

  const handleRunBenchmark = async () => {
    setIsBenchmarking(true);
    setBenchmarkResult(null);
    try {
      const res = await runDeviceBenchmark(hwConfig);
      setBenchmarkResult(res);
    } catch (e) {
      console.error('Benchmark failed', e);
    } finally {
      setIsBenchmarking(false);
    }
  };

  // Handle Download from Hub
  const handleDownloadFromHub = async (model: HubModelItem) => {
    setDownloadingId(model.id);
    setDownloadMsg(`Downloading ${model.name} (${model.downloadSizeGb} GB) from ${model.provider}...`);
    try {
      const res = await fetch('/api/models/hub/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId: model.id })
      });
      const data = await res.json();
      if (data.success) {
        setDownloadMsg(`Mounted ${model.name} into local ${data.mountedPath}`);
        fetchHubCatalog();
        fetchVault();
      } else {
        setDownloadMsg(`Download failed for ${model.name}`);
      }
    } catch (e) {
      setDownloadMsg(`Download error occurred.`);
    } finally {
      setDownloadingId(null);
      setTimeout(() => setDownloadMsg(null), 5000);
    }
  };

  // Handle Live Inference Test
  const handleRunInferenceTest = async () => {
    if (!testInferenceModel) return;
    setIsTestingInference(true);
    setInferenceResult(null);
    try {
      const res = await fetch('/api/models/hub/inference-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId: testInferenceModel.id, prompt: testPrompt })
      });
      const data = await res.json();
      setInferenceResult(data);
    } catch (e) {
      console.error('Inference test failed', e);
    } finally {
      setIsTestingInference(false);
    }
  };

  // Handle Scan Directory
  const handleScanDirectory = async () => {
    setIsScanning(true);
    setScanMessage(null);
    try {
      const res = await fetch('/api/models/scan', { method: 'POST' });
      const data = await res.json();
      setScanMessage(data.message || 'Scanned /models directory successfully!');
      fetchVault();
    } catch (e) {
      setScanMessage('Failed to scan local model directory.');
    } finally {
      setIsScanning(false);
      setTimeout(() => setScanMessage(null), 4000);
    }
  };

  // Handle Register Form Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    try {
      const payload = {
        type: registerType,
        item: {
          name: formName,
          category: formCategory,
          filename: formFilename || `${formName.toLowerCase().replace(/\s+/g, '_')}.safetensors`,
          triggerWord: formTriggerWord || `<lora:${formName.toLowerCase().replace(/\s+/g, '_')}:0.85>`,
          recommendedWeight: formRecommendedWeight,
          baseModel: formBaseModel,
          description: formDescription
        }
      };

      const res = await fetch('/api/models/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setRegStatus(data.message || 'Item registered successfully!');
        setFormName('');
        setFormFilename('');
        setFormTriggerWord('');
        setFormDescription('');
        fetchVault();
        setTimeout(() => {
          setRegStatus(null);
          setActiveTab(registerType === 'lora' ? 'loras' : 'checkpoints');
        }, 1500);
      }
    } catch (e) {
      setRegStatus('Error registering model.');
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    if (onCopyTriggerWord) onCopyTriggerWord(text);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalVaultSize = checkpoints.reduce((acc, c) => acc + c.fileSizeBytes, 0) +
                         loras.reduce((acc, l) => acc + l.fileSizeBytes, 0);

  const filteredHubCatalog = hubCatalog.filter(item => {
    if (hubProviderFilter !== 'all' && item.provider !== hubProviderFilter) return false;
    if (hubTypeFilter !== 'all' && item.type !== hubTypeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
      {/* Top Banner & Local Storage Status Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/70 border border-amber-500/40 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-amber-950 text-amber-300 border border-amber-800 uppercase tracking-widest flex items-center space-x-1">
                <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                <span>Open Model Hub & Weights Manager</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase tracking-widest">
                ● HuggingFace / Google Gemma Direct
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
              Model Hub & Local Checkpoint Vault
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Explore and download free open-weight diffusion video models (Wan 2.1, AnimateDiff), keyframe generators (FLUX.1-schnell, Animagine XL), Google Gemma 2 & PaliGemma 2 vision models, and Kaggle Sakuga LoRAs directly into your local application path.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleScanDirectory}
              disabled={isScanning}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-xl transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning Directory...' : 'Scan /models Directory'}</span>
            </button>

            <button
              onClick={() => setActiveTab('register')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-100 font-bold text-xs border border-slate-700 shadow-lg transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Register Custom Weight</span>
            </button>
          </div>
        </div>

        {/* Quick VRAM & Vault Disk Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80 relative z-10 font-mono">
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase block">Total Mounted Size</span>
            <span className="text-sm font-extrabold text-amber-300 block">{formatBytes(totalVaultSize)}</span>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase block">Checkpoints & VAEs</span>
            <span className="text-sm font-extrabold text-cyan-300 block">{checkpoints.length} Models Mounted</span>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase block">Sakuga LoRAs Loaded</span>
            <span className="text-sm font-extrabold text-indigo-300 block">{loras.length} Active Adaptors</span>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase block">Hardware Allocation</span>
            <span className="text-sm font-extrabold text-emerald-400 block">{gpuSpecs.allocatedVramGb} / {gpuSpecs.availableVramGb} GB VRAM</span>
          </div>
        </div>

        {(scanMessage || downloadMsg) && (
          <div className="p-3 bg-amber-950/90 border border-amber-500/50 rounded-xl text-amber-300 text-xs font-mono font-bold animate-fadeIn flex items-center space-x-2">
            <Info className="w-4 h-4 text-amber-400" />
            <span>{downloadMsg || scanMessage}</span>
          </div>
        )}
      </div>

      {/* Dynamic VRAM Memory Monitor & Hot-Swap Paging Console */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Gauge className="w-4.5 h-4.5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-100 flex items-center space-x-2">
                <span>Active Memory Paging & Hot-Swap Console</span>
              </h2>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                Real-time WebGPU / Apple M5 neural memory allocation & automated weight offloading status.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-[10px] font-mono">
            <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded flex items-center space-x-1">
              <Check className="w-3 h-3" />
              <span>Lazy Loading Active</span>
            </span>
            <span className="bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded flex items-center space-x-1">
              <Check className="w-3 h-3" />
              <span>Auto-Page-Out</span>
            </span>
            <span className="bg-indigo-950 text-indigo-400 border border-indigo-800 px-2 py-0.5 rounded flex items-center space-x-1">
              <Check className="w-3 h-3" />
              <span>M5 NE Accelerator</span>
            </span>
          </div>
        </div>

        {/* Real-time VRAM Level Bar */}
        <div className="space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center space-x-1">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>GPU VRAM Allotment:</span>
            </span>
            <span className="font-extrabold">
              <span className={
                (gpuSpecs.allocatedVramGb / gpuSpecs.availableVramGb) > 0.8 ? 'text-rose-400' :
                (gpuSpecs.allocatedVramGb / gpuSpecs.availableVramGb) > 0.6 ? 'text-amber-400' :
                'text-emerald-400'
              }>
                {gpuSpecs.allocatedVramGb} GB
              </span>
              <span className="text-slate-500"> / {gpuSpecs.availableVramGb} GB Max Capacity</span>
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                (gpuSpecs.allocatedVramGb / gpuSpecs.availableVramGb) > 0.8 ? 'bg-gradient-to-r from-rose-500 to-red-600' :
                (gpuSpecs.allocatedVramGb / gpuSpecs.availableVramGb) > 0.6 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                'bg-gradient-to-r from-emerald-500 to-cyan-500'
              }`}
              style={{ width: `${Math.min(100, (gpuSpecs.allocatedVramGb / gpuSpecs.availableVramGb) * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>0 GB (Idle Threshold)</span>
            <span>{Math.round(gpuSpecs.availableVramGb * 0.6)} GB (DDR Swap Mode)</span>
            <span>{gpuSpecs.availableVramGb} GB (Overflow Point)</span>
          </div>
        </div>

        {/* Real-time Rolling Log Console */}
        <div className="space-y-1.5 font-mono">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Real-time Memory Swapper Logs:</span>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 h-32 overflow-y-auto font-mono text-[11px] text-slate-300 space-y-1 scrollbar-thin">
            {swapperLogs.length === 0 ? (
              <span className="text-slate-500 italic">[Waiting for hot-swap trigger event...]</span>
            ) : (
              swapperLogs.slice().reverse().map((log, idx) => (
                <div key={idx} className="flex items-start space-x-1.5 hover:bg-slate-900/50 rounded py-0.5 px-1 transition-colors">
                  <span className="text-amber-500 select-none">&gt;</span>
                  <span className={
                    log.includes('WARNING') ? 'text-rose-400 font-bold' :
                    log.includes('✓') || log.includes('Successfully') ? 'text-emerald-300 font-bold' :
                    log.includes('[LAZY-LOAD]') || log.includes('[HOT-SWAP]') ? 'text-cyan-300' :
                    'text-slate-300'
                  }>
                    {log}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Dynamic First-Launch Weight Auto-Fetch Agent Dashboard */}
      {autoFetchState && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl ${
                autoFetchState.status === 'fetching' ? 'bg-amber-500/10 text-amber-400 animate-pulse' :
                autoFetchState.status === 'paused' ? 'bg-slate-800 text-slate-400' :
                autoFetchState.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                'bg-slate-800 text-slate-400'
              }`}>
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider">
                    Asynchronous AI Model Auto-Fetch Agent
                  </h3>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                    autoFetchState.status === 'fetching' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                    autoFetchState.status === 'paused' ? 'bg-slate-800 text-slate-400 border border-slate-700' :
                    autoFetchState.status === 'completed' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                    'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {autoFetchState.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automatically populating missing models into local workspace path after first compile/boot.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {autoFetchState.status === 'fetching' && (
                <button
                  onClick={handlePauseAutoFetch}
                  className="p-2 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 transition-all text-xs flex items-center space-x-1.5 cursor-pointer"
                  title="Pause Downloads"
                >
                  <Pause className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline font-bold">Pause</span>
                </button>
              )}
              {autoFetchState.status === 'paused' && (
                <button
                  onClick={handlePauseAutoFetch}
                  className="p-2 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 transition-all text-xs flex items-center space-x-1.5 cursor-pointer"
                  title="Resume Downloads"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span className="hidden sm:inline font-bold">Resume</span>
                </button>
              )}
              {autoFetchState.status === 'idle' && (
                <button
                  onClick={handleStartAutoFetch}
                  className="p-2 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 transition-all text-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold">Start Fetch</span>
                </button>
              )}
              <button
                onClick={handleResetAutoFetch}
                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-855 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 transition-all text-xs flex items-center space-x-1.5 cursor-pointer"
                title="Restart Agent Queue"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline font-bold">Re-Scan & Sync</span>
              </button>
              <button
                onClick={() => setIsAutoFetchExpanded(!isAutoFetchExpanded)}
                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {isAutoFetchExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isAutoFetchExpanded && (
            <div className="space-y-4">
              {/* Progress and speed metrics */}
              {autoFetchState.status === 'fetching' && autoFetchState.activeModelId && (
                <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
                    <span className="flex items-center space-x-1.5">
                      <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                      <span>Downloading: <strong className="text-amber-300">
                        {hubCatalog.find(m => m.id === autoFetchState.activeModelId)?.name || 'Model Weight File'}
                      </strong></span>
                    </span>
                    <span className="text-slate-300">
                      {formatBytes(autoFetchState.downloadedBytes)} / {formatBytes(autoFetchState.totalBytes)} ({autoFetchState.progress}%)
                    </span>
                  </div>

                  <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-300"
                      style={{ width: `${autoFetchState.progress}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-1">
                    <span>Speed: <strong className="text-cyan-400">{autoFetchState.downloadSpeedMbs} MB/s</strong></span>
                    <span>Remaining Models in Pipeline: <strong className="text-slate-300">{autoFetchState.queue.length}</strong></span>
                  </div>
                </div>
              )}

              {autoFetchState.status === 'completed' && (
                <div className="bg-emerald-950/30 border border-emerald-500/20 p-4 rounded-2xl text-emerald-300 text-xs font-mono flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <strong className="block text-slate-200">First Launch Model Fetch Complete</strong>
                    All local high-fidelity AI models (WAN 2.1 Video, Flux Keyframes, Gemma, Voice templates) are loaded and ready.
                  </div>
                </div>
              )}

              {/* Logs Console Window */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-[11px] text-slate-400 space-y-1 max-h-40 overflow-y-auto">
                <div className="flex items-center justify-between text-[10px] text-slate-500 pb-2 border-b border-slate-900 mb-2">
                  <span className="flex items-center space-x-1">
                    <Activity className="w-3.5 h-3.5 text-slate-400" />
                    <span>Agent Operations Console Logs</span>
                  </span>
                  <span>UTC Engine Clock Active</span>
                </div>
                {autoFetchState.logs.slice(-6).map((log: string, idx: number) => (
                  <div key={idx} className="flex items-start space-x-1.5 leading-relaxed">
                    <span className="text-amber-500/70 select-none">&gt;</span>
                    <span className={log.includes('✓') || log.includes('Success') || log.includes('completion') ? 'text-emerald-400 font-bold' : log.includes('Initiating') ? 'text-cyan-400 font-bold' : 'text-slate-300'}>
                      {log}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Tab Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-xl">
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('hub')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'hub'
                ? 'bg-amber-500 text-slate-950 shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Open Model Hub ({hubCatalog.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('checkpoints')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'checkpoints'
                ? 'bg-amber-500 text-slate-950 shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Model Checkpoints ({checkpoints.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('loras')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'loras'
                ? 'bg-amber-500 text-slate-950 shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>LoRA Adaptors ({loras.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('register')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-amber-500 text-slate-950 shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Register Weight</span>
          </button>

          <button
            onClick={() => setActiveTab('directories')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'directories'
                ? 'bg-amber-500 text-slate-950 shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <FolderArchive className="w-4 h-4" />
            <span>Folder Storage Layout</span>
          </button>

          <button
            onClick={() => setActiveTab('hardware')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'hardware'
                ? 'bg-amber-500 text-slate-950 shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>On-Device GPU / CPU Engine</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-400 px-3">
          Local Storage: <strong className="text-slate-200">/models/</strong>
        </div>
      </div>

      {/* TAB 0: OPEN MODEL HUB (Hugging Face, Kaggle, Google Gemma) */}
      {activeTab === 'hub' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-400 flex items-center space-x-1">
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>Provider:</span>
              </span>
              {['all', 'huggingface', 'google_gemma', 'kaggle'].map((p) => (
                <button
                  key={p}
                  onClick={() => setHubProviderFilter(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono capitalize transition-all cursor-pointer ${
                    hubProviderFilter === p
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {p === 'google_gemma' ? 'Google Gemma' : p === 'huggingface' ? 'Hugging Face' : p}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-400 flex items-center space-x-1">
                <Box className="w-3.5 h-3.5 text-cyan-400" />
                <span>Type:</span>
              </span>
              {['all', 'video', 'image', 'llm', 'tts', 'lora'].map((t) => (
                <button
                  key={t}
                  onClick={() => setHubTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono uppercase transition-all cursor-pointer ${
                    hubTypeFilter === t
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Model Catalog Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredHubCatalog.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 shadow-xl transition-all space-y-4 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Provider Badge */}
                        <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded border uppercase ${
                          item.provider === 'google_gemma' ? 'bg-indigo-950 text-indigo-300 border-indigo-700' :
                          item.provider === 'huggingface' ? 'bg-amber-950 text-amber-300 border-amber-700' :
                          'bg-cyan-950 text-cyan-300 border-cyan-700'
                        }`}>
                          {item.provider === 'google_gemma' ? 'Google Gemma' : item.provider === 'huggingface' ? 'Hugging Face' : 'Kaggle Hub'}
                        </span>

                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 uppercase">
                          {item.type}
                        </span>

                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                          {item.license}
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-slate-100 group-hover:text-amber-400 transition-colors mt-1">
                        {item.name}
                      </h3>

                      <div className="text-[11px] font-mono text-slate-400 flex items-center space-x-1">
                        <span>Repo:</span>
                        <code className="text-slate-200 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                          {item.repoId}
                        </code>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <span className="text-xs font-mono font-extrabold text-amber-300 block bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                        {item.downloadSizeGb} GB
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 block">
                        Min {item.minVramGb}GB VRAM
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {item.tags.map((tag, idx) => (
                      <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
                  <a
                    href={item.directDownloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-400 hover:text-amber-400 flex items-center space-x-1 font-mono transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Repository</span>
                  </a>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setTestInferenceModel(item)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold border border-slate-700 flex items-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Test Prompt</span>
                    </button>

                    {item.isDownloaded ? (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-mono font-bold flex items-center space-x-1">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Mounted in /models</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleDownloadFromHub(item)}
                        disabled={downloadingId === item.id}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-slate-950 text-xs font-extrabold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
                      >
                        {downloadingId === item.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Downloading...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            <span>Mount to /models</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 1: MODEL CHECKPOINTS */}
      {activeTab === 'checkpoints' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {checkpoints.map((ckpt) => (
              <div
                key={ckpt.id}
                className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 shadow-xl transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase border ${
                          ckpt.category === 'video' ? 'bg-indigo-950 text-indigo-300 border-indigo-800' :
                          ckpt.category === 'image' ? 'bg-cyan-950 text-cyan-300 border-cyan-800' :
                          ckpt.category === 'tts' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                          'bg-slate-950 text-slate-300 border-slate-800'
                        }`}>
                          {ckpt.category} checkpoint
                        </span>

                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          ckpt.status === 'mounted' ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' :
                          'bg-slate-950 text-slate-500 border-slate-800'
                        }`}>
                          ● {ckpt.status === 'mounted' ? 'Mounted in VRAM' : 'Available'}
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-slate-100 mt-1">
                        {ckpt.name}
                      </h3>
                    </div>

                    <span className="text-xs font-mono font-bold text-amber-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 whitespace-nowrap">
                      {formatBytes(ckpt.fileSizeBytes)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {ckpt.description}
                  </p>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Architecture:</span>
                      <span className="text-slate-200 font-bold">{ckpt.baseArchitecture}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Quantization Precision:</span>
                      <span className="text-cyan-300 font-bold">{ckpt.quantization}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Min VRAM Required:</span>
                      <span className="text-amber-300 font-bold">{ckpt.vramRequiredGb} GB</span>
                    </div>
                  </div>
                </div>

                {/* File Path & Actions */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between bg-slate-950/90 px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400">
                    <span className="truncate max-w-xs">{ckpt.localPath}</span>
                    <button
                      onClick={() => copyText(ckpt.localPath, ckpt.id)}
                      className="p-1 text-slate-400 hover:text-amber-300 transition-all ml-2 flex-shrink-0"
                      title="Copy path"
                    >
                      {copiedId === ckpt.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {ckpt.sourceUrl && (
                    <a
                      href={ckpt.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 text-[10px] text-cyan-400 hover:underline font-mono"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>HuggingFace / Model Weights Source</span>
                    </a>
                  )}

                  {/* Hot Swap & Memory Mount Controls */}
                  <div className="pt-1.5 flex gap-2">
                    {ckpt.status === 'mounted' ? (
                      <button
                        onClick={() => handleHotSwap(ckpt.id, 'unmount')}
                        disabled={isSwappingModelId === ckpt.id}
                        className="flex-1 py-1.5 rounded-xl bg-slate-950 hover:bg-rose-950/20 text-rose-400 border border-rose-900/40 font-bold text-[11px] transition-all cursor-pointer flex items-center justify-center space-x-1.5 disabled:opacity-50"
                      >
                        {isSwappingModelId === ckpt.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Pause className="w-3.5 h-3.5" />
                        )}
                        <span>Offload to RAM (Lazy)</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleHotSwap(ckpt.id, 'mount')}
                        disabled={isSwappingModelId === ckpt.id}
                        className="flex-1 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800 font-bold text-[11px] transition-all cursor-pointer flex items-center justify-center space-x-1.5 disabled:opacity-50"
                      >
                        {isSwappingModelId === ckpt.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                        <span>Mount to VRAM (Hot Swap)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: LORA WEIGHT ADAPTORS */}
      {activeTab === 'loras' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {loras.map((lora) => (
              <div
                key={lora.id}
                className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 shadow-xl transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-4">
                    {lora.thumbnailUrl ? (
                      <img
                        src={lora.thumbnailUrl}
                        alt={lora.name}
                        className="w-20 h-20 rounded-xl object-cover border border-slate-700 shadow-md flex-shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400 flex-shrink-0">
                        <Sparkles className="w-8 h-8" />
                      </div>
                    )}

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 uppercase">
                          {lora.category} lora
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {formatBytes(lora.fileSizeBytes)}
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          lora.status === 'mounted' ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' :
                          'bg-slate-950 text-slate-500 border-slate-800'
                        }`}>
                          ● {lora.status === 'mounted' ? 'Loaded' : 'Offloaded'}
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-slate-100 truncate">
                        {lora.name}
                      </h3>
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {lora.description}
                      </p>
                    </div>
                  </div>

                  {/* Trigger Word Box */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/30 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span className="flex items-center space-x-1">
                        <Tag className="w-3.5 h-3.5 text-amber-400" />
                        <span>Prompt Trigger Word Tag:</span>
                      </span>
                      <span className="text-amber-300 font-bold">Weight: {lora.recommendedWeight}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                      <code className="text-xs font-mono font-bold text-emerald-300 truncate">
                        {lora.triggerWord}
                      </code>
                      <button
                        onClick={() => copyText(lora.triggerWord, lora.id)}
                        className="flex items-center space-x-1 px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[10px] transition-all flex-shrink-0"
                      >
                        {copiedId === lora.id ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === lora.id ? 'Copied Tag' : 'Copy Tag'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 space-y-2 font-mono text-[10px] text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="truncate">Path: {lora.localPath}</span>
                    <span className="text-cyan-400 font-bold flex-shrink-0 ml-1">Base: {lora.baseModel}</span>
                  </div>

                  <div className="pt-1 flex gap-2">
                    {lora.status === 'mounted' ? (
                      <button
                        onClick={() => handleHotSwap(lora.id, 'unmount')}
                        disabled={isSwappingModelId === lora.id}
                        className="flex-1 py-1 rounded bg-slate-950 hover:bg-rose-950/25 text-rose-400 border border-rose-900/40 font-bold text-[10px] transition-all cursor-pointer flex items-center justify-center space-x-1 disabled:opacity-50"
                      >
                        {isSwappingModelId === lora.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Pause className="w-3 h-3" />
                        )}
                        <span>Offload LoRA (Lazy)</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleHotSwap(lora.id, 'mount')}
                        disabled={isSwappingModelId === lora.id}
                        className="flex-1 py-1 rounded bg-emerald-950 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800 font-bold text-[10px] transition-all cursor-pointer flex items-center justify-center space-x-1 disabled:opacity-50"
                      >
                        {isSwappingModelId === lora.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                        <span>Mount LoRA (Hot Swap)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: REGISTER NEW WEIGHT */}
      {activeTab === 'register' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl max-w-2xl mx-auto space-y-6">
          <div className="space-y-1 border-b border-slate-800 pb-4">
            <h2 className="text-lg font-extrabold text-slate-100 flex items-center space-x-2">
              <Plus className="w-5 h-5 text-amber-400" />
              <span>Register Model Checkpoint or LoRA Weight</span>
            </h2>
            <p className="text-xs text-slate-300">
              Add custom `.safetensors`, `.ckpt`, or `.onnx` files downloaded to your `/models/` folder into the suite's model index.
            </p>
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRegisterType('lora')}
                className={`py-2.5 rounded-xl border font-bold transition-all ${
                  registerType === 'lora'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                LoRA Weight Adaptor
              </button>

              <button
                type="button"
                onClick={() => setRegisterType('checkpoint')}
                className={`py-2.5 rounded-xl border font-bold transition-all ${
                  registerType === 'checkpoint'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                Model Checkpoint (.safetensors)
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 text-[11px] block">Model / LoRA Display Name:</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={registerType === 'lora' ? "e.g., Studio Ghibli Aesthetic LoRA" : "e.g., Wan2.1 1.3B Speed Checkpoint"}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-400 text-[11px] block">Category:</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="style">Style & Aesthetic</option>
                  <option value="action">Sakuga & Motion</option>
                  <option value="character">Character Consistency</option>
                  <option value="lighting">Lighting & FX</option>
                  <option value="video">Video Checkpoint</option>
                  <option value="tts">Voice TTS ONNX</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 text-[11px] block">Filename (.safetensors):</label>
                <input
                  type="text"
                  value={formFilename}
                  onChange={(e) => setFormFilename(e.target.value)}
                  placeholder="e.g., ghibli_v1.safetensors"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {registerType === 'lora' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 text-[11px] block">Prompt Trigger Word Tag:</label>
                  <input
                    type="text"
                    value={formTriggerWord}
                    onChange={(e) => setFormTriggerWord(e.target.value)}
                    placeholder="e.g., <lora:ghibli_style:0.85>"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-300 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 text-[11px] block">Recommended Alpha Weight:</label>
                  <input
                    type="text"
                    value={formRecommendedWeight}
                    onChange={(e) => setFormRecommendedWeight(e.target.value)}
                    placeholder="0.85"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-slate-400 text-[11px] block">Description & Notes:</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
                placeholder="Briefly describe what this model weight adds to the animation pipeline..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            {regStatus && (
              <div className="p-3 bg-emerald-950/90 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-mono font-bold">
                {regStatus}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs shadow-xl shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              Add Weight to Vault Index
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: DIRECTORY STORAGE LAYOUT */}
      {activeTab === 'directories' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
          <div className="space-y-2 border-b border-slate-800 pb-4">
            <h2 className="text-lg font-extrabold text-slate-100 flex items-center space-x-2">
              <FolderArchive className="w-5 h-5 text-amber-400" />
              <span>Offline Directory Storage Layout</span>
            </h2>
            <p className="text-xs text-slate-300">
              When complete and exported to Pinokio or run locally on your GPU, the application reads model weights directly from the following filesystem folder paths:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-amber-400 font-bold">
                <span>1. Checkpoints Folder</span>
                <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded">.safetensors / .ckpt</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Place base video generation models (Wan 2.1, AnimateDiff) and image keyframe models here.
              </p>
              <code className="block bg-slate-900 p-2 rounded-lg text-emerald-300 border border-slate-800 text-[11px]">
                {directories.checkpointsPath}
              </code>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-indigo-400 font-bold">
                <span>2. LoRA Weights Folder</span>
                <span className="text-[10px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded">.safetensors</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Place Sakuga action, style, character consistency, and atmospheric lighting adaptors here.
              </p>
              <code className="block bg-slate-900 p-2 rounded-lg text-emerald-300 border border-slate-800 text-[11px]">
                {directories.lorasPath}
              </code>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-cyan-400 font-bold">
                <span>3. Voice TTS Weights</span>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded">.onnx / .pth</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Place Kokoro, CosyVoice, or Bark voice synthesis weights for automatic anime character dubbing.
              </p>
              <code className="block bg-slate-900 p-2 rounded-lg text-emerald-300 border border-slate-800 text-[11px]">
                {directories.ttsPath}
              </code>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span>4. VAE Color Precision Weights</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded">.safetensors</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Variational Auto-encoders prevent washed-out color artifacts during video decoding.
              </p>
              <code className="block bg-slate-900 p-2 rounded-lg text-emerald-300 border border-slate-800 text-[11px]">
                {directories.vaePath}
              </code>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ON-DEVICE GPU / CPU ENGINE & HARDWARE ACCELERATION */}
      {activeTab === 'hardware' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Driver & Hardware Spec Banner */}
          <div className="bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
                  <Zap className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase">
                      Local Device Acceleration
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase">
                      {hwCapabilities?.hasWebGpu ? '● WebGPU Active' : '● WASM CPU SIMD Active'}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-100">
                    On-Device GPU / CPU Local Inference Pipeline
                  </h3>
                </div>
              </div>

              <button
                onClick={handleRunBenchmark}
                disabled={isBenchmarking}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-slate-950 font-extrabold text-xs shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                <Activity className={`w-4 h-4 ${isBenchmarking ? 'animate-spin' : ''}`} />
                <span>{isBenchmarking ? 'Benchmarking Hardware...' : 'Run On-Device Tensor Benchmark'}</span>
              </button>
            </div>

            {/* Hardware Capability Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase block">Detected Adapter</span>
                <span className="text-xs font-bold text-cyan-300 block truncate" title={hwCapabilities?.gpuAdapterName}>
                  {hwCapabilities?.gpuAdapterName || 'CPU SIMD Engine'}
                </span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase block">Logical CPU Cores</span>
                <span className="text-xs font-bold text-amber-300 block">
                  {hwCapabilities?.cpuCores || 8} Threads Available
                </span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase block">Estimated VRAM</span>
                <span className="text-xs font-bold text-emerald-400 block">
                  ~{hwCapabilities?.estimatedVramGb || 12} GB VRAM Available
                </span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase block">ONNX Runtime Engine</span>
                <span className="text-xs font-bold text-indigo-300 block">
                  {hwCapabilities?.onnxVersion || '1.20+ (WebGPU)'}
                </span>
              </div>
            </div>

            {/* Benchmark Output Box */}
            {benchmarkResult && (
              <div className="p-4 bg-slate-950 border border-cyan-500/50 rounded-xl space-y-2 animate-fadeIn font-mono">
                <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                  <span>{benchmarkResult.status}</span>
                  <span className="text-emerald-400">Latency: {benchmarkResult.latencyMs} ms</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1 border-t border-slate-800">
                  <div>TFLOPS Capacity: <strong className="text-amber-300">{benchmarkResult.tflops} TFLOPS</strong></div>
                  <div>Memory Bandwidth: <strong className="text-cyan-300">{benchmarkResult.memoryBandwidthGbs} GB/s</strong></div>
                  <div>Acceleration: <strong className="text-emerald-300">On-Device DirectML / WebGPU</strong></div>
                </div>
              </div>
            )}
          </div>

          {/* On-Device Execution Settings & VRAM Slab Config */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                <Sliders className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  Hardware Execution Provider
                </h3>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-mono text-slate-400 block">Execution Backend:</label>
                <div className="grid grid-cols-1 gap-2 font-mono text-xs">
                  {[
                    { id: 'webgpu', name: 'WebGPU DirectML / CUDA Hardware Acceleration (Recommended)', desc: 'Direct browser GPU tensor execution with zero API delay' },
                    { id: 'wasm_cpu', name: 'WebAssembly SIMD (Multithreaded CPU Execution)', desc: 'Utilizes CPU AVX-512 vector instructions across all logical cores' },
                    { id: 'cuda_directml', name: 'CUDA 12.2 / DirectML Native GPU Bridge', desc: 'Full GPU VRAM offload with high throughput keyframe diffusion' },
                    { id: 'hybrid_offload', name: 'Hybrid GPU-CPU Memory Offload', desc: 'Splits diffusion weights between VRAM and system RAM' }
                  ].map((prov) => (
                    <div
                      key={prov.id}
                      onClick={() => handleUpdateHardwareConfig({ ...hwConfig, executionProvider: prov.id as any })}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        hwConfig.executionProvider === prov.id
                          ? 'bg-amber-950/80 border-amber-500 text-amber-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>{prov.name}</span>
                        {hwConfig.executionProvider === prov.id && <Check className="w-4 h-4 text-amber-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 font-sans mt-1">{prov.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-xs font-mono text-slate-400 block">Weight Precision Mode:</label>
                <select
                  value={hwConfig.precisionMode}
                  onChange={(e) => handleUpdateHardwareConfig({ ...hwConfig, precisionMode: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 font-mono font-bold focus:border-amber-500 focus:outline-none cursor-pointer"
                >
                  <option value="fp16">FP16 Half Precision (Optimal Quality / VRAM Balance)</option>
                  <option value="q4_k_m">GGUF Q4_K_M Quantized (Low VRAM Memory Usage)</option>
                  <option value="int8">INT8 Quantized (Ultra-Fast CPU Execution)</option>
                  <option value="fp32">FP32 Full Precision (Max Studio Color Accuracy)</option>
                </select>
              </div>
            </div>

            {/* Memory Slabs & Embedded Models On-Device Matrix */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                <Box className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  Embedded Models On-Device Matrix
                </h3>
              </div>

              <div className="space-y-3 font-mono text-xs">
                {[
                  {
                    name: 'FLUX.1-schnell 4-Step Keyframe Model',
                    type: 'Image Diffusion',
                    status: 'On-Device WebGPU / CPU Ready',
                    size: '6.9 GB',
                    color: 'text-amber-300'
                  },
                  {
                    name: 'Wan 2.1 14B Text-to-Video Diffusion',
                    type: 'Video Generator',
                    status: 'On-Device GPU Offload Ready',
                    size: '14.2 GB',
                    color: 'text-cyan-300'
                  },
                  {
                    name: 'Kokoro-82M ONNX Speech Synthesis',
                    type: 'Voice Dubbing TTS',
                    status: 'On-Device WASM / WebGPU Zero Latency',
                    size: '340 MB',
                    color: 'text-rose-300'
                  },
                  {
                    name: 'Google Gemma 2 2B / PaliGemma 2',
                    type: 'Flow Orchestrator',
                    status: 'On-Device Self-Contained Pipeline',
                    size: '2.8 GB',
                    color: 'text-emerald-300'
                  },
                  {
                    name: 'Animagine XL 3.1 & Illustrious XL Base',
                    type: 'Cel Shading Base',
                    status: 'Local Weight Mounted',
                    size: '6.8 GB',
                    color: 'text-indigo-300'
                  }
                ].map((mod, idx) => (
                  <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`font-bold ${mod.color}`}>{mod.name}</span>
                      <span className="text-[10px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-800">{mod.size}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Category: {mod.type}</span>
                      <span className="text-emerald-400 font-bold">✓ {mod.status}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* VRAM Limit & Thread Sliders */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Max VRAM Limit:</span>
                  <span className="text-cyan-300 font-bold">{hwConfig.vramLimitGb} GB</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="24"
                  step="2"
                  value={hwConfig.vramLimitGb}
                  onChange={(e) => handleUpdateHardwareConfig({ ...hwConfig, vramLimitGb: parseInt(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />

                <div className="flex justify-between text-xs font-mono pt-1">
                  <span className="text-slate-400">CPU Execution Threads:</span>
                  <span className="text-amber-300 font-bold">{hwConfig.cpuThreads} Threads</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="16"
                  step="1"
                  value={hwConfig.cpuThreads}
                  onChange={(e) => handleUpdateHardwareConfig({ ...hwConfig, cpuThreads: parseInt(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEST INFERENCE MODAL */}
      {testInferenceModel && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 md:p-8 max-w-xl w-full space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 uppercase">
                  Live Model Test
                </span>
                <h3 className="text-base font-extrabold text-slate-100">
                  {testInferenceModel.name}
                </h3>
              </div>

              <button
                onClick={() => setTestInferenceModel(null)}
                className="text-slate-400 hover:text-slate-200 text-xs font-bold font-mono px-2 py-1 bg-slate-800 rounded-lg cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 block">
                Test Prompt ({testInferenceModel.provider} / {testInferenceModel.repoId})
              </label>
              <textarea
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:border-amber-500 focus:outline-none resize-none font-mono"
              />

              <button
                onClick={handleRunInferenceTest}
                disabled={isTestingInference}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-slate-950 font-extrabold text-xs shadow-xl transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isTestingInference ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Running Inference on {testInferenceModel.provider}...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Run Sample Test Generation</span>
                  </>
                )}
              </button>
            </div>

            {/* Inference Result Box */}
            {inferenceResult && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Inference Latency: <strong className="text-emerald-400">{inferenceResult.inferenceTimeMs} ms</strong></span>
                  <span>VRAM: <strong className="text-cyan-300">{inferenceResult.vramUsedGb} GB</strong></span>
                </div>

                <div className="rounded-xl overflow-hidden border border-slate-800 max-h-56 relative bg-slate-900 flex items-center justify-center">
                  <img
                    src={inferenceResult.generatedOutputUrl}
                    alt="Inference test result"
                    className="w-full h-48 object-cover rounded-xl"
                  />
                  <div className="absolute bottom-2 right-2 bg-slate-950/80 px-2 py-1 rounded text-[10px] font-mono text-amber-300 border border-slate-800">
                    {testInferenceModel.repoId}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
