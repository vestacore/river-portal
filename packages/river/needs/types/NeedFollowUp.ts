/** Status events on a need caused by other aggregates (a flow matching, dispatching, delivering). */
export type NeedFollowUp = 'need.Matched' | 'need.DeliveryStarted' | 'need.Delivered' | 'need.Confirmed' | 'need.Closed';
