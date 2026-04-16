'use client';

import { useRef } from 'react';
import { Provider } from 'react-redux';
import { makeStore, setupListeners, AppStore } from './store';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
    setupListeners(storeRef.current.dispatch);
  }
  return <Provider store={storeRef.current}>{children}</Provider>;
}
