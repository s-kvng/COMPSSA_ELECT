/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import { useRouter, useParams as useNextParams } from 'next/navigation';
import React, { useContext, createContext } from 'react';

interface NavigationContextType {
  path: string;
  params: Record<string, string>;
  navigateTo: (newPath: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

// Helper to parse dynamic route parameters for Next.js
export function parseRoute(currentPath: string) {
  const cleanPath = currentPath.split('?')[0];
  const params: Record<string, string> = {};

  if (cleanPath.startsWith('/vote/') && cleanPath.split('/').length === 3) {
    const parts = cleanPath.split('/');
    params.categoryId = parts[2];
  } else if (cleanPath.startsWith('/admin/elections/') && cleanPath.endsWith('/live')) {
    const parts = cleanPath.split('/');
    params.id = parts[3];
  } else if (cleanPath.startsWith('/admin/elections/') && cleanPath.split('/').length === 4) {
    const parts = cleanPath.split('/');
    params.id = parts[3];
  } else if (cleanPath.startsWith('/admin/elections/') && cleanPath.split('/').length === 3) {
    const parts = cleanPath.split('/');
    params.id = parts[2];
  } else if (cleanPath.startsWith('/results/') && cleanPath.split('/').length === 3) {
    const parts = cleanPath.split('/');
    params.electionId = parts[2];
  }

  return params;
}

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const nextParams = useNextParams();

  const navigateTo = (newPath: string) => {
    const formattedPath = newPath.startsWith('/') ? newPath : `/${newPath}`;
    router.push(formattedPath);
  };

  // Convert Next.js params to match old structure
  const params = Object.fromEntries(
    Object.entries(nextParams as Record<string, string | string[]>).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ])
  );

  return (
    <NavigationContext.Provider value={{ path: '', params, navigateTo }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  const router = useRouter();
  const nextParams = useNextParams();

  // If not in provider, create a fallback
  if (!context) {
    const params = Object.fromEntries(
      Object.entries(nextParams as Record<string, string | string[]>).map(([key, value]) => [
        key,
        Array.isArray(value) ? value[0] : value,
      ])
    );

    return {
      path: '',
      params,
      navigateTo: (path: string) => {
        const formattedPath = path.startsWith('/') ? path : `/${path}`;
        router.push(formattedPath);
      },
    };
  }

  return context;
}

