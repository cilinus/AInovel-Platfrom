'use client';

import React from 'react';
import Link from 'next/link';
import styled from 'styled-components';

interface SectionTitleProps {
  title: string;
  moreLink?: string;
  moreText?: string;
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.foreground};
`;

const MoreLink = styled(Link)`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: none;
  }
`;

export default function SectionTitle({
  title,
  moreLink,
  moreText = '더보기',
}: SectionTitleProps) {
  return (
    <Wrapper>
      <Title>{title}</Title>
      {moreLink && <MoreLink href={moreLink}>{moreText}</MoreLink>}
    </Wrapper>
  );
}