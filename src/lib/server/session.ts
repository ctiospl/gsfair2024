import { db } from './db.js';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import { sha256 } from '@oslojs/crypto/sha2';
import type { RequestEvent } from '@sveltejs/kit';

export function generateSessionToken(): string {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	const token = encodeBase32LowerCaseNoPadding(bytes);
	return token;
}

export async function createSession(token: string, userId: string): Session {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: Session = {
		id: sessionId,
		userId,
		expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30
	};
	await db
		.insertInto('user_session')
		.values({
			id: session.id,
			user_id: session.userId,
			expires_at: session.expiresAt
		})
		.execute();
	return session;
}

export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const row = await db
		.selectFrom('user_session')
		.innerJoin('users', 'user.id', 'user_session.user_id')
		.select(['user_session.id', 'user_session.user_id', 'user_session.expires_at', 'users.id'])
		.where('id', '=', sessionId)
		.execute();

	if (row === null) {
		return { session: null, user: null };
	}
	const session: Session = {
		id: row.id,
		userId: row.user_id,
		expiresAt: row.expires_at * 1000
	};
	const user: User = {
		id: row.id
	};
	if (Date.now() >= session.expiresAt.getTime()) {
		await db.deleteFrom('user_session').where('id', '=', session.id).execute();
		return null;
	}
	if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
		session.expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30;
		await db
			.updateTable('user_session')
			.set({
				expires_at: Math.floor(session.expiresAt / 1000)
			})
			.where('id', '=', session.id);
	}
	return { session, user };
}

export async function invalidateSession(sessionId: string): Promise<void> {
	await db.deleteFrom('user_session').where('id', '=', sessionId).execute();
}

export async function invalidateAllSessions(): Promise<void> {
	await db.deleteFrom('user_session').execute();
}

export type SessionValidationResult =
	| { session: Session; user: User }
	| { session: null; user: null };

export interface Session {
	id: string;
	userId: string;
	expiresAt: number;
}

export interface User {
	id: string;
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void {
	event.cookies.set('session', token, {
		httpOnly: true,
		sameSite: 'lax',
		expires: expiresAt,
		path: '/'
	});
}

export function deleteSessionTokenCookie(event: RequestEvent): void {
	event.cookies.set('session', '', {
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 0,
		path: '/'
	});
}
