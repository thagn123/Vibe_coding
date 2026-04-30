# Security Specification - VibeCode Lab

## Data Invariants
1. A user profile (`/users/{userId}`) can only be created or modified by the user with the matching `uid`.
2. Challenges (`/challenges/{challengeId}`) are read-only for regular users and can only be modified by admins.
3. User challenge progress (`/users/{userId}/progress/{challengeId}`) can only be accessed and modified by the owner.
4. Prompt lab entries (`/users/{userId}/prompts/{promptId}`) can only be accessed and modified by the owner.
5. All timestamps must be server-generated.
6. User level and experience in the main profile can only be incremented, not arbitrarily set, when completing challenges (though for simplicity here we'll allow owner update but with strict schema). Actually, a more secure way is server-side, but in this environment we'll enforce strict keys and immutability.

## The Dirty Dozen Payloads (Rejection Targets)
1. **Identity Spoofing**: Attempt to create a user profile with a different UID than the authenticated user.
2. **PII Leak**: Attempt to read another user's private profile data (if we had a private subcollection, but here we restrict the whole doc).
3. **Admin Escalation**: User tries to update their own `isAdmin` field (if we had one, but we check against an `admins` collection).
4. **Shadow Update**: Adding a `points: 99999` field to a progress document when it shouldn't be there.
5. **ID Poisoning**: Injecting a 2KB string as a `challengeId`.
6. **Path Traversal**: Trying to use `../` or similar in document IDs.
7. **Type Mismatch**: Sending a string for the `experience` field.
8. **Invalid Enum**: Setting challenge difficulty to "Impossible".
9. **Timestamp Spoofing**: Sending a client-side date for `createdAt`.
10. **Resource Exhaustion**: Sending a 500KB string for a small text field like `displayName`.
11. **Orphaned Write**: Creating progress for a challenge that doesn't exist.
12. **Blanket Read**: Authenticated user trying to `list` all users without any filters.
