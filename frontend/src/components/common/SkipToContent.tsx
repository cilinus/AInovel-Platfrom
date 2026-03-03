'use client';

import styled from 'styled-components';

const SkipLink = styled.a`
  position: absolute;
  left: -9999px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
  z-index: 9999;
  padding: 8px 16px;
  background: ${({ theme }) => theme.colors.primary};
  color: #ffffff;
  border-radius: 4px;
  text-decoration: none;
  font-size: 0.875rem;

  &:focus {
    position: fixed;
    left: 8px;
    top: 8px;
    width: auto;
    height: auto;
    overflow: visible;
  }
`;

export default function SkipToContent() {
  return <SkipLink href="#main-content">본문으로 건너뛰기</SkipLink>;
}
