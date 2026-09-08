'use client';

import PlaygroundLegacy from '../ui/legacy/PlaygroundLegacy';
import PlaygroundV2 from '../ui/v2/PlaygroundV2';
import { useUiVersion } from '../version/UiVersionProvider';

export default function Page() {
  return useUiVersion() === 'legacy' ? <PlaygroundLegacy /> : <PlaygroundV2 />;
}
