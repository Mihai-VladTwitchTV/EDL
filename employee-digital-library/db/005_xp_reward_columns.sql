ALTER TABLE content_items
    ADD COLUMN xp_reward INTEGER NOT NULL DEFAULT 10,
    ADD COLUMN xp_bonus_first_attempt INTEGER NOT NULL DEFAULT 0;
