package org.simpleapp.service;

import org.simpleapp.dto.ErrorResponseDto;
import org.simpleapp.dto.FieldError;
import org.simpleapp.dto.RegistrationRequestDto;
import org.simpleapp.dto.RegistrationResponseDto;
import org.simpleapp.model.UserAccount;
import org.simpleapp.repository.AccountRepository;
import org.simpleapp.validator.EmailFormatValidator;
import org.simpleapp.validator.PasswordPolicyValidator;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RegistrationService {

    private final EmailFormatValidator emailFormatValidator;
    private final PasswordPolicyValidator passwordPolicyValidator;
    private final BlocklistScreeningService blocklistScreeningService;
    private final AccountRepository accountRepository;
    private final TokenIssuer tokenIssuer;
    private final BCryptPasswordEncoder passwordEncoder;

    public RegistrationService(EmailFormatValidator emailFormatValidator,
                               PasswordPolicyValidator passwordPolicyValidator,
                               BlocklistScreeningService blocklistScreeningService,
                               AccountRepository accountRepository,
                               TokenIssuer tokenIssuer) {
        this.emailFormatValidator = emailFormatValidator;
        this.passwordPolicyValidator = passwordPolicyValidator;
        this.blocklistScreeningService = blocklistScreeningService;
        this.accountRepository = accountRepository;
        this.tokenIssuer = tokenIssuer;
        this.passwordEncoder = new BCryptPasswordEncoder(12);
    }

    public RegistrationResult register(RegistrationRequestDto request) {
        ErrorResponseDto errorResponse = new ErrorResponseDto();

        // Validate email format (FR-004)
        if (!emailFormatValidator.isValid(request.getEmailAddress())) {
            errorResponse.addError(new FieldError("email_address", "email_invalid",
                    "Email address format is invalid"));
        }

        // Validate password complexity (FR-005)
        List<FieldError> passwordErrors = passwordPolicyValidator.validate(request.getPassword());
        for (FieldError error : passwordErrors) {
            errorResponse.addError(error);
        }

        // Check blocklist only if password passes basic complexity (FR-006)
        if (passwordErrors.isEmpty() && request.getPassword() != null) {
            if (blocklistScreeningService.isBlocked(request.getPassword())) {
                errorResponse.addError(new FieldError("password", "password_blocked",
                        "This password is not allowed. Please choose a different password."));
            }
        }

        // Return validation errors (FR-007, FR-008)
        if (!errorResponse.getErrors().isEmpty()) {
            return RegistrationResult.validationFailure(errorResponse);
        }

        // Check for duplicate email (HTTP 409)
        if (accountRepository.existsByEmailAddressIgnoreCase(request.getEmailAddress())) {
            ErrorResponseDto duplicateError = new ErrorResponseDto();
            duplicateError.addError(new FieldError("email_address", "email_taken",
                    "An account with this email address already exists"));
            return RegistrationResult.duplicateEmail(duplicateError);
        }

        // Create account (FR-009, FR-011)
        String credentialHash = passwordEncoder.encode(request.getPassword());
        UserAccount account = new UserAccount(request.getEmailAddress(), credentialHash);
        account = accountRepository.save(account);

        // Issue token (FR-009)
        String token = tokenIssuer.issue(account.getAccountId(), account.getEmailAddress());

        RegistrationResponseDto response = new RegistrationResponseDto(
                account.getAccountId().toString(),
                account.getAccountStatus(),
                token,
                account.getCreatedAt()
        );

        return RegistrationResult.success(response);
    }

    public static class RegistrationResult {
        public enum ResultType { SUCCESS, VALIDATION_ERROR, DUPLICATE_EMAIL }

        private final ResultType type;
        private final RegistrationResponseDto successResponse;
        private final ErrorResponseDto errorResponse;

        private RegistrationResult(ResultType type, RegistrationResponseDto successResponse, ErrorResponseDto errorResponse) {
            this.type = type;
            this.successResponse = successResponse;
            this.errorResponse = errorResponse;
        }

        public static RegistrationResult success(RegistrationResponseDto response) {
            return new RegistrationResult(ResultType.SUCCESS, response, null);
        }

        public static RegistrationResult validationFailure(ErrorResponseDto errors) {
            return new RegistrationResult(ResultType.VALIDATION_ERROR, null, errors);
        }

        public static RegistrationResult duplicateEmail(ErrorResponseDto errors) {
            return new RegistrationResult(ResultType.DUPLICATE_EMAIL, null, errors);
        }

        public ResultType getType() {
            return type;
        }

        public RegistrationResponseDto getSuccessResponse() {
            return successResponse;
        }

        public ErrorResponseDto getErrorResponse() {
            return errorResponse;
        }
    }
}
