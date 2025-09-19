-- Tabla para almacenar wallets registradas
CREATE TABLE IF NOT EXISTS wallets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    address VARCHAR(42) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    tag VARCHAR(50),
    is_contract BOOLEAN DEFAULT FALSE,
    balance_eth DECIMAL(20, 8) DEFAULT 0,
    last_balance_check TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    
    -- Índices para optimizar búsquedas
    INDEX idx_address (address),
    INDEX idx_name (name),
    INDEX idx_tag (tag),
    INDEX idx_created_at (created_at),
    
    -- Constraint para validar formato de dirección Ethereum
    CONSTRAINT chk_address_format CHECK (address REGEXP '^0x[a-fA-F0-9]{40}$')
);

-- Insertar algunas wallets de ejemplo (opcionales)
INSERT IGNORE INTO wallets (address, name, description, tag) VALUES
('0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe', 'Ethereum Foundation', 'Official Ethereum Foundation wallet', 'foundation'),
('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'Vitalik Buterin', 'Vitalik Buterin personal wallet', 'vip'),
('0xA0b86a33E6441E81a7F9c7C71C07Ae89c8E1e54B', 'Binance Hot Wallet', 'Binance exchange hot wallet', 'exchange'),
('0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503', 'MetaMask Institutional', 'MetaMask Institutional treasury', 'institution');

-- Tabla para almacenar transacciones monitoreadas (opcional, para futuras funcionalidades)
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_id INT NOT NULL,
    tx_hash VARCHAR(66) NOT NULL,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    value_eth DECIMAL(20, 8) NOT NULL,
    gas_price BIGINT,
    gas_used BIGINT,
    block_number BIGINT,
    timestamp TIMESTAMP NOT NULL,
    status ENUM('success', 'failed') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
    INDEX idx_wallet_id (wallet_id),
    INDEX idx_tx_hash (tx_hash),
    INDEX idx_timestamp (timestamp),
    INDEX idx_block_number (block_number)
);

-- Tabla para almacenar tokens de las wallets (opcional)
CREATE TABLE IF NOT EXISTS wallet_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_id INT NOT NULL,
    contract_address VARCHAR(42) NOT NULL,
    token_name VARCHAR(100),
    token_symbol VARCHAR(20),
    token_decimals INT DEFAULT 18,
    balance DECIMAL(30, 0) DEFAULT 0,
    balance_formatted DECIMAL(20, 8) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
    UNIQUE KEY unique_wallet_token (wallet_id, contract_address),
    INDEX idx_wallet_id (wallet_id),
    INDEX idx_contract_address (contract_address),
    INDEX idx_token_symbol (token_symbol)
);