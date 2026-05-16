import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Debug Trainer',
  description: 'Java/Spring 실무 버그 디버깅 학습 플랫폼',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
