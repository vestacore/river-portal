/** A function's answer: a status and a small JSON body. A 5xx asks the messaging layer to deliver again. */
export type FunctionResponse = {
  status: number;
  body: Record<string, unknown>;
};
