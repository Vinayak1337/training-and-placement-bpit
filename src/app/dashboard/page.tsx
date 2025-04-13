'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

/**
 * Main coordinator dashboard redirects to admin dashboard
 * This serves as a landing page for coordinators after login
 */
export default function Dashboard() {
	const router = useRouter();
	const { isAuthenticated, user, isLoading } = useAuth();

	useEffect(() => {
		if (isLoading) return;

		if (isAuthenticated && user?.role === 'coordinator') {
			router.push('/admin-dashboard');
		} else if (isAuthenticated && user?.role === 'student') {
			router.push('/student-dashboard');
		} else if (!isAuthenticated) {
			router.push('/login');
		}
	}, [isAuthenticated, user, isLoading, router]);

	
	return (
		<div className='flex flex-col items-center justify-center min-h-screen'>
			<h1 className='text-2xl font-semibold mb-4'>
				Training & Placement Portal
			</h1>
			<p className='text-muted-foreground'>Redirecting to dashboard...</p>
		</div>
	);
}
