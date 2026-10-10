import React, { useState, useRef, useEffect } from 'react';
import { EpisodeProject, ScriptScene, ShotItem } from '../types';
import { 
  BookOpen, 
  Scroll, 
  Grid, 
  Layers, 
  MessageSquare, 
  Sparkles, 
  Download, 
  Plus, 
  Trash2, 
  Move, 
  Type, 
  Wand2, 
  Eye, 
  Maximize2, 
  Sliders, 
  FileText, 
  Palette, 
  Image as ImageIcon,
  Check,
  Zap,
  ArrowDown,
  Printer,
  Copy,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  LayoutGrid
} from 'lucide-react';
import { registerRealTimeHeal } from '../utils/selfHealingEngine';

interface MangaLayoutPublisherProps {
  project: EpisodeProject;
  onUpdateProject?: (updated: Partial<EpisodeProject>) => void;
  onGenerateImage?: (prompt: string, aspectRatio?: string) => Promise<string | null>;
}

export interface SpeechBubble {
  id: string;
  panelId: string;
  type: 'speech' | 'thought' | 'shout' | 'whisper' | 'narration';
  text: string;
  speaker?: string;
  xPct: number; // 0 to 100 relative to panel
  yPct: number; // 0 to 100 relative to panel
  widthPx: number;
  heightPx: number;
  tailX: number; // offset relative to bubble center
  tailY: number;
  fontSize: number;
  bubbleColor: string;
  textColor: string;
  borderWidth: number;
}

export interface MangaSFX {
  id: string;
  panelId: string;
  japaneseText: string;
  romajiText: string;
  meaning: string;
  xPct: number;
  yPct: number;
  rotationDeg: number;
  scale: number;
  color: string;
  strokeColor: string;
  fontStyle: 'impact' | 'brush' | 'jagged' | 'neon';
}

export interface MangaPanel {
  id: string;
  sceneNumber: number;
  shotId?: string;
  imageUrl: string;
  caption: string;
  aspectRatio: string;
  colSpan: number; // 1 to 12 in grid
  rowSpan: number;
  screentone: 'none' | 'halftone' | 'speedlines' | 'darkness' | 'sparkles' | 'vignette';
  bubbles: SpeechBubble[];
  sfxList: MangaSFX[];
  directorNote?: string;
}

export interface MangaPage {
  id: string;
  pageNumber: number;
  title: string;
  layoutPreset: 'manga-classic-6' | 'manga-action-5' | 'webtoon-vertical-strip' | 'yonkoma-4' | 'impact-splash';
  panels: MangaPanel[];
}

// Preset Japanese Action Sound Effects
const PRESET_SFX: { japaneseText: string; romajiText: string; meaning: string; fontStyle: 'impact' | 'brush' | 'jagged' | 'neon' }[] = [
  { japaneseText: 'ゴゴゴ', romajiText: 'GOGOGO', meaning: 'Menacing Rumble / Tension', fontStyle: 'impact' },
  { japaneseText: 'ドン！', romajiText: 'DON!', meaning: 'Dramatic Impact / Shock', fontStyle: 'jagged' },
  { japaneseText: 'バァン！', romajiText: 'BAAM!', meaning: 'Explosion / Gunshot', fontStyle: 'impact' },
  { japaneseText: 'シュッ', romajiText: 'SHU!', meaning: 'High-speed Slash / Dash', fontStyle: 'brush' },
  { japaneseText: 'パチパチ', romajiText: 'PACHI-PACHI', meaning: 'Sparks / Electricity', fontStyle: 'neon' },
  { japaneseText: 'ドキドキ', romajiText: 'DOKI-DOKI', meaning: 'Heartbeat / Nervousness', fontStyle: 'brush' },
  { japaneseText: 'ザザッ', romajiText: 'ZAZA!', meaning: 'Footsteps on Gravel / Sudden Halt', fontStyle: 'jagged' }
];

export const MangaLayoutPublisher: React.FC<MangaLayoutPublisherProps> = ({
  project,
  onUpdateProject,
  onGenerateImage
}) => {
  // Mode: 'manga-page' vs 'webtoon-strip'
  const [publishMode, setPublishMode] = useState<'manga-page' | 'webtoon-strip'>('manga-page');

  // Gutter & Reading Flow Configuration
  const [gutterSpacing, setGutterSpacing] = useState<number>( publishMode === 'webtoon-strip' ? 24 : 12 );
  const [readingDirection, setReadingDirection] = useState<'rtl' | 'ltr'>('rtl');
  const [paperBackground, setPaperBackground] = useState<'white' | 'sepia' | 'dark'>('white');
  const [pageScalePct, setPageScalePct] = useState<number>(100);

  // Selected Panel & Bubble Active Selection State
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);
  const [selectedSfxId, setSelectedSfxId] = useState<string | null>(null);

  // Active Tool: 'select' | 'bubble' | 'sfx' | 'screentone'
  const [activeTool, setActiveTool] = useState<'select' | 'bubble' | 'sfx' | 'screentone'>('select');

  // Generated Manga Pages State
  const [pages, setPages] = useState<MangaPage[]>(() => {
    // Generate initial pages from script scenes and shots
    const initialPanels: MangaPanel[] = project.shots.slice(0, 6).map((shot, idx) => ({
      id: `panel_${shot.id || idx}`,
      sceneNumber: shot.sceneNumber,
      shotId: shot.id,
      imageUrl: shot.keyframeUrl || `https://picsum.photos/seed/${project.id}_shot_${idx}/800/600`,
      caption: shot.actionPrompt || `Scene ${shot.sceneNumber} - Shot ${shot.shotNumber}`,
      aspectRatio: '16/9',
      colSpan: idx % 3 === 0 ? 12 : 6,
      rowSpan: 1,
      screentone: idx === 0 ? 'speedlines' : idx === 3 ? 'halftone' : 'none',
      bubbles: shot.dialogueLine ? [
        {
          id: `bubble_${idx}`,
          panelId: `panel_${shot.id || idx}`,
          type: 'speech',
          text: shot.dialogueLine,
          speaker: shot.charactersInShot?.[0] || 'Character',
          xPct: 15,
          yPct: 15,
          widthPx: 180,
          heightPx: 80,
          tailX: -20,
          tailY: 30,
          fontSize: 12,
          bubbleColor: '#ffffff',
          textColor: '#000000',
          borderWidth: 2
        }
      ] : [],
      sfxList: idx === 0 ? [
        {
          id: `sfx_${idx}`,
          panelId: `panel_${shot.id || idx}`,
          japaneseText: 'ゴゴゴ',
          romajiText: 'GOGOGO',
          meaning: 'Menacing Rumble',
          xPct: 70,
          yPct: 20,
          rotationDeg: -12,
          scale: 1.2,
          color: '#ef4444',
          strokeColor: '#000000',
          fontStyle: 'impact'
        }
      ] : []
    }));

    return [
      {
        id: 'page_1',
        pageNumber: 1,
        title: `${project.title} — Chapter 1 Page 1`,
        layoutPreset: 'manga-classic-6',
        panels: initialPanels
      }
    ];
  });

  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const activePage = pages[currentPageIndex] || pages[0];

  // Auto Convert Screenplay Scenes to Manga Page
  const handleAutoConvertScriptToManga = () => {
    const newPanels: MangaPanel[] = [];
    
    project.scenes.forEach((scene) => {
      const sceneShots = project.shots.filter(s => s.sceneNumber === scene.sceneNumber);
      const shotsToUse = sceneShots.length > 0 ? sceneShots : [
        {
          id: `gen_shot_${scene.sceneNumber}_1`,
          sceneNumber: scene.sceneNumber,
          shotNumber: 1,
          shotType: 'Wide',
          cameraMovement: 'Static',
          durationSec: 3,
          charactersInShot: project.cast.slice(0, 2).map(c => c.name),
          actionPrompt: scene.action || scene.heading,
          dialogueLine: scene.dialogue?.[0]?.line,
          keyframeUrl: `https://picsum.photos/seed/${project.id}_sc_${scene.sceneNumber}/800/600`,
          status: 'ready'
        } as ShotItem
      ];

      shotsToUse.forEach((shot, shotIdx) => {
        const dialogLine = shot.dialogueLine || scene.dialogue?.[shotIdx]?.line;
        const speaker = scene.dialogue?.[shotIdx]?.character || shot.charactersInShot?.[0] || 'Character';

        newPanels.push({
          id: `panel_sc${scene.sceneNumber}_sh${shotIdx}`,
          sceneNumber: scene.sceneNumber,
          shotId: shot.id,
          imageUrl: shot.keyframeUrl || `https://picsum.photos/seed/${project.id}_sc${scene.sceneNumber}_${shotIdx}/800/600`,
          caption: shot.actionPrompt || scene.action,
          aspectRatio: shotIdx === 0 ? '16/9' : '4/3',
          colSpan: shotIdx % 2 === 0 ? 12 : 6,
          rowSpan: 1,
          screentone: shot.shotType === 'Sakuga Impact' ? 'speedlines' : 'none',
          bubbles: dialogLine ? [
            {
              id: `bub_${scene.sceneNumber}_${shotIdx}`,
              panelId: `panel_sc${scene.sceneNumber}_sh${shotIdx}`,
              type: dialogLine.length > 60 ? 'narration' : 'speech',
              text: dialogLine,
              speaker: speaker,
              xPct: 10,
              yPct: 10,
              widthPx: 190,
              heightPx: 85,
              tailX: -15,
              tailY: 25,
              fontSize: 12,
              bubbleColor: '#ffffff',
              textColor: '#000000',
              borderWidth: 2
            }
          ] : [],
          sfxList: shot.shotType === 'Sakuga Impact' ? [
            {
              id: `sfx_${scene.sceneNumber}_${shotIdx}`,
              panelId: `panel_sc${scene.sceneNumber}_sh${shotIdx}`,
              japaneseText: 'ドン！',
              romajiText: 'DON!',
              meaning: 'Dramatic Impact',
              xPct: 75,
              yPct: 15,
              rotationDeg: -15,
              scale: 1.4,
              color: '#f59e0b',
              strokeColor: '#000000',
              fontStyle: 'jagged'
            }
          ] : []
        });
      });
    });

    // Chunk panels into pages of ~5 panels each
    const newPages: MangaPage[] = [];
    const chunkSize = 5;
    for (let i = 0; i < newPanels.length; i += chunkSize) {
      const pagePanels = newPanels.slice(i, i + chunkSize);
      newPages.push({
        id: `page_${newPages.length + 1}`,
        pageNumber: newPages.length + 1,
        title: `${project.title} — Page ${newPages.length + 1}`,
        layoutPreset: 'manga-classic-6',
        panels: pagePanels
      });
    }

    if (newPages.length > 0) {
      setPages(newPages);
      setCurrentPageIndex(0);
      registerRealTimeHeal('Export', `Converted ${project.scenes.length} screenplay scenes into ${newPages.length} manga/webtoon publisher pages.`, 'Converted script.', 'heal');
    }
  };

  // Add Speech Bubble to Selected Panel
  const handleAddSpeechBubble = (panelId: string, bubbleType: SpeechBubble['type'] = 'speech') => {
    const newBubble: SpeechBubble = {
      id: `bubble_${Date.now()}`,
      panelId,
      type: bubbleType,
      text: bubbleType === 'narration' ? 'Chapter 1: The Encounter...' : 'Speak line here!',
      speaker: 'Character',
      xPct: 20,
      yPct: 20,
      widthPx: 170,
      heightPx: 75,
      tailX: -20,
      tailY: 30,
      fontSize: 12,
      bubbleColor: '#ffffff',
      textColor: '#000000',
      borderWidth: 2
    };

    setPages(prevPages => prevPages.map(page => ({
      ...page,
      panels: page.panels.map(p => p.id === panelId ? { ...p, bubbles: [...p.bubbles, newBubble] } : p)
    })));

    setSelectedBubbleId(newBubble.id);
  };

  // Add Japanese SFX to Selected Panel
  const handleAddSFX = (panelId: string, preset = PRESET_SFX[0]) => {
    const newSfx: MangaSFX = {
      id: `sfx_${Date.now()}`,
      panelId,
      japaneseText: preset.japaneseText,
      romajiText: preset.romajiText,
      meaning: preset.meaning,
      xPct: 65,
      yPct: 20,
      rotationDeg: -10,
      scale: 1.2,
      color: '#ef4444',
      strokeColor: '#000000',
      fontStyle: preset.fontStyle
    };

    setPages(prevPages => prevPages.map(page => ({
      ...page,
      panels: page.panels.map(p => p.id === panelId ? { ...p, sfxList: [...p.sfxList, newSfx] } : p)
    })));

    setSelectedSfxId(newSfx.id);
  };

  // Delete selected Bubble or SFX
  const handleDeleteBubble = (bubbleId: string) => {
    setPages(prevPages => prevPages.map(page => ({
      ...page,
      panels: page.panels.map(p => ({
        ...p,
        bubbles: p.bubbles.filter(b => b.id !== bubbleId)
      }))
    })));
    setSelectedBubbleId(null);
  };

  const handleDeleteSFX = (sfxId: string) => {
    setPages(prevPages => prevPages.map(page => ({
      ...page,
      panels: page.panels.map(p => ({
        ...p,
        sfxList: p.sfxList.filter(s => s.id !== sfxId)
      }))
    })));
    setSelectedSfxId(null);
  };

  // Export Manga Page / Strip as PNG / Printable HTML Canvas
  const handleExportPageAsPNG = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const pageTitle = `${project.title}_Manga_Page_${activePage.pageNumber}`;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${pageTitle}</title>
          <style>
            body { margin: 0; padding: 20px; background: #000; color: #fff; font-family: sans-serif; text-align: center; }
            .page-container { background: ${paperBackground === 'dark' ? '#111827' : paperBackground === 'sepia' ? '#fbf0d9' : '#ffffff'}; padding: 24px; border-radius: 8px; max-w: 900px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            .panel-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: ${gutterSpacing}px; }
            .panel { border: 3px solid #000; position: relative; overflow: hidden; background: #222; }
            .panel img { width: 100%; height: 100%; object-fit: cover; display: block; }
            .bubble { position: absolute; background: #fff; color: #000; border: 2px solid #000; border-radius: 50%; padding: 10px; font-weight: bold; font-size: 12px; text-align: center; }
            @media print { body { background: #fff; padding: 0; } .page-container { box-shadow: none; border: none; } }
          </style>
        </head>
        <body>
          <h2>${project.title} — Page ${activePage.pageNumber}</h2>
          <p>Press Ctrl+P / Cmd+P to save as high-res PDF or print manga sheet.</p>
          <div className="page-container">
            <div className="panel-grid">
              ${activePage.panels.map(p => `
                <div class="panel" style="grid-column: span ${p.colSpan}; aspect-ratio: 16/9;">
                  <img src="${p.imageUrl}" />
                </div>
              `).join('')}
            </div>
          </div>
          <script>
            setTimeout(() => { window.print(); }, 800);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Helper to render SVG Speech Bubble Shapes
  const renderSVGBubble = (bubble: SpeechBubble, isSelected: boolean) => {
    const isNarration = bubble.type === 'narration';
    const isThought = bubble.type === 'thought';
    const isShout = bubble.type === 'shout';
    const isWhisper = bubble.type === 'whisper';

    return (
      <div
        key={bubble.id}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedBubbleId(bubble.id);
          setSelectedSfxId(null);
        }}
        style={{
          left: `${bubble.xPct}%`,
          top: `${bubble.yPct}%`,
          width: `${bubble.widthPx}px`,
          minHeight: `${bubble.heightPx}px`
        }}
        className={`absolute z-20 cursor-move select-none group transition-all ${
          isSelected ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900 scale-105' : ''
        }`}
      >
        <div className="relative w-full h-full">
          {/* SVG Shape Layer */}
          <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
            {isNarration && (
              <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill={bubble.bubbleColor}
                stroke={bubble.textColor}
                strokeWidth={bubble.borderWidth}
                rx="4"
              />
            )}

            {!isNarration && !isShout && (
              <>
                <ellipse
                  cx="50%"
                  cy="50%"
                  rx="48%"
                  ry="46%"
                  fill={bubble.bubbleColor}
                  stroke={bubble.textColor}
                  strokeWidth={bubble.borderWidth}
                  strokeDasharray={isWhisper ? '4,3' : 'none'}
                />
                {/* Speech Tail Pointer */}
                <path
                  d={`M 50% 85% Q ${50 + bubble.tailX}% ${100 + bubble.tailY}%, ${50 + bubble.tailX + 10}% ${100 + bubble.tailY}%`}
                  fill="none"
                  stroke={bubble.textColor}
                  strokeWidth={bubble.borderWidth}
                />
              </>
            )}

            {isShout && (
              <polygon
                points="10,0 30,10 50,0 70,12 90,0 100,20 90,40 100,60 85,80 100,100 75,90 50,100 30,85 0,100 10,70 0,50 10,25"
                fill={bubble.bubbleColor}
                stroke={bubble.textColor}
                strokeWidth={bubble.borderWidth + 1}
              />
            )}
          </svg>

          {/* Text Content Layer */}
          <div
            className="relative z-10 p-3 flex flex-col justify-center items-center text-center font-bold h-full leading-snug"
            style={{
              color: bubble.textColor,
              fontSize: `${bubble.fontSize}px`,
              fontFamily: isNarration ? 'serif' : 'sans-serif'
            }}
          >
            {bubble.speaker && !isNarration && (
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-extrabold mb-0.5">
                {bubble.speaker}
              </span>
            )}
            <span>{bubble.text}</span>
          </div>

          {/* Drag Handle & Delete Button when selected */}
          {isSelected && (
            <div className="absolute -top-3 -right-3 z-30 flex items-center space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteBubble(bubble.id);
                }}
                className="p-1 rounded-full bg-rose-600 text-white shadow hover:bg-rose-500 cursor-pointer"
                title="Delete Speech Bubble"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Helper to render Action SFX
  const renderSVGSFX = (sfx: MangaSFX, isSelected: boolean) => {
    return (
      <div
        key={sfx.id}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedSfxId(sfx.id);
          setSelectedBubbleId(null);
        }}
        style={{
          left: `${sfx.xPct}%`,
          top: `${sfx.yPct}%`,
          transform: `rotate(${sfx.rotationDeg}deg) scale(${sfx.scale})`,
          transformOrigin: 'center center'
        }}
        className={`absolute z-20 cursor-move select-none group transition-transform ${
          isSelected ? 'ring-2 ring-rose-500 ring-offset-2 ring-offset-slate-900' : ''
        }`}
      >
        <div className="relative">
          <span
            className="font-extrabold text-2xl tracking-widest block drop-shadow-md"
            style={{
              color: sfx.color,
              WebkitTextStroke: `1.5px ${sfx.strokeColor}`,
              fontFamily: sfx.fontStyle === 'impact' ? 'impact, sans-serif' : 'serif'
            }}
          >
            {sfx.japaneseText}
          </span>
          <span className="text-[8px] font-mono font-bold block text-center text-slate-900 bg-white/90 px-1 rounded shadow -mt-1">
            {sfx.romajiText}
          </span>

          {isSelected && (
            <div className="absolute -top-4 -right-4 z-30 flex items-center space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSFX(sfx.id);
                }}
                className="p-1 rounded-full bg-rose-600 text-white shadow hover:bg-rose-500 cursor-pointer"
                title="Delete SFX"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation & Publisher Modes */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-rose-500/30 rounded-xl text-rose-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-extrabold text-slate-100">
                Manga & Webtoon Layout Publisher
              </h2>
              <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 text-[10px] font-mono font-bold">
                PRINT & WEBTOON HD
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Screenplay scene layout engine, vector speech bubbles, Katakana SFX typography, and PDF/PNG publisher
            </p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setPublishMode('manga-page');
                setGutterSpacing(12);
              }}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                publishMode === 'manga-page'
                  ? 'bg-rose-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Classic Manga Pages</span>
            </button>

            <button
              onClick={() => {
                setPublishMode('webtoon-strip');
                setGutterSpacing(32);
              }}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                publishMode === 'webtoon-strip'
                  ? 'bg-rose-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Scroll className="w-3.5 h-3.5" />
              <span>Vertical Webtoon Strip</span>
            </button>
          </div>

          <button
            onClick={handleAutoConvertScriptToManga}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-extrabold text-xs shadow-lg hover:opacity-95 transition-all cursor-pointer"
          >
            <Wand2 className="w-4 h-4" />
            <span>Auto-Convert Script to Panels</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid: Toolbar, Canvas Preview, Properties Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Tool Palette & SFX Library (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Tools Palette */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
            <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-rose-400" />
              <span>Vector Overlay Palette</span>
            </h3>

            {/* Speech Bubble Actions */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-slate-400 block font-bold">ADD SPEECH BUBBLES</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => selectedPanelId && handleAddSpeechBubble(selectedPanelId, 'speech')}
                  disabled={!selectedPanelId}
                  className="flex items-center justify-center space-x-1.5 p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-rose-500 text-slate-200 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Speech</span>
                </button>

                <button
                  onClick={() => selectedPanelId && handleAddSpeechBubble(selectedPanelId, 'shout')}
                  disabled={!selectedPanelId}
                  className="flex items-center justify-center space-x-1.5 p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-rose-500 text-slate-200 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Shout</span>
                </button>

                <button
                  onClick={() => selectedPanelId && handleAddSpeechBubble(selectedPanelId, 'thought')}
                  disabled={!selectedPanelId}
                  className="flex items-center justify-center space-x-1.5 p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-rose-500 text-slate-200 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Thought</span>
                </button>

                <button
                  onClick={() => selectedPanelId && handleAddSpeechBubble(selectedPanelId, 'narration')}
                  disabled={!selectedPanelId}
                  className="flex items-center justify-center space-x-1.5 p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-rose-500 text-slate-200 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                >
                  <Type className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Narration</span>
                </button>
              </div>
            </div>

            {/* Action SFX Typography Library */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 block font-bold">JAPANESE KATAKANA SFX</span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {PRESET_SFX.map((preset) => (
                  <button
                    key={preset.japaneseText}
                    onClick={() => selectedPanelId && handleAddSFX(selectedPanelId, preset)}
                    disabled={!selectedPanelId}
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-rose-500 text-left text-xs transition-all disabled:opacity-40 cursor-pointer group"
                  >
                    <div>
                      <span className="font-extrabold text-rose-400 font-mono block text-sm">
                        {preset.japaneseText}
                      </span>
                      <span className="text-[9px] text-slate-400 block">
                        {preset.meaning}
                      </span>
                    </div>
                    <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Page Settings & Export Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl text-xs">
            <h3 className="font-extrabold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-cyan-400" />
              <span>Canvas & Print Setup</span>
            </h3>

            <div className="space-y-2">
              <div>
                <label className="text-slate-400 block mb-1 font-mono text-[11px]">Gutter Spacing ({gutterSpacing}px)</label>
                <input
                  type="range"
                  min="0"
                  max="48"
                  value={gutterSpacing}
                  onChange={(e) => setGutterSpacing(parseInt(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-mono text-[11px]">Paper Style</label>
                <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px]">
                  <button
                    onClick={() => setPaperBackground('white')}
                    className={`p-1.5 rounded border ${paperBackground === 'white' ? 'bg-rose-500 text-slate-950 font-bold border-rose-400' : 'bg-slate-950 text-slate-300 border-slate-800'}`}
                  >
                    WHITE
                  </button>
                  <button
                    onClick={() => setPaperBackground('sepia')}
                    className={`p-1.5 rounded border ${paperBackground === 'sepia' ? 'bg-amber-600 text-white font-bold border-amber-500' : 'bg-slate-950 text-slate-300 border-slate-800'}`}
                  >
                    SEPIA
                  </button>
                  <button
                    onClick={() => setPaperBackground('dark')}
                    className={`p-1.5 rounded border ${paperBackground === 'dark' ? 'bg-slate-800 text-white font-bold border-slate-700' : 'bg-slate-950 text-slate-300 border-slate-800'}`}
                  >
                    DARK
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-mono text-[11px]">Reading Direction</label>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
                  <button
                    onClick={() => setReadingDirection('rtl')}
                    className={`p-1.5 rounded border ${readingDirection === 'rtl' ? 'bg-rose-500 text-slate-950 font-bold border-rose-400' : 'bg-slate-950 text-slate-300 border-slate-800'}`}
                  >
                    RTL (Right to Left)
                  </button>
                  <button
                    onClick={() => setReadingDirection('ltr')}
                    className={`p-1.5 rounded border ${readingDirection === 'ltr' ? 'bg-rose-500 text-slate-950 font-bold border-rose-400' : 'bg-slate-950 text-slate-300 border-slate-800'}`}
                  >
                    LTR (Standard)
                  </button>
                </div>
              </div>

              <button
                onClick={handleExportPageAsPNG}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-rose-400 font-extrabold text-xs transition-all cursor-pointer mt-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save as PDF/PNG</span>
              </button>
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN: Interactive Canvas Preview (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Page Pagination Toolbar */}
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-xl">
            <div className="flex items-center space-x-2 font-mono text-xs text-slate-300">
              <span className="font-bold text-rose-400">{activePage.title}</span>
              <span>({activePage.panels.length} Panels)</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                disabled={currentPageIndex === 0}
                onClick={() => setCurrentPageIndex(prev => Math.max(0, prev - 1))}
                className="p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs font-bold text-slate-200">
                Page {currentPageIndex + 1} / {pages.length}
              </span>
              <button
                disabled={currentPageIndex >= pages.length - 1}
                onClick={() => setCurrentPageIndex(prev => Math.min(pages.length - 1, prev + 1))}
                className="p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Manga Canvas Container */}
          <div
            className={`p-6 rounded-2xl shadow-2xl transition-all min-h-[600px] border border-slate-800 ${
              paperBackground === 'dark' ? 'bg-slate-950' : paperBackground === 'sepia' ? 'bg-[#fbf0d9]' : 'bg-white'
            }`}
            style={{ direction: readingDirection }}
          >
            {/* Panel Grid Layout */}
            <div
              className="grid grid-cols-12"
              style={{ gap: `${gutterSpacing}px` }}
            >
              {activePage.panels.map((panel) => {
                const isSelected = selectedPanelId === panel.id;

                return (
                  <div
                    key={panel.id}
                    onClick={() => {
                      setSelectedPanelId(panel.id);
                      setSelectedBubbleId(null);
                      setSelectedSfxId(null);
                    }}
                    style={{
                      gridColumn: publishMode === 'webtoon-strip' ? 'span 12' : `span ${panel.colSpan}`
                    }}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer group ${
                      isSelected
                        ? 'border-rose-500 shadow-xl ring-2 ring-rose-500/50'
                        : 'border-black hover:border-slate-700'
                    }`}
                  >
                    {/* Background Screentone Texture Overlay */}
                    {panel.screentone === 'halftone' && (
                      <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] bg-[size:6px_6px] opacity-25"></div>
                    )}
                    {panel.screentone === 'speedlines' && (
                      <div className="absolute inset-0 z-10 pointer-events-none bg-[repeating-conic-gradient(from_0deg,#000_0deg_15deg,transparent_15deg_30deg)] opacity-20"></div>
                    )}

                    {/* Panel Image Artwork */}
                    <div className="aspect-video w-full bg-slate-900 relative">
                      <img
                        src={panel.imageUrl}
                        alt={`Scene ${panel.sceneNumber} Panel`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />

                      {/* Scene Badge */}
                      <span className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded bg-black/80 text-white font-mono text-[9px] font-bold">
                        SCENE {panel.sceneNumber}
                      </span>
                    </div>

                    {/* Render Speech Bubbles on Panel */}
                    {panel.bubbles.map((b) => renderSVGBubble(b, selectedBubbleId === b.id))}

                    {/* Render Action SFX on Panel */}
                    {panel.sfxList.map((s) => renderSVGSFX(s, selectedSfxId === s.id))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Selection Inspector & Properties (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Selected Bubble Editor */}
          {selectedBubbleId && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl text-xs">
              <h3 className="font-extrabold text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4" />
                <span>Speech Bubble Inspector</span>
              </h3>

              {(() => {
                const bubble = activePage.panels
                  .flatMap(p => p.bubbles)
                  .find(b => b.id === selectedBubbleId);

                if (!bubble) return null;

                const updateBubble = (updates: Partial<SpeechBubble>) => {
                  setPages(prevPages => prevPages.map(page => ({
                    ...page,
                    panels: page.panels.map(p => ({
                      ...p,
                      bubbles: p.bubbles.map(b => b.id === selectedBubbleId ? { ...b, ...updates } : b)
                    }))
                  })));
                };

                return (
                  <div className="space-y-2.5">
                    <div>
                      <label className="text-slate-400 block mb-1 font-mono text-[11px]">Dialogue Text</label>
                      <textarea
                        rows={2}
                        value={bubble.text}
                        onChange={(e) => updateBubble({ text: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 font-sans focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-400 block mb-1 font-mono text-[10px]">Position X ({bubble.xPct}%)</label>
                        <input
                          type="range"
                          min="0"
                          max="80"
                          value={bubble.xPct}
                          onChange={(e) => updateBubble({ xPct: parseInt(e.target.value) })}
                          className="w-full accent-emerald-500 cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1 font-mono text-[10px]">Position Y ({bubble.yPct}%)</label>
                        <input
                          type="range"
                          min="0"
                          max="80"
                          value={bubble.yPct}
                          onChange={(e) => updateBubble({ yPct: parseInt(e.target.value) })}
                          className="w-full accent-emerald-500 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 font-mono text-[11px]">Speaker Tag</label>
                      <input
                        type="text"
                        value={bubble.speaker || ''}
                        onChange={(e) => updateBubble({ speaker: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Selected Panel Inspector */}
          {selectedPanelId && !selectedBubbleId && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl text-xs">
              <h3 className="font-extrabold text-rose-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Grid className="w-4 h-4" />
                <span>Panel Layout Inspector</span>
              </h3>

              {(() => {
                const panel = activePage.panels.find(p => p.id === selectedPanelId);
                if (!panel) return null;

                const updatePanel = (updates: Partial<MangaPanel>) => {
                  setPages(prevPages => prevPages.map(page => ({
                    ...page,
                    panels: page.panels.map(p => p.id === selectedPanelId ? { ...p, ...updates } : p)
                  })));
                };

                return (
                  <div className="space-y-2.5">
                    <div>
                      <label className="text-slate-400 block mb-1 font-mono text-[11px]">Screentone Overlay</label>
                      <select
                        value={panel.screentone}
                        onChange={(e) => updatePanel({ screentone: e.target.value as MangaPanel['screentone'] })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-rose-500 focus:outline-none cursor-pointer"
                      >
                        <option value="none">None (Clean Artwork)</option>
                        <option value="halftone">Vintage Halftone Dots</option>
                        <option value="speedlines">Action Speed Lines</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 font-mono text-[11px]">Grid Width Span (1 to 12)</label>
                      <input
                        type="range"
                        min="3"
                        max="12"
                        step="3"
                        value={panel.colSpan}
                        onChange={(e) => updatePanel({ colSpan: parseInt(e.target.value) })}
                        className="w-full accent-rose-500 cursor-pointer"
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
