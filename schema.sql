CREATE TABLE IF NOT EXISTS `member_cache` (
  `fuid` int(11) NOT NULL,
  `username` text NOT NULL,
  `last_seen` datetime DEFAULT NULL,
  PRIMARY KEY (`fuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `notes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `noting_member_fuid` int(11) NOT NULL,
  `pr_number` int(11) NOT NULL,
  `note_text` text NOT NULL,
  `created` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `noting_member_fuid_FK1` (`noting_member_fuid`),
  KEY `pr_number_FK1` (`pr_number`),
  CONSTRAINT `noting_member_fuid_FK1` FOREIGN KEY (`noting_member_fuid`) REFERENCES `member_cache` (`fuid`),
  CONSTRAINT `pr_number_FK1` FOREIGN KEY (`pr_number`) REFERENCES `prs` (`pr_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `prs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pr_number` int(11) NOT NULL,
  `pr_name` text NOT NULL,
  `pr_type` text NOT NULL,
  `date_opened` datetime NOT NULL,
  `pr_status` enum('OPEN','CLOSED','MERGED') NOT NULL DEFAULT 'OPEN',
  `pr_types` text NOT NULL DEFAULT '[]',
  `author_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pr_number` (`pr_number`),
  KEY `pr_status` (`pr_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `tm_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `requesting_member_fuid` int(11) NOT NULL,
  `pr_number` int(11) NOT NULL,
  `created` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `pr_number_FK2` (`pr_number`),
  KEY `requesting_member_fuid_FK1` (`requesting_member_fuid`),
  CONSTRAINT `pr_number_FK2` FOREIGN KEY (`pr_number`) REFERENCES `prs` (`pr_number`),
  CONSTRAINT `requesting_member_fuid_FK1` FOREIGN KEY (`requesting_member_fuid`) REFERENCES `member_cache` (`fuid`)
) ENGINE=InnoDB CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `votes_new` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `voting_member_fuid` int(11) NOT NULL,
  `pr_number` int(11) NOT NULL,
  `voting_group` enum('LEGACY','DESIGN','BALANCE','VETO','SPRITE','MAP') NOT NULL,
  `vote_type` enum('APPROVE','OBJECT') NOT NULL,
  `created` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `enforce_unique_votes` (`voting_member_fuid`,`pr_number`,`voting_group`,`vote_type`),
  KEY `pr_number_FK3` (`pr_number`),
  CONSTRAINT `pr_number_FK3` FOREIGN KEY (`pr_number`) REFERENCES `prs` (`pr_number`),
  CONSTRAINT `voting_member_fuid_FK1` FOREIGN KEY (`voting_member_fuid`) REFERENCES `member_cache` (`fuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
