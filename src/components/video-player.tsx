"use client";

import { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  FastForward,
  Settings,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  initialPlaybackSeconds?: number;
  onProgressUpdate?: (seconds: number, percent: number) => void;
  onEnded?: () => void;
}

export default function CustomVideoPlayer({
  src,
  poster,
  initialPlaybackSeconds = 0,
  onProgressUpdate,
  onEnded,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [hasResumed, setHasResumed] = useState(false);
  const [resumePromptVisible, setResumePromptVisible] = useState(false);

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  // Initialize playback position if saved in DB
  useEffect(() => {
    if (initialPlaybackSeconds > 5 && !hasResumed) {
      setResumePromptVisible(true);
    }
  }, [initialPlaybackSeconds, hasResumed]);

  const handleResume = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = initialPlaybackSeconds;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
    setHasResumed(true);
    setResumePromptVisible(false);
  };

  const handleStartFromBeginning = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
    setHasResumed(true);
    setResumePromptVisible(false);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
    setResumePromptVisible(false);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 0;
    setCurrentTime(current);
    setDuration(dur);

    // Call progress callback
    if (onProgressUpdate && dur > 0) {
      const percent = Math.min(100, Math.round((current / dur) * 100));
      onProgressUpdate(Math.round(current), percent);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackRate(speed);
      setShowSpeedMenu(false);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-full rounded-3xl bg-slate-950 overflow-hidden border border-slate-800 shadow-2xl group selection:bg-none"
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => {
          setIsPlaying(false);
          if (onEnded) onEnded();
        }}
        onClick={togglePlay}
        className="w-full h-full object-cover cursor-pointer"
        playsInline
      />

      {/* Resume Playback Overlay Prompt */}
      {resumePromptVisible && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-lg">
            <RotateCcw className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-white">Resume Previous Playback?</h4>
            <p className="text-xs text-slate-300 mt-1 font-mono">
              You previously stopped at <strong className="text-indigo-400">{formatTime(initialPlaybackSeconds)}</strong>
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleResume}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" /> Resume at {formatTime(initialPlaybackSeconds)}
            </button>
            <button
              onClick={handleStartFromBeginning}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              Start from Beginning
            </button>
          </div>
        </div>
      )}

      {/* Center Play Button Overlay on Pause */}
      {!isPlaying && !resumePromptVisible && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-2xl backdrop-blur-sm hover:scale-110 hover:bg-indigo-500 transition z-20 cursor-pointer"
          title="Play Video"
        >
          <Play className="w-7 h-7 fill-white ml-1" />
        </button>
      )}

      {/* Bottom Controls Bar */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-4 sm:p-5 flex flex-col gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {/* Scrubber Progress Bar */}
        <div className="relative w-full flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:h-2 transition-all"
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="p-1.5 hover:text-white transition cursor-pointer">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-1.5 group/vol">
              <button onClick={toggleMute} className="p-1.5 hover:text-white transition cursor-pointer">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hidden group-hover/vol:inline-block"
              />
            </div>

            {/* Timestamp */}
            <span className="font-mono text-[11px] text-slate-400">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-3 relative">
            {/* Speed Selector */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700 font-mono text-[11px] font-bold text-slate-200 transition flex items-center gap-1 cursor-pointer"
              >
                {playbackRate}x
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-9 right-0 bg-slate-900 border border-slate-800 rounded-xl p-1.5 shadow-2xl flex flex-col gap-1 min-w-[70px] z-40">
                  {speeds.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSpeedChange(s)}
                      className={`px-2 py-1 rounded-lg text-left text-xs font-mono transition cursor-pointer ${
                        playbackRate === s
                          ? "bg-indigo-600 text-white font-bold"
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen Button */}
            <button onClick={toggleFullscreen} className="p-1.5 hover:text-white transition cursor-pointer">
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
