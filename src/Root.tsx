import React from 'react';
import { Composition } from 'remotion';
import { V11Video } from './episodes/v11/V11Video';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="v11"
      component={V11Video}
      durationInFrames={1080}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
