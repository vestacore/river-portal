/**
 * A call from one function of the river to another, as that function's own identity: the door from
 * the cabinets, a bank from the clock. Tests hand in their own.
 */
export type FunctionCall = (url: string, request: { headers: Record<string, string>; body: string }) => Promise<{ status: number; body: string }>;
