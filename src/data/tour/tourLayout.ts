// Shared breadboard geometry for the circuit-tour step data.
// `col(n)` is the x position of breadboard column n; the Z_* constants are
// the z positions of the labelled power/signal rows. Not part of the public
// tour API — only the step modules below import these.

export const col = (idx: number) => -7.48 + idx * 0.22;

export const Z_TOP_5V = -1.76;
export const Z_A = -1.32;
export const Z_B = -1.1;
export const Z_C = -0.88;
export const Z_D = -0.66;
export const Z_E = -0.44;
export const Z_I = 1.1;
export const Z_J = 1.32;
export const Z_BOT_3V3 = 1.76;
