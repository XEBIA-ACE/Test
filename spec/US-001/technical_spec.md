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