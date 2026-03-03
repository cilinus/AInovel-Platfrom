'use client';

import React, { forwardRef } from 'react';
import styled, { css } from 'styled-components';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

const InputWrapper = styled.div<{ $fullWidth?: boolean }>`
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

const StyledInput = styled.input<{ $hasError?: boolean }>`
  font-size: 0.875rem;
  padding: 0.625rem 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  width: 100%;

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

const ErrorMessage = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.destructive};
`;

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, fullWidth, id, ...rest }, ref) => {
    const inputId = id || (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined);

    return (
      <InputWrapper $fullWidth={fullWidth}>
        {label && <StyledLabel htmlFor={inputId}>{label}</StyledLabel>}
        <StyledInput
          ref={ref}
          id={inputId}
          $hasError={!!error}
          aria-invalid={!!error}
          aria-describedby={error && inputId ? `${inputId}-error` : undefined}
          {...rest}
        />
        {error && (
          <ErrorMessage id={inputId ? `${inputId}-error` : undefined} role="alert">
            {error}
          </ErrorMessage>
        )}
      </InputWrapper>
    );
  },
);

Input.displayName = 'Input';

export default Input;