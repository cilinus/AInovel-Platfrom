'use client';

import Header from '@/src/components/Layout/Header';
import Footer from '@/src/components/Layout/Footer';
import MyPageContent from '@/src/components/my/MyPageContent';

export default function MyPage() {
  return (
    <>
      <Header />
      <main id="main-content" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <MyPageContent />
      </main>
      <Footer />
    </>
  );
}
