import React, { useState } from 'react';
import { ShotItem, DubbingTrack } from '../types';
import { 
  Camera, 
  Video, 
  MessageSquare, 
  Users, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  Volume2, 
  Maximize2, 
  Minimize2,
  Tv,
  Film,
  Compass,
  Mic,
  Smile
} from 'lucide-react';

interface ActiveShotFloatingPanelProps {
  activeShot: ShotItem | undefined;
  dubbingTracks: DubbingTrack[];
  sceneShotsCount: number;
  activeShotIndex: number;
}

export const ActiveShotFloatingPanel: React.FC<ActiveShotFloatingPanelProps> = ({
  activeShot,
  dubbingTracks,
  sceneShotsCount,
  activeShotIndex
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isVisible, setIsVisible] = useState<boolean>(true);

  if (!isVisible) {
    return (
      <button
        onClick={() => {
          setIsVisible(true);
          setIsExpanded(true);
        }}
        className="fixed bottom-6 right-6 z-40 flex items-center space-x-2 bg-slate-950/90 border border-amber-500/40 text-amber-400 hover:text-amber-300 px-4 py-2.5 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all font-mono text-xs uppercase tracking-wider backdrop-blur-md"
        title="Open Composition Inspector HUD"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        <Compass className="w-4 h-4" />
        <span>Open HUD</span>
      </button>
    );
  }

  // Find the exact dubbing track details for the active shot if any
  const activeDubTrack = activeShot 
    ? dubbingTracks.find(track => track.shotId === activeShot.id) 
    : null;

  const speakerName = activeDubTrack?.character || (activeShot?.charactersInShot?.[0]) || null;
  const dialogueEmotion = activeDubTrack?.emotion || 'Standard';

  return (
    <div 
      className={`fixed bottom-6 right-6 z-40 bg-slate-950/95 border border-amber-500/30 rounded-2xl shadow-2xl backdrop-blur-xl transition-all duration-300 select-none overflow-hidden ${
        isExpanded ? 'w-80 md:w-96' : 'w-72'
      }`}
    >
      {/* HUD Header Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </div>
          <div>
            <span className="text-[10px] font-bold font-mono tracking-widest text-slate-300 uppercase block">
              Live HUD Inspector
            </span>
            {activeShot && (
              <span className="text-[9px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                Active: Shot #{activeShotIndex + 1} of {sceneShotsCount}
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors"
            title={isExpanded ? 'Collapse HUD Panel' : 'Expand HUD Panel'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-colors text-xs font-mono font-bold"
            title="Close HUD Panel"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Main HUD Body Content */}
      {isExpanded ? (
        <div className="p-4 space-y-4">
          {activeShot ? (
            <>
              {/* Camera Composition & Optics Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Composition/Shot Type */}
                <div className="bg-slate-900/60 border border-slate-850 p-2.5 rounded-xl space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-400">
                    <Camera className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[9px] font-bold font-mono tracking-wider uppercase">Shot Type</span>
                  </div>
                  <div className="text-xs font-black text-slate-100 font-mono tracking-wide">
                    {activeShot.shotType}
                  </div>
                </div>

                {/* Camera Movement */}
                <div className="bg-slate-900/60 border border-slate-850 p-2.5 rounded-xl space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-400">
                    <Video className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span className="text-[9px] font-bold font-mono tracking-wider uppercase">Movement</span>
                  </div>
                  <div className="text-xs font-black text-slate-100 font-mono tracking-wide">
                    {activeShot.cameraMovement}
                  </div>
                </div>
              </div>

              {/* Speaker / Dialogue Section */}
              <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-slate-400">
                    <MessageSquare className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-[9px] font-bold font-mono tracking-wider uppercase">Dialogue Channel</span>
                  </div>
                  {speakerName && (
                    <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-rose-950/60 text-rose-400 font-extrabold uppercase border border-rose-900/50">
                      LIVE
                    </span>
                  )}
                </div>

                {activeShot.dialogueLine ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-200">
                        {speakerName || 'Narrator'}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 bg-slate-950 px-1 rounded flex items-center gap-0.5">
                        <Smile className="w-2.5 h-2.5" />
                        {dialogueEmotion}
                      </span>
                    </div>
                    <p className="text-xs italic text-cyan-400 font-serif leading-relaxed bg-slate-950 p-2 rounded-lg border border-slate-900">
                      "{activeShot.dialogueLine}"
                    </p>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic py-1 text-center font-mono">
                    No speech dialogue assigned
                  </div>
                )}
              </div>

              {/* Characters Present in Frame */}
              <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-3 space-y-2">
                <div className="flex items-center space-x-1.5 text-slate-400">
                  <Users className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-[9px] font-bold font-mono tracking-wider uppercase">Cast in Frame</span>
                </div>
                {activeShot.charactersInShot && activeShot.charactersInShot.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {activeShot.charactersInShot.map((char) => (
                      <span 
                        key={char} 
                        className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300"
                      >
                        {char}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-500 font-mono italic">
                    Scenery / Environment only
                  </div>
                )}
              </div>

              {/* Visual mini-waveform progress simulator */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                  <span>Composition Load Vector</span>
                  <span className="text-amber-500 font-bold">STABLE</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex items-center">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-200"
                    style={{ width: `${((activeShotIndex + 1) / sceneShotsCount) * 100}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-6 text-slate-500 font-mono text-xs space-y-2">
              <Film className="w-8 h-8 mx-auto text-slate-700 animate-pulse" />
              <p>No Active Shot Selected</p>
              <p className="text-[10px] text-slate-650">Scrub the timeline or select a card to track composition properties.</p>
            </div>
          )}
        </div>
      ) : (
        /* Collapsed Mode HUD Details (Simple Strip) */
        <div className="p-3 bg-slate-950/80 font-mono space-y-2 text-xs">
          {activeShot ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px] font-bold uppercase">Optics:</span>
                <span className="text-slate-100 font-bold">{activeShot.shotType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px] font-bold uppercase">Movement:</span>
                <span className="text-slate-100 font-bold">{activeShot.cameraMovement}</span>
              </div>
              {speakerName && (
                <div className="flex items-center justify-between text-cyan-400 font-bold">
                  <span className="text-slate-400 text-[10px] font-bold uppercase">Speaker:</span>
                  <span>{speakerName}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-500 text-center text-[10px] italic">No active composition</div>
          )}
        </div>
      )}
    </div>
  );
};
