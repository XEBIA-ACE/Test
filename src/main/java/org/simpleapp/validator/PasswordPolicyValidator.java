package org.simpleapp.validator;

import org.simpleapp.dto.FieldError;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Component
public class PasswordPolicyValidator {

    private static final int MIN_LENGTH = 8;
    private static final int MAX_LENGTH = 64;
    private static final Pattern UPPERCASE_PATTERN = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE_PATTERN = Pattern.compile("[a-z]");
    private static final Pattern DIGIT_PATTERN = Pattern.compile("[0-9]");
    private static final Pattern SPECIAL_CHAR_PATTERN = Pattern.compile("[^a-zA-Z0-9]");

    public List<FieldError> validate(String password) {
        List<FieldError> errors = new ArrayList<>();

        if (password == null || password.isEmpty()) {
            errors.add(new FieldError("password", "password_required", "Password is required"));
            return errors;
        }

        if (password.length() < MIN_LENGTH) {
            errors.add(new FieldError("password", "password_too_short",
                    "Password must be at least " + MIN_LENGTH + " characters"));
        }

        if (password.length() > MAX_LENGTH) {
            errors.add(new FieldError("password", "password_too_long",
                    "Password must not exceed " + MAX_LENGTH + " characters"));
        }

        if (!UPPERCASE_PATTERN.matcher(password).find()) {
            errors.add(new FieldError("password", "password_missing_uppercase",
                    "Password must contain at least one uppercase letter"));
        }

        if (!LOWERCASE_PATTERN.matcher(password).find()) {
            errors.add(new FieldError("password", "password_missing_lowercase",
                    "Password must contain at least one lowercase letter"));
        }

        if (!DIGIT_PATTERN.matcher(password).find()) {
            errors.add(new FieldError("password", "password_missing_digit",
                    "Password must contain at least one digit"));
        }

        if (!SPECIAL_CHAR_PATTERN.matcher(password).find()) {
            errors.add(new FieldError("password", "password_missing_special",
                    "Password must contain at least one special character"));
        }

        return errors;
    }
}
