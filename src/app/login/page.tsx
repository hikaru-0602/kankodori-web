'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/firebase/lib/auth';
import { useAuth } from '@/firebase/context/auth';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    console.log('Auth state changed:', { user, authLoading });
    if (!authLoading && user) {
      console.log('User is authenticated, redirecting to home...');
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleLogin = async () => {
    try {
      console.log('Starting login...');
      const result = await login();
      console.log('Login result:', result);
      if (result && result.user) {
        console.log('Login successful, waiting for auth state update...');
        // Auth state will update automatically via onAuthStateChanged
        // The useEffect above will handle the redirect
      }
    } catch (error) {
      console.error('ログインエラー:', error);
      alert('ログインに失敗しました。もう一度お試しください。');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-slate-900 relative overflow-hidden flex items-center justify-center">
      {/* 背景アニメーション */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/30 via-slate-800/20 to-gray-800/30 animate-pulse"></div>

      {/* グラデーション円 */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-indigo-600/20 to-violet-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="relative z-10 max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent pb-4">
            さあ、始めましょう
          </h1>
        </div>

        <div className="flex items-center justify-center">
          <Button
            onClick={handleLogin}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-6 px-12 text-2xl rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <span className="flex items-center justify-center gap-2">ログイン</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
