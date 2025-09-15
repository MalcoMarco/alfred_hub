<?php
// Configuración de la base de datos
$host = 'localhost';
$dbname = 'compliance_hub'; // Cambia por el nombre de tu base de datos
$username = 'malco'; // Cambia por tu usuario de base de datos
$password = 'password'; // Cambia por tu contraseña de base de datos

// Clave secreta para JWT (CAMBIAR EN PRODUCCIÓN)
$jwt_secret = 'TU_CLAVE_SECRETA_SUPER_SEGURA_2024'; // ¡Cambiar por una clave única y segura!

// Configuración CORS
$allowed_origins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://tu-dominio.com'
];

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
    
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    if (in_array($origin, $allowed_origins)) {
        header("Access-Control-Allow-Origin: $origin");
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
?>