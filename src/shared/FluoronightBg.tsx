import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

export interface FluoronightBgProps {
  /** Apply inline SVG horizontal motion-blur filter (stdDeviation="14 0") for high-speed Panshot look */
  panshotBlur?: boolean;
  /** Optional accent aura style behind the center subject */
  auraMode?: 'cyan' | 'gold' | 'dual';
  /** Horizontal pan distance in pixels across the composition */
  panRangePx?: number;
  /** Direction of slow horizontal pan */
  panDirection?: 'left' | 'right';
  /** Unique filter ID suffix when rendering multiple instances */
  filterId?: string;
}

export const FluoronightBg: React.FC<FluoronightBgProps> = ({
  panshotBlur = false,
  auraMode = 'cyan',
  panRangePx = 44,
  panDirection = 'left',
  filterId = 'fluoronight-panshot-blur',
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
      {/* Inline SVG horizontal Panshot motion-blur filter */}
      {panshotBlur && (
        <svg
          width="0"
          height="0"
          style={{ position: 'absolute', pointerEvents: 'none' }}
          aria-hidden="true"
        >
          <defs>
            <filter id={filterId} x="-15%" y="-15%" width="130%" height="130%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="14 0" edgeMode="duplicate" />
            </filter>
          </defs>
        </svg>
      )}

      {/* Stadium backdrop with Fluoronight color grading + optional Panshot blur */}
      <AbsoluteFill
        style={{
          filter: panshotBlur ? `url(#${filterId})` : undefined,
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
            filter: 'contrast(1.22) saturate(1.35) brightness(0.82)',
          }}
        />
      </AbsoluteFill>

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
