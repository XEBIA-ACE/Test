-- Seed password blocklist with SHA-256 hashes of common passwords (lowercased)
-- "password" -> 5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8
-- "123456" -> 8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92
-- "qwerty" -> 65e84be33532fb784c48129675f9eff3a682b27168c0ea744b2cf58ee02337c5
-- "abc123" -> 6ca13d52ca70c883e0f0bb101e425a89e8624de51db2d2392593af6a84118090
-- "password1!" -> 65c21921ca10a8502757efc9aa552874d181c6206feb2845a921eb57f5e518d4
-- "password123" -> ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f

INSERT INTO password_blocklist (entry_hash) VALUES ('5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8');
INSERT INTO password_blocklist (entry_hash) VALUES ('8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92');
INSERT INTO password_blocklist (entry_hash) VALUES ('65e84be33532fb784c48129675f9eff3a682b27168c0ea744b2cf58ee02337c5');
INSERT INTO password_blocklist (entry_hash) VALUES ('6ca13d52ca70c883e0f0bb101e425a89e8624de51db2d2392593af6a84118090');
INSERT INTO password_blocklist (entry_hash) VALUES ('65c21921ca10a8502757efc9aa552874d181c6206feb2845a921eb57f5e518d4');
INSERT INTO password_blocklist (entry_hash) VALUES ('ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f');
