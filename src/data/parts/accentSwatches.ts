// Accent colour swatches for the garden diorama UI.
import { AccentId } from '../../types/simulation';


export interface AccentSwatch {
  id: AccentId;
  label: string;
  hex: string;
  darkHex: string;
  softHex: string;
}

export const ACCENT_SWATCHES: AccentSwatch[] = [
  { id: 'mint', label: 'Mint', hex: '#6cc29f', darkHex: '#439675', softHex: '#d9efe5' },
  { id: 'tomato', label: 'Tomato', hex: '#ef6a4c', darkHex: '#c64b30', softHex: '#fbe0d9' },
  { id: 'cobalt', label: 'Cobalt', hex: '#41538f', darkHex: '#2c3b6d', softHex: '#dce2f5' },
  { id: 'mustard', label: 'Mustard', hex: '#e6b83a', darkHex: '#be911d', softHex: '#f9efd0' },
  { id: 'blush', label: 'Blush', hex: '#e59eb5', darkHex: '#bc7089', softHex: '#f9e5ec' },
];

