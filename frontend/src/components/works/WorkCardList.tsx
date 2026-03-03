'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Work } from '@/src/types/work';
import SectionTitle from '@/src/components/common/SectionTitle';
import WorkCard from './WorkCard';

interface WorkCardListProps {
  title: string;
  works: Work[];
  moreLink?: string;
}

const Container = styled.div`
  position: relative;
`;

const ScrollWrapper = styled.div`
  position: relative;
  overflow: hidden;
`;

const ScrollContainer = styled.div`
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  padding: 0.25rem 0;

  &::-webkit-scrollbar {
    display: none;
  }
  scrollbar-width: none;
`;

const ScrollItem = styled.div`
  scroll-snap-align: start;
  flex-shrink: 0;
`;

const ArrowButton = styled.button<{ $direction: 'left' | 'right' }>`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${({ $direction }) =>
    $direction === 'left' ? 'left: 0;' : 'right: 0;'}
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.card};
  color: ${({ theme }) => theme.colors.foreground};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  opacity: 0.9;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }

  & > svg {
    width: 20px;
    height: 20px;
  }
`;

export default function WorkCardList({ title, works, moreLink }: WorkCardListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScroll();

    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, works]);

  const scroll = useCallback((direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const offset = direction === 'left' ? -el.clientWidth : el.clientWidth;
    el.scrollBy({ left: offset, behavior: 'smooth' });
  }, []);

  return (
    <Container>
      <SectionTitle title={title} moreLink={moreLink} />
      <ScrollWrapper>
        {canScrollLeft && (
          <ArrowButton
            $direction="left"
            onClick={() => scroll('left')}
            aria-label="이전 작품 보기"
            type="button"
          >
            <ChevronLeft />
          </ArrowButton>
        )}
        <ScrollContainer ref={scrollRef}>
          {works.map((work) => (
            <ScrollItem key={work.id}>
              <WorkCard work={work} variant="compact" />
            </ScrollItem>
          ))}
        </ScrollContainer>
        {canScrollRight && (
          <ArrowButton
            $direction="right"
            onClick={() => scroll('right')}
            aria-label="다음 작품 보기"
            type="button"
          >
            <ChevronRight />
          </ArrowButton>
        )}
      </ScrollWrapper>
    </Container>
  );
}