// Fee config and feature flags

export interface FeesPolicy {
  marginBps: number;
  marginFixedCents: number;
  minCents: number;
  maxCents: number;
}

export const presets = {
  balanced: {
    marginBps: 400,
    marginFixedCents: 99,
    minCents: 99,
    maxCents: 999,
  },
  aggressive: {
    marginBps: 600,
    marginFixedCents: 129,
    minCents: 99,
    maxCents: 1299,
  },
};

function getEnvInt(name: string, fallback: number): number {
  const val = process.env[name];
  if (val === undefined) return fallback;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? fallback : parsed;
}

export function getFeesPolicy(): FeesPolicy {
  const mode = (process.env.FEES_MODE || "balanced") as keyof typeof presets;
  const base = presets[mode] || presets.balanced;
  return {
    marginBps: getEnvInt("FEES_MARGIN_BPS", base.marginBps),
    marginFixedCents: getEnvInt("FEES_MARGIN_FIXED_CENTS", base.marginFixedCents),
    minCents: getEnvInt("FEES_MIN_CENTS", base.minCents),
    maxCents: getEnvInt("FEES_MAX_CENTS", base.maxCents),
  };
}
