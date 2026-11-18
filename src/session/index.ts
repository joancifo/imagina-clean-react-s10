// API pública del slice Sesión.
export type { SessionGateway, SessionUser } from './port';
export { createHttpSessionGateway } from './http-session-gateway';
export { createInMemorySessionGateway } from './in-memory-session-gateway';
export { SessionProvider, useSession, useSignIn, type Session } from './SessionProvider';
export { SignInBar } from './SignInBar';
