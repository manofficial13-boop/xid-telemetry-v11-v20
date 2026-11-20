import React from 'react';
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

export interface MotionTrailPlayerProps {
  /** Asset path relative to public/, e.g. 'v11/images/r9.png' */
  src: string;
  /** Direction the 3 motion-trail ghosts extend behind the subject */
  trailDirection?: 'left' | 'right';
  /** Tint / drop-shadow glow color for motion-trail ghosts */
  glowColor?: string;
  /** Frame when entrance animation starts (relative to current Sequence) */
  enterFrame?: number;
  /** Set true for Frame 0 thumbnail framing so subject starts immediately in position */
  instantFrameZero?: boolean;
  /** Distance in px for spring slide entrance */
  slideFromX?: number;
  /** Base scale multiplier */
  baseScale?: number;
  /** Continuous slow-zoom growth over the scene */
  zoomAmount?: number;
  /** Duration in frames over which continuous slow-zoom runs */
  zoomDuration?: number;
  /** Container width/height and positioning */
  height?: number;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  /** Optional horizontal flip */
  flipX?: boolean;
  /** Optional extra container style */
  style?: React.CSSProperties;
}

const TRAIL_LAYERS = [
  { offset: 75, opacity: 0.1 },
  { offset: 50, opacity: 0.25 },
  { offset: 25, opacity: 0.45 },
] as const;

export const MotionTrailPlayer: React.FC<MotionTrailPlayerProps> = ({
  src,
  trailDirection = 'left',
  glowColor = '#00F0FF',
  enterFrame = 0,
  instantFrameZero = false,
  slideFromX,
  baseScale = 1,
  zoomAmount = 0.06,
  zoomDuration = 180,
  height = 1100,
  top,
  left,
  right,
  bottom,
  flipX = false,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = frame - enterFrame;
  if (localFrame < 0) {
    return null;
  }

  const trailSign = trailDirection === 'left' ? -1 : 1;
  const resolvedSlideFromX = slideFromX ?? trailSign * 140;

  const entranceProgress = instantFrameZero
    ? 1
    : spring({
        frame: localFrame,
        fps,
        config: {
          damping: 15,
          stiffness: 150,
          mass: 0.85,
        },
      });

  const slideX = interpolate(entranceProgress, [0, 1], [resolvedSlideFromX, 0]);
  const entranceOpacity = instantFrameZero
    ? 1
    : interpolate(localFrame, [0, 5], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });

  const dynamicZoom = interpolate(localFrame, [0, Math.max(zoomDuration, 1)], [1, 1 + zoomAmount], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Subtle velocity-responsive trail expansion during entrance burst
  const burstMultiplier = instantFrameZero
    ? 1
    : interpolate(entranceProgress, [0, 0.7, 1], [1.45, 1.08, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });

  const resolvedSrc = staticFile(src);
  const flipScaleX = flipX ? -1 : 1;

  const sharedImgStyle: React.CSSProperties = {
    height: `${height}px`,
    width: 'auto',
    objectFit: 'contain',
    display: 'block',
    userSelect: 'none',
  };

  return (
    <div
      style={{
        position: 'absolute',
        top,
        left,
        right,
        bottom,
        opacity: entranceOpacity,
        transform: `translate3d(${slideX}px, 0, 0) scale(${baseScale * dynamicZoom})`,
        transformOrigin: 'center center',
        pointerEvents: 'none',
        ...style,
      }}
    >
      {/* 3 staggered Motiontrail ghost layers behind the subject */}
      {TRAIL_LAYERS.map((layer) => {
        const ghostX = trailSign * layer.offset * burstMultiplier;
        return (
          <Img
            key={layer.offset}
            src={resolvedSrc}
            style={{
              ...sharedImgStyle,
              position: 'absolute',
              top: 0,
              left: 0,
              opacity: layer.opacity,
              transform: `translate3d(${ghostX}px, 0, 0) scaleX(${flipScaleX})`,
              filter: `drop-shadow(0 0 24px ${glowColor}) drop-shadow(0 0 8px ${glowColor}) saturate(1.35) brightness(1.06)`,
            }}
          />
        );
      })}

      {/* Crisp foreground subject cutout */}
      <Img
        src={resolvedSrc}
        style={{
          ...sharedImgStyle,
          position: 'relative',
          transform: `scaleX(${flipScaleX})`,
          filter: `drop-shadow(0 14px 28px rgba(0, 0, 0, 0.72)) drop-shadow(0 0 14px ${glowColor}55)`,
        }}
      />
    </div>
  );
};
