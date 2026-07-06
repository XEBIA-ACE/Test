package org.simpleapp.model;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_accounts")
public class UserAccount {

    @Id
    @GeneratedValue
    @Column(name = "account_id", columnDefinition = "UUID")
    private UUID accountId;

    @Column(name = "email_address", nullable = false, unique = true, length = 320)
    private String emailAddress;

    @Column(name = "credential_hash", nullable = false)
    private String credentialHash;

    @Column(name = "account_status", nullable = false, length = 16)
    private String accountStatus = "active";

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public UserAccount() {
    }

    public UserAccount(String emailAddress, String credentialHash) {
        this.emailAddress = emailAddress;
        this.credentialHash = credentialHash;
        this.accountStatus = "active";
        this.createdAt = Instant.now();
    }

    public UUID getAccountId() {
        return accountId;
    }

    public void setAccountId(UUID accountId) {
        this.accountId = accountId;
    }

    public String getEmailAddress() {
        return emailAddress;
    }

    public void setEmailAddress(String emailAddress) {
        this.emailAddress = emailAddress;
    }

    public String getCredentialHash() {
        return credentialHash;
    }

    public void setCredentialHash(String credentialHash) {
        this.credentialHash = credentialHash;
    }

    public String getAccountStatus() {
        return accountStatus;
    }

    public void setAccountStatus(String accountStatus) {
        this.accountStatus = accountStatus;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
