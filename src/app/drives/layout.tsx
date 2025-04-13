import StudentSidebar from '@/components/layout/StudentSidebar';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Placement Drives - T&P Cell',
	description: 'Placement Drives for Students'
};

export default function DrivesLayout({
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
