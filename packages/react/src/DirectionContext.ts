import React from 'react';
import { Direction } from '@aesthetic/core';
import { DirectionContextType } from './types';

export default React.createContext<DirectionContextType>(
  (document?.documentElement?.getAttribute('dir') as Direction) || 'ltr',
);
