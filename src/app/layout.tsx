import { Geist, Geist_Mono } from 'next/font/google';

import { Providers } from './providers';

import type { Metadata } from 'next';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin', 'cyrillic'],
});

export const metadata: Metadata = {
  title: {
    default: 'ГТД УЗ - Автоматизация таможенных деклараций',
    template: '%s | ГТД УЗ',
  },
  description:
    'Система автоматизации заполнения грузовых таможенных деклараций Узбекистана с использованием AI',
  keywords: ['ГТД', 'таможня', 'декларация', 'Узбекистан', 'автоматизация', 'AI'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
