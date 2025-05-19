// app/try/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Paaṭha AI - 3-Question Challenge',
  description: 'Take our 3-question challenge and discover your learning strengths in just 60 seconds!',
  openGraph: {
    title: 'Paaṭha AI - Take the 3-Question Challenge!',
    description: 'Test your knowledge with our 3-question challenge and discover your strengths and areas for improvement.',
    images: [
      {
        url: 'https://www.paatha.ai/images/og-challenge.png',
        width: 1200,
        height: 630,
        alt: 'Paaṭha AI Challenge',
      },
    ],
  },
};

export default function TryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}