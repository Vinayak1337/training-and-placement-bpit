import Header from '@/components/layout/Header';
import StudentSidebar from '@/components/layout/StudentSidebar';
import { authOptions } from '@/lib/auth-options';
import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
	title: 'Student Dashboard - T&P Cell',
	description: 'Student Dashboard for Training and Placement Cell'
};

export default async function StudentDashboardLayout({
	children
}: {
	children: React.ReactNode;
}) {
	const session = await getServerSession(authOptions);
	if (session && session.user.role !== 'student') return notFound();

	return (
		<div className='flex min-h-screen w-full flex-col bg-muted/40'>
			<StudentSidebar />
			<div className='flex flex-col sm:gap-4 sm:py-4 sm:pl-60'>
				<Header />
				<div className='flex-1 p-4 sm:px-6 sm:py-0'>{children}</div>
			</div>
		</div>
	);
}
