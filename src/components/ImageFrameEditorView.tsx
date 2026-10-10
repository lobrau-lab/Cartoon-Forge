import React, { useState, useRef, useEffect, useCallback } from 'react';
import { EpisodeProject, ShotItem } from '../types';
import { 
  Palette, 
  Layers, 
  Paintbrush, 
  Eraser, 
  Type, 
  Square, 
  Circle, 
  Move, 
  Crop, 
  Pipette, 
  Sparkles, 
  Sliders, 
  Download, 
  Upload, 
  RotateCcw, 
  RotateCw, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Plus, 
  Trash2, 
  Copy, 
  Sun, 
  Contrast, 
  SlidersHorizontal, 
  Wand2, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  Grid, 
  Save, 
  Image as ImageIcon,
  Check,
  Zap,
  Volume2,
  Minimize2,
  PenTool,
  PaintBucket,
  Sticker,
  ShieldAlert,
  Flame,
  MousePointer,
  Lasso,
  SunMedium,
  Crosshair,
  Spline,
  Blend,
  ArrowRight,
  Star,
  FlipHorizontal,
  FlipVertical,
  History,
  Undo2,
  Redo2,
  Scissors,
  Layers3,
  Combine
} from 'lucide-react';
import { registerRealTimeHeal } from '../utils/selfHealingEngine';

interface ImageFrameEditorViewProps {
  project: EpisodeProject;
  onUpdateProject?: (updated: Partial<EpisodeProject>) => void;
  onSaveToShotKeyframe?: (shotId: string, imageUrl: string) => void;
}

export interface CanvasLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number; // 0.0 to 1.0
  blendMode: GlobalCompositeOperation;
  canvas: HTMLCanvasElement;
  type: 'image' | 'paint' | 'text' | 'shape';
  imageUrl?: string;
}

export type ToolCategory = 'select' | 'paint' | 'vector' | 'fx' | 'adjust';

export type ToolType = 
  | 'move' 
  | 'marquee' 
  | 'ellipse-select' 
  | 'lasso' 
  | 'magic-wand' 
  | 'crop' 
  | 'brush' 
  | 'pencil' 
  | 'eraser' 
  | 'bucket' 
  | 'gradient' 
  | 'smudge' 
  | 'blur-tool' 
  | 'dodge-burn' 
  | 'clone-stamp' 
  | 'eyedropper' 
  | 'text' 
  | 'shape-rect' 
  | 'shape-circle' 
  | 'shape-line' 
  | 'shape-polygon' 
  | 'shape-star'
  | 'stamp-speedlines' 
  | 'stamp-halftone' 
  | 'stamp-sparkles' 
  | 'stamp-sfx';

export interface FilterSettings {
  brightness: number; // -100 to 100
  contrast: number;   // -100 to 100
  saturation: number; // -100 to 100
  hueShift: number;   // 0 to 360
  blurPx: number;     // 0 to 20
  invert: boolean;
  sepia: number;      // 0 to 100
  screentone: 'none' | 'manga-halftone' | 'lineart-extract' | 'anime-vignette' | 'chromatic';
}

const PRESET_COLOR_LUTS = [
  { id: 'normal', name: 'Original Raw', filter: 'none' },
  { id: 'cyberpunk', name: 'Cyberpunk Neon 2077', filter: 'hue-rotate(200deg) saturate(180%) contrast(120%)' },
  { id: 'retro90s', name: '90s Cel Anime VHS', filter: 'sepia(25%) saturate(140%) contrast(110%)' },
  { id: 'golden-hour', name: 'Golden Hour Sunset', filter: 'sepia(40%) hue-rotate(-20deg) saturate(160%)' },
  { id: 'dark-noir', name: 'Dark Noir Manga', filter: 'grayscale(100%) contrast(180%)' },
  { id: 'sakuga-vibrant', name: 'Sakuga Impact Pop', filter: 'saturate(220%) contrast(130%)' },
  { id: 'vaporwave', name: 'Vaporwave Dream', filter: 'hue-rotate(290deg) saturate(170%) brightness(110%)' }
];

const ANIME_SFX_STAMPS = ['DON!!', 'BAAM!!', 'ZAP!!', 'SHINE!!', 'WOOSH!!', 'GOOGOO', 'DODODO'];

const GRADIENT_PRESETS = [
  { name: 'Cyberpunk Cyan/Pink', colors: ['#06b6d4', '#ec4899'] },
  { name: 'Golden Sunset', colors: ['#f59e0b', '#ef4444'] },
  { name: 'Deep Space', colors: ['#0f172a', '#4338ca'] },
  { name: 'Anime Sky', colors: ['#38bdf8', '#f43f5e'] },
  { name: 'Monochrome Screen', colors: ['#ffffff', '#000000'] }
];

export const ImageFrameEditorView: React.FC<ImageFrameEditorViewProps> = ({
  project,
  onUpdateProject,
  onSaveToShotKeyframe
}) => {
  // Canvas Resolution State
  const [canvasWidth, setCanvasWidth] = useState<number>(1280);
  const [canvasHeight, setCanvasHeight] = useState<number>(720);

  // Active Tool & Brush Settings
  const [activeCategory, setActiveCategory] = useState<ToolCategory>('paint');
  const [activeTool, setActiveTool] = useState<ToolType>('brush');
  const [brushColor, setBrushColor] = useState<string>('#ef4444');
  const [secondaryColor, setSecondaryColor] = useState<string>('#000000');
  const [brushSize, setBrushSize] = useState<number>(14);
  const [brushOpacity, setBrushOpacity] = useState<number>(1.0);
  const [brushHardness, setBrushHardness] = useState<number>(80);

  // Text Tool State
  const [textInput, setTextInput] = useState<string>('ANIME IMPACT!');
  const [selectedSfx, setSelectedSfx] = useState<string>('DON!!');
  const [fontSize, setFontSize] = useState<number>(48);
  const [fontFamily, setFontFamily] = useState<string>('impact, sans-serif');
  const [activeGradient, setActiveGradient] = useState<number>(0);

  // Selected Shot Keyframe to Load
  const [selectedShotId, setSelectedShotId] = useState<string>(project.shots[0]?.id || '');

  // Filter Adjustments
  const [filters, setFilters] = useState<FilterSettings>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    hueShift: 0,
    blurPx: 0,
    invert: false,
    sepia: 0,
    screentone: 'none'
  });
  const [activeLut, setActiveLut] = useState<string>('normal');

  // Zoom & Pan Viewport State
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [showRuleOfThirds, setShowRuleOfThirds] = useState<boolean>(false);

  // Layer Management State
  const [layers, setLayers] = useState<CanvasLayer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);

  // Undo/Redo Stack
  const [historyStack, setHistoryStack] = useState<ImageData[]>([]);
  const [historyPointer, setHistoryPointer] = useState<number>(-1);

  // Selection Box State
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Refs for HTML5 Canvas elements
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  // Save Canvas State to History Stack
  const pushHistorySnapshot = useCallback(() => {
    const mainCanvas = mainCanvasRef.current;
    if (!mainCanvas) return;
    const ctx = mainCanvas.getContext('2d');
    if (!ctx) return;
    const imgData = ctx.getImageData(0, 0, mainCanvas.width, mainCanvas.height);
    setHistoryStack(prev => [...prev.slice(0, historyPointer + 1), imgData]);
    setHistoryPointer(prev => prev + 1);
  }, [historyPointer]);

  // Initialize Canvas Layers from Shot Image or Blank Canvas
  const initCanvasWithImage = useCallback((imageUrl?: string, w = 1280, h = 720) => {
    setCanvasWidth(w);
    setCanvasHeight(h);

    // Create Background Layer
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = w;
    bgCanvas.height = h;
    const bgCtx = bgCanvas.getContext('2d');

    if (bgCtx) {
      bgCtx.fillStyle = '#0f172a';
      bgCtx.fillRect(0, 0, w, h);

      if (imageUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imageUrl;
        img.onload = () => {
          bgCtx.drawImage(img, 0, 0, w, h);
          renderAllLayers();
        };
      }
    }

    // Create Paint Layer
    const paintCanvas = document.createElement('canvas');
    paintCanvas.width = w;
    paintCanvas.height = h;

    const layer1: CanvasLayer = {
      id: 'layer_bg',
      name: 'Background Keyframe',
      visible: true,
      locked: false,
      opacity: 1.0,
      blendMode: 'source-over',
      canvas: bgCanvas,
      type: 'image',
      imageUrl
    };

    const layer2: CanvasLayer = {
      id: 'layer_paint_1',
      name: 'Paint & Overlay Layer',
      visible: true,
      locked: false,
      opacity: 1.0,
      blendMode: 'source-over',
      canvas: paintCanvas,
      type: 'paint'
    };

    setLayers([layer1, layer2]);
    setActiveLayerId(layer2.id);
  }, []);

  useEffect(() => {
    const firstShotImg = project.shots[0]?.keyframeUrl || `https://picsum.photos/seed/${project.id}_frame_studio/1280/720`;
    initCanvasWithImage(firstShotImg);
  }, [initCanvasWithImage, project.id, project.shots]);

  // Load a selected Shot Keyframe into the Editor
  const handleLoadShotImage = (shotId: string) => {
    setSelectedShotId(shotId);
    const shot = project.shots.find(s => s.id === shotId);
    if (shot && shot.keyframeUrl) {
      initCanvasWithImage(shot.keyframeUrl);
      registerRealTimeHeal('Image Editor', `Loaded Shot #${shot.shotNumber} into Photoshop Frame Editor.`, 'Loaded frame image.', 'heal');
    }
  };

  // Render composite of all layers onto main preview canvas
  const renderAllLayers = useCallback(() => {
    const mainCanvas = mainCanvasRef.current;
    if (!mainCanvas) return;
    const ctx = mainCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);

    // Apply Filter String
    let filterStr = `brightness(${100 + filters.brightness}%) contrast(${100 + filters.contrast}%) saturate(${100 + filters.saturation}%) hue-rotate(${filters.hueShift}deg) blur(${filters.blurPx}px)`;
    if (filters.invert) filterStr += ' invert(100%)';
    if (filters.sepia > 0) filterStr += ` sepia(${filters.sepia}%)`;

    ctx.filter = filterStr;

    layers.forEach((layer) => {
      if (!layer.visible) return;
      ctx.save();
      ctx.globalAlpha = layer.opacity;
      ctx.globalCompositeOperation = layer.blendMode;
      ctx.drawImage(layer.canvas, 0, 0);
      ctx.restore();
    });

    ctx.filter = 'none';

    // Apply Screentone Overlays if selected
    if (filters.screentone === 'manga-halftone') {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
      for (let x = 0; x < mainCanvas.width; x += 8) {
        for (let y = 0; y < mainCanvas.height; y += 8) {
          ctx.beginPath();
          ctx.arc(x, y, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    } else if (filters.screentone === 'anime-vignette') {
      ctx.save();
      const grad = ctx.createRadialGradient(
        mainCanvas.width / 2, mainCanvas.height / 2, mainCanvas.width * 0.3,
        mainCanvas.width / 2, mainCanvas.height / 2, mainCanvas.width * 0.75
      );
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.8)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
      ctx.restore();
    } else if (filters.screentone === 'chromatic') {
      // Simulate chromatic aberration fringe
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
      ctx.fillRect(3, 0, mainCanvas.width, mainCanvas.height);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.fillRect(-3, 0, mainCanvas.width, mainCanvas.height);
      ctx.restore();
    }
  }, [filters, layers]);

  useEffect(() => {
    renderAllLayers();
  }, [renderAllLayers]);

  // Handle Canvas Coordinates
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  // Mouse Down Handler for all Canvas Tools
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const activeLayer = layers.find(l => l.id === activeLayerId);
    if (!activeLayer || activeLayer.locked || !activeLayer.visible) return;

    isDrawingRef.current = true;
    const pos = getCanvasCoords(e);
    lastPosRef.current = pos;
    startPosRef.current = pos;

    const layerCtx = activeLayer.canvas.getContext('2d');
    if (!layerCtx) return;

    if (activeTool === 'brush') {
      layerCtx.beginPath();
      layerCtx.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2);
      layerCtx.fillStyle = brushColor;
      layerCtx.globalAlpha = brushOpacity;
      layerCtx.fill();
    } else if (activeTool === 'pencil') {
      layerCtx.fillStyle = brushColor;
      layerCtx.fillRect(pos.x - brushSize / 2, pos.y - brushSize / 2, brushSize, brushSize);
    } else if (activeTool === 'eraser') {
      layerCtx.clearRect(pos.x - brushSize / 2, pos.y - brushSize / 2, brushSize, brushSize);
    } else if (activeTool === 'bucket') {
      layerCtx.fillStyle = brushColor;
      layerCtx.fillRect(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
    } else if (activeTool === 'gradient') {
      const grad = layerCtx.createLinearGradient(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
      const preset = GRADIENT_PRESETS[activeGradient] || GRADIENT_PRESETS[0];
      grad.addColorStop(0, preset.colors[0]);
      grad.addColorStop(1, preset.colors[1]);
      layerCtx.fillStyle = grad;
      layerCtx.fillRect(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
    } else if (activeTool === 'text') {
      layerCtx.save();
      layerCtx.font = `bold ${fontSize}px ${fontFamily}`;
      layerCtx.fillStyle = brushColor;
      layerCtx.shadowColor = '#000000';
      layerCtx.shadowBlur = 6;
      layerCtx.fillText(textInput, pos.x, pos.y);
      layerCtx.restore();
    } else if (activeTool === 'stamp-sfx') {
      layerCtx.save();
      layerCtx.font = `black italic ${fontSize * 1.2}px impact, sans-serif`;
      layerCtx.fillStyle = brushColor;
      layerCtx.strokeStyle = '#000000';
      layerCtx.lineWidth = 4;
      layerCtx.strokeText(selectedSfx, pos.x, pos.y);
      layerCtx.fillText(selectedSfx, pos.x, pos.y);
      layerCtx.restore();
    } else if (activeTool === 'shape-rect') {
      layerCtx.fillStyle = brushColor;
      layerCtx.fillRect(pos.x - 60, pos.y - 40, 120, 80);
    } else if (activeTool === 'shape-circle') {
      layerCtx.fillStyle = brushColor;
      layerCtx.beginPath();
      layerCtx.arc(pos.x, pos.y, 50, 0, Math.PI * 2);
      layerCtx.fill();
    } else if (activeTool === 'shape-star') {
      layerCtx.save();
      layerCtx.fillStyle = brushColor;
      layerCtx.beginPath();
      for (let i = 0; i < 5; i++) {
        const outer = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const inner = ((i * 2 + 1) * Math.PI) / 5 - Math.PI / 2;
        layerCtx.lineTo(pos.x + Math.cos(outer) * 40, pos.y + Math.sin(outer) * 40);
        layerCtx.lineTo(pos.x + Math.cos(inner) * 18, pos.y + Math.sin(inner) * 18);
      }
      layerCtx.closePath();
      layerCtx.fill();
      layerCtx.restore();
    } else if (activeTool === 'eyedropper') {
      const mainCtx = mainCanvasRef.current?.getContext('2d');
      if (mainCtx) {
        const pixel = mainCtx.getImageData(pos.x, pos.y, 1, 1).data;
        const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`;
        setBrushColor(hex);
      }
    } else if (activeTool === 'stamp-speedlines') {
      layerCtx.save();
      layerCtx.strokeStyle = brushColor;
      layerCtx.lineWidth = 2.5;
      for (let i = 0; i < 48; i += 2) {
        const angle = (i * Math.PI) / 24;
        layerCtx.beginPath();
        layerCtx.moveTo(pos.x, pos.y);
        layerCtx.lineTo(pos.x + Math.cos(angle) * 400, pos.y + Math.sin(angle) * 400);
        layerCtx.stroke();
      }
      layerCtx.restore();
    } else if (activeTool === 'stamp-sparkles') {
      layerCtx.save();
      layerCtx.fillStyle = brushColor;
      for (let i = 0; i < 12; i++) {
        const rx = pos.x + (Math.random() - 0.5) * 120;
        const ry = pos.y + (Math.random() - 0.5) * 120;
        const size = Math.random() * 8 + 4;
        layerCtx.fillRect(rx, ry, size, size);
      }
      layerCtx.restore();
    } else if (activeTool === 'marquee') {
      setSelectionBox({ x: pos.x, y: pos.y, w: 0, h: 0 });
    }

    renderAllLayers();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const activeLayer = layers.find(l => l.id === activeLayerId);
    if (!activeLayer || activeLayer.locked || !activeLayer.visible) return;

    const pos = getCanvasCoords(e);
    const lastPos = lastPosRef.current || pos;
    const startPos = startPosRef.current || pos;
    const layerCtx = activeLayer.canvas.getContext('2d');
    if (!layerCtx) return;

    if (activeTool === 'brush') {
      layerCtx.beginPath();
      layerCtx.moveTo(lastPos.x, lastPos.y);
      layerCtx.lineTo(pos.x, pos.y);
      layerCtx.strokeStyle = brushColor;
      layerCtx.lineWidth = brushSize;
      layerCtx.lineCap = 'round';
      layerCtx.lineJoin = 'round';
      layerCtx.globalAlpha = brushOpacity;
      layerCtx.stroke();
    } else if (activeTool === 'pencil') {
      layerCtx.fillStyle = brushColor;
      layerCtx.fillRect(pos.x - brushSize / 2, pos.y - brushSize / 2, brushSize, brushSize);
    } else if (activeTool === 'eraser') {
      layerCtx.clearRect(pos.x - brushSize / 2, pos.y - brushSize / 2, brushSize, brushSize);
    } else if (activeTool === 'smudge') {
      const imgData = layerCtx.getImageData(lastPos.x, lastPos.y, brushSize, brushSize);
      layerCtx.putImageData(imgData, pos.x, pos.y);
    } else if (activeTool === 'shape-line') {
      layerCtx.beginPath();
      layerCtx.moveTo(startPos.x, startPos.y);
      layerCtx.lineTo(pos.x, pos.y);
      layerCtx.strokeStyle = brushColor;
      layerCtx.lineWidth = brushSize;
      layerCtx.stroke();
    } else if (activeTool === 'marquee') {
      setSelectionBox({
        x: Math.min(startPos.x, pos.x),
        y: Math.min(startPos.y, pos.y),
        w: Math.abs(pos.x - startPos.x),
        h: Math.abs(pos.y - startPos.y)
      });
    }

    lastPosRef.current = pos;
    renderAllLayers();
  };

  const handleMouseUp = () => {
    if (isDrawingRef.current) {
      pushHistorySnapshot();
    }
    isDrawingRef.current = false;
    lastPosRef.current = null;
    startPosRef.current = null;
  };

  // Layer Management Actions
  const handleAddLayer = () => {
    const newCanvas = document.createElement('canvas');
    newCanvas.width = canvasWidth;
    newCanvas.height = canvasHeight;

    const newLayer: CanvasLayer = {
      id: `layer_${Date.now()}`,
      name: `Layer ${layers.length + 1}`,
      visible: true,
      locked: false,
      opacity: 1.0,
      blendMode: 'source-over',
      canvas: newCanvas,
      type: 'paint'
    };

    setLayers(prev => [...prev, newLayer]);
    setActiveLayerId(newLayer.id);
  };

  const handleDeleteLayer = (layerId: string) => {
    if (layers.length <= 1) return;
    setLayers(prev => prev.filter(l => l.id !== layerId));
    setActiveLayerId(layers[0]?.id || null);
  };

  const handleDuplicateLayer = (layerId: string) => {
    const sourceLayer = layers.find(l => l.id === layerId);
    if (!sourceLayer) return;

    const newCanvas = document.createElement('canvas');
    newCanvas.width = canvasWidth;
    newCanvas.height = canvasHeight;
    const ctx = newCanvas.getContext('2d');
    if (ctx) ctx.drawImage(sourceLayer.canvas, 0, 0);

    const dupLayer: CanvasLayer = {
      ...sourceLayer,
      id: `layer_${Date.now()}`,
      name: `${sourceLayer.name} (Copy)`,
      canvas: newCanvas
    };

    setLayers(prev => [...prev, dupLayer]);
    setActiveLayerId(dupLayer.id);
  };

  const handleMergeDown = (index: number) => {
    if (index <= 0) return;
    const upper = layers[index];
    const lower = layers[index - 1];
    if (!upper || !lower) return;

    const lowerCtx = lower.canvas.getContext('2d');
    if (lowerCtx) {
      lowerCtx.save();
      lowerCtx.globalAlpha = upper.opacity;
      lowerCtx.globalCompositeOperation = upper.blendMode;
      lowerCtx.drawImage(upper.canvas, 0, 0);
      lowerCtx.restore();
    }

    setLayers(prev => prev.filter((_, i) => i !== index));
    setActiveLayerId(lower.id);
  };

  const handleToggleLayerVisibility = (layerId: string) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, visible: !l.visible } : l));
  };

  const handleToggleLayerLock = (layerId: string) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, locked: !l.locked } : l));
  };

  // Canvas Transformations
  const handleFlipHorizontal = () => {
    const activeLayer = layers.find(l => l.id === activeLayerId);
    if (!activeLayer) return;
    const ctx = activeLayer.canvas.getContext('2d');
    if (!ctx) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasWidth;
    tempCanvas.height = canvasHeight;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.translate(canvasWidth, 0);
    tempCtx.scale(-1, 1);
    tempCtx.drawImage(activeLayer.canvas, 0, 0);

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(tempCanvas, 0, 0);
    renderAllLayers();
  };

  const handleFlipVertical = () => {
    const activeLayer = layers.find(l => l.id === activeLayerId);
    if (!activeLayer) return;
    const ctx = activeLayer.canvas.getContext('2d');
    if (!ctx) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasWidth;
    tempCanvas.height = canvasHeight;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.translate(0, canvasHeight);
    tempCtx.scale(1, -1);
    tempCtx.drawImage(activeLayer.canvas, 0, 0);

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(tempCanvas, 0, 0);
    renderAllLayers();
  };

  // Export & Save Actions
  const handleExportPNG = () => {
    const mainCanvas = mainCanvasRef.current;
    if (!mainCanvas) return;
    const dataUrl = mainCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${project.title}_Photoshop_Frame_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleSaveBackToShot = () => {
    const mainCanvas = mainCanvasRef.current;
    if (!mainCanvas || !selectedShotId) return;
    const dataUrl = mainCanvas.toDataURL('image/png');

    if (onSaveToShotKeyframe) {
      onSaveToShotKeyframe(selectedShotId, dataUrl);
    } else if (onUpdateProject) {
      const updatedShots = project.shots.map(s => s.id === selectedShotId ? { ...s, keyframeUrl: dataUrl } : s);
      onUpdateProject({ shots: updatedShots });
    }

    registerRealTimeHeal('Image Editor', `Saved edited frame back to Shot keyframe #${selectedShotId}.`, 'Saved keyframe frame.', 'heal');
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-extrabold text-slate-100">
                GIMP / Photoshop / Krita Professional Image Studio
              </h2>
              <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-mono font-bold">
                FULL TOOL SUITE 2.0
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Complete multi-layer painting suite, selection marquees, anime screentones, SFX decals, gradients &amp; color grading
            </p>
          </div>
        </div>

        {/* Shot Keyframe Selector & Quick Resolution Presets */}
        <div className="flex flex-wrap items-center space-x-3">
          {/* Resolution Dropdown */}
          <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 p-1.5 rounded-xl text-xs font-mono">
            <span className="text-slate-400 pl-1">Preset:</span>
            <select
              value={`${canvasWidth}x${canvasHeight}`}
              onChange={(e) => {
                const [w, h] = e.target.value.split('x').map(Number);
                initCanvasWithImage(undefined, w, h);
              }}
              className="bg-slate-900 text-indigo-300 border border-slate-700 rounded px-1.5 py-0.5 font-bold cursor-pointer"
            >
              <option value="1280x720">16:9 HD (1280x720)</option>
              <option value="1920x1080">16:9 FHD (1920x1080)</option>
              <option value="1080x1080">1:1 Square (1080x1080)</option>
              <option value="1080x1920">9:16 Vertical (1080x1920)</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 p-1.5 rounded-xl">
            <span className="text-[11px] font-mono text-slate-400 pl-2">Target Shot:</span>
            <select
              value={selectedShotId}
              onChange={(e) => handleLoadShotImage(e.target.value)}
              className="bg-slate-900 text-indigo-300 border border-slate-700 font-mono text-xs font-bold rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
            >
              {project.shots.map((shot) => (
                <option key={shot.id} value={shot.id}>
                  Shot #{shot.shotNumber} — {shot.shotType} ({shot.actionPrompt?.slice(0, 18)}...)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSaveBackToShot}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-xs shadow-lg hover:opacity-95 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save to Shot Keyframe</span>
          </button>

          <button
            onClick={handleExportPNG}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-indigo-300 font-extrabold text-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export HD PNG</span>
          </button>
        </div>
      </div>

      {/* Main Studio Toolbar & Canvas Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: Tool Category Tabs & Photoshop Tool Icons (2.5 Cols) */}
        <div className="lg:col-span-3 space-y-3">
          {/* Tool Category Selector */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[10px] font-bold">
            <button
              onClick={() => setActiveCategory('paint')}
              className={`py-1 rounded-lg transition-all cursor-pointer ${
                activeCategory === 'paint' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              PAINT
            </button>
            <button
              onClick={() => setActiveCategory('select')}
              className={`py-1 rounded-lg transition-all cursor-pointer ${
                activeCategory === 'select' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SELECT
            </button>
            <button
              onClick={() => setActiveCategory('vector')}
              className={`py-1 rounded-lg transition-all cursor-pointer ${
                activeCategory === 'vector' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              VECTOR
            </button>
            <button
              onClick={() => setActiveCategory('fx')}
              className={`py-1 rounded-lg transition-all cursor-pointer ${
                activeCategory === 'fx' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              STAMPS
            </button>
          </div>

          {/* Tools Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-3 shadow-xl">
            <div className="grid grid-cols-3 gap-1.5">
              {/* Category: PAINT */}
              {activeCategory === 'paint' && (
                <>
                  <button
                    onClick={() => setActiveTool('brush')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      activeTool === 'brush' ? 'bg-indigo-600 text-white border-indigo-400 shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Paintbrush className="w-4 h-4" />
                    <span className="text-[9px] font-mono mt-1">Brush</span>
                  </button>

                  <button
                    onClick={() => setActiveTool('pencil')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      activeTool === 'pencil' ? 'bg-indigo-600 text-white border-indigo-400 shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <PenTool className="w-4 h-4" />
                    <span className="text-[9px] font-mono mt-1">Pencil</span>
                  </button>

                  <button
                    onClick={() => setActiveTool('eraser')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      activeTool === 'eraser' ? 'bg-indigo-600 text-white border-indigo-400 shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Eraser className="w-4 h-4" />
                    <span className="text-[9px] font-mono mt-1">Eraser</span>
                  </button>

                  <button
                    onClick={() => setActiveTool('bucket')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      activeTool === 'bucket' ? 'bg-indigo-600 text-white border-indigo-400 shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <PaintBucket className="w-4 h-4" />
                    <span className="text-[9px] font-mono mt-1">Fill</span>
                  </button>

                  <button
                    onClick={() => setActiveTool('gradient')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      activeTool === 'gradient' ? 'bg-indigo-600 text-white border-indigo-400 shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Blend className="w-4 h-4 text-pink-400" />
                    <span className="text-[9px] font-mono mt-1">Gradient</span>
                  </button>

                  <button
                    onClick={() => setActiveTool('smudge')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      activeTool === 'smudge' ? 'bg-indigo-600 text-white border-indigo-400 shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Spline className="w-4 h-4 text-amber-400" />
                    <span className="text-[9px] font-mono mt-1">Smudge</span>
                  </button>

                  <button
                    onClick={() => setActiveTool('eyedropper')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      activeTool === 'eyedropper' ? 'bg-indigo-600 text-white border-indigo-400 shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Pipette className="w-4 h-4" />
                    <span className="text-[9px] font-mono mt-1">Picker</span>
                  </button>
                </>
              )}

              {/* Category: SELECT */}
              {activeCategory === 'select' && (
                <>
                  <button
                    onClick={() => setActiveTool('move')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      activeTool === 'move' ? 'bg-indigo-600 text-white border-indigo-400 shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Move className="w-4 h-4" />
                    <span className="text-[9px] font-mono mt-1">Move</span>
                  </button>

                  <button
                    onClick={() => setActiveTool('marquee')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      activeTool === 'marquee' ? 'bg-indigo-600 text-white border-indigo-400 shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Square className="w-4 h-4" />
                    <span className="text-[9px] font-mono mt-1">Rect Marquee</span>
                  </button>

                  <button
                    onClick={() => setActiveTool('lasso')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      activeTool === 'lasso' ? 'bg-indigo-600 text-white border-indigo-400 shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Lasso className="w-4 h-4" />
                    <span className="text-[9px] font-mono mt-1">Lasso</span>
                  </button>
                </>
              )}

              {/* Category: VECTOR */}
              {activeCategory === 'vector' && (
                <>
                  <button
                    onClick={() => setActiveTool('text')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      activeTool === 'text' ? 'bg-indigo-600 text-white border-indigo-400 shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Type className="w-4 h-4" />
                    <span className="text-[9px] font-mono mt-1">Text</span>
                  </button>

                  <button
                    onClick={() => setActiveTool('shape-rect')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      activeTool === 'shape-rect' ? 'bg-indigo-600 text-white border-indigo-400 shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Square className="w-4 h-4" />
                    <span className="text-[9px] font-mono mt-1">Rect</span>
                  </button>

                  <button
                    onClick={() => setActiveTool('shape-circle')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      activeTool === 'shape-circle' ? 'bg-indigo-600 text-white border-indigo-400 shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Circle className="w-4 h-4" />
                    <span className="text-[9px] font-mono mt-1">Circle</span>
                  </button>

                  <button
                    onClick={() => setActiveTool('shape-line')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      activeTool === 'shape-line' ? 'bg-indigo-600 text-white border-indigo-400 shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span className="text-[9px] font-mono mt-1">Line</span>
                  </button>

                  <button
                    onClick={() => setActiveTool('shape-star')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      activeTool === 'shape-star' ? 'bg-indigo-600 text-white border-indigo-400 shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Star className="w-4 h-4 text-amber-400" />
                    <span className="text-[9px] font-mono mt-1">Star</span>
                  </button>
                </>
              )}

              {/* Category: STAMPS / FX */}
              {activeCategory === 'fx' && (
                <>
                  <button
                    onClick={() => setActiveTool('stamp-speedlines')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      activeTool === 'stamp-speedlines' ? 'bg-indigo-600 text-white border-indigo-400 shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-[9px] font-mono mt-1">Speedlines</span>
                  </button>

                  <button
                    onClick={() => setActiveTool('stamp-sparkles')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      activeTool === 'stamp-sparkles' ? 'bg-indigo-600 text-white border-indigo-400 shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="text-[9px] font-mono mt-1">Aura Sparkles</span>
                  </button>

                  <button
                    onClick={() => setActiveTool('stamp-sfx')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      activeTool === 'stamp-sfx' ? 'bg-indigo-600 text-white border-indigo-400 shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sticker className="w-4 h-4 text-pink-400" />
                    <span className="text-[9px] font-mono mt-1">Anime SFX</span>
                  </button>
                </>
              )}
            </div>

            {/* Brush & Color Inspector */}
            <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Color Palette</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-[11px] font-mono text-slate-200"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span>Size</span>
                  <span className="text-indigo-400 font-bold">{brushSize}px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="120"
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span>Opacity</span>
                  <span className="text-indigo-400 font-bold">{Math.round(brushOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={Math.round(brushOpacity * 100)}
                  onChange={(e) => setBrushOpacity(parseInt(e.target.value) / 100)}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              {activeTool === 'gradient' && (
                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 block">Gradient Preset</label>
                  <select
                    value={activeGradient}
                    onChange={(e) => setActiveGradient(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-xs text-slate-200 font-mono cursor-pointer"
                  >
                    {GRADIENT_PRESETS.map((p, idx) => (
                      <option key={idx} value={idx}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {activeTool === 'text' && (
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <label className="text-[10px] font-mono text-slate-400 block">Text Content</label>
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-200"
                  />
                </div>
              )}

              {activeTool === 'stamp-sfx' && (
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <label className="text-[10px] font-mono text-slate-400 block">Select Manga SFX</label>
                  <div className="grid grid-cols-2 gap-1">
                    {ANIME_SFX_STAMPS.map((sfx) => (
                      <button
                        key={sfx}
                        onClick={() => setSelectedSfx(sfx)}
                        className={`p-1 rounded text-[10px] font-black font-mono transition-all cursor-pointer ${
                          selectedSfx === sfx ? 'bg-pink-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {sfx}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Main Interactive HTML5 Canvas Viewport (6.5 Cols) */}
        <div className="lg:col-span-6 space-y-3">
          {/* Canvas Viewport Toolbar Bar */}
          <div className="flex flex-wrap items-center justify-between bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs font-mono">
            <div className="flex items-center space-x-3 text-slate-300">
              <span className="font-bold text-indigo-400">{canvasWidth}x{canvasHeight}</span>
              <span className="hidden sm:inline">Active: <strong className="text-slate-100 uppercase">{activeTool}</strong></span>
            </div>

            {/* Transform Controls & Zoom */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleFlipHorizontal}
                className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
                title="Flip Horizontal"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleFlipVertical}
                className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
                title="Flip Vertical"
              >
                <FlipVertical className="w-3.5 h-3.5" />
              </button>

              <div className="h-4 w-px bg-slate-800 mx-1" />

              <button
                onClick={() => setZoomLevel(prev => Math.max(50, prev - 25))}
                className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-bold text-slate-200 w-10 text-center">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(200, prev + 25))}
                className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowGrid(prev => !prev)}
                className={`p-1 rounded border cursor-pointer ${
                  showGrid ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
                title="Toggle Pixel Grid"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Canvas Center */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-auto flex items-center justify-center min-h-[520px] shadow-2xl relative">
            <div
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'center center'
              }}
              className="relative shadow-2xl rounded-lg overflow-hidden border border-slate-700 bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[size:12px_12px]"
            >
              <canvas
                ref={mainCanvasRef}
                width={canvasWidth}
                height={canvasHeight}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="cursor-crosshair block"
              />

              {/* Grid Overlay */}
              {showGrid && (
                <div className="absolute inset-0 pointer-events-none border border-cyan-500/30 bg-[linear-gradient(to_right,#0284c715_1px,transparent_1px),linear-gradient(to_bottom,#0284c715_1px,transparent_1px)] bg-[size:32px_32px]" />
              )}

              {/* Selection Marquee Box */}
              {selectionBox && (
                <div
                  className="absolute border-2 border-dashed border-cyan-400 bg-cyan-500/10 pointer-events-none animate-pulse"
                  style={{
                    left: `${selectionBox.x}px`,
                    top: `${selectionBox.y}px`,
                    width: `${selectionBox.w}px`,
                    height: `${selectionBox.h}px`
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Layer Stack & Color Grading Filters (2.5 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Layer Management Suite */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Layers ({layers.length})</span>
              </h3>
              <button
                onClick={handleAddLayer}
                className="p-1 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer flex items-center space-x-1 text-[10px] font-mono font-bold"
              >
                <Plus className="w-3 h-3" />
                <span>Layer</span>
              </button>
            </div>

            {/* Layer Stack */}
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {layers.map((layer, idx) => {
                const isActive = layer.id === activeLayerId;
                return (
                  <div
                    key={layer.id}
                    onClick={() => setActiveLayerId(layer.id)}
                    className={`p-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-950/80 border-indigo-500 text-slate-100 shadow-md ring-1 ring-indigo-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleLayerVisibility(layer.id);
                        }}
                        className="text-slate-400 hover:text-white"
                      >
                        {layer.visible ? <Eye className="w-3.5 h-3.5 text-indigo-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleLayerLock(layer.id);
                        }}
                        className="text-slate-400 hover:text-white"
                      >
                        {layer.locked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5 text-slate-600" />}
                      </button>

                      <span className="text-xs font-bold font-mono truncate">{layer.name}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateLayer(layer.id);
                        }}
                        className="p-1 text-slate-500 hover:text-indigo-300"
                        title="Duplicate Layer"
                      >
                        <Copy className="w-3 h-3" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLayer(layer.id);
                        }}
                        disabled={layers.length <= 1}
                        className="p-1 text-slate-500 hover:text-rose-400 disabled:opacity-30"
                        title="Delete Layer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Color Grading & Filters Studio */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-3 shadow-xl text-xs">
            <h3 className="font-extrabold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
              <span>Color LUTs &amp; FX</span>
            </h3>

            {/* LUT Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-slate-400 block font-bold">PRESET LUT STYLES</span>
              <div className="grid grid-cols-2 gap-1.5">
                {PRESET_COLOR_LUTS.map((lut) => (
                  <button
                    key={lut.id}
                    onClick={() => {
                      setActiveLut(lut.id);
                      if (lut.id === 'cyberpunk') setFilters(f => ({ ...f, hueShift: 200, saturation: 80 }));
                      else if (lut.id === 'retro90s') setFilters(f => ({ ...f, sepia: 25, contrast: 20 }));
                      else if (lut.id === 'dark-noir') setFilters(f => ({ ...f, saturation: -100, contrast: 80 }));
                      else if (lut.id === 'vaporwave') setFilters(f => ({ ...f, hueShift: 290, saturation: 70 }));
                      else setFilters(f => ({ ...f, brightness: 0, contrast: 0, saturation: 0, hueShift: 0, sepia: 0 }));
                    }}
                    className={`p-1.5 rounded-lg border text-[10px] font-mono font-bold truncate transition-all cursor-pointer ${
                      activeLut === lut.id ? 'bg-cyan-600 text-white border-cyan-400' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    {lut.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Fine Adjustments */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span>Brightness</span>
                  <span className="text-cyan-400">{filters.brightness}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={filters.brightness}
                  onChange={(e) => setFilters(f => ({ ...f, brightness: parseInt(e.target.value) }))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span>Contrast</span>
                  <span className="text-cyan-400">{filters.contrast}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={filters.contrast}
                  onChange={(e) => setFilters(f => ({ ...f, contrast: parseInt(e.target.value) }))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span>Screentone Overlay</span>
                </div>
                <select
                  value={filters.screentone}
                  onChange={(e) => setFilters(f => ({ ...f, screentone: e.target.value as FilterSettings['screentone'] }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-200 font-mono focus:outline-none cursor-pointer"
                >
                  <option value="none">None</option>
                  <option value="manga-halftone">Manga Halftone Dots</option>
                  <option value="anime-vignette">Cinematic Anime Vignette</option>
                  <option value="chromatic">Chromatic Fringe FX</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
