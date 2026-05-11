# Celebration Trigger Rules

This document defines how POWERBACK Celebrations resolve.

A Celebration is a conditional donation. Funds are kept in a segregated account under rules the user accepts before confirming. The funds are only delivered to a candidate's campaign if the required public event is verified in the official public record.

## Core rule

A Celebration resolves only by checking whether the required public event appears in the official public record.

POWERBACK does not evaluate:

- motives
- promises
- bill merits
- political strategy
- later political outcomes

The verification question should stay narrow:

> Did the official record show that the required public event happened?

If yes, the release rule applies.

If no, the fallback rule applies.

## Preferred language

Use:

- segregated account
- conditional rules
- public trigger
- official record
- required public event
- candidate's campaign
- campaign committee

Avoid:

- escrow
- reward
- bargain
- promise enforcement
- judging intent
- judging bill merits
- judging political outcomes
- money going to a politician personally

## Developer-facing rule shape

```ts
type CelebrationTriggerRule = {
  requiredPublicEvent: string;
  officialRecordSource: string;
  officialRecordUrl?: string;
  releaseRule: string;
  fallbackRule: string;
  verificationScope: 'official_public_record_only';
  doesNotEvaluate: [
    'motives',
    'promises',
    'bill_merits',
    'political_strategy',
    'later_political_outcomes',
  ];
};
```

## Implementation guidance

Any code that creates, displays, verifies, resolves, or explains a Celebration should preserve this structure.

Resolution logic should not ask whether a politician meant well, made a sincere promise, supported the bill enough, deserves funds, or produced a good downstream result.

The only valid resolution source is the official public record named in the condition.

## User-facing summary

A Celebration follows the rule accepted by the user before confirmation. POWERBACK checks the official public record for the required event. It does not judge motives, promises, bill merits, or later political outcomes.
