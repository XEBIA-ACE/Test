# Register Account Using Email or Mobile

| | |
|---|---|
| **ID** | US-001 |
| **Feature** | F-01 — User Registration and Account Creation |
| **Epic** | EP-001 — User Account Registration via Email and Mobile |
| **Status** | Draft |
| **Date** | 2026-07-21 |

## Background

Part of feature *User Registration and Account Creation*.

## Acceptance Criteria

### Story

- [ ] Given a new user wants to register, When the user inputs an email address or mobile number, Then the system validates that the input matches the required format and is unique.
- [ ] Given the input email or mobile is already registered, When the user submits the registration form, Then the user receives a message that the email or mobile is already registered.
- [ ] Given the input email or mobile has an invalid format, When the user submits the registration form, Then the user receives a validation error message indicating the issue.
- [ ] Given the registration form displays errors, When the user corrects and resubmits, Then the form provides clear feedback about the next steps or remaining issues.

### Epic

- [ ] Given a new user, when they register with a valid email or mobile, then an OTP is sent and the account is created upon successful validation.
- [ ] Given a user attempts to register with an already-used email or mobile, then the system prompts that the email or mobile is already in use.
- [ ] Given a user submits invalid email or mobile format, then the system displays an appropriate validation error.
- [ ] Given a user fails OTP verification, then they are prevented from completing registration and can retry.
- [ ] Given successful registration, then the user is redirected to the personalized dashboard or homepage.

## Proposed Solution

### Functional Specification

## S-001

### Purpose

This functional specification defines requirements for enabling new users to register an account using either an email address or a mobile phone number, ensuring data format validation and uniqueness checks as part of the User Account Management Service.

### Scope

The specification covers the registration capability of the User Account Management Service, specifically the process of accepting user registration requests, validating email/mobile input, enforcing uniqueness, and providing user-facing feedback for both success and error conditions.

### Non-Goals

1. Password setting or authentication flows post-registration initiation
2. Management of user profile fields beyond the chosen identifier
3. Two-factor authentication or OTP verification ([NEEDS CLARIFICATION: Is OTP required at registration?] (Assumed: Not required for this story.))
4. Support for social login or third-party identity providers
5. Handling of language localization or internationalization
6. Integration with notification systems (email/SMS) for this registration step
7. Registration via user identifiers other than email/mobile
8. Rate limiting or anti-abuse functionality
9. Customization of input validation formats by clients
10. Storage or management of user consents or preferences

### Key Entities

- **UserRegistrationRequest**  
  - identifier: string (email address or mobile number)
  
- **UserAccount**  
  - user_id: string  
  - email: string (nullable)  
  - mobile: string (nullable)
  
Relationship:  
- UserRegistrationRequest → UserAccount (0..1, by uniqueness constraint)

### Functional Requirements

FR-001: User Account Management Service SHALL accept registration requests where the identifier is either an email address or a mobile number. (P1)

FR-002: User Account Management Service SHALL validate that the submitted identifier matches required syntactic format for email or mobile. (P1)

FR-003: User Account Management Service MUST NOT allow registration with identifiers (email or mobile) already associated with an existing UserAccount. (P1)

FR-004: User Account Management Service SHALL provide a clear error message if the identifier does not conform to required format. (P2)

FR-005: User Account Management Service SHALL provide a clear error message if the identifier is already registered. (P2)

FR-006: User Account Management Service SHOULD provide actionable feedback when resubmitted data remains invalid or incomplete, indicating next steps or specific issues. (P2)

FR-007: User Account Management Service MAY allow the user to correct input and resubmit the registration form after validation errors. (P2)

FR-008: User Account Management Service MUST NOT return details about existing user accounts other than the fact that the identifier is already registered. (P2)

FR-009: User Account Management Service SHALL NOT accept registration with both an email and a mobile in a single request. (P3)

### Assumptions Propagation

A-001: Registration step does not require OTP or password input at this stage. (FR-001, FR-002, FR-003)  
A-002: Identifier must be either a syntactically valid email or a regionally valid mobile number, but not both. (FR-001, FR-002, FR-009)  
A-003: System only checks uniqueness against exact-match identifiers. (FR-003, FR-005, FR-008)

### Success Criteria

SC-001: Percentage of successful registrations where identifier format is valid and not previously registered equals 100%.

SC-002: Presentation of precisely worded error messages for all failed validation attempts is at least 98%.

SC-003: The system prevents creation of more than one account with the same identifier in all cases.

### Priority Levels

- Acceptance Criterion 1: Valid format and uniqueness check (P1)
- Acceptance Criterion 2: Duplicate identifier message (P2)
- Acceptance Criterion 3: Invalid format message (P2)
- Acceptance Criterion 4: Error correction flow and feedback (P2)

### Edge Cases

EC-001: Given a user submits an empty identifier, When submission occurs, Then the system rejects the request with a message "Identifier required." (FR-002, FR-004)

EC-002: Given a user submits an email with invalid syntax (e.g. "user@@domain"), When submission occurs, Then the system rejects with "Invalid email format." (FR-002, FR-004)

EC-003: Given a user submits a mobile number in an unsupported format, When submission occurs, Then the system rejects it as invalid and provides format guidance. (FR-002, FR-004)

EC-004: Given a submitted identifier matches an existing account, When registration is attempted, Then the system rejects with "Identifier already registered." (FR-003, FR-005)

EC-005: Given a registration attempt where both email and mobile are provided in one request, When submission occurs, Then the system rejects with a message to include only one identifier. (FR-009)

EC-006: Given the user encounters a validation error, When the identifier is corrected and resubmitted, Then the system processes the new input and provides success or new specific error messages as required. (FR-006, FR-007)

EC-007: Given a user repeatedly submits invalid data, When error messages are triggered, Then the system continues to provide actionable, specific feedback on each attempt. (FR-006)

### Independent Testability

Preconditions:
1. No existing user account with the test identifier.
2. Identifier follows the required syntactic format (valid email or mobile).
User Action: User submits the registration form with the identifier.
Observable Outcome: The system accepts the request and registers the new user.

### Technical Design

## S-001

---
## 1. Contracts & Interfaces

### 1.1. API Contract: Registration Initiation

- **Endpoint**: `POST /api/v1/register/initiate`
- **Request Payload**:
  - `identifier` (string, required): Either a syntactically valid email address or a regionally valid mobile number. MUST NOT include both.
- **Responses**:
  - **201 Created**: Registration successfully initiated.
    - Body: `{ user_id: string }`
  - **400 Bad Request**: Input is missing, invalid, or malformed.
    - Possible messages:  
      - "Identifier required." (For empty/undefined identifier)  
      - "Invalid email format."
      - "Invalid mobile format. Mobile must be in E.164 format."
      - "Provide either email or mobile, not both."
  - **409 Conflict**: Identifier already registered.
    - Body: `{ message: "Identifier already registered." }`
  - **422 Unprocessable Entity**: Input supplied but not processable (e.g., ambiguous or not parsable as either email or mobile).
    - Body: `{ message: string }`

### 1.2. Data Model: UserAccount Table

- **Table**: `user_accounts`
  - `user_id` (UUID, PK, not null)
  - `email` (varchar(320), unique, nullable)
  - `mobile` (varchar(16), unique, nullable)

- **Indexes**:
  - `UNIQUE INDEX idx_email_nonnull` ON `user_accounts(email)` WHERE `email IS NOT NULL`
  - `UNIQUE INDEX idx_mobile_nonnull` ON `user_accounts(mobile)` WHERE `mobile IS NOT NULL`

### 1.3. Validation Logic Interface

- **Class**: `ValidationService`
  - `validateEmailFormat(email: string): boolean`
  - `validateMobileFormat(mobile: string): boolean`
  - `parseIdentifier(identifier: string): { type: 'email'|'mobile', value: string } | Error`

- **Class**: `UserAccountRepository`
  - `existsByEmail(email: string): Promise<boolean>`
  - `existsByMobile(mobile: string): Promise<boolean>`
  - `createUserAccount(data: { email?: string, mobile?: string }): Promise<UserAccount>`

---

## 2. Test Strategy

**Test Case 1:**  
- **Test:** Accepts valid email, creates user  
- **Covers:** /register/initiate contract (`201`), data model uniqueness, `validateEmailFormat`, `existsByEmail`  
- **Steps:** POST valid email → Assert `201` and user created

**Test Case 2:**  
- **Test:** Accepts valid mobile, creates user  
- **Covers:** /register/initiate contract (`201`), uniqueness, `validateMobileFormat`, `existsByMobile`  
- **Steps:** POST valid mobile (E.164) → Assert `201` and user created

**Test Case 3:**  
- **Test:** Rejects empty identifier  
- **Covers:** `/register/initiate` contract (`400` "Identifier required")

**Test Case 4:**  
- **Test:** Rejects invalid email  
- **Covers:** `/register/initiate` contract (`400` "Invalid email format"); `ValidationService.validateEmailFormat`

**Test Case 5:**  
- **Test:** Rejects invalid mobile  
- **Covers:** `/register/initiate` contract (`400` "Invalid mobile format."); `ValidationService.validateMobileFormat`

**Test Case 6:**  
- **Test:** Rejects duplicate email  
- **Covers:** `/register/initiate` contract (`409` "Identifier already registered."); `UserAccountRepository.existsByEmail`

**Test Case 7:**  
- **Test:** Rejects duplicate mobile  
- **Covers:** `/register/initiate` contract (`409` "Identifier already registered."); `UserAccountRepository.existsByMobile`

**Test Case 8:**  
- **Test:** Rejects if both email and mobile provided  
- **Covers:** `/register/initiate` contract (`400` "Provide either email or mobile, not both.")

**Test Case 9:**  
- **Test:** Accepts valid correction after previous error  
- **Covers:** Resubmission; corrects Test 4/5/8 and follows with valid format, asserts success

**Test Case 10:**  
- **Test:** Multiple failed attempts each yield actionable feedback  
- **Covers:** Consistent presentation of specific error messages over several invalid submissions

---

## 3. Implementation Approach

### 3.1. HTTP Controller

- **Class:** `UserRegistrationController`
  - Method: `POST /api/v1/register/initiate`
    1. Parse body, extract `identifier`.
    2. Pass to `ValidationService.parseIdentifier`.  
      - If Error, respond with `400/422` and message.
    3. If email:
        - `ValidationService.validateEmailFormat`
        - `UserAccountRepository.existsByEmail`
    4. If mobile:
        - `ValidationService.validateMobileFormat`
        - `UserAccountRepository.existsByMobile`
    5. On conflict, return `409 Conflict`.
    6. On success, `UserAccountRepository.createUserAccount`.

### 3.2. Data Persistence

- Use `user_accounts` table.
- Enforce uniqueness with partial indexes (see 1.2).

### 3.3. Validation Logic

- Email: RFC5322-compliant regex in `ValidationService`.
- Mobile: E.164-compliant regex; further region checks MAY be handled by a pluggable NuMLib integration.

### 3.4. Error Handling

## Affected Services

- `S-001`

## API Changes

| Service | Endpoint | Method | Change |
|---------|----------|--------|--------|
| `S-001` | `/api/v1/register/initiate` | POST | Enhancement - extend input validation, improve duplicate handling and error reporting |

## Open Questions / Gaps

_No gaps identified._