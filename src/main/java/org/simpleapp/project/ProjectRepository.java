package org.simpleapp.project;

import java.time.Instant;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import org.springframework.stereotype.Repository;

/**
 * In-memory store for projects and project membership (US-003).
 *
 * <p>ADR-002: a local {@code project_members} membership set records which user
 * identities may access which projects; the owner is always treated as an
 * authorized member. ADR-003: listings are returned ordered by
 * {@code createdAt ASC, id ASC} for deterministic output (FR-010).
 */
@Repository
public class ProjectRepository {

    private final Map<UUID, Project> projects = new ConcurrentHashMap<>();
    private final Map<UUID, Set<UUID>> membersByProject = new ConcurrentHashMap<>();

    private static final Comparator<Project> LISTING_ORDER =
            Comparator.comparing(Project::getCreatedAt).thenComparing(Project::getId);

    public ProjectRepository() {
        seed();
    }

    /**
     * Persists a project and records its owner as a member. Exposed so newly
     * created projects become visible in the listing immediately (FR-005).
     */
    public Project save(Project project, Set<UUID> memberIds) {
        projects.put(project.getId(), project);
        Set<UUID> members = new LinkedHashSet<>();
        members.add(project.getOwnerId());
        if (memberIds != null) {
            members.addAll(memberIds);
        }
        membersByProject.put(project.getId(), members);
        return project;
    }

    public Optional<Project> findById(UUID id) {
        return Optional.ofNullable(projects.get(id));
    }

    /**
     * Returns every project the given user may access (owner or member),
     * ordered deterministically. Never null; empty when the user has access to
     * no projects (FR-008, EC-001).
     */
    public List<Project> findAccessibleByUser(UUID userId) {
        return projects.values().stream()
                .filter(project -> isMember(project.getId(), userId))
                .sorted(LISTING_ORDER)
                .collect(Collectors.toList());
    }

    public boolean isMember(UUID projectId, UUID userId) {
        Set<UUID> members = membersByProject.get(projectId);
        return members != null && members.contains(userId);
    }

    private void seed() {
        UUID alice = UUID.fromString("11111111-1111-1111-1111-111111111111");
        UUID bob = UUID.fromString("22222222-2222-2222-2222-222222222222");

        Instant base = Instant.parse("2026-01-01T00:00:00Z");

        Project apollo = new Project(
                UUID.fromString("aaaaaaaa-0000-0000-0000-000000000001"),
                "Apollo", "Flagship delivery programme", "internal",
                alice, base, base);
        Project gemini = new Project(
                UUID.fromString("aaaaaaaa-0000-0000-0000-000000000002"),
                "Gemini", "Client integration workstream", "client",
                bob, base.plusSeconds(3600), base.plusSeconds(3600));

        // Alice owns Apollo and is also a collaborator on Gemini.
        save(apollo, Set.of(bob));
        save(gemini, Set.of(alice));
    }
}
