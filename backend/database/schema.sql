-- ============================================================
--  ArtForge Database Schema
--  Run this entire file in MySQL Workbench
-- ============================================================

CREATE DATABASE IF NOT EXISTS artforge_db;
USE artforge_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id              VARCHAR(36)     PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL,
    email           VARCHAR(150)    UNIQUE NOT NULL,
    password        VARCHAR(255)    NOT NULL,
    role            ENUM('ADMIN','ARTIST','VISITOR','CURATOR') DEFAULT 'VISITOR',
    avatar          VARCHAR(500),
    wallet_balance  DECIMAL(12,2)   DEFAULT 50000.00,
    subscription    VARCHAR(50)     DEFAULT 'Basic',
    joined_date     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    total_earned    DECIMAL(12,2)   DEFAULT 0.00,
    bio             TEXT
);

-- Artworks table
CREATE TABLE IF NOT EXISTS artworks (
    id                  VARCHAR(36)     PRIMARY KEY,
    title               VARCHAR(200)    NOT NULL,
    artist              VARCHAR(100)    NOT NULL,
    description         TEXT,
    year                INT,
    image_url           VARCHAR(500),
    price               DECIMAL(12,2)   NOT NULL,
    category            VARCHAR(50),
    cultural_history    TEXT,
    curator_insight     TEXT,
    is_auction          BOOLEAN         DEFAULT FALSE,
    current_bid         DECIMAL(12,2),
    bid_end_time        TIMESTAMP       NULL,
    owner_id            VARCHAR(36),
    current_owner_name  VARCHAR(100),
    is_listed           BOOLEAN         DEFAULT TRUE,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Bids table
CREATE TABLE IF NOT EXISTS bids (
    id          VARCHAR(36)     PRIMARY KEY,
    artwork_id  VARCHAR(36)     NOT NULL,
    bidder_id   VARCHAR(36)     NOT NULL,
    bidder_name VARCHAR(100),
    amount      DECIMAL(12,2)   NOT NULL,
    timestamp   TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE,
    FOREIGN KEY (bidder_id)  REFERENCES users(id)    ON DELETE CASCADE
);

-- Exhibitions table
CREATE TABLE IF NOT EXISTS exhibitions (
    id          VARCHAR(36)     PRIMARY KEY,
    title       VARCHAR(200)    NOT NULL,
    theme       VARCHAR(200),
    curator_id  VARCHAR(36),
    banner_url  VARCHAR(500),
    description TEXT,
    status      ENUM('active','upcoming','closed') DEFAULT 'upcoming',
    FOREIGN KEY (curator_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Exhibition <-> Artworks (many-to-many)
CREATE TABLE IF NOT EXISTS exhibition_artworks (
    exhibition_id  VARCHAR(36),
    artwork_id     VARCHAR(36),
    PRIMARY KEY (exhibition_id, artwork_id),
    FOREIGN KEY (exhibition_id) REFERENCES exhibitions(id) ON DELETE CASCADE,
    FOREIGN KEY (artwork_id)    REFERENCES artworks(id)    ON DELETE CASCADE
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id              VARCHAR(36)     PRIMARY KEY,
    user_id         VARCHAR(36)     NOT NULL,
    type            ENUM('sale','purchase','bid_fee') NOT NULL,
    amount          DECIMAL(12,2)   NOT NULL,
    date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    description     VARCHAR(300),
    status          ENUM('completed','pending','processing') DEFAULT 'completed',
    payment_method  VARCHAR(100)    DEFAULT 'ArtWallet',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Purchase History
CREATE TABLE IF NOT EXISTS purchase_history (
    id              VARCHAR(36)     PRIMARY KEY,
    artwork_id      VARCHAR(36),
    artwork_title   VARCHAR(200),
    buyer_id        VARCHAR(36),
    buyer_name      VARCHAR(100),
    amount          DECIMAL(12,2),
    purchase_date   TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
--  Seed Data — Default admin user (password: admin123)
-- ============================================================
INSERT IGNORE INTO users (id, name, email, password, role, avatar, wallet_balance, subscription, total_earned)
VALUES (
    'admin-001',
    'Admin',
    'admin@artforge.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'ADMIN',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    1000000.00,
    'Elite',
    0.00
);

-- Seed artworks
INSERT IGNORE INTO artworks (id, title, artist, description, year, image_url, price, category, is_auction, current_bid, is_listed, current_owner_name) VALUES
('art-001', 'Echoes of Eternity',    'Elena Vance',    'An abstract exploration of time and memory using layered gold leaf and deep cerulean pigments.', 2023, 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=1000', 4500.00, 'Abstract',   TRUE,  4200.00, TRUE, 'Elena Vance'),
('art-002', 'The Silent Watcher',    'Marcus Thorne',  'A hyper-realistic charcoal portrait capturing the wisdom of the coastal elders.',                  2022, 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=1000', 3200.00, 'Realism',    FALSE, NULL,    TRUE, 'Marcus Thorne'),
('art-003', 'Neon Renaissance',      'Sora Kim',       'Classic sculpture forms reimagined with cyberpunk aesthetic and digital projections.',               2024, 'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&q=80&w=1000', 8900.00, 'Mixed Media',TRUE,  7500.00, TRUE, 'Sora Kim'),
('art-004', 'Whispers of the Tundra','Anya Petrov',    'A minimalist landscape piece evoking the vast, chilling beauty of the Arctic.',                     2023, 'https://images.unsplash.com/photo-1501472312651-726afe119ff1?auto=format&fit=crop&q=80&w=1000', 2100.00, 'Minimalism', FALSE, NULL,    TRUE, 'Anya Petrov'),
('art-005', 'Kinetic Solitude',      'David Chen',     'A study of movement in stillness through long-exposure painting techniques.',                         2024, 'https://images.unsplash.com/photo-1515405290399-ed34273bb427?auto=format&fit=crop&q=80&w=1000', 5600.00, 'Abstract',   TRUE,  5100.00, TRUE, 'David Chen'),
('art-006', 'The Glass Horizon',     'Isabella Ross',  'A breathtaking digital render of a futuristic skyline reflected in a calm ocean.',                   2023, 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1000',12000.00, 'Digital',    FALSE, NULL,    TRUE, 'Isabella Ross'),
('art-007', 'Velvet Shadows',        'Julian Reed',    'An intimate oil painting exploring light and shadow in a silent corridor.',                          2022, 'https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&q=80&w=1000', 3800.00, 'Oil',        FALSE, NULL,    TRUE, 'Julian Reed'),
('art-008', 'Celestial Pulse',       'Sora Kim',       'Dynamic swirls of ultraviolet and deep violet, mimicking the birth of a star.',                      2024, 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=1000', 6400.00, 'Abstract',   TRUE,  6000.00, TRUE, 'Sora Kim');
