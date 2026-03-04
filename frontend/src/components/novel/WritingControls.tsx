'use client';

import styled from 'styled-components';
import { useNovelStore } from '@/src/stores/novelStore';
import type { WritingTone, Perspective } from '@/src/types/novel';
import { WRITING_TONE_LABELS, PERSPECTIVE_LABELS } from '@/src/types/novel';

const ControlsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ControlGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

const ControlLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.foreground};
`;

const StyledSelect = styled.select`
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  outline: none;
  cursor: pointer;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }
`;

const LengthRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const StyledSlider = styled.input`
  flex: 1;
  accent-color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
`;

const LengthValue = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.primary};
  min-width: 4.5rem;
  text-align: right;
`;

interface WritingControlsProps {
  tone?: string;
  perspective?: string;
  targetLength?: number;
  onToneChange?: (tone: string) => void;
  onPerspectiveChange?: (perspective: string) => void;
  onTargetLengthChange?: (length: number) => void;
}

export default function WritingControls({
  tone: toneProp,
  perspective: perspectiveProp,
  targetLength: targetLengthProp,
  onToneChange,
  onPerspectiveChange,
  onTargetLengthChange,
}: WritingControlsProps = {}) {
  const storeTone = useNovelStore((s) => s.settings.writingTone);
  const storePerspective = useNovelStore((s) => s.settings.perspective);
  const storeTargetLength = useNovelStore((s) => s.settings.targetLength);
  const storeSetWritingTone = useNovelStore((s) => s.setWritingTone);
  const storeSetPerspective = useNovelStore((s) => s.setPerspective);
  const storeSetTargetLength = useNovelStore((s) => s.setTargetLength);

  const currentTone = (toneProp as WritingTone | undefined) ?? storeTone;
  const currentPerspective = (perspectiveProp as Perspective | undefined) ?? storePerspective;
  const currentTargetLength = targetLengthProp ?? storeTargetLength;

  const handleToneChange = (val: string) => {
    if (onToneChange) {
      onToneChange(val);
    } else {
      storeSetWritingTone(val as WritingTone);
    }
  };

  const handlePerspectiveChange = (val: string) => {
    if (onPerspectiveChange) {
      onPerspectiveChange(val);
    } else {
      storeSetPerspective(val as Perspective);
    }
  };

  const handleTargetLengthChange = (val: number) => {
    if (onTargetLengthChange) {
      onTargetLengthChange(val);
    } else {
      storeSetTargetLength(val);
    }
  };

  const tones = Object.keys(WRITING_TONE_LABELS) as WritingTone[];
  const perspectives = Object.keys(PERSPECTIVE_LABELS) as Perspective[];

  return (
    <ControlsWrapper>
      <ControlGroup>
        <ControlLabel htmlFor="writing-tone">문체</ControlLabel>
        <StyledSelect
          id="writing-tone"
          value={currentTone}
          onChange={(e) => handleToneChange(e.target.value)}
        >
          {tones.map((t) => (
            <option key={t} value={t}>
              {WRITING_TONE_LABELS[t]}
            </option>
          ))}
        </StyledSelect>
      </ControlGroup>

      <ControlGroup>
        <ControlLabel htmlFor="perspective">시점</ControlLabel>
        <StyledSelect
          id="perspective"
          value={currentPerspective}
          onChange={(e) => handlePerspectiveChange(e.target.value)}
        >
          {perspectives.map((p) => (
            <option key={p} value={p}>
              {PERSPECTIVE_LABELS[p]}
            </option>
          ))}
        </StyledSelect>
      </ControlGroup>

      <ControlGroup>
        <ControlLabel htmlFor="target-length">목표 글자 수</ControlLabel>
        <LengthRow>
          <StyledSlider
            id="target-length"
            type="range"
            min={1000}
            max={5000}
            step={500}
            value={currentTargetLength}
            onChange={(e) => handleTargetLengthChange(Number(e.target.value))}
          />
          <LengthValue>{currentTargetLength.toLocaleString()}자</LengthValue>
        </LengthRow>
      </ControlGroup>
    </ControlsWrapper>
  );
}