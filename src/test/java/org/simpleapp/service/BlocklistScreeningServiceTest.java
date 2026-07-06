package org.simpleapp.service;

import org.junit.Before;
import org.junit.Test;
import org.simpleapp.repository.PasswordBlocklistRepository;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class BlocklistScreeningServiceTest {

    private BlocklistScreeningService service;
    private PasswordBlocklistRepository repository;

    @Before
    public void setUp() {
        repository = mock(PasswordBlocklistRepository.class);
        String passwordHash = sha256("password");
        when(repository.existsById(passwordHash)).thenReturn(true);
        service = new BlocklistScreeningService(repository);
    }

    @Test
    public void shouldBlockPasswordOnBlocklist() {
        assertTrue(service.isBlocked("password"));
    }

    @Test
    public void shouldBlockPasswordCaseInsensitive() {
        assertTrue(service.isBlocked("PASSWORD"));
    }

    @Test
    public void shouldAllowPasswordNotOnBlocklist() {
        String hash = sha256("uniquep@ss123");
        when(repository.existsById(hash)).thenReturn(false);
        assertFalse(service.isBlocked("UniqueP@ss123"));
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
