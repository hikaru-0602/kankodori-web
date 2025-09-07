'use client';

import { useEffect } from 'react';
import { initializeRemoteConfig } from '@/lib/remote-config';

export function RemoteConfigInitializer() {
  useEffect(() => {
    initializeRemoteConfig().catch(console.error);
  }, []);

  return null;
}
