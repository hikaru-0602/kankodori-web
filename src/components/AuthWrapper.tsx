'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/firebase/context/auth';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    console.log('AuthWrapper - Auth state:', { user, isLoading, pathname });

    if (!isLoading) {
      if (!user && !isLoginPage) {
        // 未認証でログインページ以外にいる場合 → ログインページへ
        console.log('Redirecting to login...');
        router.push('/login');
      } else if (user && isLoginPage) {
        // 認証済みでログインページにいる場合 → ホームページへ
        console.log('Redirecting to home...');
        router.push('/');
      }
    }
  }, [user, isLoading, isLoginPage, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin h-10 w-10 text-indigo-600 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-4 text-gray-600">認証を確認中...</p>
        </div>
      </div>
    );
  }

  // 認証状態とページが一致しない場合は何も表示しない（リダイレクト中）
  if ((!user && !isLoginPage) || (user && isLoginPage)) {
    return null;
  }

  return <>{children}</>;
}
