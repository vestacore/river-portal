---
type: architecture
status: draft
tags: [architecture, event-sourcing, catalogue]
aliases: [Events, Event Types]
related: ["[[Log Event]]", "[[Event Log and Projections]]", "[[Template — Event Type]]", "[[Canonical Parameters]]"]
---

# Event Catalogue

Every [[Log Event]] type, grouped by aggregate. This is the **complete** list: any event name used anywhere in the vault must appear here. Back to [[Architecture Overview]]; mechanics in [[Event Log and Projections]].

**Naming.** The naming rules — `aggregate.PastTenseVerb`, the fixed list of camelCase aggregates, and the fixed synonyms (for example `consent.Withdrawn`, never `consent.Revoked`) — live in [[Canonical Parameters#Event naming]]; see also [[Conventions#Naming]]. New types are added here first, with [[Template — Event Type]].

**Payloads** carry ids, codes and business facts, and **no plaintext PII**. Personal free text (a need description, a gratitude note) is encrypted with the author's per-person key, so crypto-shredding (`person.KeyShredded`) makes it unreadable too. See [[Firebase Data Model#Where PII lives]] and [[Event Log and Projections#Crypto-shredding]].

**Default visibility** is the event's baseline [[Visibility Levels|level]]; individual fields may be stricter (`fieldVisibility`). **DP** marks events that record a decision ([[Decision Points Overview]]).

**Projection keys:** `queue` needQueue · `needs` needs view · `flows` flow board · `legs` leg view · `ledger` staff ledger · `pubLedger` public [[Transparency Ledger]] · `stats` public live counters · `inv` inventory · `rep` [[Reputation Signals]] · `cons` consents · `audit` decision audit trail · `people` person stubs · `content` content views · `pub` public pages · `map` [[Flow Map]] · `cases` safeguarding, dispute and whistleblowing cases · `notif` notifications (Pub/Sub).

## People and roles

| Event | Payload summary | Default | Projections |
|---|---|---|---|
| `person.Registered` | personId, locale, channels (PII in vault) | private | people |
| `person.ProvisionallyRecorded` | personId, channel (a need submitted without an account) | private | people |
| `person.LinkedToIdentity` | personId, identityProvider (Firebase / Workspace) | private | people |
| `person.ProfileUpdated` | personId, changedFields[] (names only) | private | people |
| `person.PreferenceChanged` | personId, preference (contact / display / report cadence / recognition), value key | private | people, pub, notif |
| `person.ContactChannelAdded` / `person.ContactChannelVerified` / `person.ContactChannelRemoved` | personId, channel kind (never the value) | private | people, notif |
| `person.ProxyLinked` / `person.ProxyUnlinked` | subjectId, proxyId, basis | private | people, needs |
| `person.PseudonymAssigned` | personId, context, pseudonymKey | team | people |
| `person.GiftAidDeclared` / `person.GiftAidWithdrawn` | personId, declarationRef (UK Gift Aid) | private | people, ledger |
| `person.Merged` | survivorId, mergedId, reasonKey | team | people, audit |
| `person.DataRequestReceived` / `person.DataRequestFulfilled` | personId, right (access / rectification / portability …), dueAt | private | people, audit |
| `person.ErasureRequested` | personId, basis | private | people, audit |
| `person.ErasureDeferred` | personId, reasonKey (legal hold), reviewOn | private | people, audit |
| `person.KeyShredded` | personId (wrapped DEK destroyed — crypto-shredding) | team | all views referencing the person |
| `organisation.Registered` | orgId, name, country, tier | public | people, stats |
| `organisation.Verified` | orgId, verificationId | public | people, rep |
| `organisation.SettingsChanged` | features, locales, brand tokens, stricter [[Canonical Parameters]] | team | — |
| `organisation.SafeguardingLeadAppointed` | orgId, personId | team | people, audit |
| `organisation.RouteSuspended` | orgId, routeRef, reasonKey | team | legs, flows, audit, notif |
| `organisation.MilestoneReached` / `organisation.MilestoneCorrected` | scope, metric, threshold, asOfEventId | public | pub, stats |
| `organisation.Suspended` / `organisation.Reinstated` / `organisation.Archived` | orgId, reasonKey | team | people, pub |
| `partner.Proposed` | partnerOrgId, proposedRoles[] | team | people |
| `partner.AgreementSigned` | partnerOrgId, agreementRef (data sharing), roles[] | team | people, audit |
| `partner.CapacityDeclared` / `partner.CapacityWithdrawn` | partnerOrgId, capacity (service, area, volume) | team | people, flows |
| `partner.ReferralSent` / `partner.ReferralAccepted` / `partner.ReferralReturned` | partnerOrgId, needId / sharedNeedRef (paired with `need.Referred`) | private | needs, notif |
| `partner.Paused` / `partner.Ended` | partnerOrgId, reasonKey | team | people, flows |
| `role.Applied` | personId, role (e.g. volunteer), scope | private | people |
| `role.Derived` | personId, role (recipient / giver / carrier …), sourceEventId | team | people |
| `role.Granted` | personId, role (incl. auditor, finance steward, safeguarding lead), scope {org/programme/campaign/flow}, expiresAt? | team | people, audit |
| `role.CharterAccepted` | personId, charter (ethics charter / carrier code of conduct), version | team | people, audit |
| `role.AvailabilityChanged` | personId, role, availability (available / away / off duty), capacity?, corridors? | team | people, flows |
| `role.TimeLogged` | personId, role, hours, flowId? / hubId? | team | people, stats |
| `role.Paused` / `role.Resumed` | personId, role (self-declared) | team | people |
| `role.Suspended` / `role.Reinstated` | personId, role, reason (sealed when safeguarding) | team | people, audit |
| `role.Relinquished` | personId, role (retired, left) | team | people |
| `role.Revoked` | personId, role, scope, reason | team | people, audit |
| `role.Expired` | personId, role, scope (time-boxed grant ends) | team | people, audit |

## Consent, verification, visibility

| Event | Payload summary | Default | Projections |
|---|---|---|---|
| `consent.Requested` | consentId, subjectId, purpose, audience, wordingVersion | private | cons, notif |
| `consent.Granted` | consentId, subjectId, purpose, scope, mediaIds?, expiresAt? | private | cons, pub |
| `consent.Declined` (DP-09) | consentId | private | cons |
| `consent.Narrowed` | consentId, newScope | private | cons, pub, content |
| `consent.Withdrawn` | consentId, reason? | private | cons, pub, content (removal within 15 minutes — [[Canonical Parameters]]) |
| `consent.Expired` | consentId (request unanswered, or time limit reached) | private | cons, pub |
| `consent.Superseded` | consentId, byConsentId | private | cons |
| `consent.WordingPublished` | purpose, wordingVersion, locales[] | team | cons |
| `consent.CoverageReviewed` | period, findingsKey | team | audit |
| `verification.Requested` | verificationId, subject {kind,id}, depth | team | needs, people |
| `verification.DepthSet` (DP-02) | verificationId, depth (V0–V4), reasonKey | team | needs, audit |
| `verification.EvidenceRecorded` | verificationId, evidenceRef, seenNotStored | sealed/private | needs |
| `verification.Completed` (DP-02) | verificationId, outcome (sufficient / insufficient), depth | team | needs, people, rep, audit |
| `verification.Waived` (DP-02) | verificationId, reason | team | needs, audit |
| `verification.Expired` | verificationId (time-bound attestation lapses) | team | people |
| `verification.Revoked` | verificationId, reason | team | needs, people, audit |
| `visibility.PolicyChanged` | policyVersion, changes[] | team | all affected |
| `visibility.Changed` (DP-12) | target {kind,id,field?}, from, to, consentId? | team | all affected, audit |
| `visibility.ChangeDeclined` (DP-12) | target, reason (widening only) | team | audit |
| `visibility.Sealed` / `visibility.Unsealed` (DP-12) | target, fields[] (unsealing by the Safeguarding Lead) | sealed | all affected, cases, audit |

## Needs and offers

| Event | Payload summary | Default | Projections |
|---|---|---|---|
| `need.Drafted` | needId, channel | private | — |
| `need.Submitted` | needId, category, form, urgency, oblast, description (PII-scanned, encrypted with subject DEK), onBehalfOf? | private | queue, needs, stats, notif |
| `need.Acknowledged` | needId, messageTemplate | private | queue, needs, notif |
| `need.Triaged` (DP-01) | needId, category, priority (urgency + waiting time), verificationDepth, assignedTo[] | team | queue, needs, audit |
| `need.ClarificationRequested` | needId, questionKey | private | needs, notif |
| `need.Clarified` | needId, fields[] | private | needs |
| `need.Amended` | needId, version, changedFields[] | private | queue, needs |
| `need.Opened` | needId | team | queue, needs, stats |
| `need.LinkedAsRelated` | needId, relatedNeedId / sharedNeedRef | team | needs |
| `need.PutOnHold` | needId, kind, reviewOn, messageKey | private | queue, needs, notif |
| `need.Referred` | needId, partnerOrgId?, service, messageKey | private | needs, notif, stats |
| `need.Resumed` | needId (back to `open` from `on_hold` or `referred`) | private | queue, needs |
| `need.PartiallyMatched` / `need.Matched` | needId, flowId | team | needs, flows |
| `need.DeliveryStarted` | needId, flowId, consignmentId | team | queue, needs, stats, notif |
| `need.Delivered` | needId, legId | team | needs, stats, notif |
| `need.Confirmed` | needId, confirmationId | team | needs, stats |
| `need.Closed` | needId, reasonKey (confirmed / auto-closed after 30 days on carrier evidence) | team | queue, needs, stats |
| `need.Withdrawn` | needId, byRecipient: true | private | queue, needs |
| `offer.Submitted` | offerId, form, category, quantity?, amount?, currency?, intentStatementId | private | flows, notif |
| `offer.ClarificationRequested` | offerId, questionKey | private | notif |
| `offer.Clarified` | offerId, fields[] | private | flows |
| `offer.Amended` | offerId, changedFields[] | private | flows |
| `offer.Accepted` (DP-03) | offerId, conditionsNote? | team | flows, audit, notif |
| `offer.DeclinedWithThanks` (DP-03) | offerId, reasonKey | private | audit, notif |
| `offer.AcceptanceWithdrawn` | offerId, reasonKey | team | flows, audit, notif |
| `offer.Withdrawn` / `offer.Expired` | offerId | private | flows |
| `offer.ConvertedToGift` | offerId, giftIds[] | team | flows |
| `intent.Stated` | intentStatementId, offerId?, version | private | flows |
| `intent.Clarified` | intentStatementId, version | private | flows |
| `intent.AssistanceUsed` | intentStatementId, via (vertex / coordinator) | team | audit |
| `intent.ConcernRaised` / `intent.ConcernResolved` | intentStatementId, principleRef, resolutionKey? | team | flows, audit |
| `intent.Acknowledged` | intentStatementId, byPersonId | team | flows |

## Gifts, flows, campaigns, programmes

| Event | Payload summary | Default | Projections |
|---|---|---|---|
| `gift.Pledged` | giftId, giverRef, form, amount?, currency?, restrictedPurpose?, campaignId? | private | ledger, stats, rep |
| `gift.PledgeLapsed` | giftId (never arrived; no reputational effect) | private | ledger, stats |
| `gift.Received` | giftId, amount, currency, fxRate, provider, providerRef | private | ledger, pubLedger, stats, rep, notif |
| `gift.ReceiptIssued` | giftId, receiptRef | private | ledger, notif |
| `gift.ReceiptCorrected` | giftId, previousEventId, amount | team | ledger, pubLedger |
| `gift.RecurringStarted` / `gift.RecurringStopped` | giverRef, planRef, amount, currency, interval | private | ledger |
| `gift.RestrictionRecorded` | giftId, restriction (purpose, scope, period) | team | ledger |
| `gift.RestrictionVaried` | giftId, from, to, agreementRef (giver's recorded agreement) | team | ledger, pubLedger, audit |
| `gift.RestrictedBalanceReported` | fundRef, in, spent, remaining, currency | participants | ledger, notif |
| `gift.CommitmentProposed` / `gift.CommitmentAgreed` / `gift.CommitmentDeclined` | commitmentId, sponsorRef, purpose, scope, cap, period | team | ledger, audit |
| `gift.CommitmentAmended` | commitmentId, changedFields[], agreementRef | team | ledger, audit |
| `gift.CommitmentFulfilled` / `gift.CommitmentClosed` | commitmentId, totals | team | ledger, content |
| `gift.Allocated` | giftId, flowId, amount? / itemIds? | team | flows, ledger |
| `gift.Deallocated` | giftId, flowId, reason | team | flows, ledger |
| `gift.Reallocated` | giftId, fromFlowId, toFlowId, reason | team | flows, ledger, notif |
| `gift.RepurposeConsentRequested` / `gift.RepurposeConsented` | giftId, proposedPurpose | private | ledger, notif |
| `gift.Delivered` | giftId, confirmationId | participants | flows, stats |
| `gift.Acknowledged` | giftId, gratitudeNoteId? | participants | rep, notif |
| `gift.Refunded` | giftId, amount, currency (negative ledger line; only before allocation) | team | ledger, pubLedger |
| `gift.ReturnedToGiver` | giftId, itemIds[], reason | team | ledger, inv |
| `flow.Formed` | flowId, needIds[], giftIds[], leadCoordinatorId | team | flows, stats |
| `flow.MatchSuggested` | flowId?, needIds[], giftIds[], suggestionId (accompanies `ai.SuggestionMade`) | team | flows, audit |
| `flow.NeedLinked` / `flow.NeedUnlinked` | flowId, needId, reason? | team | flows, needs |
| `flow.BudgetEstimated` | flowId, lines[], amount, currency | team | flows, ledger |
| `flow.Committed` (DP-04) | flowId, matchRationaleKey, aiSuggestionId? | team | flows, needs, audit |
| `flow.PriorityDecided` | flowIds[], stockRef, decisionKey | team | flows, audit |
| `flow.CoordinatorJoined` / `flow.CoordinatorLeft` | flowId, personId, role | team | flows |
| `flow.PartnerJoined` / `flow.PartnerLeft` | flowId, partnerOrgId, scope | team | flows |
| `flow.ResponsibilityDelegated` | flowId, scope (e.g. routing), to | team | flows, audit |
| `flow.LeadHandoverProposed` / `flow.LeadHandoverDeclined` | flowId, from, to, note | team | flows, notif |
| `flow.LeadHandedOver` | flowId, from, to, note, forced? (administrator with reason) | team | flows, audit |
| `flow.TaskCreated` / `flow.TaskClaimed` / `flow.TaskReleased` / `flow.TaskClaimExpired` / `flow.TaskReassigned` / `flow.TaskCompleted` | flowId, taskId, claimant?, until? | team | flows, rep |
| `flow.MotionStarted` / `flow.Arrived` / `flow.Confirmed` / `flow.Reported` / `flow.Closed` | flowId | participants | flows, stats, map, notif |
| `flow.Replanned` | flowId, reasonKey (consignment returned or lost) | participants | flows, notif |
| `flow.CostsReconciled` | flowId, budget, actual, variance, currency | team | flows, ledger |
| `flow.Dissolved` / `flow.Reformed` | flowId, reasonKey, newFlowId? | team | flows |
| `campaign.Drafted` | campaignId, purpose, goal, currency, surplusRule | team | content |
| `campaign.Launched` | campaignId, slug, goal, currency, dates | public | pub, stats, pubLedger |
| `campaign.GoalChanged` | campaignId, goal, reason | public | pub |
| `campaign.GoalReached` | campaignId, asOfEventId | public | pub, stats, notif |
| `campaign.Paused` / `campaign.Resumed` | campaignId, reasonKey | public | pub |
| `campaign.SurplusReallocated` | campaignId, toCampaignId / purpose, amount, currency (per published surplus rule) | public | pub, pubLedger |
| `campaign.Closed` | campaignId, outcomeSummaryKey | public | pub, stats |
| `campaign.Reported` (DP-10) / `campaign.Archived` | campaignId, reportId? | public | pub |
| `programme.Planned` | programmeId, name, funders[], budget | team | people, pub |
| `programme.Activated` / `programme.Suspended` / `programme.Resumed` / `programme.ClosingStarted` / `programme.Closed` | programmeId, reasonKey? | team | people, pub |
| `programme.FundingLineAdded` | programmeId, funderRef, amount, currency, restriction | team | ledger |
| `programme.IndicatorDefined` | programmeId, indicatorKey, definition | team | stats |
| `programme.SnapshotTaken` | programmeId, totals, asOfEventId | team | content, stats |

## Logistics

| Event | Payload summary | Default | Projections |
|---|---|---|---|
| `consignment.PackingStarted` | consignmentId, flowId, hubId | team | flows, inv |
| `consignment.ItemAdded` / `consignment.ItemRemoved` | consignmentId, itemId | team | inv |
| `consignment.Packed` | consignmentId, flowId, itemIds[], hubId | team | flows, inv |
| `consignment.Labelled` | consignmentId, labelRef | team | flows |
| `consignment.CustomsDocumentsPrepared` | consignmentId, mediaId (PDF) | team | flows |
| `consignment.Ready` (DP-07) | consignmentId, weightKg, volumeM3 | team | flows |
| `consignment.DispatchDelayed` (DP-07) | consignmentId, reason, newDate | team | flows, notif |
| `consignment.Dispatched` (DP-07) | consignmentId, firstLegId, itemsManifestHash | participants | flows, map, notif, audit |
| `consignment.InTransit` / `consignment.Delivered` / `consignment.Returned` / `consignment.Lost` | consignmentId, legId | participants | flows, map, stats, notif |
| `consignment.ArrivedAtHub` | consignmentId, hubId | participants | flows, inv, map |
| `consignment.Split` / `consignment.Merged` | consignmentId(s), childIds[] | team | flows, inv |
| `consignment.Rerouted` (DP-05) | consignmentId, fromPlan, toPlan, reason | team | flows, legs, audit |
| `consignment.Recalled` | consignmentId, reason | team | flows, notif, audit |
| `item.Expected` / `item.Received` / `item.Purchased` | itemId, category, quantity, unit, condition, sourceGiftId? / costId? | team | inv |
| `item.ConditionRecorded` | itemId, condition | team | inv |
| `item.Reserved` / `item.Released` | itemId, flowId | team | inv, flows |
| `item.Packed` / `item.Moved` / `item.Delivered` | itemId, consignmentId / fromHubId, toHubId | team | inv |
| `item.WrittenOff` | itemId, reasonKey | team | inv, ledger |
| `item.ReturnedToGiver` | itemId, giftId | team | inv, ledger |
| `leg.Planned` (DP-05) | legId, consignmentId, from/to (locationIds), plannedAt, budgetedCost | team | legs, flows |
| `leg.CarrierAssigned` (DP-05) | legId, carrierId, magicLinkIssued: bool | team | legs, flows, notif, audit |
| `leg.AccessLinkIssued` / `leg.AccessLinkRevoked` | legId, carrierId, expiresAt | team | legs |
| `leg.AssignmentAccepted` / `leg.AssignmentDeclined` | legId, carrierId, reason? | team | legs, flows, notif |
| `leg.CarrierUnassigned` | legId, carrierId, reason | team | legs, flows, rep |
| `leg.Cancelled` | legId, reason | team | legs, flows |
| `leg.Departed` | legId, odometer?, mediaId? | participants | legs, map, notif |
| `leg.CheckpointPassed` / `leg.Delayed` | legId, checkpointKey / reasonKey, newEta? | participants | legs, notif |
| `leg.IncidentReported` | legId, kind (accident, delay, border) | team (sealed if people are at risk) | legs, notif, cases |
| `leg.HandedOver` | legId, toPersonRef / hubId, mediaId? | participants | legs, flows, map |
| `leg.HandoverFailed` | legId, reasonKey (recipient unreachable) | participants | legs, notif |
| `leg.DepartureTimeCorrected` | legId, previousEventId, departedAt | team | legs, rep |
| `leg.NoCostsDeclared` | legId | team | legs, ledger |
| `leg.Closed` | legId, costIds[] (carrier contact redacted 72 hours later — [[Canonical Parameters]]) | team | legs, ledger |
| `hub.Proposed` / `hub.Opened` / `hub.Paused` / `hub.Reopened` / `hub.ClosingStarted` / `hub.Closed` | hubId, locationId (coarse public) | public | inv, map |
| `hub.AcceptedCategoriesUpdated` | hubId, categoryIds[] | public | inv, pub |
| `hub.ItemsReceived` / `hub.ItemsReleased` | hubId, itemIds[], consignmentId? | team | inv |
| `hub.StockCounted` | hubId, counts[] | team | inv |
| `hub.DiscrepancyRecorded` | hubId, itemId / category, expected, counted | team | inv, rep, audit |

## Money

| Event | Payload summary | Default | Projections |
|---|---|---|---|
| `costRecord.Drafted` | costId (offline capture) | team | legs |
| `costRecord.Submitted` | costId, kind (fuel, toll, ferry, customs, packaging, postage, accommodation, vehicle hire), amount, currency, fxRate, flowId/legId, receiptMediaId | team | ledger, legs |
| `costRecord.ReceiptAttached` | costId, mediaId | team | ledger |
| `costRecord.BudgetApproved` (DP-06) | flowId / legId, amount, currency | team | ledger, flows |
| `costRecord.Queried` / `costRecord.Clarified` | costId, questionKey | team | ledger, notif |
| `costRecord.Approved` (DP-06) | costId, approverRole(s) (Lead Coordinator up to GBP 250; Finance Steward above; two approvers at GBP 1,000 or more — [[Canonical Parameters]]) | team | ledger, pubLedger, audit |
| `costRecord.Declined` (DP-06) | costId, reason | team | ledger, notif |
| `costRecord.FundingAssigned` | costId, fundId / commitmentId | participants | ledger, pubLedger |
| `costRecord.Reallocated` (DP-06) | costId, fromFund, toFund | team | ledger, pubLedger |
| `costRecord.Reimbursed` / `costRecord.PaidDirect` | costId, paidTo (personRef), method, reference | private | ledger |
| `costRecord.Reversed` | costId, reason (reversing entry; a new record follows) | team | ledger, pubLedger |

## Confirmation, gratitude and reputation

| Event | Payload summary | Default | Projections |
|---|---|---|---|
| `deliveryConfirmation.Requested` | confirmationId, needId, channel | private | needs, notif |
| `deliveryConfirmation.Recorded` | confirmationId, needId, by (recipient / proxy / carrier), mediaIds[] | private | needs, flows, stats, notif |
| `deliveryConfirmation.IssueReported` | confirmationId, issueKey (e.g. partial) | private | needs, flows, notif |
| `deliveryConfirmation.ReviewStarted` | confirmationId, reviewerId | team | needs |
| `deliveryConfirmation.Accepted` (DP-08) | confirmationId, auto? | team | needs, flows, stats, rep, audit |
| `deliveryConfirmation.FollowUpRequested` (DP-08) | confirmationId, questionKey (never framed as an accusation) | team | needs, flows, audit |
| `deliveryConfirmation.Reopened` | confirmationId, reason | team | needs, flows, stats |
| `deliveryConfirmation.Retracted` | confirmationId, reason | team | needs, flows, stats |
| `gratitudeNote.Written` | noteId, fromRef, flowId, language, transcribedBy?, text (PII-scanned, encrypted with author DEK) | private | notif |
| `gratitudeNote.SubmittedForReview` | noteId | private | content |
| `gratitudeNote.Approved` (DP-09) | noteId, redactions[] | team | content |
| `gratitudeNote.ReturnedToAuthor` | noteId, suggestionKey | private | notif |
| `gratitudeNote.Translated` | noteId, locale, translationId | participants | content |
| `gratitudeNote.Routed` | noteId, toRef (per recipient of thanks) | participants | rep, notif |
| `gratitudeNote.Delivered` | noteId, toRef, channel | participants | rep, stats |
| `gratitudeNote.ReplyRelayed` | noteId, replyText (encrypted with author DEK) | participants | notif |
| `gratitudeNote.Published` / `gratitudeNote.Unpublished` | noteId, consentId | public | pub |
| `gratitudeNote.Withdrawn` | noteId | private | pub, content, notif |
| `reputation.SignalRecomputed` | subjectId, signal, value, basisEventIds[] | private | rep |
| `reputation.ContestRaised` (DP-11) | subjectId, signal, reasonText | private | rep, audit |
| `reputation.ReviewerRecused` | subjectId, reviewerId | private | audit |
| `reputation.SignalAnnotated` (DP-11) | subjectId, signal, note | private | rep, audit |
| `reputation.SignalCorrected` (DP-11) | subjectId, signal, eventId, exclusion / correction reason | private | rep, audit |
| `reputation.ContestRejected` (DP-11) | subjectId, signal, explanation (signal upheld) | private | rep, audit |
| `reputation.DefinitionRevised` | signal, definitionVersion | team | rep (rebuild) |
| `reputation.SharingConsented` / `reputation.SharingWithdrawn` | subjectId, toOrgId | private | rep, cons |

## Content and publication

| Event | Payload summary | Default | Projections |
|---|---|---|---|
| `article.Drafted` / `article.Revised` | articleId, revisionId, locale | team | content |
| `report.Generated` | reportId, kind (donor / impact / campaign / grant), period, sourceQuery | private | content |
| `report.Revised` | reportId, changeNote | team | content, pub |
| `mediaAsset.Uploaded` | mediaId, ownerRef, mime, storagePath | private | content |
| `mediaAsset.Processed` | mediaId, renditions[], exifStripped, facesBlurred | private | content |
| `mediaAsset.Quarantined` | mediaId, reasonKey (malware / unsafe) | team | content |
| `mediaAsset.PiiFlagged` / `mediaAsset.FacesBlurred` / `mediaAsset.Redacted` | mediaId, rendition | team | content |
| `mediaAsset.VisibilityChanged` | mediaId, to, consentId? | team | content, pub |
| `mediaAsset.PublishedRendition` / `mediaAsset.Unpublished` | mediaId, rendition, consentId | public | pub |
| `mediaAsset.Shredded` | mediaId (erasure / retention) | team | content, pub |
| `translation.MachineDrafted` | targetRef, locale, via: vertex, model id | team | content |
| `translation.Started` | targetRef, locale, translatorId (human) | team | content |
| `translation.SubmittedForReview` / `translation.ChangesRequested` | targetRef, locale, notes? | team | content |
| `translation.Approved` | targetRef, locale, reviewerId | team | content, pub |
| `translation.SourceChanged` / `translation.Superseded` | targetRef, locale | team | content, pub |
| `publication.Drafted` / `publication.DraftSaved` | publicationId, kind, sourceRefs[], blockDiff? | team | content |
| `publication.SubmittedForReview` | publicationId | team | content |
| `publication.ChangesRequested` (DP-10) | publicationId, notes | team | content |
| `publication.ConsentChecked` (DP-09) | publicationId, consentIds[], result (cleared / missing) | team | content, audit |
| `publication.Approved` (DP-10) | publicationId, approverId | team | content, audit |
| `publication.Scheduled` (DP-10) | publicationId, at | team | content |
| `publication.Published` | publicationId, slug, locales[] | public | pub, stats, notif |
| `publication.Revised` | publicationId, changeNote (visible correction note) | public | pub |
| `publication.Redacted` | publicationId, blocks[] (consent withdrawn; within 15 minutes) | public | pub |
| `publication.Withdrawn` | publicationId, reason | team | pub |

## Categories and locations

| Event | Payload summary | Default | Projections |
|---|---|---|---|
| `category.Proposed` / `category.Activated` / `category.LabelChanged` / `category.Deprecated` | categoryId, labels{locale}, replacedBy? | public | content, pub, inv |
| `location.Captured` / `location.Geocoded` / `location.Corrected` | locationId, codes (oblast, raion, settlement) — never the address line | private | needs, legs |
| `location.ConfirmedByCarrier` | locationId, legId | private | legs |
| `location.DiscreetFlagSet` | locationId | private | needs, legs, map |
| `location.Archived` / `location.Shredded` | locationId | team | needs, legs |

## Safeguarding, disputes and whistleblowing

| Event | Payload summary | Default | Projections |
|---|---|---|---|
| `safeguarding.ConcernRaised` | caseId, subjectRef (need / person), source (person / system rule) | sealed | cases, notif |
| `safeguarding.Referred` | caseId, agencyKey | sealed | cases |
| `safeguarding.AccessGranted` | caseId, granteeId (auditor / regulator), reason, expiresAt | sealed | cases, audit |
| `safeguarding.Closed` | caseId, outcomeKey | sealed | cases |
| `dispute.Raised` | disputeId, kind, subjectRef, channel | private | cases, notif |
| `dispute.Acknowledged` / `dispute.Assigned` | disputeId, assigneeId? | private | cases, notif |
| `dispute.Escalated` | disputeId, from, to, reason | private | cases, notif, audit |
| `dispute.Resolved` | disputeId, outcome, remedy | private | cases, audit |
| `dispute.ReviewRequested` / `dispute.ReviewConcluded` | disputeId, panelRef, findings? | private | cases, audit |
| `dispute.Closed` | disputeId (complainant satisfied or 30 days) | private | cases |
| `whistleblow.Raised` | reportId, channel (own `sealed` aggregate and access list) | sealed | cases |
| `whistleblow.Closed` | reportId, outcomeKey | sealed | cases |

## System and AI

| Event | Payload summary | Default | Projections |
|---|---|---|---|
| `ai.SuggestionMade` | suggestionId, useCase (need summary, match, publication draft …), model, targetRef, promptHash (no prompt text) | team | audit |
| `ai.SuggestionAccepted` / `ai.SuggestionRejected` | suggestionId, byPersonId, fieldsChanged?, reason? | team | audit |
| `system.CommandRejected` | command, reasonKey | team | audit |
| `system.ScopeViolationBlocked` | actorRef, command, scope | team | audit |
| `system.SealedAccessed` | personId (reader), target {kind,id}, purposeKey | sealed | audit |
| `system.BreakGlassUsed` | account, reason, startedAt, endedAt, requestCount, recordsOpened | team | audit |
| `system.UnmaskGranted` | auditorId, target, approverId | team | audit |
| `system.AuditNoteAdded` / `system.AuditConcluded` | auditorId, findingKey / reportRef | team | audit |
| `system.AccessReviewed` | period, changes[] | team | audit |
| `system.ReconciliationCompleted` / `system.ReconciliationSignedOff` | scope (payments / stock / bank), period, signedBy? | team | audit, ledger |
| `system.PeriodEnded` | scope (report / digest), period | team | content |
| `system.ProjectionDefined` / `system.ProjectionRebuildStarted` / `system.ProjectionRebuilt` / `system.ProjectionRetired` | view, fromVersion, toVersion, events | team | audit |
| `system.ProjectionVerified` | view, diffCount (rebuilt from the log and compared with live) | team | audit |
| `system.SchemaUpcasterRegistered` | eventType, fromVersion, toVersion | team | audit |
| `system.LogExported` / `system.ArchiveSegmentSealed` | segment, range, hash | team | audit |

AI events accompany, never replace, the human decision event (e.g. `flow.Committed` cites `aiSuggestionId`). See [[Vertex AI Integration]].

## Added in engineering iteration 01 (2026-09-24)

| Event | Aggregate | Payload (summary) | Default visibility | Projections |
|---|---|---|---|---|
| `content.BlockEdited` | content | `blockId`, `locale`, Tiptap `doc`, server-rendered `html` | public | content blocks, site document |
| `publication.Drafted` (`publicationKind: feedItem`) | publication | `kind`, `text` (en-GB, uk), `reportId`, `source` (vertex / fallback / editor), `model` | team | feed (studio) |
| `publication.Published` / `publication.Withdrawn` (`publicationKind: report` or `feedItem`) | publication | report: `safetyOverride`, `daysSinceDelivery`; feed item: final `text` | public | reports, feed, site document, campaign page |


## Added in engineering iteration 04 (2026-09-25)

| Event | Aggregate | Payload (summary) | Default visibility | Projections |
|---|---|---|---|---|
| `settings.ProfileApplied` | settings | `profileId`, `keepOverrides` | team | organisation settings |
| `settings.ValuesChanged` | settings | `values`: setting key → validated value; a value equal to the one in force is not recorded | team | organisation settings (and every page, through tokens) |
| `settings.ValueReset` | settings | `key` | team | organisation settings |
| `costRecord.Submitted` / `costRecord.Approved` (extended) | costRecord | `amountMinor` and `currency` as paid, `fxRate` used, `reportingCurrency`, `reportingMinor`; on approval `approvedAs`: `lead` (within the limit) or `finance_steward` | team / public | flows, ledger, campaign page, site document |
| `gift.Acknowledged` (payload fixed) | gift | `flowId`, `gratitudeNoteId`; emitted when the recipient shares thanks with the people who helped | team for now (participants when participant views exist) | gifts ("My river") |

- The `settings.*` events implement `organisation.SettingsChanged`, with a dedicated aggregate so that each change is small and can be reset key by key.
- The acting role recorded with every event is the **capacity** in which the person acted, for example `finance_steward` for an approval (engineering: `adr/records/ADR-0021 Identity Layer and Demo Personas.md`).

Naming rules: [[Canonical Parameters]].

