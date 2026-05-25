import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/features/auth/mockAuth";
import { NavigationProvider } from "@/features/auth/navigation";

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
  title: "COMPSSA Election Platform",
  description: "Digital voting system for the COMPSSA department.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full antialiased", spaceGrotesk.variable, jetbrainsMono.variable)}
    >
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>
          <NavigationProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </NavigationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
