'use client';

import React from 'react';
import styled from 'styled-components';
import Button from './Button';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  message: string;
  description?: string;
  action?: EmptyStateAction;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
`;

const IconWrapper = styled.div`
  width: 48px;
  height: 48px;
  color: ${({ theme }) => theme.colors.mutedForeground};
  margin-bottom: 1rem;

  & > svg {
    width: 100%;
    height: 100%;
  }
`;

const Message = styled.p`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.foreground};
  margin-bottom: 0.5rem;
`;

const Description = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  margin-bottom: 1.5rem;
  max-width: 24rem;
  line-height: 1.5;
`;

const ActionButton = styled(Button)`
  margin-top: 0.5rem;
`;

export default function EmptyState({ icon, message, description, action }: EmptyStateProps) {
  return (
    <Container>
      {icon && <IconWrapper>{icon}</IconWrapper>}
      <Message>{message}</Message>
      {description && <Description>{description}</Description>}
      {action && (
        <ActionButton type="button" onClick={action.onClick}>
          {action.label}
        </ActionButton>
      )}
    </Container>
  );
}