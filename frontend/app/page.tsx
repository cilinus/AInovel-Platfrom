import Header from '@/src/components/Layout/Header';
import Footer from '@/src/components/Layout/Footer';
import HomeContent from '@/src/components/home/HomeContent';

export default function HomePage() {
  return (
    <>
      <Header />
      <main id="main-content" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <HomeContent />
      </main>
      <Footer />
    </>
  );
}
