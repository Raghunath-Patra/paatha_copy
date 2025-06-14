// frontend/app/[board]/[class]/[subject]/[chapter]/[sectionNumber]/questions/q/[questionId]/page.tsx

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SectionQuestionPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    // Construct the section questions URL with the question ID as a query parameter
    const sectionQuestionsUrl = `/${params.board}/${params.class}/${params.subject}/${params.chapter}/${params.sectionNumber}/questions?q=${params.questionId}`;
    
    // Replace the current URL without adding to history stack
    router.replace(sectionQuestionsUrl);
  }, [params, router]);

  return null; // This component only handles redirection
}