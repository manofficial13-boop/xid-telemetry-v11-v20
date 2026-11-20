import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

export interface FluoronightBgProps {
  /** Apply GPU-friendly CSS blur + horizontal speed streaks for high-speed Panshot look */
  panshotBlur?: boolean;
  /** Optional accent aura style behind the center subject */
  auraMode?: 'cyan' | 'gold' | 'dual';
  /** Horizontal pan distance in pixels across the composition */
  panRangePx?: number;
  /** Direction of slow horizontal pan */
  panDirection?: 'left' | 'right';
  /** Optional legacy identifier kept for backwards compatibility */
  filterId?: string;
}

export const FluoronightBg: React.FC<FluoronightBgProps> = ({
  panshotBlur = false,
  auraMode = 'cyan',
  panRangePx = 44,
  panDirection = 'left',
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const panStart = panDirection === 'left' ? panRangePx : -panRangePx;
  const panEnd = panDirection === 'left' ? -panRangePx : panRangePx;
  const panX = interpolate(frame, [0, Math.max(durationInFrames, 1)], [panStart, panEnd], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Subtle breathing scale so stadium feels alive
  const subtleZoom = interpolate(frame, [0, Math.max(durationInFrames, 1)], [1.14, 1.2], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#030816',
        overflow: 'hidden',
      }}
    >
      {/* Stadium backdrop with Fluoronight color grading + lightweight CSS Panshot blur */}
      <AbsoluteFill
        style={{
          transform: `translate3d(${panX}px, 0, 0) scale(${subtleZoom})`,
          transformOrigin: 'center center',
        }}
      >
        <Img
          src={staticFile('shared/images/stadium.jpg')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: panshotBlur
              ? 'contrast(1.22) saturate(1.35) brightness(0.82) blur(3px)'
              : 'contrast(1.22) saturate(1.35) brightness(0.82)',
          }}
        />
      </AbsoluteFill>

      {/* Lightweight horizontal CSS linear-gradient speed streaks for Panshot motion feel */}
      {panshotBlur && (
        <AbsoluteFill
          style={{
            backgroundImage: [
              'linear-gradient(180deg, transparent 0%, transparent 16%, rgba(0, 240, 255, 0.10) 16.4%, transparent 17.4%, transparent 29%, rgba(255, 255, 255, 0.08) 29.3%, transparent 30.1%, transparent 44%, rgba(0, 210, 255, 0.09) 44.5%, transparent 45.6%, transparent 59%, rgba(255, 255, 255, 0.06) 59.3%, transparent 60.1%, transparent 72%, rgba(0, 240, 255, 0.07) 72.4%, transparent 73.3%, transparent 100%)',
              'repeating-linear-gradient(180deg, rgba(0, 240, 255, 0.03) 0px, rgba(0, 240, 255, 0.03) 2px, transparent 2px, transparent 20px)',
            ].join(', '),
            maskImage:
              'linear-gradient(90deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.92) 22%, rgba(0,0,0,0.92) 78%, rgba(0,0,0,0.12) 100%)',
            WebkitMaskImage:
              'linear-gradient(90deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.92) 22%, rgba(0,0,0,0.92) 78%, rgba(0,0,0,0.12) 100%)',
            mixBlendMode: 'screen',
            transform: `translate3d(${panX * 0.65}px, 0, 0)`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Deep night-blue atmospheric tint for Fluoronight cohesion */}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(2, 10, 28, 0.56) 0%, rgba(0, 22, 58, 0.22) 45%, rgba(2, 12, 24, 0.34) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Electric blue/cyan radial spotlight glow behind center subject */}
      <AbsoluteFill
        style={{
          background:
            auraMode === 'gold'
              ? 'radial-gradient(circle at 50% 43%, rgba(255, 215, 0, 0.30) 0%, rgba(0, 240, 255, 0.22) 28%, rgba(0, 85, 255, 0.16) 52%, rgba(0, 0, 0, 0) 76%)'
              : auraMode === 'dual'
                ? 'radial-gradient(circle at 28% 45%, rgba(255, 215, 0, 0.34) 0%, rgba(255, 160, 0, 0.08) 38%, rgba(0, 0, 0, 0) 64%), radial-gradient(circle at 72% 45%, rgba(0, 240, 255, 0.36) 0%, rgba(0, 85, 255, 0.18) 38%, rgba(0, 0, 0, 0) 66%)'
                : 'radial-gradient(circle at 50% 43%, rgba(0, 240, 255, 0.34) 0%, rgba(0, 85, 255, 0.24) 34%, rgba(0, 30, 110, 0.08) 60%, rgba(0, 0, 0, 0) 78%)',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />

      {/* Subtle vibrant green pitch glow at the bottom */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 90% 34% at 50% 82%, rgba(24, 230, 108, 0.24) 0%, rgba(0, 180, 90, 0.10) 48%, rgba(0, 0, 0, 0) 80%)',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />

      {/* Subtle tactical telemetry grid overlay in upper atmosphere */}
      <AbsoluteFill
        style={{
          backgroundImage:
            'linear-gradient(rgba(0, 240, 255, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.04) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.08) 55%, rgba(0,0,0,0) 80%)',
          WebkitMaskImage:
            'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.08) 55%, rgba(0,0,0,0) 80%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top edge darkening for ScanHeader contrast */}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(2, 6, 18, 0.72) 0%, rgba(2, 6, 18, 0.18) 14%, rgba(2, 6, 18, 0) 24%)',
          pointerEvents: 'none',
        }}
      />

      {/* Dark tactical vignette on the bottom 28% for HUD and subtitle contrast */}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(0deg, rgba(2, 6, 18, 0.96) 0%, rgba(2, 8, 22, 0.88) 15%, rgba(2, 8, 22, 0.45) 23%, rgba(2, 8, 22, 0) 28%)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
