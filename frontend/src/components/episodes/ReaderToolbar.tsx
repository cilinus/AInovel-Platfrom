'use client';

import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Minus, Plus } from 'lucide-react';
import { useReaderStore } from '@/src/stores/readerStore';

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(1rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Overlay = styled.div`
  position: fixed;
  bottom: 4rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  width: 100%;
  max-width: 400px;
  padding: 0 1rem;
  animation: ${slideUp} 0.2s ease-out;
`;

const Panel = styled.div`
  background-color: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ControlRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ControlLabel = styled.span`
  font-size: 0.8125rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.mutedForeground};
  min-width: 3.5rem;
`;

const ControlGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: transparent;
  color: ${({ theme }) => theme.colors.foreground};
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.muted};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const SizeDisplay = styled.span`
  font-size: 0.8125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.foreground};
  min-width: 2.5rem;
  text-align: center;
`;

const ToggleButton = styled.button<{ $active: boolean }>`
  padding: 0.375rem 0.625rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;

  ${({ $active, theme }) =>
    $active
      ? css`
          background-color: ${theme.colors.primary};
          color: #ffffff;
          border-color: ${theme.colors.primary};
        `
      : css`
          background-color: transparent;
          color: ${theme.colors.foreground};

          &:hover {
            background-color: ${theme.colors.muted};
          }
        `}
`;

const ColorCircle = styled.button<{ $color: string; $active: boolean }>`
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  border: 2px solid
    ${({ $active, theme }) =>
      $active ? theme.colors.primary : theme.colors.border};
  background-color: ${({ $color }) => $color};
  cursor: pointer;
  transition: border-color 0.15s;
  box-shadow: ${({ $active, theme }) =>
    $active ? `0 0 0 2px ${theme.colors.primary}40` : 'none'};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const FONT_SIZE_MIN = 14;
const FONT_SIZE_MAX = 28;
const FONT_SIZE_STEP = 2;

const BG_COLORS = [
  { value: '#ffffff', label: '흰색' },
  { value: '#f5f0e8', label: '크림색' },
  { value: '#1a1a2e', label: '다크' },
];

const LINE_HEIGHTS = [1.6, 1.8, 2.0];

export default function ReaderToolbar() {
  const { settings, isToolbarVisible, updateSettings } = useReaderStore();

  if (!isToolbarVisible) {
    return null;
  }

  const handleFontSizeDecrease = () => {
    if (settings.fontSize > FONT_SIZE_MIN) {
      updateSettings({ fontSize: settings.fontSize - FONT_SIZE_STEP });
    }
  };

  const handleFontSizeIncrease = () => {
    if (settings.fontSize < FONT_SIZE_MAX) {
      updateSettings({ fontSize: settings.fontSize + FONT_SIZE_STEP });
    }
  };

  return (
    <Overlay>
      <Panel role="toolbar" aria-label="읽기 설정">
        <ControlRow>
          <ControlLabel>글자 크기</ControlLabel>
          <ControlGroup>
            <IconButton
              type="button"
              onClick={handleFontSizeDecrease}
              disabled={settings.fontSize <= FONT_SIZE_MIN}
              aria-label="글자 크기 줄이기"
            >
              <Minus size={14} />
            </IconButton>
            <SizeDisplay>{settings.fontSize}px</SizeDisplay>
            <IconButton
              type="button"
              onClick={handleFontSizeIncrease}
              disabled={settings.fontSize >= FONT_SIZE_MAX}
              aria-label="글자 크기 늘리기"
            >
              <Plus size={14} />
            </IconButton>
          </ControlGroup>
        </ControlRow>

        <ControlRow>
          <ControlLabel>글꼴</ControlLabel>
          <ControlGroup>
            <ToggleButton
              type="button"
              $active={settings.fontFamily === 'serif'}
              onClick={() => updateSettings({ fontFamily: 'serif' })}
              aria-label="명조체"
              aria-pressed={settings.fontFamily === 'serif'}
            >
              명조
            </ToggleButton>
            <ToggleButton
              type="button"
              $active={settings.fontFamily === 'sans'}
              onClick={() => updateSettings({ fontFamily: 'sans' })}
              aria-label="고딕체"
              aria-pressed={settings.fontFamily === 'sans'}
            >
              고딕
            </ToggleButton>
          </ControlGroup>
        </ControlRow>

        <ControlRow>
          <ControlLabel>배경색</ControlLabel>
          <ControlGroup>
            {BG_COLORS.map((bg) => (
              <ColorCircle
                key={bg.value}
                type="button"
                $color={bg.value}
                $active={settings.bgColor === bg.value}
                onClick={() => updateSettings({ bgColor: bg.value })}
                aria-label={`배경색: ${bg.label}`}
                aria-pressed={settings.bgColor === bg.value}
              />
            ))}
          </ControlGroup>
        </ControlRow>

        <ControlRow>
          <ControlLabel>줄간격</ControlLabel>
          <ControlGroup>
            {LINE_HEIGHTS.map((lh) => (
              <ToggleButton
                key={lh}
                type="button"
                $active={settings.lineHeight === lh}
                onClick={() => updateSettings({ lineHeight: lh })}
                aria-label={`줄간격 ${lh}`}
                aria-pressed={settings.lineHeight === lh}
              >
                {lh.toFixed(1)}
              </ToggleButton>
            ))}
          </ControlGroup>
        </ControlRow>
      </Panel>
    </Overlay>
  );
}