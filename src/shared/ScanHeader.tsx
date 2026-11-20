import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export interface ScanHeaderProps {
  /** Episode identifier badge, e.g. 'V11' */
  episodeTag?: string;
  /** Lab title label */
  brandLabel?: string;
}

export const ScanHeader: React.FC<ScanHeaderProps> = ({
  episodeTag = 'V11',
  brandLabel = 'XID AMOUNT // TELEMETRY LAB',
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progressPct = interpolate(frame, [0, Math.max(durationInFrames - 1, 1)], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Subtle live telemetry pulse on the indicator dot
  const pulseOpacity = 0.55 + 0.45 * Math.sin((frame / 15) * Math.PI);

  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        zIndex: 40,
      }}
    >
      {/* Full-width top active glowing cyan progress/scan bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 8,
          backgroundColor: 'rgba(0, 240, 255, 0.14)',
        }}
      >
        <div
          style={{
            width: `${progressPct}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #0055FF 0%, #00F0FF 82%, #FFFFFF 100%)',
            boxShadow: '0 0 16px rgba(0, 240, 255, 0.95), 0 0 32px rgba(0, 240, 255, 0.55)',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: -5,
              top: -3,
              width: 14,
              height: 14,
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 0 14px #00F0FF, 0 0 26px #00F0FF',
            }}
          />
        </div>
      </div>

      {/* Branding pill container */}
      <div
        style={{
          position: 'absolute',
          top: 44,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '12px 28px',
            borderRadius: 999,
            backgroundColor: 'rgba(4, 12, 28, 0.78)',
            border: '1.5px solid rgba(0, 240, 255, 0.48)',
            boxShadow: '0 6px 24px rgba(0, 0, 0, 0.55), inset 0 0 16px rgba(0, 240, 255, 0.12)',
          }}
        >
          {/* Live telemetry dot */}
          <div
            style={{
              width: 11,
              height: 11,
              borderRadius: '50%',
              backgroundColor: '#00F0FF',
              opacity: pulseOpacity,
              boxShadow: '0 0 10px #00F0FF',
            }}
          />

          {/* Brand text */}
          <span
            style={{
              fontFamily: "'Inter', 'Montserrat', 'Liberation Sans', 'DejaVu Sans', sans-serif",
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: '0.12em',
              color: '#E8F7FF',
              textTransform: 'uppercase',
            }}
          >
            {brandLabel}
          </span>

          {/* Episode tag pill */}
          <span
            style={{
              fontFamily: "'Inter', 'Montserrat', 'Liberation Sans', 'DejaVu Sans', sans-serif",
              fontSize: 21,
              fontWeight: 900,
              letterSpacing: '0.08em',
              color: '#030B1A',
              backgroundColor: '#00F0FF',
              padding: '4px 14px',
              borderRadius: 999,
              boxShadow: '0 0 14px rgba(0, 240, 255, 0.65)',
              textTransform: 'uppercase',
            }}
          >
            {episodeTag}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
