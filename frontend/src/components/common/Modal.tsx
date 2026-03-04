'use client';

import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
`;

const ModalCard = styled.div`
  position: relative;
  width: 90%;
  max-width: 480px;
  max-height: 85vh;
  overflow-y: auto;
  padding: 1.5rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  background-color: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
`;

const ModalTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.foreground};
  margin: 0 0 1.25rem;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.25rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  cursor: pointer;
  line-height: 1;
  padding: 0.25rem;

  &:hover {
    color: ${({ theme }) => theme.colors.foreground};
  }
`;

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEsc]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <Overlay onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <ModalCard>
        <CloseButton type="button" onClick={onClose} aria-label="닫기">&times;</CloseButton>
        <ModalTitle>{title}</ModalTitle>
        {children}
      </ModalCard>
    </Overlay>,
    document.body,
  );
}