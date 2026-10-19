/** A request to one function of the river, free of any server library. Header names are lower-case. */
export type FunctionRequest = {
  method: string;
  path: string;
  headers: Readonly<Record<string, string | undefined>>;
  body: string;
};
