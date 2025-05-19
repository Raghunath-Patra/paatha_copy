'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Navigation from './components/navigation/Navigation';
import { useSupabaseAuth } from './contexts/SupabaseAuthContext';
import Logo from './components/common/Logo';

interface ClassInfo {
  display_name: string;
}

interface Classes {
  [key: string]: ClassInfo;
}

interface Board {
  display_name: string;
  classes: Classes;
}

interface BoardStructure {
  [key: string]: Board;
}

interface BoardClassCardProps {
  board: string;
  displayName: string;
  classes: Classes;
  onClick: (board: string, classKey: string) => void;
}

const BoardClassCard: React.FC<BoardClassCardProps> = ({ board, displayName, classes, onClick }) => (
  <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
    <h2 className="text-xl font-medium text-neutral-900 mb-4">{displayName}</h2>
    <div className="space-y-3">
      {Object.entries(classes).map(([classKey, classInfo]) => (
        <button
          key={classKey}
          onClick={() => onClick(board, classKey)}
          className="w-full text-left px-4 py-2 rounded-lg hover:bg-neutral-50
                    transition-colors flex items-center justify-between group"
        >
          <span className="text-neutral-700 group-hover:text-neutral-900">
            {classInfo.display_name}
          </span>
          <span className="text-neutral-400 group-hover:text-neutral-700">›</span>
        </button>
      ))}
    </div>
  </div>
);

export default function HomePage() {
  const router = useRouter();
  const { profile } = useSupabaseAuth();
  
  const boardStructure: BoardStructure = {
    cbse: {
      display_name: "CBSE",
      classes: {
        viii: {
          display_name: "Class VIII"
        },
        ix: {
          display_name: "Class IX"
        },
        x: {
          display_name: "Class X"
        },
        xi: {
          display_name: "Class XI"
        },
        xii: {
          display_name: "Class XII"
        }
      }
    },
    karnataka: {
      display_name: "Karnataka State Board",
      classes: {
        "8th": {
          display_name: "8th Class"
        },
        "9th": {
          display_name: "9th Class"
        },
        "10th": {
          display_name: "10th Class"
        },
        "puc-1": {
          display_name: "PUC-I"
        },
        "puc-2": {
          display_name: "PUC-II"
        }
      }
    }
  };
  
  const handleClassSelect = (board: string, classLevel: string): void => {
    router.push(`/${board}/${classLevel}`);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <div className="container-fluid px-8 py-6">
        <div className="max-w-[1600px] mx-auto w-full">
          <div className="flex justify-end mb-4">
            <Navigation />
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              {/* Updated title section with SVG logo */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <Logo className="h-12 w-12" showText={false} />
                <h1 className="text-5xl font-bold bg-gradient-to-r from-teal-500 via-teal-400 to-cyan-400 bg-clip-text text-transparent inline-block">
                  Paaṭha AI
                </h1>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {Object.entries(boardStructure).map(([boardKey, board]) => (
                <BoardClassCard
                  key={boardKey}
                  board={boardKey}
                  displayName={board.display_name}
                  classes={board.classes}
                  onClick={handleClassSelect}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}