// [board]/[class]/[subject]/[chapter]/q/[questionId]/page.tsx

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function QuestionPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    // Construct the main chapter URL with the question ID as a query parameter
    const chapterUrl = `/${params.board}/${params.class}/${params.subject}/${params.chapter}?q=${params.questionId}`;
    
    // Replace the current URL without adding to history stack
    router.replace(chapterUrl);
  }, [params, router]);

  return null; // This component only handles redirection
}