import type { enGB } from './enGB.ts';

type Widen<T> = T extends string ? string : T extends ReadonlyArray<infer U> ? ReadonlyArray<Widen<U>> : { readonly [K in keyof T]: Widen<T[K]> };

/** Every locale's dictionary has exactly the shape of the British English one. */
export type Dictionary = Widen<typeof enGB>;
