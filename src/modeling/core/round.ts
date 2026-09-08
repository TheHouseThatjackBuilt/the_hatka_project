/** Round the actual binary value to nearest, ties to even, as in the source model.
 * Math.round and toFixed disagree with that rule at exact halfway values.
 */
export function roundTo(value: number, digits = 0): number {
  if (!Number.isFinite(value) || !Number.isInteger(digits) || digits < 0 || digits > 6) {
    throw new Error('Rounding requires a finite value and 0–6 decimal places');
  }
  if (value === 0) return 0;
  // Integral doubles need no decimal rounding; this also avoids overflowing
  // when converting a very large scaled BigInt back to Number.
  if (Number.isInteger(value)) return value;
  const bits = new DataView(new ArrayBuffer(8));
  bits.setFloat64(0, Math.abs(value));
  const encoded = bits.getBigUint64(0);
  const exponent = Number((encoded >> 52n) & 0x7ffn);
  const fraction = encoded & ((1n << 52n) - 1n);
  const significand = exponent === 0 ? fraction : fraction | (1n << 52n);
  const shift = exponent === 0 ? -1074 : exponent - 1023 - 52;
  let numerator = significand * 10n ** BigInt(digits);
  let denominator = 1n;
  if (shift >= 0) numerator <<= BigInt(shift);
  else denominator <<= BigInt(-shift);
  let integer = numerator / denominator;
  const twiceRemainder = (numerator % denominator) * 2n;
  if (twiceRemainder > denominator || (twiceRemainder === denominator && integer % 2n !== 0n)) {
    integer++;
  }
  const result = Number(integer) / 10 ** digits;
  return result === 0 ? 0 : Math.sign(value) * result;
}
