// frontend/app/types/progress.ts

export interface ChapterProgress {
    attempted: number;    
    total: number;       
    averageScore: number; 
  }
  
  export interface SubjectProgress {
    [chapterNumber: string]: ChapterProgress;
  }
  
  export interface UserProgress {
    [subject: string]: SubjectProgress;
  }