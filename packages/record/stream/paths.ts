const pad = (seq: number): string => String(seq).padStart(9, '0');

/** Document paths of a stream under `root` (for example `orgs/demo`). Fact ids sort like their numbers. */
export const streamPaths = {
  streams: (root: string) => `${root}/streams`,
  head: (root: string, stream: string) => `${root}/streams/${stream}`,
  log: (root: string, stream: string) => `${root}/streams/${stream}/log`,
  fact: (root: string, stream: string, seq: number) => `${root}/streams/${stream}/log/${pad(seq)}`,
};
