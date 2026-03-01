CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    campus VARCHAR(255),
    contact_url VARCHAR(255),
    email VARCHAR(255),
    password VARCHAR(255),
    phone_number VARCHAR(255),
    total_co2saved DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_swaps_completed INTEGER NOT NULL DEFAULT 0,
    total_water_saved DOUBLE PRECISION NOT NULL DEFAULT 0,
    username VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS clothing_items (
    id BIGSERIAL PRIMARY KEY,
    active BOOLEAN DEFAULT TRUE,
    campus VARCHAR(255),
    category VARCHAR(255),
    clothing_type VARCHAR(255),
    color VARCHAR(255),
    color_tags VARCHAR(500),
    condition VARCHAR(255),
    description VARCHAR(255),
    gender VARCHAR(255),
    image_url VARCHAR(255),
    size VARCHAR(255),
    style VARCHAR(255),
    style_tags VARCHAR(500),
    title VARCHAR(255),
    user_id BIGINT
);

CREATE TABLE IF NOT EXISTS swipe_ledger (
    id BIGSERIAL PRIMARY KEY,
    action VARCHAR(255),
    confirmed BOOLEAN,
    item_id_to BIGINT,
    timestamp TIMESTAMP,
    user_id_from BIGINT
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_clothing_items_active_campus ON clothing_items (active, campus);
CREATE INDEX IF NOT EXISTS idx_clothing_items_filters ON clothing_items (gender, clothing_type, size, color, style);
CREATE INDEX IF NOT EXISTS idx_clothing_items_user_id ON clothing_items (user_id);
CREATE INDEX IF NOT EXISTS idx_swipe_ledger_user_action ON swipe_ledger (user_id_from, action);
CREATE INDEX IF NOT EXISTS idx_swipe_ledger_item ON swipe_ledger (item_id_to);
