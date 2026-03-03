'use client';

import React, { forwardRef } from 'react';
import styled, { css } from 'styled-components';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

const TextareaWrapper = styled.div<{ $fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  ${({ $fullWidth }) =>
    $fullWidth &&
    css`
      width: 100%;
    `}
`;

const StyledLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.foreground};
`;

const StyledTextarea = styled.textarea<{ $hasError?: boolean }>`
  font-size: 0.875rem;
  padding: 0.625rem 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  width: 100%;
  resize: vertical;
  font-family: inherit;
  line-height: 1.5;

  &::placeholder {
    color: ${({ theme }) => theme.colors.mutedForeground};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: ${({ theme }) => theme.colors.muted};
  }

  ${({ $hasError, theme }) =>
    $hasError &&
    css`
      border-color: ${theme.colors.destructive};

      &:focus {
        border-color: ${theme.colors.destructive};
        box-shadow: 0 0 0 3px ${theme.colors.destructive}20;
      }
    `}
`;

const BottomRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ErrorMessage = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.destructive};
`;

const CharCount = styled.span<{ $over?: boolean }>`
  font-size: 0.75rem;
  color: ${({ $over, theme }) => $over ? theme.colors.destructive : theme.colors.mutedForeground};
  margin-left: auto;
`;

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, fullWidth, id, maxLength, value, ...rest }, ref) => {
    const textareaId = id || (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined);
    const currentLength = typeof value === 'string' ? value.length : 0;
    const isOver = maxLength ? currentLength > maxLength : false;

    return (
      <TextareaWrapper $fullWidth={fullWidth}>
        {label && <StyledLabel htmlFor={textareaId}>{label}</StyledLabel>}
        <StyledTextarea
          ref={ref}
          id={textareaId}
          $hasError={!!error}
          aria-invalid={!!error}
          aria-describedby={error && textareaId ? `${textareaId}-error` : undefined}
          maxLength={maxLength}
          value={value}
          {...rest}
        />
        <BottomRow>
          {error ? (
            <ErrorMessage id={textareaId ? `${textareaId}-error` : undefined} role="alert">
              {error}
            </ErrorMessage>
          ) : <span />}
          {maxLength && (
            <CharCount $over={isOver}>
              {currentLength}/{maxLength}
            </CharCount>
          )}
        </BottomRow>
      </TextareaWrapper>
    );
  },
);

Textarea.displayName = 'Textarea';

export default Textarea;