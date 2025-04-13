import StudentSidebar from '@/components/layout/StudentSidebar';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Student Dashboard - T&P Cell',
	description: 'Student Dashboard for Training and Placement Cell'
};

export default function StudentDashboardLayout({
	children
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			<StudentSidebar />
			<div className='container mx-auto py-4 px-4 sm:px-6 lg:px-8'>
				{children}
			</div>
		</>
	);
}
