package org.simpleapp.repository;

import org.simpleapp.model.PasswordBlocklistEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PasswordBlocklistRepository extends JpaRepository<PasswordBlocklistEntry, String> {
}
