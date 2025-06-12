import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/app/ThemeProvider"
import Footer from "@/components/Footer";
import Header from "@/components/Header/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sidney Kaguli | Portfolio",
  description: "Full-stack web developer with a focus on remote work",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider 
          attribute="class" 
          defaultTheme="system" 
          enableSystem 
          disableTransitionOnChange
        >
          <main className="pb-8 min-h-screen bg-orange-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-300 break-words leading-6 transition-colors duration-500">
            <Header />
            <div className="px-5 pt-14 mx-auto max-w-3xl">
              {children}
            </div>
            <Footer />
          </main>
        </ThemeProvider>
      </body> 
    </html>
  );
}