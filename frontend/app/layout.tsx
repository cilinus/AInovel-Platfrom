import type { Metadata, Viewport } from 'next';
import StyledComponentsRegistry from '@/src/lib/registry';
import ThemeProvider from '@/src/providers/ThemeProvider';
import SkipToContent from '@/src/components/common/SkipToContent';
import AuthInitializer from '@/src/components/auth/AuthInitializer';
import { notoSerifKR } from '@/src/lib/fonts';
import { themeInitScript } from '@/src/lib/theme-script';

export const metadata: Metadata = {
  title: {
    default: 'AINovel - AI가 만드는 무한한 이야기',
    template: '%s | AINovel',
  },
  description: 'AI 기술로 생성된 소설을 즐기고, 직접 창작하세요. 로맨스, 판타지, 무협 등 다양한 장르.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: ThemeProvider dynamically sets color-scheme on <html>,
    // causing server/client mismatch. This is intentional for theme hydration.
    <html lang="ko" className={notoSerifKR.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
        <link
          rel="dns-prefetch"
          href="https://cdn.jsdelivr.net"
        />
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>
        <StyledComponentsRegistry>
          <ThemeProvider>
            <SkipToContent />
            <AuthInitializer />
            {children}
          </ThemeProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
