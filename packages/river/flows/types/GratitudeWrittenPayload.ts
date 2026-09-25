/**
 * Payload of `gratitudeNote.Written`. `publicText` is present only when the recipient chose the
 * gratitude wall, and is already redacted.
 */
export type GratitudeWrittenPayload = {
  flowId: string;
  needId: string;
  locale: string;
  onWall: boolean;
  sharedWithParticipants: boolean;
  publicText: string | null;
  oblastId: string;
};
