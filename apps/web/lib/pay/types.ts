/** Who is acting in a merchant or payer cabinet. `ref` is what enters the streams: a merchant id or a payer handle. */
export type PayActor = { role: 'merchant' | 'payer'; ref: string; name: string; personaId: string };

/** A steward of the payment river: staff with the Finance Steward or Administrator role act; an Auditor only reads. */
export type PayOperator = { id: string; name: string; canAct: boolean };

/** Form state of the merchant's "ask for a payment" form. The pay link is returned once and never stored. */
export type PlaceState = { placed: { orderId: string; payPath: string } | null; errors: Record<string, string>; values: Record<string, string> };
