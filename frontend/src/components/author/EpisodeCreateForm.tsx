'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileText, Upload, X } from 'lucide-react';
import { useCreateEpisode } from '@/src/hooks/useAuthorWorks';
import Input from '@/src/components/common/Input';
import Button from '@/src/components/common/Button';

interface EpisodeCreateFormProps {
  workId: string;
  insertPosition?: number;
}

const episodeCreateSchema = z.object({
  title: z.string().min(1, '제목을 입력하세요').max(100, '100자 이내로 입력하세요'),
  content: z.string().min(1, '내용을 입력하세요'),
  isFree: z.boolean().default(false),
  price: z.coerce.number().min(0).default(3),
  authorNote: z.string().max(500).optional(),
  publishNow: z.boolean().default(true),
});

type EpisodeCreateFormData = z.infer<typeof episodeCreateSchema>;

const FormWrapper = styled.form`
  max-width: 800px;
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

const ContentTextarea = styled.textarea<{ $hasError?: boolean }>`
  font-size: 0.9375rem;
  padding: 1rem;
  border: 1px solid ${({ $hasError, theme }) => $hasError ? theme.colors.destructive : theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  outline: none;
  width: 100%;
  min-height: 400px;
  resize: vertical;
  font-family: inherit;
  line-height: 1.8;
  transition: border-color 0.2s;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.mutedForeground};
  }
`;

const NoteTextarea = styled.textarea`
  font-size: 0.875rem;
  padding: 0.625rem 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  outline: none;
  width: 100%;
  min-height: 80px;
  resize: vertical;
  font-family: inherit;
  line-height: 1.5;
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

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const WordCount = styled.span`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const CheckboxLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.foreground};
  cursor: pointer;
`;

const SubmitRow = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
`;

const TabRow = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const TabButton = styled.button<{ $active: boolean }>`
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ $active, theme }) => $active ? theme.colors.primary : 'transparent'};
  color: ${({ $active, theme }) => $active ? theme.colors.background : theme.colors.foreground};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const DropZone = styled.div<{ $isDragOver: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: 200px;
  border: 2px dashed ${({ $isDragOver, theme }) => $isDragOver ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ $isDragOver, theme }) => $isDragOver ? `${theme.colors.primary}08` : theme.colors.muted};
  cursor: pointer;
  transition: all 0.2s;
  color: ${({ theme }) => theme.colors.mutedForeground};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const DropZoneText = styled.span`
  font-size: 0.875rem;
  text-align: center;
  line-height: 1.5;
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  background-color: ${({ theme }) => theme.colors.muted};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.foreground};
`;

const FileInfoText = styled.span`
  flex: 1;
`;

const RemoveButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border: none;
  background: none;
  color: ${({ theme }) => theme.colors.mutedForeground};
  cursor: pointer;
  border-radius: ${({ theme }) => theme.radius.sm};
  transition: color 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.destructive};
  }
`;

const PreviewArea = styled.div`
  max-height: 200px;
  overflow-y: auto;
  padding: 0.75rem 1rem;
  background-color: ${({ theme }) => theme.colors.muted};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 0.8125rem;
  line-height: 1.7;
  color: ${({ theme }) => theme.colors.mutedForeground};
  white-space: pre-wrap;
  word-break: break-all;
`;

const PreviewLabel = styled.span`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const FileErrorText = styled.span`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.destructive};
`;

type InputMode = 'direct' | 'file';

interface UploadedFile {
  name: string;
  size: number;
  content: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_EXTENSIONS = ['.txt', '.md'];
const ACCEPTED_MIME_TYPES = ['text/plain', 'text/markdown'];

const InsertPositionBanner = styled.div`
  padding: 0.625rem 0.75rem;
  background-color: ${({ theme }) => theme.colors.primary}10;
  border: 1px solid ${({ theme }) => theme.colors.primary}30;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 500;
`;

export default function EpisodeCreateForm({ workId, insertPosition }: EpisodeCreateFormProps) {
  const router = useRouter();
  const { createEpisode, loading } = useCreateEpisode();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EpisodeCreateFormData>({
    resolver: zodResolver(episodeCreateSchema),
    defaultValues: {
      title: '',
      content: '',
      isFree: false,
      price: 3,
      authorNote: '',
      publishNow: true,
    },
  });

  const [inputMode, setInputMode] = useState<InputMode>('direct');
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const contentValue = watch('content');
  const isFree = watch('isFree');

  const validateAndReadFile = useCallback((file: File) => {
    setFileError(null);

    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(extension) && !ACCEPTED_MIME_TYPES.includes(file.type)) {
      setFileError('.txt 또는 .md 파일만 업로드할 수 있습니다.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError('파일 크기가 5MB를 초과합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setValue('content', text, { shouldValidate: true });
      setUploadedFile({ name: file.name, size: file.size, content: text });
    };
    reader.readAsText(file, 'UTF-8');
  }, [setValue]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndReadFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [validateAndReadFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndReadFile(file);
    }
  }, [validateAndReadFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleRemoveFile = useCallback(() => {
    setUploadedFile(null);
    setFileError(null);
    setValue('content', '', { shouldValidate: true });
  }, [setValue]);

  const previewLines = uploadedFile
    ? uploadedFile.content.split('\n').slice(0, 10).join('\n')
    : '';

  const onSubmit = useCallback(
    async (data: EpisodeCreateFormData) => {
      try {
        await createEpisode(workId, {
          title: data.title,
          content: data.content,
          isFree: data.isFree,
          price: data.isFree ? 0 : data.price,
          authorNote: data.authorNote || undefined,
          publishNow: data.publishNow,
          ...(insertPosition !== undefined ? { episodeNumber: insertPosition } : {}),
        });
        router.push(`/author/works/${workId}`);
      } catch {
        // error handled by hook
      }
    },
    [createEpisode, workId, router, insertPosition],
  );

  return (
    <FormWrapper onSubmit={handleSubmit(onSubmit)}>
      {insertPosition !== undefined && (
        <InsertPositionBanner>
          Ch.{String(insertPosition).padStart(3, '0')} 위치에 삽입됩니다
        </InsertPositionBanner>
      )}
      <Input
        label="에피소드 제목"
        placeholder="에피소드 제목을 입력하세요"
        error={errors.title?.message}
        fullWidth
        {...register('title')}
      />

      <FieldGroup>
        <Label htmlFor="content">본문</Label>
        <TabRow>
          <TabButton
            type="button"
            $active={inputMode === 'direct'}
            onClick={() => setInputMode('direct')}
          >
            직접 입력
          </TabButton>
          <TabButton
            type="button"
            $active={inputMode === 'file'}
            onClick={() => setInputMode('file')}
          >
            파일 업로드
          </TabButton>
        </TabRow>

        {inputMode === 'direct' ? (
          <ContentTextarea
            id="content"
            $hasError={!!errors.content}
            placeholder="에피소드 내용을 작성하세요..."
            {...register('content')}
          />
        ) : (
          <>
            {!uploadedFile ? (
              <DropZone
                $isDragOver={isDragOver}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <FileText size={40} />
                <DropZoneText>
                  .txt / .md 파일을<br />드래그하거나 클릭하세요
                </DropZoneText>
                <Upload size={16} />
              </DropZone>
            ) : (
              <>
                <FileInfo>
                  <FileText size={16} />
                  <FileInfoText>
                    {uploadedFile.name} ({uploadedFile.content.length.toLocaleString()}자)
                  </FileInfoText>
                  <RemoveButton type="button" onClick={handleRemoveFile} aria-label="파일 제거">
                    <X size={16} />
                  </RemoveButton>
                </FileInfo>
                <PreviewLabel>미리보기</PreviewLabel>
                <PreviewArea>{previewLines}</PreviewArea>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            {fileError && <FileErrorText>{fileError}</FileErrorText>}
          </>
        )}

        <InfoRow>
          {errors.content ? (
            <ErrorText>{errors.content.message}</ErrorText>
          ) : <span />}
          <WordCount>{contentValue?.length ?? 0}자</WordCount>
        </InfoRow>
      </FieldGroup>

      <ToggleRow>
        <CheckboxLabel>
          <input type="checkbox" {...register('isFree')} />
          무료 에피소드
        </CheckboxLabel>
        <CheckboxLabel>
          <input type="checkbox" {...register('publishNow')} />
          즉시 공개
        </CheckboxLabel>
      </ToggleRow>

      {!isFree && (
        <Input
          label="가격 (토큰)"
          type="number"
          min={0}
          error={errors.price?.message}
          fullWidth
          {...register('price')}
        />
      )}

      <FieldGroup>
        <Label htmlFor="authorNote">작가의 말 (선택)</Label>
        <NoteTextarea
          id="authorNote"
          placeholder="독자에게 전하고 싶은 말을 적어주세요..."
          {...register('authorNote')}
        />
      </FieldGroup>

      <SubmitRow>
        <Button type="submit" variant="primary" size="md" disabled={loading}>
          {loading ? '등록 중...' : '에피소드 등록'}
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