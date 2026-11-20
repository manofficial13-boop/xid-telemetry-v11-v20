import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { AudioLayer, SfxTrigger } from '../../shared/AudioLayer';
import { FluoronightBg } from '../../shared/FluoronightBg';
import { MotionTrailPlayer } from '../../shared/MotionTrailPlayer';
import { ScanHeader } from '../../shared/ScanHeader';
import { SubtitleSegment, Subtitles } from '../../shared/Subtitles';

const FONT_DISPLAY =
  "'Montserrat', 'Inter', 'Arial Black', 'Liberation Sans', 'DejaVu Sans', sans-serif";
const FONT_UI = "'Inter', 'Montserrat', 'Liberation Sans', 'DejaVu Sans', sans-serif";

/**
 * 3-frame Camerashake helper: ±12px translate jitter on major impact beats ONLY.
 * Frame 0 stays dead-center (0, 0) with zero shake/blur so the opening thumbnail is razor-sharp.
 */
const IMPACT_BEATS = [183, 651, 927] as const;

const SHAKE_PATTERN: ReadonlyArray<{ x: number; y: number }> = [
  { x: 12, y: -9 },
  { x: -12, y: 8 },
  { x: 7, y: -5 },
];

function getCameraShakeTransform(frame: number): {
  x: number;
  y: number;
  scale: number;
} {
  for (const beat of IMPACT_BEATS) {
    const offset = frame - beat;
    if (offset >= 0 && offset < SHAKE_PATTERN.length) {
      const sample = SHAKE_PATTERN[offset];
      return { x: sample.x, y: sample.y, scale: 1.028 };
    }
  }
  return { x: 0, y: 0, scale: 1 };
}

/** Exact audio-verified SFX trigger map across the 1080-frame (36.0s) episode */
const V11_SFX_TRIGGERS: SfxTrigger[] = [
  // Scene 1 (0 - 183)
  { frame: 0, type: 'bass-hit', volume: 0.55 },
  // Scene 2 (183 - 330)
  { frame: 183, type: 'whoosh', volume: 0.45 },
  { frame: 183, type: 'bass-hit', volume: 0.55 },
  // Scene 3 (330 - 651)
  { frame: 330, type: 'whoosh', volume: 0.45 },
  { frame: 441, type: 'tick', volume: 0.35 },
  { frame: 507, type: 'tick', volume: 0.35 },
  { frame: 570, type: 'tick', volume: 0.35 },
  // Scene 4 (651 - 927)
  { frame: 651, type: 'bass-hit', volume: 0.55 },
  { frame: 705, type: 'tick', volume: 0.35 },
  { frame: 801, type: 'tick', volume: 0.35 },
  // Scene 5 (927 - 1080)
  { frame: 927, type: 'whoosh', volume: 0.45 },
  { frame: 927, type: 'bass-hit', volume: 0.55 },
];

/**
 * Exact 21 audio-verified kinetic subtitle segments (30 FPS, verified against vo.mp3).
 */
const V11_SUBTITLES: SubtitleSegment[] = [
  // Scene 1 (0 - 183 | 0.0s - 6.1s)
  {
    startFrame: 0,
    endFrame: 63,
    text: "3.2 G'S OF LAUNCH FORCE",
    highlightWords: ['3.2', "G'S"],
    highlightColor: '#00F0FF',
  },
  {
    startFrame: 63,
    endFrame: 96,
    text: 'IS WHAT SEPARATES',
  },
  {
    startFrame: 96,
    endFrame: 141,
    text: 'PRIME RONALDO NAZÁRIO',
    highlightWords: ['RONALDO', 'NAZÁRIO'],
    highlightColor: '#FFD700',
  },
  {
    startFrame: 141,
    endFrame: 183,
    text: 'FROM KYLIAN MBAPPÉ.',
    highlightWords: ['KYLIAN', 'MBAPPÉ'],
    highlightColor: '#00F0FF',
  },

  // Scene 2 (183 - 330 | 6.1s - 11.0s)
  {
    startFrame: 183,
    endFrame: 228,
    text: 'WHILE MBAPPÉ HITS',
    highlightWords: ['MBAPPÉ'],
    highlightColor: '#00F0FF',
  },
  {
    startFrame: 228,
    endFrame: 267,
    text: 'A TERRIFYING TOP SPEED',
    highlightWords: ['TOP', 'SPEED'],
    highlightColor: '#FFD700',
  },
  {
    startFrame: 267,
    endFrame: 330,
    text: 'OF 38 KILOMETERS PER HOUR,',
    highlightWords: ['38', 'KILOMETERS'],
    highlightColor: '#00F0FF',
  },

  // Scene 3 (330 - 651 | 11.0s - 21.7s)
  {
    startFrame: 330,
    endFrame: 378,
    text: "BIOMECHANICS FROM R9'S",
    highlightWords: ["R9'S"],
    highlightColor: '#FFD700',
  },
  {
    startFrame: 378,
    endFrame: 441,
    text: '1997 BARCELONA PEAK',
    highlightWords: ['1997', 'BARCELONA'],
    highlightColor: '#FFD700',
  },
  {
    startFrame: 441,
    endFrame: 507,
    text: 'REVEAL HE REACHED 30 KM/H',
    highlightWords: ['30', 'KM/H'],
    highlightColor: '#00F0FF',
  },
  {
    startFrame: 507,
    endFrame: 570,
    text: 'IN JUST 1.8 SECONDS,',
    highlightWords: ['1.8', 'SECONDS'],
    highlightColor: '#FFD700',
  },
  {
    startFrame: 570,
    endFrame: 651,
    text: 'WHILE DRIBBLING AT FULL STRIDE.',
    highlightWords: ['FULL', 'STRIDE'],
    highlightColor: '#00F0FF',
  },

  // Scene 4 (651 - 927 | 21.7s - 30.9s)
  {
    startFrame: 651,
    endFrame: 705,
    text: 'THAT INSTANT TORQUE',
    highlightWords: ['INSTANT', 'TORQUE'],
    highlightColor: '#FFD700',
  },
  {
    startFrame: 705,
    endFrame: 762,
    text: 'GENERATED NEARLY 400 NEWTONS',
    highlightWords: ['400', 'NEWTONS'],
    highlightColor: '#FFD700',
  },
  {
    startFrame: 762,
    endFrame: 801,
    text: 'OF PITCH PUSH-OFF,',
    highlightWords: ['PUSH-OFF'],
    highlightColor: '#00F0FF',
  },
  {
    startFrame: 801,
    endFrame: 855,
    text: 'LEAVING DEFENDERS FROZEN',
    highlightWords: ['FROZEN'],
    highlightColor: '#00F0FF',
  },
  {
    startFrame: 855,
    endFrame: 927,
    text: 'BEFORE THEIR BRAINS COULD REACT.',
    highlightWords: ['BRAINS'],
    highlightColor: '#FFD700',
  },

  // Scene 5 (927 - 1080 | 30.9s - 36.0s)
  {
    startFrame: 927,
    endFrame: 984,
    text: 'SO IF BOTH SUPERSTARS',
    highlightWords: ['SUPERSTARS'],
    highlightColor: '#FFD700',
  },
  {
    startFrame: 984,
    endFrame: 1023,
    text: 'LINED UP FROM A DEAD STOP,',
    highlightWords: ['DEAD', 'STOP'],
    highlightColor: '#00F0FF',
  },
  {
    startFrame: 1023,
    endFrame: 1065,
    text: 'WHO TAKES THE CROWN,',
    highlightWords: ['CROWN'],
    highlightColor: '#FFD700',
  },
  {
    startFrame: 1065,
    endFrame: 1080,
    text: 'BECAUSE...',
    highlightWords: ['BECAUSE'],
    highlightColor: '#FFD700',
  },
];

/** Reusable top-mid telemetry badge */
const TelemetryBadge: React.FC<{
  label: string;
  sublabel?: string;
  accent?: string;
}> = ({ label, sublabel, accent = '#00F0FF' }) => (
  <div
    style={{
      position: 'absolute',
      top: 158,
      left: 0,
      right: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      zIndex: 15,
      pointerEvents: 'none',
    }}
  >
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 30px',
        borderRadius: 10,
        backgroundColor: 'rgba(4, 14, 34, 0.84)',
        border: `2px solid ${accent}`,
        boxShadow: `0 0 24px ${accent}55, 0 8px 24px rgba(0,0,0,0.6)`,
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 2,
          backgroundColor: accent,
          boxShadow: `0 0 12px ${accent}`,
          display: 'inline-block',
        }}
      />
      <span
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 32,
          fontWeight: 900,
          letterSpacing: '0.1em',
          color: '#FFFFFF',
          textTransform: 'uppercase',
          textShadow: `0 0 18px ${accent}88`,
        }}
      >
        {label}
      </span>
    </div>
    {sublabel && (
      <div
        style={{
          fontFamily: FONT_UI,
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: '0.2em',
          color: accent,
          textTransform: 'uppercase',
          textShadow: '0 2px 10px rgba(0,0,0,0.9)',
        }}
      >
        {sublabel}
      </div>
    )}
  </div>
);

/**
 * SCENE 1 (Frames 0 - 183 | 0.0s - 6.1s): Unboxed Symmetric Face-Off & 3D Depth Hook
 * Both Prime R9 (left, #FFD700) and Kylian Mbappé (right, #00F0FF) rendered equally as
 * free cutouts from Frame 0, heads overlapping the lowered 3.2 G metric, with centered VS
 * badge and two identical symmetric stat pills cleanly above the subtitle safe zone.
 */
const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();

  const metricScale = interpolate(frame, [0, 183], [1, 1.04], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Subtle gold highlight pulse on R9 at frame 96 ("PRIME RONALDO NAZÁRIO")
  const r9Pulse = interpolate(frame, [96, 104, 138], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Subtle cyan highlight pulse on Mbappé at frame 141 ("FROM KYLIAN MBAPPÉ.")
  const mbappePulse = interpolate(frame, [141, 149, 180], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const vsBreath = 1 + Math.sin(frame * 0.09) * 0.035;

  return (
    <AbsoluteFill>
      <FluoronightBg
        panshotBlur
        auraMode="dual"
        panDirection="left"
        panRangePx={42}
        filterId="v11-scene1-panshot"
      />

      <TelemetryBadge
        label="LAUNCH FORCE SCAN"
        sublabel="PRIME R9 (1997)  VS  KYLIAN MBAPPÉ"
        accent="#00F0FF"
      />

      {/* Giant 3.2 G metric lowered ~50px behind both player cutouts for true 3D head overlap */}
      <div
        style={{
          position: 'absolute',
          top: 312,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 2,
          transform: `scale(${metricScale})`,
          transformOrigin: 'center center',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 230,
            fontWeight: 900,
            lineHeight: 0.92,
            letterSpacing: '-0.04em',
            color: '#F4FDFF',
            textShadow:
              '0 0 28px rgba(0, 240, 255, 0.95), 0 0 72px rgba(0, 110, 255, 0.85), 0 12px 34px rgba(0, 0, 0, 0.85)',
          }}
        >
          3.2 G
        </div>
        <div
          style={{
            width: 720,
            height: 3,
            marginTop: 14,
            background:
              'linear-gradient(90deg, rgba(255,215,0,0) 0%, #FFD700 32%, #FFFFFF 50%, #00F0FF 68%, rgba(0,240,255,0) 100%)',
            boxShadow: '0 0 16px rgba(0, 240, 255, 0.8)',
          }}
        />
      </div>

      {/* Reactive gold aura flare behind R9 on name spoken at frame 96 */}
      {r9Pulse > 0.01 && (
        <div
          style={{
            position: 'absolute',
            top: 430,
            left: -40,
            width: 620,
            height: 760,
            background:
              'radial-gradient(circle at 50% 45%, rgba(255, 215, 0, 0.48) 0%, rgba(255, 165, 0, 0.16) 44%, rgba(0, 0, 0, 0) 72%)',
            mixBlendMode: 'screen',
            opacity: r9Pulse,
            zIndex: 4,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Reactive cyan aura flare behind Mbappé on name spoken at frame 141 */}
      {mbappePulse > 0.01 && (
        <div
          style={{
            position: 'absolute',
            top: 430,
            right: -40,
            width: 620,
            height: 760,
            background:
              'radial-gradient(circle at 50% 45%, rgba(0, 240, 255, 0.50) 0%, rgba(0, 110, 255, 0.18) 44%, rgba(0, 0, 0, 0) 72%)',
            mixBlendMode: 'screen',
            opacity: mbappePulse,
            zIndex: 4,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Left Fighter: Prime R9 — free cutout from Frame 0 with #FFD700 gold aura */}
      <MotionTrailPlayer
        src="v11/images/r9.png"
        trailDirection="left"
        glowColor="#FFD700"
        instantFrameZero
        height={1240}
        top={200}
        left={-125}
        zoomAmount={0.045}
        zoomDuration={183}
        pulseIntensity={r9Pulse}
        style={{ zIndex: 5 }}
      />

      {/* Right Fighter: Kylian Mbappé — free cutout from Frame 0 with #00F0FF cyan aura */}
      <MotionTrailPlayer
        src="v11/images/mbappe.png"
        trailDirection="right"
        glowColor="#00F0FF"
        instantFrameZero
        height={880}
        top={412}
        right={-105}
        zoomAmount={0.045}
        zoomDuration={183}
        pulseIntensity={mbappePulse}
        style={{ zIndex: 5 }}
      />

      {/* Centered VS emblem between both players from Frame 0 */}
      <div
        style={{
          position: 'absolute',
          top: 760,
          left: '50%',
          marginLeft: -48,
          width: 96,
          height: 96,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FFD700 0%, #FFFFFF 50%, #00F0FF 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow:
            '0 0 32px rgba(0, 240, 255, 0.8), 0 0 32px rgba(255, 215, 0, 0.72), 0 8px 24px rgba(0, 0, 0, 0.8)',
          transform: `scale(${vsBreath})`,
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 36,
            fontWeight: 900,
            color: '#030816',
            letterSpacing: '-0.02em',
          }}
        >
          VS
        </span>
      </div>

      {/* Two identical symmetric stat pills cleanly above the bottom: 420px subtitle safe zone */}
      <div
        style={{
          position: 'absolute',
          bottom: 596,
          left: 44,
          right: 44,
          display: 'flex',
          gap: 24,
          zIndex: 12,
          pointerEvents: 'none',
        }}
      >
        {/* Left Pill: Prime R9 (Gold Accent) */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            padding: '14px 20px',
            borderRadius: 16,
            backgroundColor: 'rgba(4, 12, 28, 0.88)',
            border: '2px solid #FFD700',
            boxShadow: `0 0 ${Math.round(22 + r9Pulse * 24)}px rgba(255, 215, 0, ${(0.35 + r9Pulse * 0.4).toFixed(2)}), 0 10px 28px rgba(0, 0, 0, 0.75)`,
            transform: `scale(${(1 + r9Pulse * 0.04).toFixed(4)})`,
          }}
        >
          <span
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 28,
              fontWeight: 900,
              letterSpacing: '0.06em',
              color: '#FFFFFF',
              lineHeight: 1.05,
            }}
          >
            PRIME R9
          </span>
          <span
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 23,
              fontWeight: 900,
              letterSpacing: '0.08em',
              color: '#FFD700',
              textShadow: '0 0 14px rgba(255, 215, 0, 0.85)',
              lineHeight: 1.1,
            }}
          >
            3.2 G LAUNCH
          </span>
        </div>

        {/* Right Pill: K. Mbappé (Cyan Accent) */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            padding: '14px 20px',
            borderRadius: 16,
            backgroundColor: 'rgba(4, 12, 28, 0.88)',
            border: '2px solid #00F0FF',
            boxShadow: `0 0 ${Math.round(22 + mbappePulse * 24)}px rgba(0, 240, 255, ${(0.35 + mbappePulse * 0.4).toFixed(2)}), 0 10px 28px rgba(0, 0, 0, 0.75)`,
            transform: `scale(${(1 + mbappePulse * 0.04).toFixed(4)})`,
          }}
        >
          <span
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 28,
              fontWeight: 900,
              letterSpacing: '0.06em',
              color: '#FFFFFF',
              lineHeight: 1.05,
            }}
          >
            K. MBAPPÉ
          </span>
          <span
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 23,
              fontWeight: 900,
              letterSpacing: '0.08em',
              color: '#00F0FF',
              textShadow: '0 0 14px rgba(0, 240, 255, 0.85)',
              lineHeight: 1.1,
            }}
          >
            38 KM/H MAX
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/**
 * SCENE 2 (Frames 183 - 330 | Local 0 - 147): Mbappé 38 KM/H Top Speed
 */
const Scene2MbappeSpeed: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Rapid velocity count-up 0 -> 38 KM/H peaking as "38 KILOMETERS PER HOUR" lands (local 84 / global 267)
  const speedValue = interpolate(frame, [6, 86], [0, 38], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const displaySpeedInt = Math.round(speedValue);
  const displaySpeedDecimal = speedValue.toFixed(1);
  const barPercent = interpolate(frame, [6, 86], [0, 95], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const cardSpring = spring({
    frame: Math.max(0, frame - 6),
    fps,
    config: { damping: 16, stiffness: 170, mass: 0.8 },
  });
  const cardY = interpolate(cardSpring, [0, 1], [60, 0]);

  return (
    <AbsoluteFill>
      <FluoronightBg
        panshotBlur
        auraMode="cyan"
        panDirection="right"
        panRangePx={52}
        filterId="v11-scene2-panshot"
      />

      <TelemetryBadge
        label="TOP SPEED BENCHMARK"
        sublabel="KYLIAN MBAPPÉ  //  MAX VELOCITY SCAN"
        accent="#00F0FF"
      />

      {/* Giant 38 KM/H sandwiched behind Mbappé cutout (zIndex: 2) */}
      <div
        style={{
          position: 'absolute',
          top: 268,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 18,
          }}
        >
          <span
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 224,
              fontWeight: 900,
              lineHeight: 0.9,
              letterSpacing: '-0.04em',
              color: '#F2FDFF',
              textShadow:
                '0 0 32px rgba(0, 240, 255, 0.95), 0 0 76px rgba(0, 95, 255, 0.85), 0 12px 32px rgba(0, 0, 0, 0.88)',
            }}
          >
            {displaySpeedInt}
          </span>
          <span
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 82,
              fontWeight: 900,
              letterSpacing: '0.02em',
              color: '#00F0FF',
              textShadow: '0 0 24px rgba(0, 240, 255, 0.9), 0 8px 24px rgba(0, 0, 0, 0.85)',
            }}
          >
            KM/H
          </span>
        </div>
      </div>

      {/* Mbappé cutout via MotionTrailPlayer on left/center (trails extend right behind sprint lean) */}
      <MotionTrailPlayer
        src="v11/images/mbappe.png"
        trailDirection="right"
        glowColor="#00F0FF"
        enterFrame={0}
        slideFromX={180}
        height={940}
        top={335}
        left={110}
        zoomAmount={0.07}
        zoomDuration={147}
        style={{ zIndex: 5 }}
      />

      {/* Animated Neon Cyan Velocity Telemetry Bar & HUD Card (above subtitles) */}
      <div
        style={{
          position: 'absolute',
          bottom: 592,
          left: 58,
          right: 58,
          padding: '22px 28px',
          borderRadius: 20,
          backgroundColor: 'rgba(3, 12, 28, 0.88)',
          border: '2px solid rgba(0, 240, 255, 0.65)',
          boxShadow: '0 0 32px rgba(0, 240, 255, 0.25), 0 14px 36px rgba(0, 0, 0, 0.78)',
          transform: `translate3d(0, ${cardY}px, 0)`,
          zIndex: 12,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
          }}
        >
          <span
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: '0.12em',
              color: '#00F0FF',
            }}
          >
            TOP SPEED BENCHMARK // LIVE TELEMETRY
          </span>
          <span
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 32,
              fontWeight: 900,
              color: '#FFFFFF',
              textShadow: '0 0 16px rgba(0, 240, 255, 0.85)',
            }}
          >
            {displaySpeedDecimal} KM/H
          </span>
        </div>

        {/* Neon cyan velocity bar track */}
        <div
          style={{
            width: '100%',
            height: 26,
            borderRadius: 999,
            backgroundColor: 'rgba(0, 240, 255, 0.14)',
            border: '1px solid rgba(0, 240, 255, 0.35)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: `${barPercent}%`,
              height: '100%',
              borderRadius: 999,
              background: 'linear-gradient(90deg, #0044FF 0%, #00C8FF 62%, #00F0FF 88%, #FFFFFF 100%)',
              boxShadow: '0 0 24px rgba(0, 240, 255, 0.95)',
            }}
          />
        </div>

        {/* Scale ticks */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 10,
            fontFamily: FONT_UI,
            fontSize: 17,
            fontWeight: 700,
            color: '#93C5E2',
            letterSpacing: '0.06em',
          }}
        >
          <span>0 KM/H</span>
          <span>20 KM/H</span>
          <span>30 KM/H</span>
          <span style={{ color: '#00F0FF', fontWeight: 900 }}>38 KM/H PEAK</span>
          <span>40 KM/H</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/**
 * SCENE 3 (Frames 330 - 651 | Local 0 - 321): R9 1997 Peak — 30 KM/H in 1.8s
 * Tick hits at global 441 (local 111), 507 (local 177), 570 (local 240) synced with
 * 0 -> 30 KM/H and 0.0s -> 1.8s count-ups.
 */
const Scene3R9Peak: React.FC = () => {
  const frame = useCurrentFrame();

  // Synchronized count-ups across local frames hitting ticks at 111 (441), 177 (507), 240 (570)
  const speedCount = interpolate(frame, [20, 111, 177], [0, 18, 30], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const secondsCount = interpolate(frame, [20, 111, 177, 240], [0, 0.6, 1.4, 1.8], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Animated acceleration curve draw progress synced to 1.8s beat (local 177) & completion (local 245)
  const curveDraw = interpolate(frame, [25, 177, 245], [0, 0.56, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Subtle flash pulse on tick frames 111 (441), 177 (507), 240 (570)
  const isTickPulse =
    (frame >= 111 && frame <= 116) ||
    (frame >= 177 && frame <= 182) ||
    (frame >= 240 && frame <= 246);

  return (
    <AbsoluteFill>
      <FluoronightBg
        panshotBlur
        auraMode="gold"
        panDirection="left"
        panRangePx={46}
        filterId="v11-scene3-panshot"
      />

      <TelemetryBadge
        label="1997 BARCELONA PEAK"
        sublabel="BIOMECHANICS  //  DRIBBLING LAUNCH SPLIT"
        accent="#FFD700"
      />

      {/* Giant 1.8 SEC metric sandwiched behind R9 (zIndex: 2) */}
      <div
        style={{
          position: 'absolute',
          top: 262,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'baseline',
          gap: 18,
          zIndex: 2,
          pointerEvents: 'none',
          transform: isTickPulse ? 'scale(1.03)' : 'scale(1)',
        }}
      >
        <span
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 214,
            fontWeight: 900,
            lineHeight: 0.9,
            letterSpacing: '-0.04em',
            color: '#FFF9DF',
            textShadow:
              '0 0 32px rgba(255, 215, 0, 0.95), 0 0 72px rgba(255, 145, 0, 0.72), 0 12px 32px rgba(0, 0, 0, 0.88)',
          }}
        >
          {secondsCount.toFixed(1)}
        </span>
        <span
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 84,
            fontWeight: 900,
            color: '#FFD700',
            textShadow: '0 0 24px rgba(255, 215, 0, 0.9), 0 8px 24px rgba(0, 0, 0, 0.85)',
          }}
        >
          SEC
        </span>
      </div>

      {/* R9 cutout via MotionTrailPlayer with golden #FFD700 trail accents */}
      <MotionTrailPlayer
        src="v11/images/r9.png"
        trailDirection="left"
        glowColor="#FFD700"
        enterFrame={0}
        slideFromX={-170}
        height={1260}
        top={185}
        left={125}
        zoomAmount={0.06}
        zoomDuration={321}
        style={{ zIndex: 5 }}
      />

      {/* Acceleration Curve SVG + Count-up Telemetry Card (above subtitle safe zone) */}
      <div
        style={{
          position: 'absolute',
          bottom: 582,
          left: 52,
          right: 52,
          padding: '18px 24px 16px',
          borderRadius: 20,
          backgroundColor: 'rgba(4, 12, 26, 0.9)',
          border: '2px solid rgba(255, 215, 0, 0.62)',
          boxShadow: '0 0 32px rgba(255, 215, 0, 0.2), 0 14px 36px rgba(0, 0, 0, 0.82)',
          zIndex: 12,
        }}
      >
        {/* Top count-up KPI bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span
              style={{
                fontFamily: FONT_UI,
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: '0.1em',
                color: '#FFD700',
                padding: '4px 12px',
                borderRadius: 8,
                backgroundColor: 'rgba(255, 215, 0, 0.14)',
                border: '1px solid rgba(255, 215, 0, 0.5)',
              }}
            >
              R9 LAUNCH: {Math.round(speedCount)} KM/H
            </span>
            <span
              style={{
                fontFamily: FONT_UI,
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: '0.1em',
                color: '#FFFFFF',
                padding: '4px 12px',
                borderRadius: 8,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              }}
            >
              SPLIT: {secondsCount.toFixed(1)}S
            </span>
          </div>
          <span
            style={{
              fontFamily: FONT_UI,
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: '0.12em',
              color: '#00F0FF',
            }}
          >
            ACCELERATION CURVE
          </span>
        </div>

        {/* Animated SVG Curve: R9 Steep Launch vs Mbappé Top-End with clean corner legends */}
        <svg width="928" height="212" viewBox="0 0 928 212" style={{ display: 'block' }}>
          {/* Clean Top-Left Corner Legend: R9: 30 KM/H @ 1.8s (generously padded above curves) */}
          <g>
            <rect
              x="60"
              y="2"
              width="342"
              height="38"
              rx="10"
              fill="rgba(255, 215, 0, 0.14)"
              stroke="rgba(255, 215, 0, 0.65)"
              strokeWidth="1.5"
            />
            <circle cx="82" cy="21" r="7" fill="#FFD700" />
            <text
              x="98"
              y="29"
              fill="#FFD700"
              fontSize="23"
              fontWeight="900"
              fontFamily={FONT_DISPLAY}
            >
              R9: 30 KM/H @ 1.8s
            </text>
          </g>

          {/* Clean Top-Right Corner Legend: MBAPPÉ: 38 KM/H TOP (generously padded above curves) */}
          <g>
            <rect
              x="548"
              y="2"
              width="354"
              height="38"
              rx="10"
              fill="rgba(0, 240, 255, 0.14)"
              stroke="rgba(0, 240, 255, 0.65)"
              strokeWidth="1.5"
            />
            <circle cx="570" cy="21" r="7" fill="#00F0FF" />
            <text
              x="586"
              y="29"
              fill="#00F0FF"
              fontSize="23"
              fontWeight="900"
              fontFamily={FONT_DISPLAY}
            >
              MBAPPÉ: 38 KM/H TOP
            </text>
          </g>

          {/* Horizontal telemetry grid lines (plotting zone y = 68..180, well clear of legends) */}
          <line x1="60" y1="68" x2="902" y2="68" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          <line x1="60" y1="106" x2="902" y2="106" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          <line x1="60" y1="144" x2="902" y2="144" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          <line x1="60" y1="180" x2="902" y2="180" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" />

          {/* Vertical 1.8s benchmark marker */}
          <line
            x1="415"
            y1="58"
            x2="415"
            y2="180"
            stroke="#FFD700"
            strokeWidth="2"
            strokeDasharray="6 6"
            opacity="0.7"
          />

          {/* Y-axis labels */}
          <text x="8" y="74" fill="#8FB6D4" fontSize="16" fontWeight="700" fontFamily={FONT_UI}>
            38
          </text>
          <text x="8" y="112" fill="#FFD700" fontSize="16" fontWeight="800" fontFamily={FONT_UI}>
            30
          </text>
          <text x="8" y="185" fill="#8FB6D4" fontSize="16" fontWeight="700" fontFamily={FONT_UI}>
            0
          </text>

          {/* X-axis labels */}
          <text x="60" y="203" fill="#8FB6D4" fontSize="16" fontWeight="700" fontFamily={FONT_UI}>
            0.0s
          </text>
          <text x="392" y="203" fill="#FFD700" fontSize="17" fontWeight="900" fontFamily={FONT_UI}>
            1.8s
          </text>
          <text x="845" y="203" fill="#00F0FF" fontSize="16" fontWeight="700" fontFamily={FONT_UI}>
            4.0s+
          </text>

          {/* Mbappé curve: smoother build-up, higher top-end (38 KM/H) */}
          <path
            d="M 60 180 C 210 174, 340 138, 480 108 C 620 80, 740 70, 888 68"
            pathLength={1}
            fill="none"
            stroke="#00F0FF"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeDasharray={1}
            strokeDashoffset={1 - curveDraw}
            opacity="0.92"
          />

          {/* R9 1997 curve: ultra-steep explosive launch hitting 30 KM/H by 1.8s */}
          <path
            d="M 60 180 C 120 136, 225 102, 415 100 C 560 98, 710 92, 888 90"
            pathLength={1}
            fill="none"
            stroke="#FFD700"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={1}
            strokeDashoffset={1 - curveDraw}
          />

          {/* Peak highlight dot on R9 @ 1.8s */}
          {curveDraw > 0.45 && (
            <>
              <circle cx="415" cy="100" r="12" fill="#FFD700" opacity="0.28" />
              <circle cx="415" cy="100" r="6.5" fill="#FFD700" stroke="#FFFFFF" strokeWidth="2" />
            </>
          )}

          {/* Top-end highlight dot for Mbappé */}
          {curveDraw > 0.85 && (
            <>
              <circle cx="888" cy="68" r="11" fill="#00F0FF" opacity="0.28" />
              <circle cx="888" cy="68" r="6.5" fill="#00F0FF" stroke="#FFFFFF" strokeWidth="2" />
            </>
          )}
        </svg>
      </div>
    </AbsoluteFill>
  );
};

/**
 * SCENE 4 (Frames 651 - 927 | Local 0 - 276): 400 Newtons Torque & Brain Reaction
 * bass-hit at global 651 (local 0), tick at global 705 (local 54, 400 N reveal)
 * and global 801 (local 150, defender reaction card).
 */
const Scene4TorqueForce: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const newtonsValue = Math.round(
    interpolate(frame, [0, 54], [0, 400], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  const gaugeSweep = interpolate(frame, [0, 54], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Subtle pop on 400 N reveal at local frame 54 (global 705, matching tick.wav)
  const newtonsRevealPulse = interpolate(frame, [54, 57, 64], [1, 1.045, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Defender reaction alert pops in sharply at local frame 150 (global frame 801, matching tick.wav)
  const reactionPop =
    frame >= 150
      ? spring({
          frame: frame - 150,
          fps,
          config: { damping: 13, stiffness: 240, mass: 0.7 },
        })
      : 0;

  const arcCircumference = 2 * Math.PI * 305;
  const arcVisibleLength = arcCircumference * 0.68;

  return (
    <AbsoluteFill>
      <FluoronightBg
        panshotBlur={false}
        auraMode="gold"
        panDirection="right"
        panRangePx={36}
        filterId="v11-scene4-bg"
      />

      <TelemetryBadge
        label="INSTANT TORQUE TELEMETRY"
        sublabel="PITCH PUSH-OFF FORCE  //  NEURAL DELAY"
        accent="#FFD700"
      />

      {/* Radial Push-Off Force Gauge SVG behind R9 (zIndex: 2) */}
      <div
        style={{
          position: 'absolute',
          top: 255,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        <svg
          width="740"
          height="520"
          viewBox="0 0 740 520"
          style={{ position: 'absolute', top: 30 }}
        >
          {/* Background arc */}
          <circle
            cx="370"
            cy="350"
            r="305"
            fill="none"
            stroke="rgba(0, 240, 255, 0.16)"
            strokeWidth="22"
            strokeDasharray={`${arcVisibleLength} ${arcCircumference}`}
            strokeLinecap="round"
            transform="rotate(148 370 350)"
          />
          {/* Active glowing gold-to-cyan push-off force gauge */}
          <circle
            cx="370"
            cy="350"
            r="305"
            fill="none"
            stroke="url(#forceGaugeGrad)"
            strokeWidth="22"
            strokeDasharray={`${arcVisibleLength * gaugeSweep} ${arcCircumference}`}
            strokeLinecap="round"
            transform="rotate(148 370 350)"
          />
          <defs>
            <linearGradient id="forceGaugeGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00F0FF" />
              <stop offset="55%" stopColor="#FFD700" />
              <stop offset="100%" stopColor="#FF5A2C" />
            </linearGradient>
          </defs>
        </svg>

        {/* Giant 400 N metric sandwiched behind R9 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 16,
            marginTop: 4,
            transform: `scale(${newtonsRevealPulse})`,
          }}
        >
          <span
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 222,
              fontWeight: 900,
              lineHeight: 0.9,
              letterSpacing: '-0.04em',
              color: '#FFF9DF',
              textShadow:
                '0 0 34px rgba(255, 215, 0, 0.95), 0 0 76px rgba(255, 120, 0, 0.72), 0 12px 32px rgba(0, 0, 0, 0.88)',
            }}
          >
            {newtonsValue}
          </span>
          <span
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 112,
              fontWeight: 900,
              color: '#FFD700',
              textShadow: '0 0 28px rgba(255, 215, 0, 0.9), 0 8px 24px rgba(0, 0, 0, 0.85)',
            }}
          >
            N
          </span>
        </div>
      </div>

      {/* R9 cutout via MotionTrailPlayer */}
      <MotionTrailPlayer
        src="v11/images/r9.png"
        trailDirection="left"
        glowColor="#FFD700"
        enterFrame={0}
        slideFromX={-120}
        height={1280}
        top={195}
        left={120}
        zoomAmount={0.08}
        zoomDuration={276}
        style={{ zIndex: 5 }}
      />

      {/* Tactical Biomechanics Card (above subtitle safe zone) */}
      <div
        style={{
          position: 'absolute',
          bottom: 586,
          left: 56,
          right: 56,
          padding: '20px 26px',
          borderRadius: 20,
          backgroundColor: 'rgba(4, 12, 26, 0.9)',
          border: '2px solid rgba(255, 215, 0, 0.58)',
          boxShadow: '0 14px 36px rgba(0, 0, 0, 0.82), 0 0 28px rgba(255, 215, 0, 0.18)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          zIndex: 12,
        }}
      >
        {/* Row 1: Pitch Push-Off */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontFamily: FONT_UI,
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: '0.1em',
                color: '#C7DFF0',
              }}
            >
              PITCH PUSH-OFF
            </span>
            <span
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 30,
                fontWeight: 900,
                color: '#FFD700',
                textShadow: '0 0 16px rgba(255, 215, 0, 0.75)',
              }}
            >
              {newtonsValue} NEWTONS
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: 16,
              borderRadius: 999,
              backgroundColor: 'rgba(255, 215, 0, 0.14)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${gaugeSweep * 100}%`,
                height: '100%',
                borderRadius: 999,
                background: 'linear-gradient(90deg, #00F0FF 0%, #FFD700 65%, #FF6B2C 100%)',
                boxShadow: '0 0 18px rgba(255, 215, 0, 0.9)',
              }}
            />
          </div>
        </div>

        {/* Row 2: Defender Reaction 0.30s (TOO LATE) popping in at local frame 150 (global 801) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 18px',
            borderRadius: 12,
            backgroundColor:
              frame >= 150 ? 'rgba(255, 59, 92, 0.18)' : 'rgba(255, 255, 255, 0.04)',
            border:
              frame >= 150
                ? '1.5px solid rgba(255, 59, 92, 0.85)'
                : '1.5px solid rgba(255, 255, 255, 0.12)',
            transform: `scale(${frame >= 150 ? interpolate(reactionPop, [0, 1], [0.92, 1]) : 1})`,
            opacity: frame >= 150 ? 1 : 0.45,
          }}
        >
          <span
            style={{
              fontFamily: FONT_UI,
              fontSize: 21,
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: '#FFFFFF',
            }}
          >
            DEFENDER REACTION
          </span>
          <span
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 27,
              fontWeight: 900,
              color: frame >= 150 ? '#FF4D6D' : '#8CA6BE',
              textShadow: frame >= 150 ? '0 0 16px rgba(255, 59, 92, 0.85)' : 'none',
            }}
          >
            0.30s (TOO LATE)
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/**
 * SCENE 5 (Frames 927 - 1080 | Local 0 - 153): Visual A-E Debate (2-Row Grid) & Seamless Loop
 */
const POLL_ROW_1 = [
  { key: 'A', label: 'PRIME R9', accent: '#FFD700', idx: 0 },
  { key: 'B', label: 'MBAPPÉ', accent: '#00F0FF', idx: 1 },
  { key: 'C', label: 'PRIME BALE', accent: '#E2F1FF', idx: 2 },
] as const;

const POLL_ROW_2 = [
  { key: 'D', label: 'CR7 2008', accent: '#E2F1FF', idx: 3 },
  { key: 'E', label: 'NOBODY', accent: '#E2F1FF', idx: 4 },
] as const;

const Scene5Debate: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const vsSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 200, mass: 0.75 },
  });

  const pollSpring = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: { damping: 15, stiffness: 180, mass: 0.8 },
  });

  // Subtle highlight sweep across A -> E over the 153-frame outro
  const activeOptionIdx = Math.floor(frame / 28) % 5;

  return (
    <AbsoluteFill>
      <FluoronightBg
        panshotBlur
        auraMode="dual"
        panDirection="left"
        panRangePx={38}
        filterId="v11-scene5-panshot"
      />

      {/* Vertical dual cyan/gold clash beam down center */}
      <div
        style={{
          position: 'absolute',
          top: 240,
          bottom: 580,
          left: '50%',
          width: 4,
          marginLeft: -2,
          background:
            'linear-gradient(180deg, rgba(255,215,0,0) 0%, #FFD700 35%, #FFFFFF 50%, #00F0FF 65%, rgba(0,240,255,0) 100%)',
          boxShadow: '0 0 24px rgba(0, 240, 255, 0.9), 0 0 36px rgba(255, 215, 0, 0.65)',
          zIndex: 4,
          pointerEvents: 'none',
        }}
      />

      {/* Debate Headline */}
      <div
        style={{
          position: 'absolute',
          top: 152,
          left: 44,
          right: 44,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          zIndex: 14,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 48,
            fontWeight: 900,
            letterSpacing: '0.03em',
            lineHeight: 1.08,
            color: '#FFFFFF',
            textTransform: 'uppercase',
            WebkitTextStroke: '6px rgba(2, 6, 18, 0.92)',
            paintOrder: 'stroke fill',
            textShadow: '0 0 24px rgba(0, 240, 255, 0.55), 0 6px 20px rgba(0, 0, 0, 0.9)',
          }}
        >
          DEAD-STOP SPRINT:{' '}
          <span style={{ color: '#FFD700', textShadow: '0 0 24px rgba(255, 215, 0, 0.9)' }}>
            WHO WINS?
          </span>
        </div>
      </div>

      {/* Left Fighter: Prime R9 */}
      <MotionTrailPlayer
        src="v11/images/r9.png"
        trailDirection="left"
        glowColor="#FFD700"
        enterFrame={0}
        slideFromX={-160}
        height={1020}
        top={265}
        left={-75}
        zoomAmount={0.05}
        zoomDuration={153}
        style={{ zIndex: 6 }}
      />

      {/* Right Fighter: Kylian Mbappé */}
      <MotionTrailPlayer
        src="v11/images/mbappe.png"
        trailDirection="right"
        glowColor="#00F0FF"
        enterFrame={0}
        slideFromX={160}
        height={800}
        top={355}
        right={-35}
        zoomAmount={0.05}
        zoomDuration={153}
        style={{ zIndex: 6 }}
      />

      {/* Player nameplate pills flanking the face-off */}
      <div
        style={{
          position: 'absolute',
          top: 282,
          left: 44,
          padding: '8px 18px',
          borderRadius: 10,
          backgroundColor: 'rgba(6, 14, 30, 0.84)',
          border: '1.5px solid #FFD700',
          boxShadow: '0 0 18px rgba(255, 215, 0, 0.45)',
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 22,
            fontWeight: 900,
            color: '#FFD700',
          }}
        >
          PRIME R9
        </div>
        <div
          style={{
            fontFamily: FONT_UI,
            fontSize: 15,
            fontWeight: 800,
            color: '#FFFFFF',
          }}
        >
          3.2 G // 400 N
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 282,
          right: 44,
          padding: '8px 18px',
          borderRadius: 10,
          backgroundColor: 'rgba(6, 14, 30, 0.84)',
          border: '1.5px solid #00F0FF',
          boxShadow: '0 0 18px rgba(0, 240, 255, 0.45)',
          textAlign: 'right',
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 22,
            fontWeight: 900,
            color: '#00F0FF',
          }}
        >
          MBAPPÉ
        </div>
        <div
          style={{
            fontFamily: FONT_UI,
            fontSize: 15,
            fontWeight: 800,
            color: '#FFFFFF',
          }}
        >
          38 KM/H PEAK
        </div>
      </div>

      {/* Glowing Center VS Emblem */}
      <div
        style={{
          position: 'absolute',
          top: 630,
          left: '50%',
          marginLeft: -52,
          width: 104,
          height: 104,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FFD700 0%, #FFFFFF 50%, #00F0FF 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow:
            '0 0 34px rgba(0, 240, 255, 0.85), 0 0 34px rgba(255, 215, 0, 0.75), 0 8px 24px rgba(0,0,0,0.8)',
          transform: `scale(${vsSpring})`,
          zIndex: 12,
        }}
      >
        <span
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 38,
            fontWeight: 900,
            color: '#030816',
          }}
        >
          VS
        </span>
      </div>

      {/* Sleek Compact Visual A-E Poll Card ABOVE Subtitle Safe Zone (bottom: 590px) */}
      <div
        style={{
          position: 'absolute',
          bottom: 590,
          left: 44,
          right: 44,
          padding: '16px 20px',
          borderRadius: 18,
          backgroundColor: 'rgba(3, 10, 24, 0.92)',
          border: '2px solid rgba(0, 240, 255, 0.65)',
          boxShadow:
            '0 0 30px rgba(0, 240, 255, 0.25), 0 12px 32px rgba(0, 0, 0, 0.85)',
          transform: `translate3d(0, ${interpolate(pollSpring, [0, 1], [40, 0])}px, 0)`,
          opacity: pollSpring,
          zIndex: 15,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontFamily: FONT_UI,
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: '0.16em',
              color: '#00F0FF',
            }}
          >
            TELEMETRY VERDICT POLL
          </span>
          <span
            style={{
              fontFamily: FONT_UI,
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: '0.12em',
              color: '#FFD700',
            }}
          >
            DROP A–E IN COMMENTS
          </span>
        </div>

        {/* Clean 2-Row Grid Poll with 24px bold text */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {/* Row 1: A) PRIME R9 | B) MBAPPÉ | C) PRIME BALE */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
            }}
          >
            {POLL_ROW_1.map((opt) => {
              const isActive = opt.idx === activeOptionIdx;
              return (
                <div
                  key={opt.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px 14px',
                    borderRadius: 12,
                    backgroundColor: isActive
                      ? 'rgba(0, 240, 255, 0.22)'
                      : 'rgba(255, 255, 255, 0.06)',
                    border: isActive
                      ? `2px solid ${opt.accent}`
                      : '1.5px solid rgba(255, 255, 255, 0.18)',
                    boxShadow: isActive ? `0 0 18px ${opt.accent}55` : 'none',
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontSize: 24,
                      fontWeight: 900,
                      letterSpacing: '0.02em',
                      color: '#FFFFFF',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span style={{ color: opt.accent }}>{opt.key})</span> {opt.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Row 2: D) CR7 2008 | E) NOBODY */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 14,
            }}
          >
            {POLL_ROW_2.map((opt) => {
              const isActive = opt.idx === activeOptionIdx;
              return (
                <div
                  key={opt.key}
                  style={{
                    flex: '0 1 340px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px 20px',
                    borderRadius: 12,
                    backgroundColor: isActive
                      ? 'rgba(0, 240, 255, 0.22)'
                      : 'rgba(255, 255, 255, 0.06)',
                    border: isActive
                      ? `2px solid ${opt.accent}`
                      : '1.5px solid rgba(255, 255, 255, 0.18)',
                    boxShadow: isActive ? `0 0 18px ${opt.accent}55` : 'none',
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontSize: 24,
                      fontWeight: 900,
                      letterSpacing: '0.02em',
                      color: '#FFFFFF',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span style={{ color: opt.accent }}>{opt.key})</span> {opt.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const V11Video: React.FC = () => {
  const frame = useCurrentFrame();
  const shake = getCameraShakeTransform(frame);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#030816',
        overflow: 'hidden',
      }}
    >
      {/* Audio Layer: Voiceover + Looping Documentary BGM (fade last 20f) + Precision SFX */}
      <AudioLayer voPath="v11/audio/vo.mp3" sfxTriggers={V11_SFX_TRIGGERS} bgmVolume={0.12} />

      {/* Main Visual Stage wrapped in deterministic 3-frame Camerashake */}
      <AbsoluteFill
        style={{
          transform: `translate3d(${shake.x}px, ${shake.y}px, 0) scale(${shake.scale})`,
          transformOrigin: 'center center',
        }}
      >
        {/* Scene 1: Frames 0 - 183 (0.0s - 6.1s | Hook & Unboxed Symmetric Face-Off) */}
        <Sequence from={0} durationInFrames={183}>
          <Scene1Hook />
        </Sequence>

        {/* Scene 2: Frames 183 - 330 (6.1s - 11.0s | Mbappé 38 KM/H Top Speed) */}
        <Sequence from={183} durationInFrames={147}>
          <Scene2MbappeSpeed />
        </Sequence>

        {/* Scene 3: Frames 330 - 651 (11.0s - 21.7s | R9 1997 Peak: 30 KM/H in 1.8s) */}
        <Sequence from={330} durationInFrames={321}>
          <Scene3R9Peak />
        </Sequence>

        {/* Scene 4: Frames 651 - 927 (21.7s - 30.9s | 400 Newtons Torque & Brain Reaction) */}
        <Sequence from={651} durationInFrames={276}>
          <Scene4TorqueForce />
        </Sequence>

        {/* Scene 5: Frames 927 - 1080 (30.9s - 36.0s | Visual A-E Debate & Seamless Loop) */}
        <Sequence from={927} durationInFrames={153}>
          <Scene5Debate />
        </Sequence>
      </AbsoluteFill>

      {/* Persistent Top Telemetry Scan Header (Frames 0 - 1080) */}
      <ScanHeader episodeTag="V11" />

      {/* Kinetic Subtitles strictly in YouTube Shorts Safe Zone (bottom: 420px, width: 92%) */}
      <Subtitles segments={V11_SUBTITLES} />
    </AbsoluteFill>
  );
};
