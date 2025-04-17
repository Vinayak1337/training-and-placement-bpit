import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';

export default async function Home() {
	const session = await getServerSession(authOptions);
	if (!session) return redirect('/login');

	if (session.user.role === 'coordinator') return redirect('/dashboard');

	return redirect('/profile');
}
