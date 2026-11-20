import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface SubtitleSegment {
  startFrame: number;
  endFrame: number;
  text: string;
  /** Words to highlight in accent color (matched case-insensitively, ignoring punctuation) */
  highlightWords?: string[];
  /** Highlight accent color: defaults to '#FFD700' yellow or '#00F0FF' cyan */
  highlightColor?: string;
}

export interface SubtitlesProps {
  segments: SubtitleSegment[];
}

const normalizeWord = (word: string): string =>
  word.toUpperCase().replace(/[^A-Z0-9.'À-ÖØ-Þ/-]/g, '').replace(/[.,!?]+$/g, '');

export const Subtitles: React.FC<SubtitlesProps> = ({ segments }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const activeSegment = segments.find(
    (seg) => frame >= seg.startFrame && frame < seg.endFrame
  );

  if (!activeSegment) {
    return null;
  }

  const localFrame = frame - activeSegment.startFrame;
  const isFrameZeroSegment = activeSegment.startFrame === 0;

  const popSpring = spring({
    frame: localFrame,
    fps,
    config: {
      damping: 14,
      stiffness: 280,
      mass: 0.55,
    },
  });

  const scale = isFrameZeroSegment
    ? interpolate(popSpring, [0, 1], [0.95, 1])
    : interpolate(popSpring, [0, 1], [0.84, 1]);

  const translateY = isFrameZeroSegment
    ? interpolate(popSpring, [0, 1], [6, 0])
    : interpolate(popSpring, [0, 1], [16, 0]);

  const opacity = isFrameZeroSegment
    ? 1
    : interpolate(localFrame, [0, 2], [0.25, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });

  const highlightSet = new Set(
    (activeSegment.highlightWords ?? []).map((w) => normalizeWord(w))
  );
  const highlightColor = activeSegment.highlightColor ?? '#FFD700';

  const words = activeSegment.text.split(/\s+/).filter(Boolean);

  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      {/* Strictly positioned in YouTube Shorts safe zone: bottom 420px, centered, width 92% */}
      <div
        style={{
          position: 'absolute',
          bottom: 420,
          left: '4%',
          width: '92%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          opacity,
          transform: `translate3d(0, ${translateY}px, 0) scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <div
          style={{
            fontFamily:
              "'Montserrat', 'Inter', 'Arial Black', 'Liberation Sans', 'DejaVu Sans', sans-serif",
            fontSize: 58,
            fontWeight: 900,
            lineHeight: 1.16,
            letterSpacing: '-0.015em',
            textTransform: 'uppercase',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            columnGap: 16,
            rowGap: 6,
            padding: '10px 22px',
          }}
        >
          {words.map((word, idx) => {
            const isHighlighted = highlightSet.has(normalizeWord(word));
            return (
              <span
                key={`${activeSegment.startFrame}-${idx}-${word}`}
                style={{
                  color: isHighlighted ? highlightColor : '#FFFFFF',
                  WebkitTextStroke: '11px rgba(2, 6, 16, 0.96)',
                  paintOrder: 'stroke fill',
                  textShadow: isHighlighted
                    ? `0 6px 18px rgba(0, 0, 0, 0.95), 0 0 22px ${highlightColor}99`
                    : '0 6px 18px rgba(0, 0, 0, 0.95), 0 2px 6px rgba(0, 0, 0, 0.9)',
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
