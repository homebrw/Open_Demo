'use client';

import { createContext, useContext } from 'react';
import type { UiVersion } from '@/lib/uiVersion';
import { DEFAULT_UI_VERSION } from '@/lib/uiVersion';

const UiVersionContext = createContext<UiVersion>(DEFAULT_UI_VERSION);

export function UiVersionProvider({
  value,
  children,
}: {
  value: UiVersion;
  children: React.ReactNode;
}) {
  return <UiVersionContext.Provider value={value}>{children}</UiVersionContext.Provider>;
}

export function useUiVersion(): UiVersion {
  return useContext(UiVersionContext);
}
