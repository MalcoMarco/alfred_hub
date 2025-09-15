<?php
require_once 'config.php';
require_once '../vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

handleCors();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

// Obtener token del header
$token = getBearerToken();

if (!$token) {
    http_response_code(401);
    echo json_encode(['error' => 'Token no proporcionado']);
    exit;
}

try {
    // Validar y decodificar el JWT
    $decoded = JWT::decode($token, new Key($jwt_secret, 'HS256'));
    
    // El token es válido
    echo json_encode([
        'valid' => true,
        'user' => [
            'id' => $decoded->sub,
            'email' => $decoded->email,
            'role' => $decoded->role ?? null
        ]
    ]);
    
} catch (Firebase\JWT\ExpiredException $e) {
    http_response_code(401);
    echo json_encode(['error' => 'Token expirado']);
} catch (Firebase\JWT\SignatureInvalidException $e) {
    http_response_code(401);
    echo json_encode(['error' => 'Token inválido']);
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(['error' => 'Token malformado']);
}
?>