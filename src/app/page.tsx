"use client";

import { Suspense, useState, useEffect } from "react";
import dynamic from "next/dynamic";

const ModelViewer = dynamic(
  () => import("./components/ModelViewer"),
  { ssr: false }
);

export default function Home() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // ローカルストレージからテーマを読み込む
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={`flex min-h-screen flex-col items-center justify-between p-8 bg-white dark:bg-gray-900 transition-colors duration-200`}>
      <header className="w-full text-center relative">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">3Dモデルビューアー</h1>
        <button
          onClick={toggleTheme}
          className="absolute right-0 top-0 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="テーマ切り替え"
        >
          {theme === 'light' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )}
        </button>
      </header>

      <main className="flex-1 w-full max-w-4xl flex flex-col items-center justify-center gap-8 my-8">
        <div className="w-full aspect-square bg-gray-50 dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-gray-700 dark:text-gray-300">Loading...</div>}>
            <ModelViewer />
          </Suspense>
        </div>
      </main>

      <footer className="w-full text-center text-sm text-gray-500 dark:text-gray-400">
        <p>※ GLBファイルをアップロードしてください</p>
      </footer>
    </div>
  );
}
