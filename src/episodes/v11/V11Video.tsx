import React from 'react';
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
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
 * Frame 0 stays dead-center (0, 0) with zero blur so the thumbnail is razor-sharp,
 * then shakes across frames 1-3 for the opening impact beat.
 */
const IMPACT_BEATS = [0, 180, 405, 685, 920] as const;

const SHAKE_PATTERN: ReadonlyArray<{ x: number; y: number }> = [
  { x: 12, y: -9 },
  { x: -12, y: 8 },
  { x: 8, y: -6 },
  { x: -4, y: 3 },
];

function getCameraShakeTransform(frame: number): {
  x: number;
  y: number;
  scale: number;
} {
  for (const beat of IMPACT_BEATS) {
    const offset = frame - beat;
    if (beat === 0) {
      // Keep Frame 0 crisp and centered for thumbnail; shake frames 1..3
      if (offset >= 1 && offset <= 3) {
        const sample = SHAKE_PATTERN[offset - 1];
        return { x: sample.x, y: sample.y, scale: 1.028 };
      }
    } else if (offset >= 0 && offset < SHAKE_PATTERN.length) {
      const sample = SHAKE_PATTERN[offset];
      return { x: sample.x, y: sample.y, scale: 1.028 };
    }
  }
  return { x: 0, y: 0, scale: 1 };
}

/** Exact SFX trigger map across the 1080-frame (36.0s) episode */
const V11_SFX_TRIGGERS: SfxTrigger[] = [
  { frame: 0, type: 'bass-hit', volume: 0.55 },
  { frame: 95, type: 'whoosh', volume: 0.45 },
  { frame: 180, type: 'whoosh', volume: 0.45 },
  { frame: 180, type: 'bass-hit', volume: 0.55 },
  { frame: 240, type: 'tick', volume: 0.35 },
  { frame: 405, type: 'whoosh', volume: 0.45 },
  { frame: 450, type: 'tick', volume: 0.35 },
  { frame: 480, type: 'tick', volume: 0.35 },
  { frame: 510, type: 'tick', volume: 0.35 },
  { frame: 685, type: 'bass-hit', volume: 0.55 },
  { frame: 790, type: 'tick', volume: 0.35 },
  { frame: 920, type: 'whoosh', volume: 0.45 },
  { frame: 920, type: 'bass-hit', volume: 0.55 },
];

/**
 * Full 3-5 word kinetic subtitle map aligned to the 36.0s voiceover script,
 * accounting for slower spoken pronunciation of numbers and units.
 */
const V11_SUBTITLES: SubtitleSegment[] = [
  // Scene 1 (0 - 180 | 0.0s - 6.0s)
  // "Three point two G's of launch force is what separates Prime Ronaldo Nazário from Kylian Mbappé."
  {
    startFrame: 0,
    endFrame: 44,
    text: "3.2 G'S OF LAUNCH FORCE",
    highlightWords: ['3.2', "G'S"],
    highlightColor: '#00F0FF',
  },
  {
    startFrame: 44,
    endFrame: 84,
    text: 'IS WHAT SEPARATES',
    highlightWords: ['SEPARATES'],
    highlightColor: '#FFD700',
  },
  {
    startFrame: 84,
    endFrame: 132,
    text: 'PRIME RONALDO NAZÁRIO',
    highlightWords: ['RONALDO', 'NAZÁRIO'],
    highlightColor: '#FFD700',
  },
  {
    startFrame: 132,
    endFrame: 179,
    text: 'FROM KYLIAN MBAPPÉ',
    highlightWords: ['KYLIAN', 'MBAPPÉ'],
    highlightColor: '#00F0FF',
  },

  // Scene 2 (180 - 405 | 6.0s - 13.5s)
  // "While Mbappé hits a terrifying top speed of 38 kilometers per hour,"
  {
    startFrame: 180,
    endFrame: 238,
    text: 'WHILE MBAPPÉ HITS',
    highlightWords: ['MBAPPÉ'],
    highlightColor: '#00F0FF',
  },
  {
    startFrame: 238,
    endFrame: 304,
    text: 'A TERRIFYING TOP SPEED',
    highlightWords: ['TOP', 'SPEED'],
    highlightColor: '#FFD700',
  },
  {
    startFrame: 304,
    endFrame: 404,
    text: 'OF 38 KILOMETERS PER HOUR,',
    highlightWords: ['38', 'KILOMETERS', 'HOUR'],
    highlightColor: '#00F0FF',
  },

  // Scene 3 (405 - 685 | 13.5s - 22.8s)
  // "biomechanics from R9's 1997 Barcelona peak reveal he reached 30 kilometers per hour in just 1.8 seconds, while dribbling at full stride."
  {
    startFrame: 405,
    endFrame: 452,
    text: "BIOMECHANICS FROM R9'S",
    highlightWords: ["R9'S"],
    highlightColor: '#FFD700',
  },
  {
    startFrame: 452,
    endFrame: 506,
    text: '1997 BARCELONA PEAK',
    highlightWords: ['1997', 'BARCELONA'],
    highlightColor: '#FFD700',
  },
  {
    startFrame: 506,
    endFrame: 548,
    text: 'REVEAL HE REACHED',
    highlightWords: ['REACHED'],
    highlightColor: '#00F0FF',
  },
  {
    startFrame: 548,
    endFrame: 602,
    text: '30 KILOMETERS PER HOUR',
    highlightWords: ['30', 'KILOMETERS'],
    highlightColor: '#00F0FF',
  },
  {
    startFrame: 602,
    endFrame: 646,
    text: 'IN JUST 1.8 SECONDS,',
    highlightWords: ['1.8', 'SECONDS'],
    highlightColor: '#FFD700',
  },
  {
    startFrame: 646,
    endFrame: 684,
    text: 'WHILE DRIBBLING AT FULL STRIDE.',
    highlightWords: ['DRIBBLING', 'FULL', 'STRIDE'],
    highlightColor: '#00F0FF',
  },

  // Scene 4 (685 - 920 | 22.8s - 30.7s)
  // "That instant torque generated nearly 400 Newtons of pitch push-off, leaving defenders frozen before their brains could even react."
  {
    startFrame: 685,
    endFrame: 726,
    text: 'THAT INSTANT TORQUE',
    highlightWords: ['INSTANT', 'TORQUE'],
    highlightColor: '#FFD700',
  },
  {
    startFrame: 726,
    endFrame: 778,
    text: 'GENERATED NEARLY 400 NEWTONS',
    highlightWords: ['400', 'NEWTONS'],
    highlightColor: '#FFD700',
  },
  {
    startFrame: 778,
    endFrame: 816,
    text: 'OF PITCH PUSH-OFF,',
    highlightWords: ['PUSH-OFF'],
    highlightColor: '#00F0FF',
  },
  {
    startFrame: 816,
    endFrame: 854,
    text: 'LEAVING DEFENDERS FROZEN',
    highlightWords: ['FROZEN'],
    highlightColor: '#00F0FF',
  },
  {
    startFrame: 854,
    endFrame: 886,
    text: 'BEFORE THEIR BRAINS',
    highlightWords: ['BRAINS'],
    highlightColor: '#FFD700',
  },
  {
    startFrame: 886,
    endFrame: 919,
    text: 'COULD EVEN REACT.',
    highlightWords: ['REACT'],
    highlightColor: '#00F0FF',
  },

  // Scene 5 (920 - 1080 | 30.7s - 36.0s)
  // "So if both superstars lined up from a dead stop, who takes the crown, because..."
  {
    startFrame: 920,
    endFrame: 962,
    text: 'SO IF BOTH SUPERSTARS',
    highlightWords: ['SUPERSTARS'],
    highlightColor: '#FFD700',
  },
  {
    startFrame: 962,
    endFrame: 990,
    text: 'LINED UP FROM',
    highlightWords: ['LINED'],
    highlightColor: '#00F0FF',
  },
  {
    startFrame: 990,
    endFrame: 1025,
    text: 'A DEAD STOP,',
    highlightWords: ['DEAD', 'STOP'],
    highlightColor: '#00F0FF',
  },
  {
    startFrame: 1025,
    endFrame: 1080,
    text: 'WHO TAKES THE CROWN, BECAUSE...',
    highlightWords: ['CROWN'],
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
 * SCENE 1 (Frames 0 - 180): Frame 0 Hook & Thumbnail
 * Full Fluoronight + Panshot stadium, giant 3.2 G sandwiched behind R9 MotionTrail,
 * LAUNCH FORCE SCAN badge, and Mbappé split preview sliding in at frame 95.
 */
const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // R9 subtly shifts left when Mbappé split preview slides in at frame 95
  const r9ShiftX = interpolate(frame, [95, 118], [0, -135], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Mbappé split preview spring entrance starting at frame 95
  const mbappeLocalFrame = Math.max(0, frame - 95);
  const mbappeSpring =
    frame >= 95
      ? spring({
          frame: mbappeLocalFrame,
          fps,
          config: { damping: 14, stiffness: 165, mass: 0.8 },
        })
      : 0;

  const mbappePanelX = interpolate(mbappeSpring, [0, 1], [480, 0]);
  const vsScale =
    frame >= 100
      ? spring({
          frame: frame - 100,
          fps,
          config: { damping: 12, stiffness: 220, mass: 0.7 },
        })
      : 0;

  const metricScale = interpolate(frame, [0, 180], [1, 1.045], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      <FluoronightBg
        panshotBlur
        auraMode="cyan"
        panDirection="left"
        panRangePx={42}
        filterId="v11-scene1-panshot"
      />

      <TelemetryBadge
        label="LAUNCH FORCE SCAN"
        sublabel="PRIME R9 (1997)  VS  KYLIAN MBAPPÉ"
        accent="#00F0FF"
      />

      {/* Giant 3.2 G metric SANDWICHED behind R9 cutout (zIndex: 2) */}
      <div
        style={{
          position: 'absolute',
          top: 262,
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
            fontSize: 220,
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
            width: 680,
            height: 3,
            marginTop: 14,
            background:
              'linear-gradient(90deg, rgba(0,240,255,0) 0%, #00F0FF 50%, rgba(0,240,255,0) 100%)',
            boxShadow: '0 0 16px #00F0FF',
          }}
        />
      </div>

      {/* Hero R9 cutout via MotionTrailPlayer — immediately visible & bold at Frame 0 */}
      <MotionTrailPlayer
        src="v11/images/r9.png"
        trailDirection="left"
        glowColor="#00F0FF"
        instantFrameZero
        height={1340}
        top={200}
        left={115 + r9ShiftX}
        zoomAmount={0.055}
        zoomDuration={180}
        style={{ zIndex: 5 }}
      />

      {/* Compact split preview of Mbappé sliding in from right at frame 95 */}
      {frame >= 95 && (
        <div
          style={{
            position: 'absolute',
            top: 410,
            right: 26,
            width: 390,
            height: 700,
            borderRadius: 24,
            overflow: 'hidden',
            backgroundColor: 'rgba(4, 16, 40, 0.84)',
            border: '2.5px solid #00F0FF',
            boxShadow:
              '0 0 36px rgba(0, 240, 255, 0.5), 0 16px 40px rgba(0, 0, 0, 0.78)',
            transform: `translate3d(${mbappePanelX}px, 0, 0)`,
            zIndex: 8,
          }}
        >
          {/* Cyan radial glow inside split preview */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at 50% 45%, rgba(0, 240, 255, 0.36) 0%, rgba(0, 60, 180, 0.14) 52%, rgba(2, 8, 22, 0.9) 100%)',
            }}
          />
          <Img
            src={staticFile('v11/images/mbappe.png')}
            style={{
              position: 'absolute',
              top: 38,
              left: -34,
              height: 610,
              width: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 18px rgba(0, 240, 255, 0.7))',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '16px 20px',
              background:
                'linear-gradient(0deg, rgba(2, 8, 22, 0.96) 0%, rgba(2, 8, 22, 0.7) 75%, rgba(2, 8, 22, 0) 100%)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 24,
                fontWeight: 900,
                color: '#FFFFFF',
                letterSpacing: '0.06em',
              }}
            >
              K. MBAPPÉ
            </span>
            <span
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 22,
                fontWeight: 900,
                color: '#00F0FF',
              }}
            >
              38 KM/H
            </span>
          </div>
        </div>
      )}

      {/* VS emblem popping in at frame 100 */}
      {frame >= 100 && (
        <div
          style={{
            position: 'absolute',
            top: 720,
            left: 590,
            width: 92,
            height: 92,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FFD700 0%, #00F0FF 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 28px rgba(0, 240, 255, 0.85), 0 6px 20px rgba(0,0,0,0.75)',
            transform: `scale(${vsScale})`,
            zIndex: 12,
          }}
        >
          <span
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 34,
              fontWeight: 900,
              color: '#030816',
              letterSpacing: '-0.02em',
            }}
          >
            VS
          </span>
        </div>
      )}

      {/* Compact bottom telemetry strip cleanly above subtitle safe zone */}
      <div
        style={{
          position: 'absolute',
          bottom: 598,
          left: 72,
          right: 72,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 26px',
          borderRadius: 14,
          backgroundColor: 'rgba(3, 12, 28, 0.84)',
          border: '1.5px solid rgba(0, 240, 255, 0.45)',
          boxShadow: '0 8px 28px rgba(0, 0, 0, 0.65)',
          zIndex: 11,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span
            style={{
              fontFamily: FONT_UI,
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: '0.14em',
              color: '#88C8E8',
            }}
          >
            BIOMECHANICAL DELTA
          </span>
          <span
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 26,
              fontWeight: 900,
              color: '#FFFFFF',
            }}
          >
            EXPLOSIVE LAUNCH VS MAX VELOCITY
          </span>
        </div>
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 30,
            fontWeight: 900,
            color: '#FFD700',
            textShadow: '0 0 14px rgba(255, 215, 0, 0.7)',
          }}
        >
          3.2 G
        </div>
      </div>
    </AbsoluteFill>
  );
};

/**
 * SCENE 2 (Frames 180 - 405 | Local 0 - 225): Mbappé 38 KM/H Top Speed
 */
const Scene2MbappeSpeed: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Rapid velocity count-up 0 -> 38 KM/H synchronized with tick at local frame 60 (global 240)
  const speedValue = interpolate(frame, [4, 60], [0, 38], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const displaySpeedInt = Math.round(speedValue);
  const displaySpeedDecimal = speedValue.toFixed(1);
  const barPercent = interpolate(frame, [4, 60], [0, 95], {
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
        zoomDuration={225}
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
 * SCENE 3 (Frames 405 - 685 | Local 0 - 280): R9 1997 Peak — 30 KM/H in 1.8s
 * Rapid tick hits at global 450 (local 45), 480 (local 75), 510 (local 105).
 */
const Scene3R9Peak: React.FC = () => {
  const frame = useCurrentFrame();

  // Synchronized count-up across local frames 15..115 (hitting ticks at 45, 75, 105)
  const secondsCount = interpolate(frame, [15, 110], [0, 1.8], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const speedCount = interpolate(frame, [15, 110], [0, 30], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Animated acceleration curve draw progress
  const curveDraw = interpolate(frame, [30, 165], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Subtle flash pulse on tick frames 45, 75, 105
  const isTickPulse =
    (frame >= 45 && frame <= 49) ||
    (frame >= 75 && frame <= 79) ||
    (frame >= 105 && frame <= 111);

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
        zoomDuration={280}
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
            marginBottom: 10,
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

        {/* Animated SVG Curve: R9 Steep Launch vs Mbappé Top-End */}
        <svg width="928" height="162" viewBox="0 0 928 162" style={{ display: 'block' }}>
          {/* Horizontal telemetry grid lines */}
          <line x1="60" y1="22" x2="900" y2="22" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
          <line x1="60" y1="62" x2="900" y2="62" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
          <line x1="60" y1="102" x2="900" y2="102" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
          <line x1="60" y1="138" x2="900" y2="138" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" />

          {/* Vertical 1.8s benchmark marker */}
          <line
            x1="415"
            y1="14"
            x2="415"
            y2="138"
            stroke="#FFD700"
            strokeWidth="2"
            strokeDasharray="6 6"
            opacity="0.7"
          />

          {/* Y-axis labels */}
          <text x="8" y="28" fill="#8FB6D4" fontSize="15" fontWeight="700" fontFamily={FONT_UI}>
            38
          </text>
          <text x="8" y="67" fill="#FFD700" fontSize="15" fontWeight="800" fontFamily={FONT_UI}>
            30
          </text>
          <text x="8" y="142" fill="#8FB6D4" fontSize="15" fontWeight="700" fontFamily={FONT_UI}>
            0
          </text>

          {/* X-axis labels */}
          <text x="60" y="157" fill="#8FB6D4" fontSize="15" fontWeight="700" fontFamily={FONT_UI}>
            0.0s
          </text>
          <text x="392" y="157" fill="#FFD700" fontSize="16" fontWeight="900" fontFamily={FONT_UI}>
            1.8s
          </text>
          <text x="845" y="157" fill="#00F0FF" fontSize="15" fontWeight="700" fontFamily={FONT_UI}>
            4.0s+
          </text>

          {/* Mbappé curve: smoother build-up, higher top-end (38 KM/H) */}
          <path
            d="M 60 138 C 210 132, 340 94, 480 62 C 620 32, 740 22, 885 20"
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
            d="M 60 138 C 120 92, 225 56, 415 54 C 560 52, 710 46, 885 44"
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
              <circle cx="415" cy="54" r="11" fill="#FFD700" opacity="0.28" />
              <circle cx="415" cy="54" r="6" fill="#FFD700" stroke="#FFFFFF" strokeWidth="2" />
              <text
                x="432"
                y="46"
                fill="#FFD700"
                fontSize="16"
                fontWeight="900"
                fontFamily={FONT_UI}
              >
                R9: 30 KM/H @ 1.8s (DRIBBLING)
              </text>
            </>
          )}

          {/* Top-end callout for Mbappé */}
          {curveDraw > 0.8 && (
            <>
              <circle cx="885" cy="20" r="6" fill="#00F0FF" stroke="#FFFFFF" strokeWidth="2" />
              <text
                x="670"
                y="15"
                fill="#00F0FF"
                fontSize="15"
                fontWeight="800"
                fontFamily={FONT_UI}
              >
                MBAPPÉ: 38 KM/H TOP END
              </text>
            </>
          )}
        </svg>
      </div>
    </AbsoluteFill>
  );
};

/**
 * SCENE 4 (Frames 685 - 920 | Local 0 - 235): 400 Newtons Torque & Brain Reaction
 * bass-hit at global 685 (local 0), tick at global 790 (local 105).
 */
const Scene4TorqueForce: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const newtonsValue = Math.round(
    interpolate(frame, [0, 58], [0, 400], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  const gaugeSweep = interpolate(frame, [0, 58], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Defender reaction alert pops in sharply at local frame 105 (global frame 790, matching tick.wav)
  const reactionPop =
    frame >= 105
      ? spring({
          frame: frame - 105,
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
        zoomDuration={235}
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

        {/* Row 2: Defender Reaction 0.30s (TOO LATE) popping in at local frame 105 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 18px',
            borderRadius: 12,
            backgroundColor:
              frame >= 105 ? 'rgba(255, 59, 92, 0.18)' : 'rgba(255, 255, 255, 0.04)',
            border:
              frame >= 105
                ? '1.5px solid rgba(255, 59, 92, 0.85)'
                : '1.5px solid rgba(255, 255, 255, 0.12)',
            transform: `scale(${frame >= 105 ? interpolate(reactionPop, [0, 1], [0.92, 1]) : 1})`,
            opacity: frame >= 105 ? 1 : 0.45,
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
              color: frame >= 105 ? '#FF4D6D' : '#8CA6BE',
              textShadow: frame >= 105 ? '0 0 16px rgba(255, 59, 92, 0.85)' : 'none',
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
 * SCENE 5 (Frames 920 - 1080 | Local 0 - 160): Visual A-E Debate & Seamless Loop
 */
const POLL_OPTIONS = [
  { key: 'A', label: 'PRIME R9', accent: '#FFD700' },
  { key: 'B', label: 'MBAPPÉ', accent: '#00F0FF' },
  { key: 'C', label: 'PRIME BALE', accent: '#E2F1FF' },
  { key: 'D', label: 'CR7 2008', accent: '#E2F1FF' },
  { key: 'E', label: 'NOBODY', accent: '#E2F1FF' },
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

  // Subtle highlight sweep across A -> E over the 160-frame outro
  const activeOptionIdx = Math.floor(frame / 28) % POLL_OPTIONS.length;

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
        zoomDuration={160}
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
        zoomDuration={160}
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

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          {POLL_OPTIONS.map((opt, idx) => {
            const isActive = idx === activeOptionIdx;
            return (
              <div
                key={opt.key}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 10,
                  backgroundColor: isActive
                    ? 'rgba(0, 240, 255, 0.22)'
                    : 'rgba(255, 255, 255, 0.06)',
                  border: isActive
                    ? `1.5px solid ${opt.accent}`
                    : '1.5px solid rgba(255, 255, 255, 0.16)',
                  boxShadow: isActive ? `0 0 16px ${opt.accent}55` : 'none',
                }}
              >
                <span
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontSize: 20,
                    fontWeight: 900,
                    color: '#030816',
                    backgroundColor: opt.accent,
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {opt.key}
                </span>
                <span
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontSize: 21,
                    fontWeight: 900,
                    color: '#FFFFFF',
                    letterSpacing: '0.03em',
                  }}
                >
                  {opt.label}
                </span>
              </div>
            );
          })}
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
        {/* Scene 1: Frames 0 - 180 (Hook & Thumbnail) */}
        <Sequence from={0} durationInFrames={180}>
          <Scene1Hook />
        </Sequence>

        {/* Scene 2: Frames 180 - 405 (Mbappé 38 KM/H Top Speed) */}
        <Sequence from={180} durationInFrames={225}>
          <Scene2MbappeSpeed />
        </Sequence>

        {/* Scene 3: Frames 405 - 685 (R9 1997 Peak: 30 KM/H in 1.8s) */}
        <Sequence from={405} durationInFrames={280}>
          <Scene3R9Peak />
        </Sequence>

        {/* Scene 4: Frames 685 - 920 (400 Newtons Torque & Brain Reaction) */}
        <Sequence from={685} durationInFrames={235}>
          <Scene4TorqueForce />
        </Sequence>

        {/* Scene 5: Frames 920 - 1080 (Visual A-E Debate & Seamless Loop) */}
        <Sequence from={920} durationInFrames={160}>
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
