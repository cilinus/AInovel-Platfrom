'use client';

import { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Genre, GENRE_LABELS, SUB_GENRES } from '@/src/constants/genres';
import { useWork } from '@/src/hooks/useWorks';
import { useUpdateWork, useUploadCover, useUploadBackground } from '@/src/hooks/useAuthorWorks';
import Input from '@/src/components/common/Input';
import Textarea from '@/src/components/common/Textarea';
import Button from '@/src/components/common/Button';
import ImageUpload from '@/src/components/common/ImageUpload';
import Loading from '@/src/components/common/Loading';
import EmptyState from '@/src/components/common/EmptyState';

const workEditSchema = z.object({
  title: z.string().min(1, '제목을 입력하세요').max(100, '100자 이내로 입력하세요'),
  synopsis: z.string().min(10, '10자 이상 입력하세요').max(2000, '2000자 이내로 입력하세요'),
  genre: z.nativeEnum(Genre, { errorMap: () => ({ message: '장르를 선택하세요' }) }),
  subGenres: z.array(z.string()).optional(),
  tags: z.string().optional(),
  freeEpisodeCount: z.coerce.number().min(0).default(3),
  pricePerEpisode: z.coerce.number().min(0).default(3),
});

type WorkEditFormData = z.infer<typeof workEditSchema>;

interface WorkEditFormProps {
  workId: string;
}

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

const PageTitle = styled.h1`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.foreground};
  margin: 0 0 0.5rem 0;
`;

const FormError = styled.div`
  padding: 0.75rem 1rem;
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme }) => theme.colors.destructive}10;
  border: 1px solid ${({ theme }) => theme.colors.destructive}40;
  color: ${({ theme }) => theme.colors.destructive};
  font-size: 0.875rem;
`;

const CharCount = styled.span<{ $over?: boolean }>`
  font-size: 0.75rem;
  color: ${({ $over, theme }) => $over ? theme.colors.destructive : theme.colors.mutedForeground};
  text-align: right;
`;

export default function WorkEditForm({ workId }: WorkEditFormProps) {
  const router = useRouter();
  const { data: work, loading: workLoading, error: workError } = useWork(workId);
  const { updateWork, loading: updateLoading, error: updateError } = useUpdateWork();
  const { uploadCover } = useUploadCover();
  const { uploadBackground } = useUploadBackground();
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);
  const [existingBgUrl, setExistingBgUrl] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<WorkEditFormData>({
    resolver: zodResolver(workEditSchema),
    defaultValues: {
      title: '',
      synopsis: '',
      tags: '',
      freeEpisodeCount: 3,
      pricePerEpisode: 3,
      subGenres: [],
    },
  });

  // 작품 데이터 로드 후 폼 기본값 설정
  useEffect(() => {
    if (work) {
      reset({
        title: work.title,
        synopsis: work.synopsis,
        genre: work.genre,
        subGenres: work.subGenres ?? [],
        tags: work.tags?.join(', ') ?? '',
        freeEpisodeCount: work.freeEpisodeCount,
        pricePerEpisode: work.pricePerEpisode,
      });
      setExistingCoverUrl(work.coverImageUrl ?? null);
      setExistingBgUrl(work.backgroundImageUrl ?? null);
    }
  }, [work, reset]);

  const selectedGenre = watch('genre');
  const synopsisValue = watch('synopsis') ?? '';
  const subGenreOptions = selectedGenre ? SUB_GENRES[selectedGenre] ?? [] : [];

  const onSubmit = useCallback(
    async (data: WorkEditFormData) => {
      setSubmitError(null);
      try {
        await updateWork(workId, {
          title: data.title,
          synopsis: data.synopsis,
          genre: data.genre,
          subGenres: data.subGenres,
          tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
          freeEpisodeCount: data.freeEpisodeCount,
          pricePerEpisode: data.pricePerEpisode,
        });
        if (coverFile) {
          try {
            await uploadCover(workId, coverFile);
          } catch {
            console.warn('[WorkEditForm] 표지 업로드 실패');
          }
        }
        if (backgroundFile) {
          try {
            await uploadBackground(workId, backgroundFile);
          } catch {
            console.warn('[WorkEditForm] 바탕 이미지 업로드 실패');
          }
        }
        router.push(`/author/works/${workId}`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : '작품 수정에 실패했습니다.';
        setSubmitError(msg);
      }
    },
    [updateWork, uploadCover, uploadBackground, coverFile, backgroundFile, workId, router],
  );

  if (workLoading) return <Loading />;
  if (workError || !work) {
    return <EmptyState message="작품을 찾을 수 없습니다." />;
  }

  return (
    <>
      <PageTitle>작품 정보 수정</PageTitle>
      <FormWrapper onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <Label>표지 이미지</Label>
          <ImageUpload
            value={existingCoverUrl}
            onChange={(file) => setCoverFile(file)}
            onRemove={() => setExistingCoverUrl(null)}
          />
        </FieldGroup>

        <FieldGroup>
          <Label>바탕 이미지 (배너용, 16:9)</Label>
          <ImageUpload
            aspectRatio="16/9"
            value={existingBgUrl}
            onChange={(file) => setBackgroundFile(file)}
            onRemove={() => setExistingBgUrl(null)}
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
            {...register('synopsis')}
          />
          <CharCount $over={synopsisValue.length > 2000}>
            {synopsisValue.length}/2000
          </CharCount>
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

        {(submitError || updateError) && (
          <FormError>{submitError ?? updateError?.message}</FormError>
        )}

        <SubmitRow>
          <Button type="submit" variant="primary" size="md" disabled={updateLoading}>
            {updateLoading ? '수정 중...' : '작품 정보 수정'}
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
    </>
  );
}