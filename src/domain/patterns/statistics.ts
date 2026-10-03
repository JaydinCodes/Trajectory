export function mean(values: Array<number | null | undefined>): number | null {
  const valid = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
}

export function median(values: Array<number | null | undefined>): number | null {
  const valid = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value)).sort((a, b) => a - b);
  if (!valid.length) return null;
  const middle = Math.floor(valid.length / 2);
  return valid.length % 2 ? valid[middle] : (valid[middle - 1] + valid[middle]) / 2;
}

export function standardDeviation(values: Array<number | null | undefined>): number | null {
  const valid = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const average = mean(valid);
  if (average === null || valid.length < 2) return null;
  return Math.sqrt(valid.reduce((sum, value) => sum + (value - average) ** 2, 0) / valid.length);
}

/** Cohen's d using pooled population standard deviation. Returns null for no spread. */
export function effectSize(left: number[], right: number[]): number | null {
  const leftMean = mean(left); const rightMean = mean(right);
  const leftDeviation = standardDeviation(left); const rightDeviation = standardDeviation(right);
  if (leftMean === null || rightMean === null || leftDeviation === null || rightDeviation === null) return null;
  const pooled = Math.sqrt((leftDeviation ** 2 + rightDeviation ** 2) / 2);
  return pooled === 0 ? null : (leftMean - rightMean) / pooled;
}

/** Pearson r; unavailable for fewer than three pairs or either zero-variance series. */
export function pearsonCorrelation(left: number[], right: number[]): number | null {
  if (left.length !== right.length || left.length < 3) return null;
  const leftMean = mean(left); const rightMean = mean(right);
  if (leftMean === null || rightMean === null) return null;
  let numerator = 0; let leftSum = 0; let rightSum = 0;
  for (let index = 0; index < left.length; index += 1) {
    const leftDelta = left[index] - leftMean; const rightDelta = right[index] - rightMean;
    numerator += leftDelta * rightDelta; leftSum += leftDelta ** 2; rightSum += rightDelta ** 2;
  }
  const denominator = Math.sqrt(leftSum * rightSum);
  return denominator === 0 ? null : numerator / denominator;
}

export function normalizedSpread(values: number[]): number | null {
  const average = mean(values); const deviation = standardDeviation(values);
  return average === null || deviation === null || average === 0 ? null : Math.abs(deviation / average);
}
