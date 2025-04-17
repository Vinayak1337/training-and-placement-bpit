import { redirect } from 'next/navigation';
import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';

export default async function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode;
}>) {
	const session = await getServerSession(authOptions);
	if (session) return redirect('/');

	return <>{children}</>;
}
