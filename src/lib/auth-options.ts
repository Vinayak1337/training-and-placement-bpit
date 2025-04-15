import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { AuthOptions } from 'next-auth';

export const authOptions: AuthOptions = {
	providers: [
		CredentialsProvider({
			id: 'coordinator-login',
			name: 'Coordinator',
			credentials: {
				email: { label: 'Email', type: 'email' },
				password: { label: 'Password', type: 'password' }
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) {
					return null;
				}

				try {
					const coordinator = await prisma.coordinator.findUnique({
						where: { email: credentials.email }
					});

					if (!coordinator) {
						return null;
					}

					const isPasswordValid = await bcrypt.compare(
						credentials.password,
						coordinator.password_hash
					);

					if (!isPasswordValid) {
						return null;
					}

					return {
						id: coordinator.coordinator_id.toString(),
						email: coordinator.email,
						name: coordinator.name || coordinator.email.split('@')[0],
						role: 'coordinator'
					};
				} catch (error) {
					console.error('Coordinator authorization error:', error);
					return null;
				}
			}
		}),

		CredentialsProvider({
			id: 'student-login',
			name: 'Student',
			credentials: {
				student_id: { label: 'Student ID', type: 'text' },
				password: { label: 'Password', type: 'password' }
			},
			async authorize(credentials) {
				if (!credentials?.student_id || !credentials?.password) {
					return null;
				}

				try {
					const student = await prisma.student.findUnique({
						where: { student_id: credentials.student_id }
					});

					if (!student) {
						return null;
					}

					const isPasswordValid = await bcrypt.compare(
						credentials.password,
						student.password_hash
					);

					if (!isPasswordValid) {
						return null;
					}

					return {
						id: student.student_id,
						email: student.email,
						name: student.name,
						role: 'student'
					};
				} catch (error) {
					console.error('Student authorization error:', error);
					return null;
				}
			}
		})
	],
	pages: {
		signIn: '/login',
		error: '/login'
	},
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
				token.role = user.role;
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				session.user.id = token.id as string;
				session.user.role = token.role as string;
			}
			return session;
		}
	},
	session: {
		strategy: 'jwt',
		maxAge: 60 * 60 // 1 hour
	},
	cookies: {
    sessionToken: {
        name: `next-auth.session-token`,
        options: {
            httpOnly: process.env.NODE_ENV === 'production',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax',
            ...(process.env.NODE_ENV === 'production' && {
                domain: '.training-and-placement-bpit.vercel.app',
            })
        }
    },
    callbackUrl: {
        name: `next-auth.callback-url`,
        options: {
            httpOnly: process.env.NODE_ENV === 'production',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax',
            ...(process.env.NODE_ENV === 'production' && {
                domain: '.training-and-placement-bpit.vercel.app',
            })
        }
    },
    csrfToken: {
        name: `next-auth.csrf-token`,
        options: {
            httpOnly: process.env.NODE_ENV === 'production',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax',
            ...(process.env.NODE_ENV === 'production' && {
                domain: '.training-and-placement-bpit.vercel.app',
            })
        }
    }
},
	debug: true, // Enable debug logs for troubleshooting. Set to false in production once stable.
	secret: process.env.NEXTAUTH_SECRET
};
