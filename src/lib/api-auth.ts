import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { JWT } from 'next-auth/jwt';

export type AppRole = 'coordinator' | 'student';

const UNAUTHORIZED = { message: 'Authentication required' };
const FORBIDDEN = { message: 'You do not have permission to perform this action' };

export async function getApiToken(request: Request | NextRequest) {
	return getToken({ req: request as NextRequest });
}

export function unauthorizedResponse(message = UNAUTHORIZED.message) {
	return NextResponse.json({ message }, { status: 401 });
}

export function forbiddenResponse(message = FORBIDDEN.message) {
	return NextResponse.json({ message }, { status: 403 });
}

export async function requireRole(
	request: Request | NextRequest,
	roles: AppRole | AppRole[]
): Promise<JWT | NextResponse> {
	const allowedRoles = Array.isArray(roles) ? roles : [roles];
	const token = await getApiToken(request);

	if (!token) return unauthorizedResponse();
	if (!allowedRoles.includes(token.role as AppRole)) return forbiddenResponse();

	return token;
}

export async function requireAnyUser(request: Request | NextRequest) {
	return requireRole(request, ['coordinator', 'student']);
}

export async function requireCoordinator(request: Request | NextRequest) {
	return requireRole(request, 'coordinator');
}

export function isAuthResponse(value: JWT | NextResponse): value is NextResponse {
	return value instanceof Response;
}

export function canAccessStudent(token: JWT, studentId: string) {
	return token.role === 'coordinator' || token.id === studentId;
}

export function isCoordinator(token: JWT) {
	return token.role === 'coordinator';
}
