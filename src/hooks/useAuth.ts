'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';


export type UserRole = 'coordinator' | 'student';

/**
 * Custom hook for handling authentication state
 */
export function useAuth() {
	const { data: session, status } = useSession();
	const router = useRouter();

	
	const isLoading = status === 'loading';
	
	const isAuthenticated = status === 'authenticated';
	
	const user = session?.user;

	/**
	 * Handle coordinator login
	 */
	const loginCoordinator = async (email: string, password: string) => {
		try {
			const result = await signIn('coordinator-login', {
				email,
				password,
				redirect: false
			});

			return result;
		} catch (error) {
			console.error('Coordinator login error:', error);
			throw error;
		}
	};

	/**
	 * Handle student login
	 */
	const loginStudent = async (student_id: string, password: string) => {
		try {
			const result = await signIn('student-login', {
				student_id,
				password,
				redirect: false
			});

			return result;
		} catch (error) {
			console.error('Student login error:', error);
			throw error;
		}
	};

	/**
	 * Handle logout
	 */
	const logout = async () => {
		try {
			await signOut({ redirect: false });
			router.push('/login');
		} catch (error) {
			console.error('Logout error:', error);
		}
	};

	/**
	 * Get user ID for the current session
	 */
	const getUserId = (): string | null => {
		if (isAuthenticated && user) {
			return user.id;
		}
		return null;
	};

	/**
	 * Check if current user has a specific role
	 */
	const hasRole = (role: UserRole): boolean => {
		return isAuthenticated && user?.role === role;
	};

	
	return {
		session,
		isLoading,
		isAuthenticated,
		user,
		loginCoordinator,
		loginStudent,
		logout,
		getUserId,
		hasRole
	};
}
