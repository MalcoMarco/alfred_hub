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

// Obtener datos del POST
$input = json_decode(file_get_contents('php://input'), true);
$email = $input['email'] ?? '';
$password = $input['password'] ?? '';

if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['error' => 'Email y contraseña son requeridos']);
    exit;
}

try {
    // Buscar usuario en la base de datos
    $stmt = $pdo->prepare("SELECT id, email, password, role FROM users WHERE email = ? AND active = 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($password, $user['password'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Credenciales inválidas']);
        exit;
    }

    // Crear payload del JWT
    $payload = [
        'sub' => $user['id'],           // Subject (ID del usuario)
        'email' => $user['email'],      // Email del usuario
        'role' => $user['role'],        // Rol del usuario
        'iat' => time(),               // Issued at (cuando se creó)
        'exp' => time() + (24 * 60 * 60) // Expires (24 horas desde ahora)
    ];

    // Generar JWT
    $jwt = JWT::encode($payload, $jwt_secret, 'HS256');

    // Actualizar último login
    $updateStmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
    $updateStmt->execute([$user['id']]);

    // Respuesta exitosa
    echo json_encode([
        'token' => $jwt,
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role']
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error del servidor', 'details' => $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error generando token', 'details' => $e->getMessage()]);
}
?>