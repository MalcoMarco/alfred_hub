<?php
require_once 'config.php';
require_once '../vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

handleCors();
header('Content-Type: application/json');

// Validar token en todas las peticiones
$token = getBearerToken();

if (!$token) {
    http_response_code(401);
    echo json_encode(['error' => 'Token no proporcionado']);
    exit;
}

try {
    $decoded = JWT::decode($token, new Key($jwt_secret, 'HS256'));
    $currentUserId = $decoded->sub;
    $currentUserRole = $decoded->role ?? 'viewer';
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(['error' => 'Token inválido']);
    exit;
}

// Función para verificar permisos
function hasPermission($currentRole, $action, $targetUserId = null, $currentUserId = null) {
    // Solo admins pueden gestionar usuarios
    if ($currentRole === 'admin') {
        return true;
    }
    
    // Los usuarios pueden ver su propio perfil
    if ($action === 'view' && $targetUserId === $currentUserId) {
        return true;
    }
    
    // Compliance officers pueden ver usuarios
    if ($currentRole === 'compliance_officer' && $action === 'view') {
        return true;
    }
    
    return false;
}

$method = $_SERVER['REQUEST_METHOD'];
$userId = $_GET['id'] ?? null;
$action = $_GET['action'] ?? null;
$search = $_GET['search'] ?? null;

try {
    switch ($method) {
        case 'GET':
            if ($action === 'stats') {
                // Obtener estadísticas
                if (!hasPermission($currentUserRole, 'admin')) {
                    http_response_code(403);
                    echo json_encode(['error' => 'Sin permisos para ver estadísticas']);
                    exit;
                }
                
                $stats = [
                    'total' => 0,
                    'active' => 0,
                    'inactive' => 0,
                    'byRole' => [
                        'admin' => 0,
                        'compliance_officer' => 0,
                        'ceo' => 0,
                        'ops_vp' => 0
                    ]
                ];
                
                $stmt = $pdo->query("
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) as active,
                        SUM(CASE WHEN active = 0 THEN 1 ELSE 0 END) as inactive
                    FROM users
                ");
                $totals = $stmt->fetch(PDO::FETCH_ASSOC);
                
                $stmt = $pdo->query("
                    SELECT role, COUNT(*) as count 
                    FROM users 
                    GROUP BY role
                ");
                $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                $stats['total'] = (int)$totals['total'];
                $stats['active'] = (int)$totals['active'];
                $stats['inactive'] = (int)$totals['inactive'];
                
                foreach ($roles as $role) {
                    $stats['byRole'][$role['role']] = (int)$role['count'];
                }
                
                echo json_encode($stats);
                
            } elseif ($search) {
                // Buscar usuarios
                if (!hasPermission($currentUserRole, 'view')) {
                    http_response_code(403);
                    echo json_encode(['error' => 'Sin permisos para buscar usuarios']);
                    exit;
                }
                
                $stmt = $pdo->prepare("
                    SELECT id, email, first_name, last_name, role, active, 
                           created_at, updated_at, last_login
                    FROM users 
                    WHERE (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)
                    ORDER BY first_name, last_name
                ");
                $searchTerm = "%$search%";
                $stmt->execute([$searchTerm, $searchTerm, $searchTerm]);
                $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Formatear respuesta
                $formatted = array_map('formatUser', $users);
                echo json_encode($formatted);
                
            } elseif ($userId) {
                // Obtener usuario específico
                if (!hasPermission($currentUserRole, 'view', $userId, $currentUserId)) {
                    http_response_code(403);
                    echo json_encode(['error' => 'Sin permisos para ver este usuario']);
                    exit;
                }
                
                $stmt = $pdo->prepare("
                    SELECT id, email, first_name, last_name, role, active, 
                           created_at, updated_at, last_login
                    FROM users 
                    WHERE id = ?
                ");
                $stmt->execute([$userId]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$user) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Usuario no encontrado']);
                    exit;
                }
                
                echo json_encode(formatUser($user));
                
            } else {
                // Listar todos los usuarios
                if (!hasPermission($currentUserRole, 'view')) {
                    http_response_code(403);
                    echo json_encode(['error' => 'Sin permisos para ver usuarios']);
                    exit;
                }
                
                $stmt = $pdo->query("
                    SELECT id, email, first_name, last_name, role, active, 
                           created_at, updated_at, last_login
                    FROM users 
                    ORDER BY created_at DESC
                ");
                $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Formatear respuesta
                $formatted = array_map('formatUser', $users);
                echo json_encode($formatted);
            }
            break;
            
        case 'POST':
            // Crear nuevo usuario
            if (!hasPermission($currentUserRole, 'create')) {
                http_response_code(403);
                echo json_encode(['error' => 'Sin permisos para crear usuarios']);
                exit;
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            $email = $input['email'] ?? '';
            $firstName = $input['firstName'] ?? '';
            $lastName = $input['lastName'] ?? '';
            $role = $input['role'] ?? 'viewer';
            $password = $input['password'] ?? '';
            
            // Validaciones
            if (empty($email) || empty($firstName) || empty($lastName) || empty($password)) {
                http_response_code(400);
                echo json_encode(['error' => 'Todos los campos son requeridos']);
                exit;
            }
            
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(['error' => 'Email inválido']);
                exit;
            }
            
            if (!in_array($role, ['admin', 'compliance_officer', 'ceo', 'ops_vp'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Rol inválido']);
                exit;
            }
            
            // Verificar si el email ya existe
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                http_response_code(409);
                echo json_encode(['error' => 'El email ya está en uso']);
                exit;
            }
            
            // Hash de la contraseña
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            
            // Crear usuario
            $stmt = $pdo->prepare("
                INSERT INTO users (email, password, first_name, last_name, role, active) 
                VALUES (?, ?, ?, ?, ?, 1)
            ");
            $stmt->execute([$email, $hashedPassword, $firstName, $lastName, $role]);
            
            $newUserId = $pdo->lastInsertId();
            
            // Obtener el usuario creado
            $stmt = $pdo->prepare("
                SELECT id, email, first_name, last_name, role, active, 
                       created_at, updated_at, last_login
                FROM users 
                WHERE id = ?
            ");
            $stmt->execute([$newUserId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode(formatUser($user));
            break;
            
        case 'PUT':
            // Actualizar usuario
            if (!$userId) {
                http_response_code(400);
                echo json_encode(['error' => 'ID de usuario requerido']);
                exit;
            }
            
            if (!hasPermission($currentUserRole, 'update', $userId, $currentUserId)) {
                http_response_code(403);
                echo json_encode(['error' => 'Sin permisos para actualizar este usuario']);
                exit;
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            $updates = [];
            $params = [];
            
            if (isset($input['email'])) {
                if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Email inválido']);
                    exit;
                }
                $updates[] = "email = ?";
                $params[] = $input['email'];
            }
            
            if (isset($input['firstName'])) {
                $updates[] = "first_name = ?";
                $params[] = $input['firstName'];
            }
            
            if (isset($input['lastName'])) {
                $updates[] = "last_name = ?";
                $params[] = $input['lastName'];
            }
            
            if (isset($input['role'])) {
                if (!in_array($input['role'], ['admin', 'compliance_officer', 'ceo', 'ops_vp'])) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Rol inválido']);
                    exit;
                }
                $updates[] = "role = ?";
                $params[] = $input['role'];
            }
            
            if (isset($input['password']) && !empty($input['password'])) {
                $updates[] = "password = ?";
                $params[] = password_hash($input['password'], PASSWORD_DEFAULT);
            }
            
            if (empty($updates)) {
                http_response_code(400);
                echo json_encode(['error' => 'No hay campos para actualizar']);
                exit;
            }
            
            $updates[] = "updated_at = NOW()";
            $params[] = $userId;
            
            $sql = "UPDATE users SET " . implode(", ", $updates) . " WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            // Obtener usuario actualizado
            $stmt = $pdo->prepare("
                SELECT id, email, first_name, last_name, role, active, 
                       created_at, updated_at, last_login
                FROM users 
                WHERE id = ?
            ");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode(formatUser($user));
            break;
            
        case 'PATCH':
            // Operaciones específicas (cambiar estado, etc.)
            if (!hasPermission($currentUserRole, 'update')) {
                http_response_code(403);
                echo json_encode(['error' => 'Sin permisos para esta operación']);
                exit;
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $targetUserId = $input['id'] ?? null;
            $patchAction = $input['action'] ?? null;
            
            if (!$targetUserId || !$patchAction) {
                http_response_code(400);
                echo json_encode(['error' => 'ID y acción requeridos']);
                exit;
            }
            
            if ($patchAction === 'toggle_status') {
                $stmt = $pdo->prepare("
                    UPDATE users 
                    SET active = NOT active, updated_at = NOW() 
                    WHERE id = ?
                ");
                $stmt->execute([$targetUserId]);
                
                // Obtener usuario actualizado
                $stmt = $pdo->prepare("
                    SELECT id, email, first_name, last_name, role, active, 
                           created_at, updated_at, last_login
                    FROM users 
                    WHERE id = ?
                ");
                $stmt->execute([$targetUserId]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                
                echo json_encode(formatUser($user));
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Acción no válida']);
            }
            break;
            
        case 'DELETE':
            // Soft delete del usuario
            if (!$userId) {
                http_response_code(400);
                echo json_encode(['error' => 'ID de usuario requerido']);
                exit;
            }
            
            if (!hasPermission($currentUserRole, 'delete')) {
                http_response_code(403);
                echo json_encode(['error' => 'Sin permisos para eliminar usuarios']);
                exit;
            }
            
            // No permitir eliminar el propio usuario
            if ($userId == $currentUserId) {
                http_response_code(400);
                echo json_encode(['error' => 'No puedes eliminar tu propia cuenta']);
                exit;
            }
            
            $stmt = $pdo->prepare("
                UPDATE users 
                SET active = 0, updated_at = NOW() 
                WHERE id = ?
            ");
            $stmt->execute([$userId]);
            
            echo json_encode(['message' => 'Usuario eliminado exitosamente']);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
            break;
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de base de datos', 'details' => $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error del servidor', 'details' => $e->getMessage()]);
}

// Función para formatear datos del usuario
function formatUser($user) {
    return [
        'id' => (int)$user['id'],
        'email' => $user['email'],
        'firstName' => $user['first_name'],
        'lastName' => $user['last_name'],
        'role' => $user['role'],
        'active' => (bool)$user['active'],
        'createdAt' => $user['created_at'],
        'updatedAt' => $user['updated_at'],
        'lastLogin' => $user['last_login']
    ];
}
?>