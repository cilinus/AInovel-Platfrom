'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import Modal from '@/src/components/common/Modal';
import Input from '@/src/components/common/Input';
import Textarea from '@/src/components/common/Textarea';
import Button from '@/src/components/common/Button';
import GenreSelector from './GenreSelector';
import WritingControls from './WritingControls';
import { useNovelProjects } from '@/src/hooks/useNovelProjects';
import type { WritingTone, Perspective } from '@/src/types/novel';

const FormWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const ErrorText = styled.p`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.destructive};
  margin: 0;
`;

interface ProjectCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectCreateModal({ isOpen, onClose }: ProjectCreateModalProps) {
  const router = useRouter();
  const { createProject } = useNovelProjects();

  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [subGenre, setSubGenre] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [tone, setTone] = useState<string>('formal');
  const [perspective, setPerspective] = useState<string>('third_person_limited');
  const [targetLength, setTargetLength] = useState(3000);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = title.trim().length > 0 && genre.length > 0 && synopsis.trim().length > 0;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    const result = await createProject({
      title: title.trim(),
      genre,
      subGenre: subGenre || undefined,
      synopsis: synopsis.trim(),
      writingStyle: {
        tone: tone as WritingTone,
        perspective: perspective as Perspective,
      },
      settings: {
        mainCharacters: [],
        worldBuilding: '',
      } as any,
    });

    setSubmitting(false);

    if (result) {
      onClose();
      setTitle('');
      setGenre('');
      setSubGenre('');
      setSynopsis('');
      setTone('formal');
      setPerspective('third_person_limited');
      setTargetLength(3000);
      router.push(`/author/novel/${result._id}`);
    } else {
      setError('프로젝트 생성에 실패했습니다.');
    }
  }, [canSubmit, title, genre, subGenre, synopsis, tone, perspective, createProject, onClose, router]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="새 프로젝트 생성" size="lg">
      <FormWrapper>
        <Input
          label="프로젝트 제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="소설 제목을 입력하세요"
          fullWidth
        />

        <GenreSelector
          value={genre}
          subGenreValue={subGenre}
          onChange={setGenre}
          onSubGenreChange={setSubGenre}
        />

        <Textarea
          label="시놉시스"
          value={synopsis}
          onChange={(e) => setSynopsis(e.target.value)}
          maxLength={2000}
          rows={4}
          fullWidth
          placeholder="소설의 줄거리를 입력해주세요."
        />

        <WritingControls
          tone={tone}
          perspective={perspective}
          targetLength={targetLength}
          onToneChange={setTone}
          onPerspectiveChange={setPerspective}
          onTargetLengthChange={setTargetLength}
        />

        {error && <ErrorText>{error}</ErrorText>}

        <ButtonRow>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            취소
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
          >
            {submitting ? '생성 중...' : '생성'}
          </Button>
        </ButtonRow>
      </FormWrapper>
    </Modal>
  );
}