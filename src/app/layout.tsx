import type { Metadata } from 'next';
import { Inter, Roboto_Mono } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/providers/theme-provider';
import QueryProvider from '@/providers/query-provider';
import AuthProvider from '@/providers/auth-provider';
import { Toaster } from 'react-hot-toast';

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

export default async function RootLayout({
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
							<main>{children}</main>
							<Toaster position='top-right' />
						</QueryProvider>
					</ThemeProvider>
				</AuthProvider>
			</body>
		</html>
	);
}
