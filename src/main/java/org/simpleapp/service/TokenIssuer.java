package org.simpleapp.service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.UUID;

@Service
public class TokenIssuer {

    @Value("${jwt.secret:defaultSecretKeyForDevelopmentOnly12345678}")
    private String jwtSecret;

    @Value("${jwt.expiration-ms:3600000}")
    private long jwtExpirationMs;

    public String issue(UUID accountId, String email) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .setSubject(accountId.toString())
                .claim("email", email)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(SignatureAlgorithm.HS256, jwtSecret)
                .compact();
    }
}
