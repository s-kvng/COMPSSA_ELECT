import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { AuthProvider } from "@/shared/auth";
import { NavigationProvider } from "@/features/auth/navigation";
import RouteGuard from "@/components/RouteGuard";
import { ConvexClientProvider } from "@/app/ConvexClientProvider";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KTU COMPSSA Election Platform",
  description: "Digital voting system for the KTU COMPSSA department.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html
        lang="en"
        className={cn(
          "h-full antialiased",
          spaceGrotesk.variable,
          jetbrainsMono.variable,
        )}
      >
        <body className="min-h-full flex flex-col font-sans">
          <ConvexClientProvider>
            <AuthProvider>
              <NavigationProvider>
                <TooltipProvider>
                  <RouteGuard>{children}</RouteGuard>
                </TooltipProvider>
              </NavigationProvider>
            </AuthProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
