'use client';

import { useMe } from '@/src/hooks/useAuth';

export default function AuthInitializer() {
  useMe();
  return null;
}
