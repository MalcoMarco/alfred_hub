<?php
// Configuración de la base de datos
$host = 'localhost';
$dbname = 'compliance_hub'; // Cambia por el nombre de tu base de datos (alfredco_hub)
$username = 'malco'; // Cambia por tu usuario de base de datos (alfredco_hub)
$password = 'password'; // Cambia por tu contraseña de base de datos (J17ehT95fC2t^^@1)

// Clave secreta para JWT (CAMBIAR EN PRODUCCIÓN)
$jwt_secret = 'TU_CLAVE_SECRETA_SUPER_SEGURA_2024'; // ¡Cambiar por una clave única y segura!

// Configuración CORS - Permitir cualquier origen
$allowed_origins = '*'; // Permite cualquier dominio

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de conexión a la base de datos']);
    exit;
}

// Configurar CORS
function handleCors() {
    global $allowed_origins;
    
    // Si $allowed_origins es '*', permitir cualquier origen
    if ($allowed_origins === '*') {
        header("Access-Control-Allow-Origin: *");
    } else {
        // Comportamiento original para dominios específicos
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        
        if (is_array($allowed_origins) && in_array($origin, $allowed_origins)) {
            header("Access-Control-Allow-Origin: $origin");
        }
    }
    
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Credentials: true');
    
    // Responder a preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

// Función para obtener el token del header Authorization
function getBearerToken() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        return $matches[1];
    }
    
    return null;
}

// Incluir JWT library
require_once __DIR__ . '/../vendor/autoload.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// Función para validar JWT
function validateJWT($token) {
    global $jwt_secret;
    
    try {
        $decoded = JWT::decode($token, new Key($jwt_secret, 'HS256'));
        return $decoded;
    } catch (Exception $e) {
        return false;
    }
}

// Función para obtener datos del usuario desde el token
function getUserFromToken($token) {
    global $pdo;
    
    $decoded = validateJWT($token);
    if (!$decoded) {
        return false;
    }
    
    try {
        $stmt = $pdo->prepare("SELECT id, email, role FROM users WHERE id = ? AND active = 1");
        $stmt->execute([$decoded->sub]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        return false;
    }
}
?>