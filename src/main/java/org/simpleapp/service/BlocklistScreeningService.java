package org.simpleapp.service;

import org.simpleapp.repository.PasswordBlocklistRepository;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Service
public class BlocklistScreeningService {

    private final PasswordBlocklistRepository blocklistRepository;

    public BlocklistScreeningService(PasswordBlocklistRepository blocklistRepository) {
        this.blocklistRepository = blocklistRepository;
    }

    public boolean isBlocked(String password) {
        String hash = hashPassword(password.toLowerCase());
        return blocklistRepository.existsById(hash);
    }

    private String hashPassword(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
}
