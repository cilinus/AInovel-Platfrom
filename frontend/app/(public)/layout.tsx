import Header from '@/src/components/Layout/Header';
import Footer from '@/src/components/Layout/Footer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main-content" style={{ minHeight: 'calc(100vh - 64px)' }}>
        {children}
      </main>
      <Footer />
    </>
  );
}
