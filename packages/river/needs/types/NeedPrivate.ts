import type { ContactChannel } from './ContactChannel.ts';

/** Personal details of a need (`orgs/{org}/needPrivate/{id}`, visibility `private`). Never in the log. */
export type NeedPrivate = {
  needId: string;
  personId: string;
  name: string;
  contactChannel: ContactChannel;
  contactValue: string;
  settlement: string;
  description: string;
};
