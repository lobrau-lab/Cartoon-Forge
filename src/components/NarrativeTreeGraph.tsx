import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ScriptScene, EpisodeProject, CharacterAnchor, ShotItem } from '../types';
import { GitBranch, User, Plus, RefreshCw, Layers, MapPin, Clock, Film } from 'lucide-react';
import { registerRealTimeHeal } from '../utils/selfHealingEngine';

interface NarrativeTreeGraphProps {
  project: EpisodeProject;
  onUpdateProject: (updated: Partial<EpisodeProject>) => void;
}

interface TreeNode {
  id: string;
  sceneNumber: number;
  heading: string;
  location: string;
  timeOfDay: string;
  branchTitle?: string;
  branchId?: string;
  characters: string[];
  children: TreeNode[];
}

export const NarrativeTreeGraph: React.FC<NarrativeTreeGraphProps> = ({
  project,
  onUpdateProject
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 350 });
  const [selectedSceneNum, setSelectedSceneNum] = useState<number>(1);
  const [selectedCharName, setSelectedCharName] = useState<string>('All');

  // Sync selectedSceneNum with project's first scene initially
  useEffect(() => {
    if (project.scenes.length > 0 && !project.scenes.some(s => s.sceneNumber === selectedSceneNum)) {
      setSelectedSceneNum(project.scenes[0].sceneNumber);
    }
  }, [project.scenes]);

  // Monitor size dynamically
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      setDimensions({
        width: Math.max(width, 600),
        height: 350
      });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Convert linear scenes array into hierarchical d3 tree structure
  const buildSceneTree = (scenes: ScriptScene[]): TreeNode | null => {
    if (scenes.length === 0) return null;

    const sorted = [...scenes].sort((a, b) => a.sceneNumber - b.sceneNumber);
    const nodeMap = new Map<number, TreeNode>();

    // Step 1: Initialize all TreeNodes
    sorted.forEach(s => {
      const characters = Array.from(new Set(s.dialogue.map(d => d.character)));
      nodeMap.set(s.sceneNumber, {
        id: `scene-${s.sceneNumber}`,
        sceneNumber: s.sceneNumber,
        heading: s.heading,
        location: s.location,
        timeOfDay: s.timeOfDay,
        branchTitle: s.branchTitle,
        branchId: s.branchId,
        characters,
        children: []
      });
    });

    let root: TreeNode | null = null;

    // Step 2: Build tree hierarchies
    sorted.forEach(s => {
      const node = nodeMap.get(s.sceneNumber)!;
      const parentNum = s.parentSceneNumber;

      if (parentNum === undefined || parentNum <= 0 || !nodeMap.has(parentNum)) {
        if (!root) {
          root = node;
        } else {
          root.children.push(node);
        }
      } else {
        const parentNode = nodeMap.get(parentNum)!;
        parentNode.children.push(node);
      }
    });

    return root;
  };

  // Persistent SVG Layer Initialization (runs once on mount)
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    if (!svg.select('g.tree-root').empty()) return;

    const rootG = svg.append('g').attr('class', 'tree-root');
    rootG.append('g').attr('class', 'links-layer');
    rootG.append('g').attr('class', 'nodes-layer');
  }, []);

  // Re-draw D3 Tree Graph with smooth d3-transition interpolation
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    const treeData = buildSceneTree(project.scenes);
    if (!treeData) return;

    const rootNode = d3.hierarchy<TreeNode>(treeData);

    const margin = { top: 30, right: 100, bottom: 30, left: 80 };
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;

    // Use horizontal d3 tree layout
    const treeLayout = d3.tree<TreeNode>().size([innerHeight, innerWidth]);
    treeLayout(rootNode);

    const rootG = svg.select<SVGGElement>('g.tree-root')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const t = svg.transition().duration(750).ease(d3.easeCubicInOut);

    // 1. Draw/Interpolate Links
    const linksLayer = rootG.select<SVGGElement>('g.links-layer');
    const linkGenerator = d3.linkHorizontal<any, any>()
      .x((d) => d.y)
      .y((d) => d.x);

    const linkSelection = linksLayer.selectAll<SVGPathElement, d3.HierarchyLink<TreeNode>>('path.tree-link')
      .data(rootNode.links(), d => `${d.source.data.id}->${d.target.data.id}`);

    linkSelection.exit()
      .transition(t)
      .style('opacity', 0)
      .remove();

    const linkEnter = linkSelection.enter().append('path')
      .attr('class', 'tree-link')
      .attr('fill', 'none')
      .style('opacity', 0)
      .attr('d', linkGenerator as any);

    const linkMerge = linkEnter.merge(linkSelection);

    linkMerge
      .attr('stroke', (d) => {
        if (selectedCharName !== 'All') {
          const srcActive = d.source.data.characters.includes(selectedCharName);
          const dstActive = d.target.data.characters.includes(selectedCharName);
          if (srcActive && dstActive) return '#10b981'; // Emerald timeline path
        }
        return d.target.data.branchId ? '#a855f7' : '#334155';
      })
      .attr('stroke-width', (d) => {
        if (selectedCharName !== 'All') {
          const srcActive = d.source.data.characters.includes(selectedCharName);
          const dstActive = d.target.data.characters.includes(selectedCharName);
          if (srcActive && dstActive) return 3.5;
        }
        return 1.8;
      })
      .attr('stroke-dasharray', (d) => d.target.data.branchId ? '4,4' : 'none')
      .transition(t)
      .style('opacity', 1)
      .attr('d', linkGenerator as any);

    // 2. Draw/Interpolate Nodes
    const nodesLayer = rootG.select<SVGGElement>('g.nodes-layer');
    const nodeSelection = nodesLayer.selectAll<SVGGElement, d3.HierarchyNode<TreeNode>>('g.tree-node')
      .data(rootNode.descendants(), d => d.data.id);

    nodeSelection.exit()
      .transition(t)
      .style('opacity', 0)
      .attr('transform', function(this: SVGGElement) {
        return d3.select(this).attr('transform') + ' scale(0.2)';
      })
      .remove();

    const nodeEnter = nodeSelection.enter().append('g')
      .attr('class', 'tree-node')
      .style('cursor', 'pointer')
      .style('opacity', 0)
      .attr('transform', (d) => `translate(${d.y},${d.x})`);

    // Rect Capsule
    nodeEnter.append('rect').attr('class', 'node-rect')
      .attr('x', -55)
      .attr('y', -22)
      .attr('width', 110)
      .attr('height', 44)
      .attr('rx', 8)
      .attr('fill', '#0b1329');

    // Title
    nodeEnter.append('text').attr('class', 'node-title')
      .attr('dy', -4)
      .attr('text-anchor', 'middle')
      .attr('fill', '#f1f5f9')
      .style('font-family', 'ui-sans-serif, system-ui, sans-serif')
      .style('font-weight', '700')
      .style('font-size', '10px');

    // Subtitle
    nodeEnter.append('text').attr('class', 'node-sub')
      .attr('dy', 10)
      .attr('text-anchor', 'middle')
      .style('font-family', 'ui-sans-serif, system-ui, sans-serif')
      .style('font-size', '8px');

    const nodeMerge = nodeEnter.merge(nodeSelection);

    nodeMerge.on('click', (event, d) => {
      setSelectedSceneNum(d.data.sceneNumber);
    });

    // Key d3-transition interpolation for tree nodes!
    nodeMerge
      .transition(t)
      .style('opacity', 1)
      .attr('transform', (d) => `translate(${d.y},${d.x})`);

    nodeMerge.each(function(d) {
      const g = d3.select(this);
      const isSelected = d.data.sceneNumber === selectedSceneNum;
      const isCharActive = selectedCharName !== 'All' && d.data.characters.includes(selectedCharName);

      g.select('rect.node-rect')
        .transition(t)
        .attr('stroke', () => {
          if (isSelected) return '#06b6d4';
          if (isCharActive) return '#10b981';
          return d.data.branchId ? '#a855f7' : '#1e293b';
        })
        .attr('stroke-width', isSelected ? 2.5 : 1.5)
        .style('filter', () => {
          if (isSelected) return 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.75))';
          if (isCharActive) return 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))';
          return 'none';
        });

      g.select('text.node-title')
        .text(`Scene #${d.data.sceneNumber}`);

      g.select('text.node-sub')
        .attr('fill', d.data.branchId ? '#d8b4fe' : '#64748b')
        .text(() => {
          const text = d.data.branchTitle || d.data.location || 'Continuous';
          return text.length > 16 ? text.substring(0, 14) + '...' : text;
        });
    });

  }, [dimensions, project.scenes, selectedSceneNum, selectedCharName]);

  const activeScene = project.scenes.find(s => s.sceneNumber === selectedSceneNum) || project.scenes[0];

  // Action: Add new alternate story branch branching from selected node
  const handleCreateBranch = () => {
    if (!activeScene) return;

    const nextSceneNum = Math.max(...project.scenes.map(s => s.sceneNumber), 0) + 1;
    const parentId = activeScene.branchId || 'M'; // M for main
    const branchSuffix = Math.floor(Math.random() * 90) + 10;
    const newBranchId = `${parentId}.${branchSuffix}`;

    const newScene: ScriptScene = {
      sceneNumber: nextSceneNum,
      heading: `EXT. ${activeScene.location.toUpperCase()} - ALTERNATIVE BR-${branchSuffix}`,
      location: activeScene.location,
      timeOfDay: activeScene.timeOfDay,
      action: `Narrative deviation from Scene #${activeScene.sceneNumber}: An alternative course unfolds. Characters face an unexpected turning point.`,
      dialogue: activeScene.dialogue.map((d, i) => ({
        ...d,
        id: `dial-${Date.now()}-${i}`,
        line: i === 0 ? "Wait! This isn't how the telemetry was predicted to shift!" : d.line
      })),
      timingEstMin: 1.5,
      styleNotes: `Dramatic Sakuga timeline branch. Heavy rim lights.`,
      parentSceneNumber: activeScene.sceneNumber,
      branchId: newBranchId,
      branchTitle: `Alt Path ${branchSuffix}`
    };

    // Auto-create matching storyboard shot item so the player runs flawlessly
    const sampleImages = [
      'https://picsum.photos/seed/mech/1280/720',
      'https://picsum.photos/seed/cyber/1280/720',
      'https://picsum.photos/seed/matrix/1280/720'
    ];
    const newShot: ShotItem = {
      id: `shot-branch-${Date.now()}`,
      sceneNumber: nextSceneNum,
      shotNumber: 1,
      shotType: 'Sakuga Impact',
      cameraMovement: 'Tracking',
      durationSec: 4.5,
      charactersInShot: newScene.dialogue.map(d => d.character),
      actionPrompt: `Alternative scene: ${newScene.heading}. ${newScene.action}`,
      dialogueLine: newScene.dialogue[0]?.line || 'Alternative trajectory locked.',
      status: 'pending',
      videoRenderStatus: 'idle',
      keyframeUrl: sampleImages[Math.floor(Math.random() * sampleImages.length)]
    };

    onUpdateProject({
      scenes: [...project.scenes, newScene],
      shots: [...project.shots, newShot]
    });

    setSelectedSceneNum(nextSceneNum);

    registerRealTimeHeal(
      'Script', 
      `Branched narrative from Scene #${activeScene.sceneNumber}.`, 
      `Injected new Scene #${nextSceneNum} (Branch ${newBranchId}) and storyboard anchors.`, 
      'fix'
    );

    alert(`Successfully branched narrative! Scene #${nextSceneNum} ("${newScene.branchTitle}") has been spliced as a timeline branch of Scene #${activeScene.sceneNumber}.`);
  };

  // List of all character anchors for arc tracking dropdown
  const uniqueCharList = project.cast.map(c => c.name);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header and Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-purple-950 text-purple-400 border border-purple-800">
            <GitBranch className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-100">
              Interactive Story Branching & Character Arc Timeline Monitor
            </h3>
            <p className="text-xs text-slate-400">
              D3-powered node hierarchy tree. Toggle characters to track active presence paths and model narrative deviations.
            </p>
          </div>
        </div>

        {/* Character Arc Filter Dropdown */}
        <div className="flex items-center space-x-2.5 font-mono text-xs">
          <span className="text-slate-400 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-emerald-400" />
            Track Character Arc:
          </span>
          <select
            value={selectedCharName}
            onChange={(e) => setSelectedCharName(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="All">--- Show All Scenes ---</option>
            {uniqueCharList.map((name) => (
              <option key={name} value={name}>
                {name} (Timeline Path)
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* D3 Canvas container - 8 columns */}
        <div className="lg:col-span-8 flex flex-col space-y-2">
          <div 
            ref={containerRef}
            className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl overflow-x-auto relative h-[350px]"
          >
            <svg
              ref={svgRef}
              width={dimensions.width}
              height={dimensions.height}
              className="mx-auto block"
            />

            {/* Specalized Overlay badging */}
            {selectedCharName !== 'All' && (
              <div className="absolute top-3 left-3 bg-emerald-950/80 border border-emerald-800/50 backdrop-blur rounded px-2 py-1 text-[10px] font-mono text-emerald-300">
                ⚡ Tracking Character Arc path of <span className="underline font-bold">{selectedCharName}</span>
              </div>
            )}
          </div>
          <span className="text-[10px] font-mono text-slate-500 text-center block">
            * Drag horizontal container to scroll broad branches. Click any Scene node capsule to inspect storyline metadata.
          </span>
        </div>

        {/* Detail Panel and branching triggers - 4 columns */}
        <div className="lg:col-span-4 bg-slate-950 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between space-y-4">
          {activeScene ? (
            <>
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Scene #{activeScene.sceneNumber}
                  </span>
                  {activeScene.branchId ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 animate-pulse">
                      Branch {activeScene.branchId}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      Primary Trunk
                    </span>
                  )}
                </div>

                {/* Narrative Details */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider">Heading</h4>
                  <p className="text-xs font-bold text-slate-100">{activeScene.heading}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1 bg-slate-900/60 p-2 rounded border border-slate-800/50">
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-cyan-400" /> Location
                    </span>
                    <span className="text-xs font-bold text-slate-200 truncate block">{activeScene.location}</span>
                  </div>
                  <div className="space-y-1 bg-slate-900/60 p-2 rounded border border-slate-800/50">
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" /> Time of Day
                    </span>
                    <span className="text-xs font-bold text-slate-200 truncate block">{activeScene.timeOfDay}</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <h4 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider">Action / Beat Beat</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-h-24 overflow-y-auto pr-1">
                    {activeScene.action}
                  </p>
                </div>

                {/* Dynamic character lists in dialogues */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider">Active Character Arc</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(new Set(activeScene.dialogue.map(d => d.character))).length > 0 ? (
                      Array.from(new Set(activeScene.dialogue.map(d => d.character))).map(char => (
                        <span
                          key={char}
                          className={`text-[10px] px-2 py-0.5 rounded font-medium flex items-center gap-1 ${
                            selectedCharName === char 
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-slate-900 text-slate-300 border border-slate-800'
                          }`}
                        >
                          <User className="w-3 h-3 text-slate-400" />
                          {char}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">No dialogue character registered in this beat.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Branch Trigger Action */}
              <div className="pt-4 border-t border-slate-800/80">
                <button
                  onClick={handleCreateBranch}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold text-xs shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Branch Narrative Outcome From Node</span>
                </button>
                <span className="text-[9px] text-slate-500 font-mono text-center block mt-2 leading-tight">
                  Clones scene variables & appends a non-linear storyline node into the D3 compiler queue.
                </span>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center space-y-2 h-full">
              <RefreshCw className="w-8 h-8 text-slate-600 animate-spin" />
              <p className="text-xs font-mono">Compiling scene index structure...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
