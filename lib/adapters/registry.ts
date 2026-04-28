import type { NetworkAdapter } from "./types";
import { mockAdapter } from "./mock";
import { everflowAdapter } from "./everflow";
import { scaleoAdapter } from "./scaleo";

const ADAPTERS: Record<string, NetworkAdapter> = {
  mock:     mockAdapter,
  everflow: everflowAdapter,
  scaleo:   scaleoAdapter
};

export function getAdapter(key: string): NetworkAdapter {
  const a = ADAPTERS[key];
  if (!a) throw new Error(`unknown network adapter: ${key}`);
  return a;
}

export function listAdapterKeys(): string[] {
  return Object.keys(ADAPTERS);
}
