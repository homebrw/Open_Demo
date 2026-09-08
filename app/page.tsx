'use client';

import ExplorerLegacy from './ui/legacy/ExplorerLegacy';
import ExplorerV2 from './ui/v2/ExplorerV2';
import { useUiVersion } from './version/UiVersionProvider';

export default function Page() {
  return useUiVersion() === 'legacy' ? <ExplorerLegacy /> : <ExplorerV2 />;
}
