'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
	const router = useRouter();
	const { isAuthenticated, user, isLoading } = useAuth();

	useEffect(() => {
		if (isLoading) return;

		if (isAuthenticated) {
			if (user?.role === 'coordinator') {
				router.push('/dashboard');
			} else if (user?.role === 'student') {
				router.push('/student-dashboard');
			}
		} else {
			router.push('/login');
		}
	}, [isAuthenticated, user, isLoading, router]);

	return (
		<div className='flex flex-col items-center justify-center min-h-screen'>
			<h1 className='text-2xl font-semibold mb-4'>
				Training & Placement Portal
			</h1>
			<p className='text-muted-foreground'>
				Redirecting to appropriate page...
			</p>
		</div>
	);
}
