'use client';

import { useState, useEffect } from 'react';
import Sidebar from "@/components/Sidebar"

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {isMounted && (
        <>
          {/* Desktop sidebar - fixed */}
          <div className="hidden md:flex md:w-64 md:flex-col md:flex-shrink-0">
            <Sidebar />
          </div>
          {/* Mobile/Tablet overlay */}
          <div className="md:hidden fixed inset-0 z-30 overflow-hidden hidden peer-checked:flex">
            <Sidebar />
          </div>
        </>
      )}
      {/* Main content area */}
      <main className="flex-1 overflow-auto flex flex-col">
        {children}
      </main>
    </div>
  )
}
