'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Genre, GENRE_LABELS, SUB_GENRES } from '@/src/constants/genres';
import { useCreateWork, useUploadCover, useUploadBackground } from '@/src/hooks/useAuthorWorks';
import Input from '@/src/components/common/Input';
import Textarea from '@/src/components/common/Textarea';
import Button from '@/src/components/common/Button';
import ImageUpload from '@/src/components/common/ImageUpload';

const workCreateSchema = z.object({
  title: z.string().min(1, '제목을 입력하세요').max(100, '100자 이내로 입력하세요'),
  synopsis: z.string().min(10, '10자 이상 입력하세요').max(2000, '2000자 이내로 입력하세요'),
  genre: z.nativeEnum(Genre, { errorMap: () => ({ message: '장르를 선택하세요' }) }),
  subGenres: z.array(z.string()).optional(),
  tags: z.string().optional(),
  freeEpisodeCount: z.coerce.number().min(0).default(3),
  pricePerEpisode: z.coerce.number().min(0).default(3),
});

type WorkCreateFormData = z.infer<typeof workCreateSchema>;

const FormWrapper = styled.form`
  max-width: 640px;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.foreground};
`;

const Select = styled.select<{ $hasError?: boolean }>`
  font-size: 0.875rem;
  padding: 0.625rem 0.75rem;
  border: 1px solid ${({ $hasError, theme }) => $hasError ? theme.colors.destructive : theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  outline: none;
  width: 100%;
  transition: border-color 0.2s;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }
`;

const ErrorText = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.destructive};
`;

const SubGenreGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.25rem;
`;

const CheckboxLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.foreground};
  cursor: pointer;
`;

const PriceRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const SubmitRow = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
`;

export default function WorkCreateForm() {
  const router = useRouter();
  const { createWork, loading } = useCreateWork();
  const { uploadCover } = useUploadCover();
  const { uploadBackground } = useUploadBackground();
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<WorkCreateFormData>({
    resolver: zodResolver(workCreateSchema),
    defaultValues: {
      title: '',
      synopsis: '',
      tags: '',
      freeEpisodeCount: 3,
      pricePerEpisode: 3,
      subGenres: [],
    },
  });

  const selectedGenre = watch('genre');
  const subGenreOptions = selectedGenre ? SUB_GENRES[selectedGenre] ?? [] : [];

  const onSubmit = useCallback(
    async (data: WorkCreateFormData) => {
      try {
        const createdWork = await createWork({
          title: data.title,
          synopsis: data.synopsis,
          genre: data.genre,
          subGenres: data.subGenres,
          tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
          freeEpisodeCount: data.freeEpisodeCount,
          pricePerEpisode: data.pricePerEpisode,
        });
        const workId = createdWork.id;
        if (coverFile && workId) {
          try {
            await uploadCover(workId, coverFile);
          } catch {
            console.warn('[WorkCreateForm] 표지 업로드 실패, 작품은 생성됨');
          }
        }
        if (backgroundFile && workId) {
          try {
            await uploadBackground(workId, backgroundFile);
          } catch {
            console.warn('[WorkCreateForm] 바탕 이미지 업로드 실패, 작품은 생성됨');
          }
        }
        router.push('/author/works');
      } catch {
        // error handled by hook
      }
    },
    [createWork, uploadCover, uploadBackground, coverFile, backgroundFile, router],
  );

  return (
    <FormWrapper onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <Label>표지 이미지</Label>
        <ImageUpload
          onChange={(file) => setCoverFile(file)}
        />
      </FieldGroup>

      <FieldGroup>
        <Label>바탕 이미지 (배너용, 16:9)</Label>
        <ImageUpload
          aspectRatio="16/9"
          onChange={(file) => setBackgroundFile(file)}
        />
      </FieldGroup>

      <Input
        label="작품 제목"
        placeholder="작품 제목을 입력하세요"
        error={errors.title?.message}
        fullWidth
        {...register('title')}
      />

      <FieldGroup>
        <Label htmlFor="synopsis">시놉시스</Label>
        <Textarea
          id="synopsis"
          placeholder="작품의 줄거리를 입력하세요 (10자 이상)"
          error={errors.synopsis?.message}
          fullWidth
          rows={6}
          maxLength={2000}
          {...register('synopsis')}
        />
      </FieldGroup>

      <FieldGroup>
        <Label htmlFor="genre">장르</Label>
        <Select id="genre" $hasError={!!errors.genre} {...register('genre')}>
          <option value="">장르를 선택하세요</option>
          {Object.values(Genre).map((g) => (
            <option key={g} value={g}>
              {GENRE_LABELS[g]}
            </option>
          ))}
        </Select>
        {errors.genre && <ErrorText>{errors.genre.message}</ErrorText>}
      </FieldGroup>

      {subGenreOptions.length > 0 && (
        <FieldGroup>
          <Label>서브 장르</Label>
          <SubGenreGrid>
            {subGenreOptions.map((sg) => (
              <CheckboxLabel key={sg.id}>
                <input type="checkbox" value={sg.id} {...register('subGenres')} />
                {sg.label}
              </CheckboxLabel>
            ))}
          </SubGenreGrid>
        </FieldGroup>
      )}

      <Input
        label="태그"
        placeholder="쉼표로 구분 (예: 회귀, 복수, 성장)"
        error={errors.tags?.message}
        fullWidth
        {...register('tags')}
      />

      <PriceRow>
        <Input
          label="무료 에피소드 수"
          type="number"
          min={0}
          error={errors.freeEpisodeCount?.message}
          fullWidth
          {...register('freeEpisodeCount')}
        />
        <Input
          label="에피소드당 가격 (토큰)"
          type="number"
          min={0}
          error={errors.pricePerEpisode?.message}
          fullWidth
          {...register('pricePerEpisode')}
        />
      </PriceRow>

      <SubmitRow>
        <Button type="submit" variant="primary" size="md" disabled={loading}>
          {loading ? '등록 중...' : '작품 등록'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={() => router.back()}
        >
          취소
        </Button>
      </SubmitRow>
    </FormWrapper>
  );
}