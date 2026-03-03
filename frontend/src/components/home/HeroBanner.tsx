'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Work } from '@/src/types/work';
import { Genre, GENRE_LABELS } from '@/src/constants/genres';
import Button from '@/src/components/common/Button';

interface HeroBannerProps {
  works: Work[];
}

const GENRE_ACCENT_COLORS: Record<Genre, string> = {
  [Genre.ROMANCE]: '#ec4899',
  [Genre.FANTASY]: '#a855f7',
  [Genre.MARTIAL_ARTS]: '#f59e0b',
  [Genre.MODERN]: '#38bdf8',
  [Genre.MYSTERY]: '#64748b',
  [Genre.SF]: '#06b6d4',
};

const AUTO_SLIDE_INTERVAL = 5000;

const BannerContainer = styled.div`
  position: relative;
  width: 100%;
  height: 400px;
  overflow: hidden;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    height: 280px;
  }
`;

const SlideWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const Slide = styled.div<{ $active: boolean; $accentColor: string; $bgImage?: string }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: ${({ $active }) => ($active ? 1 : 0)};
  transition: opacity 0.5s ease-in-out;
  pointer-events: ${({ $active }) => ($active ? 'auto' : 'none')};
  ${({ $bgImage }) =>
    $bgImage
      ? `
    background-image: url(${$bgImage});
    background-size: cover;
    background-position: center;
  `
      : `
    background: linear-gradient(to right, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.3));
  `}
`;

const SlideOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to right,
    rgba(0, 0, 0, 0.7),
    rgba(0, 0, 0, 0.3)
  );
`;

const AccentStrip = styled.div<{ $color: string }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: ${({ $color }) => $color};
`;

const SlideContent = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem 2rem 2rem 2.5rem;
  height: 100%;
  z-index: 1;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 1.5rem 1rem 1.5rem 1.5rem;
  }
`;

const GenreBadge = styled.span<{ $color: string }>`
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ $color }) => $color};
  background: ${({ $color }) => `${$color}25`};
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  margin-bottom: 0.75rem;
  width: fit-content;
`;

const SlideTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 0.5rem;
  line-height: 1.3;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: 1.5rem;
  }
`;

const Synopsis = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 1.5rem;
  max-width: 600px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.6;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }
`;

const CTALink = styled(Link)`
  text-decoration: none;
  width: fit-content;
`;

const ArrowButton = styled.button<{ $direction: 'left' | 'right' }>`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${({ $direction }) =>
    $direction === 'left' ? 'left: 1rem;' : 'right: 1rem;'}
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.35);
  }

  & > svg {
    width: 20px;
    height: 20px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    width: 32px;
    height: 32px;

    & > svg {
      width: 16px;
      height: 16px;
    }
  }
`;

const DotContainer = styled.div`
  position: absolute;
  bottom: 1.25rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.5rem;
  z-index: 3;
`;

const Dot = styled.button<{ $active: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  padding: 0;
  cursor: pointer;
  background: ${({ $active }) =>
    $active ? '#ffffff' : 'rgba(255, 255, 255, 0.5)'};
  transition: background 0.2s;

  &:hover {
    background: ${({ $active }) =>
      $active ? '#ffffff' : 'rgba(255, 255, 255, 0.7)'};
  }
`;

export default function HeroBanner({ works }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const slideCount = works.length;

  const goToSlide = useCallback(
    (index: number) => {
      if (slideCount === 0) return;
      setCurrentIndex((index + slideCount) % slideCount);
    },
    [slideCount],
  );

  const goNext = useCallback(() => {
    goToSlide(currentIndex + 1);
  }, [currentIndex, goToSlide]);

  const goPrev = useCallback(() => {
    goToSlide(currentIndex - 1);
  }, [currentIndex, goToSlide]);

  useEffect(() => {
    if (isPaused || slideCount <= 1) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slideCount);
    }, AUTO_SLIDE_INTERVAL);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPaused, slideCount]);

  if (works.length === 0) {
    return null;
  }

  return (
    <BannerContainer
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="추천 작품 배너"
      aria-roledescription="carousel"
    >
      <SlideWrapper>
        {works.map((work, index) => {
          const accentColor =
            GENRE_ACCENT_COLORS[work.genre] || GENRE_ACCENT_COLORS[Genre.MODERN];
          const genreLabel = GENRE_LABELS[work.genre] || work.genre;

          const bgImage = work.backgroundImageUrl ?? work.coverImageUrl;

          return (
            <Slide
              key={work.id}
              $active={index === currentIndex}
              $accentColor={accentColor}
              $bgImage={bgImage}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} / ${slideCount}: ${work.title}`}
              aria-hidden={index !== currentIndex}
            >
              {bgImage && <SlideOverlay />}
              <AccentStrip $color={accentColor} />
              <SlideContent>
                <GenreBadge $color={accentColor}>{genreLabel}</GenreBadge>
                <SlideTitle>{work.title}</SlideTitle>
                <Synopsis>{work.synopsis}</Synopsis>
                <CTALink href={`/works/${work.id}`}>
                  <Button as="span" variant="primary" size="md">
                    첫화 보기
                  </Button>
                </CTALink>
              </SlideContent>
            </Slide>
          );
        })}
      </SlideWrapper>

      {slideCount > 1 && (
        <>
          <ArrowButton
            $direction="left"
            onClick={goPrev}
            type="button"
            aria-label="이전 슬라이드"
          >
            <ChevronLeft />
          </ArrowButton>
          <ArrowButton
            $direction="right"
            onClick={goNext}
            type="button"
            aria-label="다음 슬라이드"
          >
            <ChevronRight />
          </ArrowButton>
          <DotContainer>
            {works.map((_, index) => (
              <Dot
                key={index}
                $active={index === currentIndex}
                onClick={() => goToSlide(index)}
                type="button"
                aria-label={`${index + 1}번 슬라이드로 이동`}
              />
            ))}
          </DotContainer>
        </>
      )}
    </BannerContainer>
  );
}