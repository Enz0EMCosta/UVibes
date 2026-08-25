export interface BpmWindow {
  target_tempo: number;
  min_tempo: number;
  max_tempo: number;
}

export const clampTempo = (tempo: number): number => {
  if (!Number.isFinite(tempo) || tempo <= 0) {
    return 0;
  }

  return Number(tempo.toFixed(2));
};

export const getTempoWindow = (
  tempo: number,
  variancePercent = 0.08
): BpmWindow => {
  const safeTempo = clampTempo(tempo);

  if (safeTempo === 0) {
    return {
      target_tempo: 0,
      min_tempo: 0,
      max_tempo: 0,
    };
  }

  const delta = safeTempo * variancePercent;

  return {
    target_tempo: safeTempo,
    min_tempo: Number((safeTempo - delta).toFixed(2)),
    max_tempo: Number((safeTempo + delta).toFixed(2)),
  };
};

export const getRangeFromTempo = (
  tempo: number,
  variancePercent = 0.08
): { minTempo: number; maxTempo: number } => {
  const { min_tempo, max_tempo } = getTempoWindow(tempo, variancePercent);

  return {
    minTempo: min_tempo,
    maxTempo: max_tempo,
  };
};
