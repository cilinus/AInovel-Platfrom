'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { useWorks } from '@/src/hooks/useWorks';
import HeroBanner from './HeroBanner';
import RankingSection from './RankingSection';
import SectionTitle from '@/src/components/common/SectionTitle';
import WorkCardList from '@/src/components/works/WorkCardList';
import WorkGrid from '@/src/components/works/WorkGrid';
import GenreTabBar from '@/src/components/works/GenreTabBar';
import Loading from '@/src/components/common/Loading';

const HomeWrapper = styled.div`
  min-height: 100vh;
`;

const ContentArea = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
`;

const Section = styled.section`
  margin-bottom: 3rem;
`;

const GenreQuickAccess = styled(Section)`
  margin-top: 1.5rem;
`;

const NewWorksSection = styled(Section)``;

const ErrorBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  padding: 1.5rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.destructive}10;
  border: 1px solid ${({ theme }) => theme.colors.destructive}40;
`;

const ErrorText = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.destructive};
  text-align: center;
`;

export default function HomeContent() {
  const router = useRouter();

  const featuredParams = useMemo(() => ({ sort: 'popular', limit: 5 }), []);
  const hotParams = useMemo(() => ({ sort: 'popular', limit: 10 }), []);
  const newParams = useMemo(() => ({ sort: 'latest', limit: 8 }), []);

  const { data: featuredData, loading: featuredLoading, error: featuredError } = useWorks(featuredParams);
  const { data: hotData, loading: hotLoading, error: hotError } = useWorks(hotParams);
  const { data: newData, loading: newLoading, error: newError } = useWorks(newParams);

  const featuredWorks = featuredData?.items ?? [];
  const hotWorks = hotData?.items ?? [];
  const newWorks = newData?.items ?? [];

  const handleGenreClick = (genre: string | null) => {
    if (genre) {
      router.push(`/explore?genre=${genre}`);
    } else {
      router.push('/explore');
    }
  };

  const isInitialLoading = featuredLoading && hotLoading && newLoading;
  const allError = featuredError && hotError && newError;

  if (isInitialLoading) {
    return (
      <HomeWrapper>
        <Loading />
      </HomeWrapper>
    );
  }

  if (allError) {
    return (
      <HomeWrapper>
        <ContentArea>
          <Section style={{ marginTop: '2rem' }}>
            <ErrorBox>
              <ErrorText>{featuredError.message}</ErrorText>
            </ErrorBox>
          </Section>
        </ContentArea>
      </HomeWrapper>
    );
  }

  return (
    <HomeWrapper>
      {!featuredError && <HeroBanner works={featuredWorks} />}

      <ContentArea>
        <GenreQuickAccess>
          <GenreTabBar selectedGenre={null} onGenreChange={handleGenreClick} />
        </GenreQuickAccess>

        <Section>
          {hotLoading ? (
            <Loading />
          ) : hotError ? (
            <ErrorBox><ErrorText>{hotError.message}</ErrorText></ErrorBox>
          ) : (
            <WorkCardList
              title="지금 핫한 작품"
              works={hotWorks}
              moreLink="/explore?sort=popular"
            />
          )}
        </Section>

        <NewWorksSection>
          <SectionTitle title="신작 연재" moreLink="/explore?sort=latest" />
          {newLoading ? (
            <Loading />
          ) : newError ? (
            <ErrorBox><ErrorText>{newError.message}</ErrorText></ErrorBox>
          ) : (
            <WorkGrid works={newWorks} />
          )}
        </NewWorksSection>

        <RankingSection />
      </ContentArea>
    </HomeWrapper>
  );
}
