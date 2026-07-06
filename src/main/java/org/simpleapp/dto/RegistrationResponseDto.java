package org.simpleapp.dto;

import java.time.Instant;

public class RegistrationResponseDto {

    private String accountId;
    private String accountStatus;
    private String token;
    private Instant createdAt;

    public RegistrationResponseDto() {
    }

    public RegistrationResponseDto(String accountId, String accountStatus, String token, Instant createdAt) {
        this.accountId = accountId;
        this.accountStatus = accountStatus;
        this.token = token;
        this.createdAt = createdAt;
    }

    public String getAccountId() {
        return accountId;
    }

    public void setAccountId(String accountId) {
        this.accountId = accountId;
    }

    public String getAccountStatus() {
        return accountStatus;
    }

    public void setAccountStatus(String accountStatus) {
        this.accountStatus = accountStatus;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
