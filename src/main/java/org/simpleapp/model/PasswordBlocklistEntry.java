package org.simpleapp.model;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "password_blocklist")
public class PasswordBlocklistEntry {

    @Id
    @Column(name = "entry_hash", length = 64, nullable = false)
    private String entryHash;

    public PasswordBlocklistEntry() {
    }

    public PasswordBlocklistEntry(String entryHash) {
        this.entryHash = entryHash;
    }

    public String getEntryHash() {
        return entryHash;
    }

    public void setEntryHash(String entryHash) {
        this.entryHash = entryHash;
    }
}
