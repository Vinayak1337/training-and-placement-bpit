import { notFound } from 'next/navigation';
import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default async function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode;
}>) {
	const session = await getServerSession(authOptions);
	if (session && session.user.role !== 'coordinator') return notFound();

	return (
		<div className='flex min-h-screen w-full flex-col bg-muted/40'>
			<Sidebar />
			<div className='flex flex-col sm:gap-4 sm:py-4 sm:pl-60'>
				<Header />
				<div className='flex-1 p-4 sm:px-6 sm:py-0'>{children}</div>
			</div>
		</div>
	);
}
