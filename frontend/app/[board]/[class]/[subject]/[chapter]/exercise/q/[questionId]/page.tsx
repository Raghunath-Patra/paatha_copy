// frontend/app/[board]/[class]/[subject]/[chapter]/exercise/q/[questionId]/page.tsx

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ExerciseQuestionPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    // Construct the exercise URL with the question ID as a query parameter
    const exerciseUrl = `/${params.board}/${params.class}/${params.subject}/${params.chapter}/exercise?q=${params.questionId}`;
    
    // Replace the current URL without adding to history stack
    router.replace(exerciseUrl);
  }, [params, router]);

  return null; // This component only handles redirection
}