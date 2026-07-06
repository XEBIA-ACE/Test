package org.simpleapp.validator;

import org.junit.Before;
import org.junit.Test;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

public class EmailFormatValidatorTest {

    private EmailFormatValidator validator;

    @Before
    public void setUp() {
        validator = new EmailFormatValidator();
    }

    @Test
    public void shouldAcceptValidEmail() {
        assertTrue(validator.isValid("user@example.com"));
    }

    @Test
    public void shouldAcceptEmailWithSubdomain() {
        assertTrue(validator.isValid("user@sub.example.com"));
    }

    @Test
    public void shouldAcceptEmailWithPlus() {
        assertTrue(validator.isValid("user+tag@example.com"));
    }

    @Test
    public void shouldRejectEmailWithoutAtSign() {
        assertFalse(validator.isValid("userexample.com"));
    }

    @Test
    public void shouldRejectEmailWithoutDomain() {
        assertFalse(validator.isValid("user@"));
    }

    @Test
    public void shouldRejectEmailWithoutLocalPart() {
        assertFalse(validator.isValid("@example.com"));
    }

    @Test
    public void shouldRejectNullEmail() {
        assertFalse(validator.isValid(null));
    }

    @Test
    public void shouldRejectEmptyEmail() {
        assertFalse(validator.isValid(""));
    }

    @Test
    public void shouldRejectBlankEmail() {
        assertFalse(validator.isValid("   "));
    }
}
