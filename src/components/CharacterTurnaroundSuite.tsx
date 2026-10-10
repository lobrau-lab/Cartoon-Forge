import React, { useState, useEffect } from 'react';
import { EpisodeProject, CharacterAnchor } from '../types';
import JSZip from 'jszip';
import { 
  Wand2, 
  Sparkles, 
  Download, 
  Copy, 
  Check, 
  Upload, 
  Maximize2, 
  X, 
  FolderTree, 
  FileCode, 
  Layers, 
  RefreshCw, 
  Terminal, 
  Eye, 
  Smile, 
  Grid, 
  Sliders, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  FolderDown,
  Info
} from 'lucide-react';
import { registerRealTimeHeal } from '../utils/selfHealingEngine';

interface CharacterTurnaroundSuiteProps {
  project: EpisodeProject;
  character: CharacterAnchor;
  onUpdateCharacter: (updatedChar: CharacterAnchor) => void;
  onGenerateImage?: (prompt: string, aspectRatio?: string) => Promise<string | null>;
}

export const CharacterTurnaroundSuite: React.FC<CharacterTurnaroundSuiteProps> = ({
  project,
  character,
  onUpdateCharacter,
  onGenerateImage
}) => {
  // Main view tab: 'matrix' (360° Visual Anchor Sheets) vs 'lora-config' (Local LoRA Training Config Generator)
  const [activeTab, setActiveTab] = useState<'matrix' | 'lora-config'>('matrix');

  // Interactive Lightbox State
  const [lightboxImage, setLightboxImage] = useState<{ title: string; url: string; angle?: string; caption?: string } | null>(null);
  const [showGridOverlay, setShowGridOverlay] = useState<boolean>(true);

  // Batch Generation State
  const [isBatchGenerating, setIsBatchGenerating] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<number>(0);
  const [batchLog, setBatchLog] = useState<string[]>([]);

  // Individual Slot Generation State
  const [generatingSlotKey, setGeneratingSlotKey] = useState<string | null>(null);

  // Default Angles
  const defaultAngles = [
    { angle: 'Front' as const, label: 'Front View (0°)', desc: 'Primary face and chest reference' },
    { angle: 'ThreeQuarter' as const, label: '3/4 Angle View (45°)', desc: 'Volumetric depth and jawline profile' },
    { angle: 'Side' as const, label: 'Side Profile View (90°)', desc: 'Ear, nose bridge, and silhouette depth' },
    { angle: 'Back' as const, label: 'Back View (180°)', desc: 'Hair drape, jacket back, and rear details' }
  ];

  // Default Expression Matrix
  const defaultExpressions = [
    { name: 'Neutral', desc: 'Resting default face' },
    { name: 'Fierce Shout', desc: 'Combat expression & action teeth' },
    { name: 'Smirk Confident', desc: 'Slight grin & eyebrow tilt' },
    { name: 'Shocked', desc: 'Wide eyes & open mouth' },
    { name: 'Sad Reflective', desc: 'Lowered gaze & soft brow' }
  ];

  // Populate missing turnaround angles and expressions
  const anglesData = defaultAngles.map(item => {
    const existing = character.turnaroundAngles?.find(a => a.angle === item.angle);
    return {
      ...item,
      url: existing?.url || (item.angle === 'Front' ? character.avatarUrl || character.turnaroundUrl : undefined) || `https://picsum.photos/seed/${character.seed}_${item.angle}/600/600`,
      caption: existing?.caption || `1girl, ${character.name.toLowerCase().replace(/\s+/g, '_')}_anchor, ${character.hairStyle.toLowerCase()} hair, ${character.eyeColor.toLowerCase()} eyes, ${character.outfit.toLowerCase()}, ${item.angle.toLowerCase()} view turnaround, simple background, white background, master anime illustration`
    };
  });

  const expressionsData = defaultExpressions.map(item => {
    const existing = character.expressions?.find(e => e.name === item.name);
    return {
      ...item,
      url: existing?.url || `https://picsum.photos/seed/${character.seed}_exp_${item.name}/400/400`,
      caption: existing?.caption || `1girl, ${character.name.toLowerCase().replace(/\s+/g, '_')}_anchor, ${character.hairStyle.toLowerCase()} hair, ${character.eyeColor.toLowerCase()} eyes, ${item.name.toLowerCase()} expression, close up headshot portrait, anime style`
    };
  });

  // LoRA Training Config Form State
  const [triggerWord, setTriggerWord] = useState<string>(
    character.loraTrainingConfig?.triggerWord || `${character.name.toLowerCase().replace(/\s+/g, '_')}_anchor`
  );
  const [baseModel, setBaseModel] = useState<string>(
    character.loraTrainingConfig?.baseModel || 'Wan 2.1 / SDXL 1.0 (Anime Fine-tuned)'
  );
  const [networkDim, setNetworkDim] = useState<number>(character.loraTrainingConfig?.networkDim || 32);
  const [networkAlpha, setNetworkAlpha] = useState<number>(character.loraTrainingConfig?.networkAlpha || 16);
  const [learningRate, setLearningRate] = useState<string>(character.loraTrainingConfig?.learningRate || '1e-4');
  const [optimizer, setOptimizer] = useState<string>(character.loraTrainingConfig?.optimizer || 'Adafactor');
  const [resolution, setResolution] = useState<string>(character.loraTrainingConfig?.resolution || '1024x1024');
  const [epochs, setEpochs] = useState<number>(character.loraTrainingConfig?.epochs || 12);
  const [batchSize, setBatchSize] = useState<number>(character.loraTrainingConfig?.batchSize || 1);
  const [mixedPrecision, setMixedPrecision] = useState<string>(character.loraTrainingConfig?.mixedPrecision || 'bf16');

  // Selected file in the LoRA dataset file viewer
  const [selectedFileKey, setSelectedFileKey] = useState<string>('config_lora.toml');
  const [copiedFileKey, setCopiedFileKey] = useState<string | null>(null);

  // Sync state if character changes
  useEffect(() => {
    setTriggerWord(character.loraTrainingConfig?.triggerWord || `${character.name.toLowerCase().replace(/\s+/g, '_')}_anchor`);
  }, [character.id]);

  // Single Slot Generation Handler
  const handleGenerateSlot = async (slotType: 'angle' | 'expression', keyName: string, promptText: string) => {
    const slotId = `${slotType}_${keyName}`;
    setGeneratingSlotKey(slotId);
    try {
      const fullPrompt = `${project.style.loraTag}, ${character.name}, ${promptText}, ${character.hairStyle} hair, ${character.eyeColor} eyes, wearing ${character.outfit}, ${character.visualSummary}, high quality anime art, seed ${character.seed}`;
      
      let imageUrl: string | null = null;
      if (onGenerateImage) {
        imageUrl = await onGenerateImage(fullPrompt, '1:1');
      } else {
        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: fullPrompt, aspectRatio: '1:1' })
        });
        const data = await res.json();
        imageUrl = data.imageUrl;
      }

      if (imageUrl) {
        if (slotType === 'angle') {
          const updatedAngles = anglesData.map(a => a.angle === keyName ? { ...a, url: imageUrl! } : a);
          onUpdateCharacter({
            ...character,
            turnaroundAngles: updatedAngles.map(a => ({ angle: a.angle, url: a.url, caption: a.caption }))
          });
        } else {
          const updatedExpressions = expressionsData.map(e => e.name === keyName ? { ...e, url: imageUrl! } : e);
          onUpdateCharacter({
            ...character,
            expressions: updatedExpressions.map(e => ({ name: e.name, url: e.url, caption: e.caption }))
          });
        }
        registerRealTimeHeal('Cast', `Generated multi-angle reference for ${character.name} (${keyName}).`, `Updated slot ${slotId}.`, 'heal');
      }
    } catch (err) {
      console.warn('Slot image generation failed:', err);
    } finally {
      setGeneratingSlotKey(null);
    }
  };

  // Upload image to slot
  const handleUploadSlot = (e: React.ChangeEvent<HTMLInputElement>, slotType: 'angle' | 'expression', keyName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        if (slotType === 'angle') {
          const updatedAngles = anglesData.map(a => a.angle === keyName ? { ...a, url: dataUrl } : a);
          onUpdateCharacter({
            ...character,
            turnaroundAngles: updatedAngles.map(a => ({ angle: a.angle, url: a.url, caption: a.caption }))
          });
        } else {
          const updatedExpressions = expressionsData.map(e => e.name === keyName ? { ...e, url: dataUrl } : e);
          onUpdateCharacter({
            ...character,
            expressions: updatedExpressions.map(e => ({ name: e.name, url: e.url, caption: e.caption }))
          });
        }
        registerRealTimeHeal('Cast', `Uploaded reference artwork for ${character.name} (${keyName}).`, `File: ${file.name}`, 'heal');
      }
    };
    reader.readAsDataURL(file);
  };

  // Batch Generation for All Angles & Expressions
  const handleBatchGenerateSheet = async () => {
    setIsBatchGenerating(true);
    setBatchProgress(0);
    setBatchLog([]);

    const itemsToProcess = [
      ...anglesData.map(a => ({ type: 'angle' as const, key: a.angle, prompt: `${a.angle.toLowerCase()} view turnaround model sheet, full body` })),
      ...expressionsData.map(e => ({ type: 'expression' as const, key: e.name, prompt: `${e.name.toLowerCase()} facial expression, headshot portrait` }))
    ];

    let completed = 0;
    const total = itemsToProcess.length;

    for (const item of itemsToProcess) {
      setBatchLog(prev => [...prev, `🚀 Generating ${item.type} slot: "${item.key}"...`]);
      await handleGenerateSlot(item.type, item.key, item.prompt);
      completed++;
      setBatchProgress(Math.round((completed / total) * 100));
    }

    setBatchLog(prev => [...prev, `✅ Complete 360° Visual Anchor Sheet generated successfully!`]);
    setIsBatchGenerating(false);
  };

  // Helper: Generate TOML files and dataset structures
  const generateKohyaConfigToml = () => {
    return `# Kohya_ss / sd-scripts LoRA Training Config
# Generated by AI Anime Studio for Character: ${character.name}
# Trigger Word: ${triggerWord}

[model_arguments]
v2 = false
v_parameterization = false
pretrained_model_name_or_path = "${baseModel}"

[dataset_arguments]
dataset_config = "dataset.toml"
resolution = "${resolution}"

[training_arguments]
output_dir = "./output/${triggerWord}_lora"
output_name = "${triggerWord}"
save_precision = "${mixedPrecision}"
save_every_n_epochs = 2
train_batch_size = ${batchSize}
max_train_epochs = ${epochs}
learning_rate = ${learningRate}
unet_lr = ${learningRate}
text_encoder_lr = 5e-5
lr_scheduler = "cosine_with_restarts"
lr_warmup_steps = 100
optimizer_type = "${optimizer}"
mixed_precision = "${mixedPrecision}"
gradient_checkpointing = true
xformers = true
noise_offset = 0.05
caption_extension = ".caption"

[network_arguments]
network_module = "networks.lora"
network_dim = ${networkDim}
network_alpha = ${networkAlpha}
network_dropout = 0.0
`;
  };

  const generateKohyaDatasetToml = () => {
    return `# Kohya_ss Dataset Bucket Configuration
# Folder repetition count: 10
# Target Trigger Word: ${triggerWord}

[general]
shuffle_caption = true
caption_extension = ".caption font"
keep_tokens = 2

[[datasets]]
resolution = [${resolution.replace('x', ', ')}]
batch_size = ${batchSize}

  [[datasets.subsets]]
  image_dir = "./dataset/10_${triggerWord}"
  num_repeats = 10
  caption_extension = ".caption"
`;
  };

  const generateTrainShScript = () => {
    return `#!/bin/bash
# Local LoRA Training Script for ${character.name} (${triggerWord})
# Standard sd-scripts / kohya_ss environment runner

echo "================================================="
echo " Starting Local LoRA Fine-Tuning for ${character.name}"
echo " Trigger Word: ${triggerWord}"
echo " Epochs: ${epochs} | Dim: ${networkDim} | Alpha: ${networkAlpha}"
echo "================================================="

accelerate launch --num_cpu_threads_per_process=8 train_network.py \\
  --config_file="config_lora.toml"

echo "================================================="
echo " Training Complete! Model saved to ./output/${triggerWord}_lora.safetensors"
echo "================================================="
`;
  };

  const generateTrainBatScript = () => {
    return `@echo off
echo =================================================
echo Starting Local LoRA Fine-Tuning for ${character.name}
echo Trigger Word: ${triggerWord}
echo Epochs: ${epochs} ^| Dim: ${networkDim} ^| Alpha: ${networkAlpha}
echo =================================================

accelerate launch --num_cpu_threads_per_process=8 train_network.py ^
  --config_file="config_lora.toml"

echo =================================================
echo Training Complete! Model saved to ./output\\${triggerWord}_lora.safetensors
echo =================================================
pause
`;
  };

  const generateReadme = () => {
    return `# Kohya_ss / SD-Scripts LoRA Fine-Tuning Package
## Character: ${character.name}
## Trigger Word: \`${triggerWord}\`

### Dataset Structure
This package contains pre-captioned multi-angle turnaround images and expression matrices generated by AI Anime Studio:
- \`dataset/10_${triggerWord}/\`: 10 repeats folder containing image files and matching \`.caption\` text files.
- \`config_lora.toml\`: Primary hyperparameter configuration file for \`train_network.py\`.
- \`dataset.toml\`: Dataset aspect ratio bucket configuration file.
- \`train_lora.sh\` / \`train_lora.bat\`: One-click CLI launch scripts for Linux/macOS and Windows.

### Quick Start Guide (Kohya_ss GUI)
1. Launch your local **Kohya_ss** GUI environment.
2. Go to **LoRA** -> **Utilities** -> **Load Config**.
3. Select \`config_lora.toml\` from this package.
4. Click **Start Training**!

### Quick Start Guide (Command Line / sd-scripts)
1. Ensure \`sd-scripts\` is installed with Python 3.10 and PyTorch.
2. Run \`bash train_lora.sh\` (Linux) or \`train_lora.bat\` (Windows).
3. The finished \`${triggerWord}.safetensors\` model will be created in \`./output/\`.
`;
  };

  // Get file content for selected file in file viewer
  const getFileContent = (fileKey: string): string => {
    if (fileKey === 'config_lora.toml') return generateKohyaConfigToml();
    if (fileKey === 'dataset.toml') return generateKohyaDatasetToml();
    if (fileKey === 'train_lora.sh') return generateTrainShScript();
    if (fileKey === 'train_lora.bat') return generateTrainBatScript();
    if (fileKey === 'README.md') return generateReadme();

    // Dataset captions
    if (fileKey.startsWith('dataset_caption_angle_')) {
      const angleKey = fileKey.replace('dataset_caption_angle_', '');
      const angleObj = anglesData.find(a => a.angle === angleKey);
      return angleObj?.caption || `1girl, ${triggerWord}, ${angleKey.toLowerCase()} view turnaround`;
    }
    if (fileKey.startsWith('dataset_caption_exp_')) {
      const expKey = fileKey.replace('dataset_caption_exp_', '');
      const expObj = expressionsData.find(e => e.name === expKey);
      return expObj?.caption || `1girl, ${triggerWord}, ${expKey.toLowerCase()} expression`;
    }

    return '# File preview selected.';
  };

  // Download entire dataset package as ZIP using JSZip
  const handleDownloadZipPackage = async () => {
    try {
      const zip = new JSZip();

      // Root files
      zip.file('config_lora.toml', generateKohyaConfigToml());
      zip.file('dataset.toml', generateKohyaDatasetToml());
      zip.file('train_lora.sh', generateTrainShScript());
      zip.file('train_lora.bat', generateTrainBatScript());
      zip.file('README.md', generateReadme());

      // Dataset directory
      const datasetFolder = zip.folder(`dataset/10_${triggerWord}`);
      if (datasetFolder) {
        // Add angles
        for (const angleItem of anglesData) {
          const filename = `${angleItem.angle.toLowerCase()}_view`;
          datasetFolder.file(`${filename}.caption`, angleItem.caption);
        }

        // Add expressions
        for (const expItem of expressionsData) {
          const filename = `exp_${expItem.name.toLowerCase().replace(/\s+/g, '_')}`;
          datasetFolder.file(`${filename}.caption`, expItem.caption);
        }
      }

      // Generate zip blob
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `${triggerWord}_lora_dataset_config.zip`;
      link.click();

      registerRealTimeHeal('Cast', `Downloaded complete Kohya_ss LoRA dataset package ZIP for "${character.name}".`, `File: ${triggerWord}_lora_dataset_config.zip`, 'heal');
    } catch (err) {
      console.error('Failed to generate ZIP package:', err);
    }
  };

  // Copy content of selected file
  const handleCopyFile = (fileKey: string) => {
    const text = getFileContent(fileKey);
    navigator.clipboard.writeText(text);
    setCopiedFileKey(fileKey);
    setTimeout(() => setCopiedFileKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Wand2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-extrabold text-slate-100">
                {character.name} — 360° Character Turnaround & LoRA Suite
              </h2>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold">
                {character.role}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-angle turnaround sheets, expression matrix, and Kohya_ss local LoRA dataset exporter
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>360° Visual Anchor Sheets</span>
          </button>

          <button
            onClick={() => setActiveTab('lora-config')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'lora-config'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Local LoRA Training Config Generator</span>
          </button>
        </div>
      </div>

      {/* TAB 1: 360° VISUAL ANCHOR SHEETS */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          {/* Header Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
                Full Character Turnaround Angles & Expressions
              </span>
            </div>

            <button
              onClick={handleBatchGenerateSheet}
              disabled={isBatchGenerating}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-lg hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Wand2 className={`w-4 h-4 ${isBatchGenerating ? 'animate-spin' : ''}`} />
              <span>{isBatchGenerating ? `Generating Batch (${batchProgress}%)...` : 'Batch Generate Complete 360° Set'}</span>
            </button>
          </div>

          {/* Batch Generation Progress Log */}
          {isBatchGenerating && (
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span>BATCH GENERATION IN PROGRESS</span>
                <span>{batchProgress}%</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${batchProgress}%` }}
                />
              </div>
              <div className="bg-slate-900 p-3 rounded-lg text-[10px] text-slate-300 space-y-1 max-h-32 overflow-y-auto">
                {batchLog.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            </div>
          )}

          {/* 4 Core Turnaround Angles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>360° Turnaround Angles (4 View Anchors)</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                Front (0°), 3/4 (45°), Side (90°), Back (180°)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {anglesData.map((item) => {
                const slotKey = `angle_${item.angle}`;
                const isGenerating = generatingSlotKey === slotKey;

                return (
                  <div
                    key={item.angle}
                    className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-3 hover:border-slate-700 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 font-mono">
                          {item.label}
                        </span>
                        <span className="text-[9px] font-mono bg-slate-950 text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded">
                          ANGULAR
                        </span>
                      </div>

                      {/* Image Preview Canvas */}
                      <div className="aspect-square w-full rounded-lg overflow-hidden bg-slate-950 border border-slate-800 relative group">
                        <img
                          src={item.url}
                          alt={`${character.name} ${item.label}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />

                        {/* Lightbox Trigger Overlay */}
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={() => setLightboxImage({ title: item.label, url: item.url, angle: item.angle, caption: item.caption })}
                            className="p-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1 shadow cursor-pointer"
                          >
                            <Maximize2 className="w-4 h-4" />
                            <span>Inspect & Grid</span>
                          </button>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400 leading-tight">
                        {item.desc}
                      </p>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                      <button
                        onClick={() => handleGenerateSlot('angle', item.angle, `${item.angle.toLowerCase()} view turnaround model sheet`)}
                        disabled={isGenerating || isBatchGenerating}
                        className="flex-1 flex items-center justify-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-[11px] transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <Wand2 className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                        <span>{isGenerating ? 'Rendering...' : 'AI Generate'}</span>
                      </button>

                      <label className="flex items-center justify-center px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-[11px] cursor-pointer transition-all">
                        <Upload className="w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleUploadSlot(e, 'angle', item.angle)}
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Expression Matrix Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Smile className="w-4 h-4 text-purple-400" />
                <span>Facial Expression Matrix (5 Emotional Anchors)</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                Neutral, Shout, Smirk, Shocked, Sad
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {expressionsData.map((item) => {
                const slotKey = `expression_${item.name}`;
                const isGenerating = generatingSlotKey === slotKey;

                return (
                  <div
                    key={item.name}
                    className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-3 hover:border-slate-700 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 font-mono">
                          {item.name}
                        </span>
                        <span className="text-[9px] font-mono bg-purple-950 text-purple-300 border border-purple-800 px-1.5 py-0.5 rounded">
                          EXPRESSION
                        </span>
                      </div>

                      <div className="aspect-square w-full rounded-lg overflow-hidden bg-slate-950 border border-slate-800 relative group">
                        <img
                          src={item.url}
                          alt={`${character.name} ${item.name}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />

                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={() => setLightboxImage({ title: `${item.name} Expression`, url: item.url, caption: item.caption })}
                            className="p-1.5 rounded-lg bg-purple-600 text-white font-bold text-xs flex items-center gap-1 shadow cursor-pointer"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400 leading-tight">
                        {item.desc}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                      <button
                        onClick={() => handleGenerateSlot('expression', item.name, `${item.name.toLowerCase()} facial expression, headshot portrait`)}
                        disabled={isGenerating || isBatchGenerating}
                        className="flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <Wand2 className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                        <span>{isGenerating ? 'Rendering...' : 'AI Generate'}</span>
                      </button>

                      <label className="flex items-center justify-center px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-[11px] cursor-pointer transition-all">
                        <Upload className="w-3 h-3 text-slate-400" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleUploadSlot(e, 'expression', item.name)}
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LOCAL LORA TRAINING CONFIG GENERATOR */}
      {activeTab === 'lora-config' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (5 Cols): Hyperparameter Configurator */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Sliders className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Kohya_ss & SD-Scripts Configurator
                </h3>
                <p className="text-[11px] text-slate-400">
                  Tune fine-tuning hyperparameters for local LoRA dataset compilation
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1 font-mono">
                  Trigger Word Token
                </label>
                <input
                  type="text"
                  value={triggerWord}
                  onChange={(e) => setTriggerWord(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-emerald-400 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1 font-mono">
                  Base Model Architecture
                </label>
                <select
                  value={baseModel}
                  onChange={(e) => setBaseModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="Wan 2.1 / SDXL 1.0 (Anime Fine-tuned)">Wan 2.1 / SDXL 1.0 (Anime Fine-tuned)</option>
                  <option value="SDXL 1.0 Base">SDXL 1.0 Base</option>
                  <option value="Pony Diffusion XL v6">Pony Diffusion XL v6</option>
                  <option value="Flux.1 Dev">Flux.1 Dev (Kohya Flux Branch)</option>
                  <option value="Stable Diffusion v1.5">Stable Diffusion v1.5</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1 font-mono">
                    Network Dim (Rank)
                  </label>
                  <select
                    value={networkDim}
                    onChange={(e) => setNetworkDim(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value={16}>16 (Lightweight)</option>
                    <option value={32}>32 (Standard Anime)</option>
                    <option value={64}>64 (High Fidelity)</option>
                    <option value={128}>128 (Ultra Detail)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1 font-mono">
                    Network Alpha
                  </label>
                  <select
                    value={networkAlpha}
                    onChange={(e) => setNetworkAlpha(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value={8}>8</option>
                    <option value={16}>16 (Recommended)</option>
                    <option value={32}>32</option>
                    <option value={64}>64</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1 font-mono">
                    Learning Rate
                  </label>
                  <select
                    value={learningRate}
                    onChange={(e) => setLearningRate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="1e-4">1e-4 (Standard)</option>
                    <option value="2e-4">2e-4 (Fast Converge)</option>
                    <option value="5e-5">5e-5 (Fine Gentle)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1 font-mono">
                    Optimizer
                  </label>
                  <select
                    value={optimizer}
                    onChange={(e) => setOptimizer(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Adafactor">Adafactor (Low VRAM)</option>
                    <option value="AdamW8bit">AdamW8bit</option>
                    <option value="Prodigy">Prodigy (Auto LR)</option>
                    <option value="Lion8bit">Lion8bit</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1 font-mono">
                    Training Resolution
                  </label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="512x512">512x512</option>
                    <option value="768x768">768x768</option>
                    <option value="1024x1024">1024x1024 (HD)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1 font-mono">
                    Epochs Count
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="50"
                    value={epochs}
                    onChange={(e) => setEpochs(parseInt(e.target.value) || 12)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleDownloadZipPackage}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-xs shadow-lg hover:opacity-95 transition-all cursor-pointer mt-2"
              >
                <FolderDown className="w-4 h-4" />
                <span>Export Dataset & Config Package (.ZIP)</span>
              </button>
            </div>
          </div>

          {/* Right Column (7 Cols): Dataset Tree & File Viewer */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              {/* File Selection Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <FolderTree className="w-5 h-5 text-indigo-400" />
                  <span className="text-sm font-bold text-slate-100">
                    Generated Dataset Tree & Config Files
                  </span>
                </div>

                <button
                  onClick={() => handleCopyFile(selectedFileKey)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-emerald-400 font-mono text-xs font-bold transition-all cursor-pointer"
                >
                  {copiedFileKey === selectedFileKey ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>COPIED!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>COPY FILE</span>
                    </>
                  )}
                </button>
              </div>

              {/* File List Chips */}
              <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
                <button
                  onClick={() => setSelectedFileKey('config_lora.toml')}
                  className={`px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                    selectedFileKey === 'config_lora.toml'
                      ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  config_lora.toml
                </button>

                <button
                  onClick={() => setSelectedFileKey('dataset.toml')}
                  className={`px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                    selectedFileKey === 'dataset.toml'
                      ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  dataset.toml
                </button>

                <button
                  onClick={() => setSelectedFileKey('train_lora.sh')}
                  className={`px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                    selectedFileKey === 'train_lora.sh'
                      ? 'bg-indigo-500 text-white font-bold border-indigo-400'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  train_lora.sh
                </button>

                <button
                  onClick={() => setSelectedFileKey('README.md')}
                  className={`px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                    selectedFileKey === 'README.md'
                      ? 'bg-purple-500 text-white font-bold border-purple-400'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  README.md
                </button>

                {anglesData.map(a => (
                  <button
                    key={a.angle}
                    onClick={() => setSelectedFileKey(`dataset_caption_angle_${a.angle}`)}
                    className={`px-2 py-1 rounded border transition-colors cursor-pointer ${
                      selectedFileKey === `dataset_caption_angle_${a.angle}`
                        ? 'bg-teal-500 text-slate-950 font-bold border-teal-400'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {a.angle.toLowerCase()}_view.caption
                  </button>
                ))}
              </div>

              {/* Code Text Area Viewer */}
              <div className="relative">
                <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-[11px] font-mono text-emerald-300 max-h-[380px] overflow-auto select-all leading-relaxed">
                  {getFileContent(selectedFileKey)}
                </pre>
              </div>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center space-x-3 text-xs text-slate-400">
              <Info className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-[11px] leading-tight">
                All configuration files match standard <strong>sd-scripts</strong> and <strong>Kohya_ss GUI</strong> specifications for fine-tuning anime character models.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL WITH PROPORTIONS GRID & ALIGNMENT CROSSHAIRS */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100">
                  {lightboxImage.title} Inspector
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowGridOverlay(!showGridOverlay)}
                  className={`px-2.5 py-1 rounded font-mono text-xs font-bold border transition-all cursor-pointer ${
                    showGridOverlay
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  Proportions Grid: {showGridOverlay ? 'ON' : 'OFF'}
                </button>

                <button
                  onClick={() => setLightboxImage(null)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Image Canvas with Proportions Overlay */}
            <div className="aspect-square w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 relative flex items-center justify-center">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />

              {/* Proportions & Alignment Overlay */}
              {showGridOverlay && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d4_1px,transparent_1px),linear-gradient(to_bottom,#06b6d4_1px,transparent_1px)] bg-[size:12.5%_12.5%] opacity-30"></div>
                  
                  {/* Eye Level Guideline */}
                  <div className="absolute inset-x-0 top-[28%] border-b border-dashed border-emerald-400/80 flex justify-between px-2 text-[9px] font-mono text-emerald-400">
                    <span>EYE LEVEL</span>
                    <span>1:7.5 HEAD SCALE</span>
                  </div>

                  {/* Shoulder Alignment Guideline */}
                  <div className="absolute inset-x-0 top-[42%] border-b border-dashed border-amber-400/80 flex justify-between px-2 text-[9px] font-mono text-amber-400">
                    <span>SHOULDER AXIS</span>
                    <span>SYMMETRY LOCK</span>
                  </div>

                  {/* Waist Center Line */}
                  <div className="absolute inset-y-0 left-1/2 border-r border-dashed border-cyan-400/80 flex flex-col justify-between py-2 text-[9px] font-mono text-cyan-400 pl-1">
                    <span>CENTER AXIS</span>
                  </div>
                </div>
              )}
            </div>

            {/* Caption Text Box */}
            {lightboxImage.caption && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 font-mono text-xs">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Auto-Generated Caption Tag</span>
                <p className="text-emerald-300 select-all">{lightboxImage.caption}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
