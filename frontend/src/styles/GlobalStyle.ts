import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    font-family: ${({ theme }) => theme.fonts.sans};
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.foreground};
    min-height: 100vh;
    line-height: 1.5;
    padding:
      env(safe-area-inset-top)
      env(safe-area-inset-right)
      env(safe-area-inset-bottom)
      env(safe-area-inset-left);
  }

  a {
    color: inherit;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  nav a,
  header a {
    &:hover {
      text-decoration: none;
    }
  }

  button {
    cursor: pointer;
    border: none;
    background: none;
    font: inherit;
  }

  button, a, [tabindex] {
    &:focus-visible {
      outline: 2px solid ${({ theme }) => theme.colors.primary};
      outline-offset: 2px;
    }
  }

  button, a, input, textarea, select {
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }

  input, textarea, select {
    font: inherit;
  }

  img {
    max-width: 100%;
    display: block;
  }

  :root {
    --reader-font-size: 16px;
    --reader-line-height: 1.8;
    --reader-font-family: 'Noto Serif KR', serif;
    --reader-bg: #ffffff;
    --reader-text: #1a1a1a;
  }

  html[data-theme='dark'] {
    --reader-bg: #1a1a2e;
    --reader-text: #e2e8f0;
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`;
