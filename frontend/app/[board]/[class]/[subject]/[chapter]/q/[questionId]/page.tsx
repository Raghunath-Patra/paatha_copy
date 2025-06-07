// [board]/[class]/[subject]/[chapter]/q/[questionId]/page.tsx
// Updated to handle both exercise and section question redirects

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function QuestionPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    // Try to determine if this is a section question or exercise question
    // This can be done by checking the question ID format or making an API call
    // For now, we'll default to exercise questions (entire chapter)
    
    const chapterUrl = `/${params.board}/${params.class}/${params.subject}/${params.chapter}/exercise?q=${params.questionId}`;
    
    // Replace the current URL without adding to history stack
    router.replace(chapterUrl);
  }, [params, router]);

  return null; // This component only handles redirection
}