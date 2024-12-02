import { Analytics } from "@vercel/analytics/react";
import { GeistSans } from "geist/font/sans";
import { Toaster } from "sonner";

import "./globals.css";

import { ThemeProvider } from "@/components/custom/theme-provider";

export const metadata = {
  title: "AI Travel Assistant",
  description: "Your personal AI travel assistant powered by Claude and Amadeus",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={GeistSans.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="bottom-right" />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
