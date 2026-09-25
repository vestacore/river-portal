/** Which surface this process serves (ADR-0010). `local` enables both with a development identity. */
export const surfaces = ['public', 'studio', 'local'] as const;
export type Surface = (typeof surfaces)[number];
