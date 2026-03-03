'use client';

import styled, { css } from 'styled-components';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const Button = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radius.md};
  font-weight: 500;
  transition: all 0.2s;

  ${({ size }) => {
    switch (size) {
      case 'sm':
        return css`
          padding: 0.375rem 0.75rem;
          font-size: 0.875rem;
        `;
      case 'lg':
        return css`
          padding: 0.75rem 1.5rem;
          font-size: 1.125rem;
        `;
      default:
        return css`
          padding: 0.5rem 1rem;
          font-size: 1rem;
        `;
    }
  }}

  ${({ variant, theme }) => {
    switch (variant) {
      case 'secondary':
        return css`
          background-color: ${theme.colors.secondary};
          color: white;
          &:hover { opacity: 0.9; }
        `;
      case 'outline':
        return css`
          border: 1px solid ${theme.colors.border};
          background: transparent;
          color: ${theme.colors.foreground};
          &:hover { background: ${theme.colors.muted}; }
        `;
      case 'ghost':
        return css`
          background: transparent;
          color: ${theme.colors.foreground};
          &:hover { background: ${theme.colors.muted}; }
        `;
      default:
        return css`
          background-color: ${theme.colors.primary};
          color: white;
          &:hover { background-color: ${theme.colors.primaryHover}; }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default Button;
