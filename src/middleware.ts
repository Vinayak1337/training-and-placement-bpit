import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PUBLIC_PATHS = ['/', '/login', '/student-login', '/setup'];

const API_PUBLIC_PATHS = [
	'/api/auth',
	'/api/coordinators/seed',
	'/api/students/seed'
];

const STUDENT_ALLOWED_PATHS = [
	'/student-dashboard',
	'/drives',
	'/api/students',
	'/api/drives',
	'/api/placements',
	'/api/resume'
];

const STATIC_PATHS = ['/_next', '/favicon.ico', '/images', '/static'];

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	if (STATIC_PATHS.some(prefix => pathname.startsWith(prefix))) {
		return NextResponse.next();
	}

	if (PUBLIC_PATHS.includes(pathname)) {
		return NextResponse.next();
	}

	if (API_PUBLIC_PATHS.some(prefix => pathname.startsWith(prefix))) {
		return NextResponse.next();
	}

	const token = await getToken({ req: request });

	if (!token) {
		if (pathname.startsWith('/api/')) {
			return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' }
			});
		}
		const loginUrl = new URL('/login', request.url);
		loginUrl.searchParams.set('callbackUrl', pathname);
		return NextResponse.redirect(loginUrl);
	}

	const userRole = token.role as string;

	console.log("Logged in as", userRole);

	if (userRole === 'coordinator') {
		if (pathname === '/student-login') {
			return NextResponse.redirect(new URL('/admin-dashboard', request.url));
		}
	} else if (userRole === 'student') {
		// Only allow routes in STUDENT_ALLOWED_PATHS for students
		const isAllowed = STUDENT_ALLOWED_PATHS.some(prefix =>
			pathname.startsWith(prefix)
		);
		if (!isAllowed && pathname !== '/') {
			return NextResponse.redirect(new URL('/student-dashboard', request.url));
		}
		// Prevent students from accessing login or admin-dashboard
		if (pathname === '/login' || pathname.startsWith('/admin-dashboard')) {
			return NextResponse.redirect(new URL('/student-dashboard', request.url));
		}
	} else {
		return NextResponse.redirect(new URL('/login', request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		'/((?!api/auth/providers|_next/static|_next/image|favicon.ico|images/|static/).*)'
	]
};
