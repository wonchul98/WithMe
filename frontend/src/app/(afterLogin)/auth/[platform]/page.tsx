'use client';
import { useUserRepoQuery } from '@/stores/server/getUserRepoQuery';
import { useUserSyncQuery } from '@/stores/server/getUserSyncQuery';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home({ params }) {
  const router = useRouter();
  const { platform } = params;

  const [isCookieSet, setIsCookieSet] = useState(false);
  const { data: repoData, isSuccess: rePoSuccess } = useUserRepoQuery(isCookieSet);
  const { data: syncData, isSuccess: syncSuccess, refetch } = useUserSyncQuery();

  const handleCallback = async () => {
    const code = new URLSearchParams(window.location.search).get('code');
    const state = new URLSearchParams(window.location.search).get('state');
    if (!code || !state) return;

    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/login/oauth2/code/github?code=${code}&state=${state}`,
        { headers: { 'Content-Type': 'application/json' } },
      );
      if (response.data) {
        document.cookie = `userData=${encodeURIComponent(JSON.stringify(response.data))}; path=/;`;
        await refetch();
        setIsCookieSet(true);
      }
    } catch (error) {
      router.push('/');
    }
  };

  useEffect(() => {
    if (rePoSuccess) {
      router.push('/workspace');
    }
  }, [rePoSuccess]);

  useEffect(() => {
    handleCallback();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 ">
      {platform === 'github' ? (
        <svg className="mb-[20px]" xmlns="http://www.w3.org/2000/svg" width="30%" height="30%" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
      ) : (
        <svg
          height="30%"
          viewBox="0 0 256 236"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMinYMin meet"
          className="flex items-center justify-center w-auto mb-[20px]"
        >
          <path d="M128.075 236.075l47.104-144.97H80.97l47.104 144.97z" fill="#E24329" />
          <path d="M128.075 236.074L80.97 91.104H14.956l113.119 144.97z" fill="#FC6D26" />
          <path
            d="M14.956 91.104L.642 135.16a9.752 9.752 0 0 0 3.542 10.903l123.891 90.012-113.12-144.97z"
            fill="#FCA326"
          />
          <path d="M14.956 91.105H80.97L52.601 3.79c-1.46-4.493-7.816-4.492-9.275 0l-28.37 87.315z" fill="#E24329" />
          <path d="M128.075 236.074l47.104-144.97h66.015l-113.12 144.97z" fill="#FC6D26" />
          <path
            d="M241.194 91.104l14.314 44.056a9.752 9.752 0 0 1-3.543 10.903l-123.89 90.012 113.119-144.97z"
            fill="#FCA326"
          />
          <path d="M241.194 91.105h-66.015l28.37-87.315c1.46-4.493 7.816-4.492 9.275 0l28.37 87.315z" fill="#E24329" />
        </svg>
      )}

      <div className="w-24 h-24 border-8 border-gray-300 border-t-black rounded-full animate-spin "></div>
      <p className="text-3xl font-bold text-black mt-[30px]">로그인 중입니다...</p>
    </div>
  );
}
