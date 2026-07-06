package org.simpleapp.validator;

import org.junit.Before;
import org.junit.Test;
import org.simpleapp.dto.FieldError;

import java.util.List;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

public class PasswordPolicyValidatorTest {

    private PasswordPolicyValidator validator;

    @Before
    public void setUp() {
        validator = new PasswordPolicyValidator();
    }

    @Test
    public void shouldRejectPasswordShorterThan8Characters() {
        List<FieldError> errors = validator.validate("Ab1!xyz");
        assertTrue(errors.stream().anyMatch(e -> "password_too_short".equals(e.getCode())));
    }

    @Test
    public void shouldAcceptPasswordWithExactly8Characters() {
        // EC-001: exactly 8 chars meeting all complexity rules
        List<FieldError> errors = validator.validate("Ab1!xyzw");
        assertTrue(errors.isEmpty());
    }

    @Test
    public void shouldAcceptPasswordWithExactly64Characters() {
        String password = "Ab1!" + "a".repeat(60);
        List<FieldError> errors = validator.validate(password);
        assertTrue(errors.isEmpty());
    }

    @Test
    public void shouldRejectPasswordWithExactly65Characters() {
        // EC-002: exactly 65 chars
        String password = "Ab1!" + "a".repeat(61);
        List<FieldError> errors = validator.validate(password);
        assertTrue(errors.stream().anyMatch(e -> "password_too_long".equals(e.getCode())));
    }

    @Test
    public void shouldRejectPasswordMissingUppercase() {
        List<FieldError> errors = validator.validate("ab1!xyzw");
        assertTrue(errors.stream().anyMatch(e -> "password_missing_uppercase".equals(e.getCode())));
    }

    @Test
    public void shouldRejectPasswordMissingLowercase() {
        List<FieldError> errors = validator.validate("AB1!XYZW");
        assertTrue(errors.stream().anyMatch(e -> "password_missing_lowercase".equals(e.getCode())));
    }

    @Test
    public void shouldRejectPasswordMissingDigit() {
        List<FieldError> errors = validator.validate("Ab!xyzwq");
        assertTrue(errors.stream().anyMatch(e -> "password_missing_digit".equals(e.getCode())));
    }

    @Test
    public void shouldRejectPasswordMissingSpecialCharacter() {
        List<FieldError> errors = validator.validate("Ab1xyzwq");
        assertTrue(errors.stream().anyMatch(e -> "password_missing_special".equals(e.getCode())));
    }

    @Test
    public void shouldAcceptValidPassword() {
        List<FieldError> errors = validator.validate("StrongP@ss1");
        assertTrue(errors.isEmpty());
    }

    @Test
    public void shouldRejectNullPassword() {
        List<FieldError> errors = validator.validate(null);
        assertTrue(errors.stream().anyMatch(e -> "password_required".equals(e.getCode())));
    }

    @Test
    public void shouldRejectEmptyPassword() {
        List<FieldError> errors = validator.validate("");
        assertTrue(errors.stream().anyMatch(e -> "password_required".equals(e.getCode())));
    }
}
