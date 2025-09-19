<?php
require_once 'config.php';

// Manejar CORS
handleCors();

// Verificar autenticación
$token = getBearerToken();
if (!$token || !validateJWT($token)) {
    http_response_code(401);
    echo json_encode(['error' => 'Token inválido o expirado']);
    exit;
}

// Obtener datos del usuario del token
$userData = getUserFromToken($token);
if (!$userData) {
    http_response_code(401);
    echo json_encode(['error' => 'Usuario no encontrado']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            handleGetWallets();
            break;
        case 'POST':
            handleCreateWallet($userData['id']);
            break;
        case 'PUT':
            handleUpdateWallet($userData['id']);
            break;
        case 'DELETE':
            handleDeleteWallet($userData['id']);
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

// Obtener todas las wallets con información adicional
function handleGetWallets() {
    global $pdo;
    
    try {
        $sql = "SELECT 
                    w.*,
                    COUNT(wt.id) as transaction_count,
                    COUNT(wtk.id) as token_count
                FROM wallets w
                LEFT JOIN wallet_transactions wt ON w.id = wt.wallet_id
                LEFT JOIN wallet_tokens wtk ON w.id = wtk.wallet_id
                GROUP BY w.id
                ORDER BY w.created_at DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $wallets = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Formatear datos para el frontend
        foreach ($wallets as &$wallet) {
            $wallet['balance_eth'] = floatval($wallet['balance_eth']);
            $wallet['transaction_count'] = intval($wallet['transaction_count']);
            $wallet['token_count'] = intval($wallet['token_count']);
            $wallet['is_contract'] = (bool) $wallet['is_contract'];
        }
        
        http_response_code(200);
        echo json_encode($wallets);
        
    } catch (PDOException $e) {
        throw new Exception('Error al obtener wallets: ' . $e->getMessage());
    }
}

// Crear una nueva wallet
function handleCreateWallet($userId) {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validar datos requeridos
    if (!isset($input['address']) || !isset($input['name'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Dirección y nombre son requeridos']);
        return;
    }
    
    $address = trim($input['address']);
    $name = trim($input['name']);
    $description = $input['description'] ?? '';
    $tag = $input['tag'] ?? '';
    
    // Validar formato de dirección Ethereum
    if (!preg_match('/^0x[a-fA-F0-9]{40}$/', $address)) {
        http_response_code(400);
        echo json_encode(['error' => 'Formato de dirección Ethereum inválido']);
        return;
    }
    
    try {
        // Verificar si ya existe
        $checkSql = "SELECT id FROM wallets WHERE address = ?";
        $checkStmt = $pdo->prepare($checkSql);
        $checkStmt->execute([$address]);
        
        if ($checkStmt->fetch()) {
            http_response_code(409);
            echo json_encode(['error' => 'Esta wallet ya está registrada']);
            return;
        }
        
        // Insertar nueva wallet
        $sql = "INSERT INTO wallets (address, name, description, tag, created_by) 
                VALUES (?, ?, ?, ?, ?)";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$address, $name, $description, $tag, $userId]);
        
        $walletId = $pdo->lastInsertId();
        
        // Obtener la wallet creada con información completa
        $getSql = "SELECT * FROM wallets WHERE id = ?";
        $getStmt = $pdo->prepare($getSql);
        $getStmt->execute([$walletId]);
        $wallet = $getStmt->fetch(PDO::FETCH_ASSOC);
        
        // Formatear datos
        $wallet['balance_eth'] = floatval($wallet['balance_eth']);
        $wallet['is_contract'] = (bool) $wallet['is_contract'];
        $wallet['transaction_count'] = 0;
        $wallet['token_count'] = 0;
        
        http_response_code(201);
        echo json_encode([
            'message' => 'Wallet registrada exitosamente',
            'wallet' => $wallet
        ]);
        
    } catch (PDOException $e) {
        throw new Exception('Error al crear wallet: ' . $e->getMessage());
    }
}

// Actualizar una wallet existente
function handleUpdateWallet($userId) {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID de wallet requerido']);
        return;
    }
    
    $walletId = intval($input['id']);
    $name = $input['name'] ?? null;
    $description = $input['description'] ?? null;
    $tag = $input['tag'] ?? null;
    $balanceEth = $input['balance_eth'] ?? null;
    $isContract = isset($input['is_contract']) ? (bool) $input['is_contract'] : null;
    
    try {
        // Verificar que la wallet existe
        $checkSql = "SELECT id FROM wallets WHERE id = ?";
        $checkStmt = $pdo->prepare($checkSql);
        $checkStmt->execute([$walletId]);
        
        if (!$checkStmt->fetch()) {
            http_response_code(404);
            echo json_encode(['error' => 'Wallet no encontrada']);
            return;
        }
        
        // Construir query dinámico
        $updateFields = [];
        $params = [];
        
        if ($name !== null) {
            $updateFields[] = "name = ?";
            $params[] = trim($name);
        }
        if ($description !== null) {
            $updateFields[] = "description = ?";
            $params[] = $description;
        }
        if ($tag !== null) {
            $updateFields[] = "tag = ?";
            $params[] = $tag;
        }
        if ($balanceEth !== null) {
            $updateFields[] = "balance_eth = ?, last_balance_check = NOW()";
            $params[] = floatval($balanceEth);
        }
        if ($isContract !== null) {
            $updateFields[] = "is_contract = ?";
            $params[] = $isContract;
        }
        
        if (empty($updateFields)) {
            http_response_code(400);
            echo json_encode(['error' => 'No hay campos para actualizar']);
            return;
        }
        
        $params[] = $walletId;
        $sql = "UPDATE wallets SET " . implode(', ', $updateFields) . " WHERE id = ?";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        // Obtener la wallet actualizada
        $getSql = "SELECT 
                    w.*,
                    COUNT(wt.id) as transaction_count,
                    COUNT(wtk.id) as token_count
                FROM wallets w
                LEFT JOIN wallet_transactions wt ON w.id = wt.wallet_id
                LEFT JOIN wallet_tokens wtk ON w.id = wtk.wallet_id
                WHERE w.id = ?
                GROUP BY w.id";
        
        $getStmt = $pdo->prepare($getSql);
        $getStmt->execute([$walletId]);
        $wallet = $getStmt->fetch(PDO::FETCH_ASSOC);
        
        // Formatear datos
        $wallet['balance_eth'] = floatval($wallet['balance_eth']);
        $wallet['transaction_count'] = intval($wallet['transaction_count']);
        $wallet['token_count'] = intval($wallet['token_count']);
        $wallet['is_contract'] = (bool) $wallet['is_contract'];
        
        http_response_code(200);
        echo json_encode([
            'message' => 'Wallet actualizada exitosamente',
            'wallet' => $wallet
        ]);
        
    } catch (PDOException $e) {
        throw new Exception('Error al actualizar wallet: ' . $e->getMessage());
    }
}

// Eliminar una wallet
function handleDeleteWallet($userId) {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID de wallet requerido']);
        return;
    }
    
    $walletId = intval($input['id']);
    
    try {
        // Verificar que la wallet existe
        $checkSql = "SELECT id, address FROM wallets WHERE id = ?";
        $checkStmt = $pdo->prepare($checkSql);
        $checkStmt->execute([$walletId]);
        $wallet = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$wallet) {
            http_response_code(404);
            echo json_encode(['error' => 'Wallet no encontrada']);
            return;
        }
        
        // Eliminar wallet (las tablas relacionadas se eliminan por CASCADE)
        $sql = "DELETE FROM wallets WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$walletId]);
        
        http_response_code(200);
        echo json_encode([
            'message' => 'Wallet eliminada exitosamente',
            'address' => $wallet['address']
        ]);
        
    } catch (PDOException $e) {
        throw new Exception('Error al eliminar wallet: ' . $e->getMessage());
    }
}

// Función helper para obtener el token Bearer
// function getBearerToken() {
//     $headers = getallheaders();
    
//     if (isset($headers['Authorization'])) {
//         if (preg_match('/Bearer\s+(.*)$/i', $headers['Authorization'], $matches)) {
//             return $matches[1];
//         }
//     }
    
//     return null;
// }
?>