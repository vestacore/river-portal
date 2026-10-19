const pad = (seq: number): string => String(seq).padStart(9, '0');

/** Where the wave keeps what is not the stream itself: listener states, act markers and the outbox. */
export const figurePaths = {
  state: (root: string, stream: string) => `${root}/streams/${stream}/figure/state`,
  act: (root: string, stream: string, key: string) => `${root}/streams/${stream}/acts/${key}`,
  outbox: (root: string, controller: string) => `${root}/outbox/${controller}/intentions`,
  intention: (root: string, controller: string, stream: string, seq: number) => `${root}/outbox/${controller}/intentions/${stream}-${pad(seq)}`,
};
