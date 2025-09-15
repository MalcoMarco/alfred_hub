-- Script SQL para crear la tabla de usuarios
-- Ejecutar en tu base de datos MySQL

CREATE DATABASE IF NOT EXISTS alfredpay_compliance;
USE alfredpay_compliance;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'compliance_officer', 'analyst', 'viewer') DEFAULT 'viewer',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

-- Insertar usuario de prueba (password: 123456)
INSERT INTO users (email, password, role, first_name, last_name) VALUES 
('admin@alfredpay.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Admin', 'AlfredPay'),
('compliance@alfredpay.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'compliance_officer', 'Marino', 'Marrero'),
('analyst@alfredpay.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'analyst', 'Diego', 'Yánez');

-- Nota: El password hasheado corresponde a "123456"
-- Para generar un nuevo hash en PHP usa: password_hash('tu_password', PASSWORD_DEFAULT)

-- Índices adicionales para mejor rendimiento
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(active);
CREATE INDEX idx_users_role ON users(role);