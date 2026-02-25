import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export interface ReaderSettings {
  fontSize: number;
  fontFamily: 'serif' | 'sans';
  lineHeight: number;
  bgColor: string;
  mode: 'scroll' | 'page';
}

const defaultSettings: ReaderSettings = {
  fontSize: 16,
  fontFamily: 'serif',
  lineHeight: 1.8,
  bgColor: '#ffffff',
  mode: 'scroll',
};

export const readerSettingsAtom = atomWithStorage<ReaderSettings>(
  'reader-settings',
  defaultSettings,
);

export const currentPageAtom = atom(0);
export const totalPagesAtom = atom(1);
export const isToolbarVisibleAtom = atom(false);

export const readingPercentageAtom = atom((get) => {
  const current = get(currentPageAtom);
  const total = get(totalPagesAtom);
  return total > 0 ? Math.round((current / total) * 100) : 0;
});
