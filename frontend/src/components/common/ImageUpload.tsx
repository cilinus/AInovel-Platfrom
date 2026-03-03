'use client';

import React, { useCallback, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { ImagePlus, X } from 'lucide-react';

interface ImageUploadProps {
  value?: string | null;
  onChange: (file: File | null) => void;
  onRemove?: () => void;
  maxSizeMB?: number;
  aspectRatio?: string;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const Container = styled.div<{ $aspectRatio: string }>`
  position: relative;
  max-width: 200px;
  aspect-ratio: ${({ $aspectRatio }) => $aspectRatio};
`;

const DropZone = styled.div<{ $isDragging: boolean; $hasImage: boolean }>`
  width: 100%;
  height: 100%;
  border: 2px dashed ${({ $isDragging, theme }) =>
    $isDragging ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.muted};

  ${({ $isDragging, theme }) =>
    $isDragging &&
    css`
      background-color: ${theme.colors.primary}10;
    `}

  ${({ $hasImage }) =>
    $hasImage &&
    css`
      border-style: solid;
      border-color: transparent;
      padding: 0;
    `}

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: ${({ theme }) => theme.radius.md};
`;

const PlaceholderContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  padding: 1rem;
  text-align: center;
`;

const PlaceholderText = styled.span`
  font-size: 0.8125rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const PlaceholderSubText = styled.span`
  font-size: 0.6875rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  opacity: 0.7;
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 0.375rem;
  right: 0.375rem;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  border: none;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
  z-index: 1;

  &:hover {
    background-color: rgba(0, 0, 0, 0.8);
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

export default function ImageUpload({
  value,
  onChange,
  onRemove,
  maxSizeMB = 5,
  aspectRatio = '3/4',
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const displayUrl = previewUrl || value || null;

  const validateAndSetFile = useCallback(
    (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        alert('JPG, PNG, WebP 형식의 이미지만 업로드할 수 있습니다.');
        return;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`파일 크기는 ${maxSizeMB}MB 이하여야 합니다.`);
        return;
      }
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      onChange(file);
    },
    [maxSizeMB, onChange],
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        validateAndSetFile(file);
      }
      // 같은 파일 재선택 허용을 위해 value 초기화
      e.target.value = '';
    },
    [validateAndSetFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        validateAndSetFile(file);
      }
    },
    [validateAndSetFile],
  );

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setPreviewUrl(null);
      onChange(null);
      onRemove?.();
    },
    [onChange, onRemove],
  );

  return (
    <Container $aspectRatio={aspectRatio}>
      <DropZone
        $isDragging={isDragging}
        $hasImage={!!displayUrl}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        aria-label="표지 이미지 업로드"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {displayUrl ? (
          <PreviewImage src={displayUrl} alt="표지 미리보기" />
        ) : (
          <PlaceholderContent>
            <ImagePlus size={32} color="currentColor" style={{ opacity: 0.5 }} />
            <PlaceholderText>표지 이미지 업로드</PlaceholderText>
            <PlaceholderSubText>JPG, PNG, WebP (최대 {maxSizeMB}MB)</PlaceholderSubText>
          </PlaceholderContent>
        )}
      </DropZone>

      {displayUrl && (
        <RemoveButton
          type="button"
          onClick={handleRemove}
          aria-label="이미지 제거"
        >
          <X size={14} />
        </RemoveButton>
      )}

      <HiddenInput
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleFileChange}
      />
    </Container>
  );
}