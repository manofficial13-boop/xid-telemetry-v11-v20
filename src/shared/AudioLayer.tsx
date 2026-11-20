import React from 'react';
import { Audio, Sequence, interpolate, staticFile, useVideoConfig } from 'remotion';

export type SfxType = 'bass-hit' | 'whoosh' | 'tick';

export interface SfxTrigger {
  frame: number;
  type: SfxType;
  /** Optional volume override */
  volume?: number;
  /** Duration of SFX sequence window in frames */
  durationInFrames?: number;
}

export interface AudioLayerProps {
  /** Voiceover path relative to public/, e.g. 'v11/audio/vo.mp3' */
  voPath: string;
  /** Optional SFX trigger list */
  sfxTriggers?: SfxTrigger[];
  /** Base documentary BGM volume (default 0.12) */
  bgmVolume?: number;
}

const SFX_CONFIG: Record<SfxType, { path: string; defaultVolume: number; defaultDuration: number }> = {
  'bass-hit': {
    path: 'shared/sfx/bass-hit.wav',
    defaultVolume: 0.55,
    defaultDuration: 60,
  },
  whoosh: {
    path: 'shared/sfx/whoosh.wav',
    defaultVolume: 0.45,
    defaultDuration: 45,
  },
  tick: {
    path: 'shared/sfx/tick.wav',
    defaultVolume: 0.35,
    defaultDuration: 25,
  },
};

export const AudioLayer: React.FC<AudioLayerProps> = ({
  voPath,
  sfxTriggers = [],
  bgmVolume = 0.12,
}) => {
  const { durationInFrames } = useVideoConfig();

  return (
    <>
      {/* Main Episode Voiceover at full volume */}
      <Audio src={staticFile(voPath)} volume={1.0} />

      {/* Looping documentary BGM with smooth fade-out over the last 20 frames */}
      <Audio
        src={staticFile('shared/bgm/bgm.mp3')}
        loop
        volume={(f) =>
          interpolate(
            f,
            [Math.max(durationInFrames - 20, 0), durationInFrames],
            [bgmVolume, 0],
            {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }
          )
        }
      />

      {/* Precision SFX triggers via Sequence */}
      {sfxTriggers.map((trigger, index) => {
        const cfg = SFX_CONFIG[trigger.type];
        const remaining = durationInFrames - trigger.frame;
        if (remaining <= 0) {
          return null;
        }
        const seqDuration = Math.min(trigger.durationInFrames ?? cfg.defaultDuration, remaining);
        return (
          <Sequence
            key={`${trigger.type}-${trigger.frame}-${index}`}
            from={trigger.frame}
            durationInFrames={seqDuration}
          >
            <Audio
              src={staticFile(cfg.path)}
              volume={trigger.volume ?? cfg.defaultVolume}
            />
          </Sequence>
        );
      })}
    </>
  );
};
