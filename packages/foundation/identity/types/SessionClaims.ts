/** What a signed demo session carries: the persona and when it was issued (seconds). */
export type SessionClaims = { personaId: string; iat: number };
