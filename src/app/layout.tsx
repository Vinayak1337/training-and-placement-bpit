import type { Metadata } from 'next';
import { Inter, Roboto_Mono } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/providers/theme-provider';
import { Toaster } from 'react-hot-toast';
import QueryProvider from '@/providers/query-provider';
import AuthProvider from '@/providers/auth-provider';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

const inter = Inter({
	subsets: ['latin'],
	variable: '--font-sans'
});

const mono = Roboto_Mono({
	subsets: ['latin'],
	variable: '--font-mono'
});

export const metadata: Metadata = {
	title: 'T&P Cell Dashboard',
	description: 'Training and Placement Cell Management Dashboard'
};

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang='en'
			className={`${inter.variable} ${mono.variable}`}
			suppressHydrationWarning>
			<body
				className={cn(
					'min-h-screen font-sans antialiased bg-background h-full flex flex-col'
				)}>
				<AuthProvider>
					<ThemeProvider attribute='class' defaultTheme='system' enableSystem>
						<QueryProvider>
							<div className='flex min-h-screen w-full flex-col bg-muted/40'>
								<Sidebar />
								<div className='flex flex-col sm:gap-4 sm:py-4 sm:pl-60'>
									<Header />
									<main className='flex-1 p-4 sm:px-6 sm:py-0'>{children}</main>
								</div>
							</div>
							<Toaster position='top-right' />
						</QueryProvider>
					</ThemeProvider>
				</AuthProvider>
			</body>
		</html>
	);
}
