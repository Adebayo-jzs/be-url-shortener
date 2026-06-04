CREATE TABLE IF NOT EXISTS url_mappings (
    short_code VARCHAR(255) PRIMARY KEY,
    long_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP WITH TIME ZONE,
    click_count INTEGER DEFAULT 0
);

-- Partial index on expiry_date to speed up lookups/cleanses for links that expire
CREATE INDEX IF NOT EXISTS idx_url_mappings_expiry_date 
ON url_mappings (expiry_date) 
WHERE expiry_date IS NOT NULL;
