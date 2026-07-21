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