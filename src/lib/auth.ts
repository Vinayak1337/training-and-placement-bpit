import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ALGORITHM = 'HS256';

interface UserPayload extends jose.JWTPayload {
	userId: string | number;
	email: string;
	role: 'coordinator' | 'student';
	// Add other potential claims like name if included in the token
}

interface AuthResult {
	user: UserPayload | null;
	error?: string;
}

let secretKey: Uint8Array | null = null;
if (JWT_SECRET) {
	secretKey = new TextEncoder().encode(JWT_SECRET);
} else {
	console.error(
		'CRITICAL: JWT_SECRET environment variable is not defined. Authentication is disabled.'
	);
}

/**
 * Verifies the provided JWT token string.
 * @param token The JWT string from the auth_token cookie.
 * @returns An object containing the user payload if verification is successful,
 *          or an error message if verification fails or the token is missing.
 */
export async function verifyAuth(
	token: string | undefined
): Promise<AuthResult> {
	if (!secretKey) {
		return { user: null, error: 'Authentication system misconfigured.' };
	}

	// Check if the token was provided
	if (!token) {
		return { user: null, error: 'Missing authentication token.' };
	}

	try {
		const { payload } = await jose.jwtVerify<UserPayload>(token, secretKey, {
			algorithms: [JWT_ALGORITHM]
			// issuer: 'urn:example:issuer',
			// audience: 'urn:example:audience',
		});

		if (!payload.userId || !payload.role) {
			console.error('Invalid token payload structure:', payload);
			return { user: null, error: 'Invalid token payload.' };
		}

		return { user: payload };
	} catch (error) {
		if (error instanceof jose.errors.JWTExpired) {
			return { user: null, error: 'Token expired.' };
		} else if (error instanceof jose.errors.JOSEError) {
			console.error('JWT Verification Error:', error.message, error.code);
			return { user: null, error: 'Invalid or malformed token.' };
		} else {
			console.error('Unexpected Error during Auth Verification:', error);
			return { user: null, error: 'Authentication verification failed.' };
		}
	}
}
