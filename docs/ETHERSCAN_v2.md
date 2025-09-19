# Integración Etherscan API v2

Este módulo proporciona una integración completa con la API v2 de Etherscan para explorar la blockchain de Ethereum.

## 🚀 Nuevas Funcionalidades API v2

### ✨ Características Principales

- **Explorador de Balances**: Consulta balances de ETH de direcciones individuales o múltiples
- **Historial de Transacciones**: Visualiza transacciones normales e internas con detalles completos
- **🆕 Transferencias de Tokens**: Explora movimientos de tokens ERC-20 y ERC-721 (NFTs)
- **Análisis de Contratos**: Verifica código fuente y obtén información de contratos
- **Explorador de Bloques**: Consulta información detallada de bloques específicos
- **🆕 Gas Tracker**: Monitoreo en tiempo real de precios de gas (Rápido, Estándar, Seguro)
- **🆕 Estadísticas de Red**: Supply de ETH, transacciones diarias, altura de bloques

### 🔧 Configuración

1. **Obtén tu API Key**:
   - Visita [https://etherscan.io/apis](https://etherscan.io/apis)
   - Crea una cuenta gratuita
   - Genera tu API key

2. **Configura variables de entorno**:
   ```bash
   # .env.local
   VITE_ETHERSCAN_API_KEY=tu_api_key_aquí
   ```

### 📋 Endpoints API v2 Disponibles

#### Account Module
- `getBalance(address)` - Balance de ETH
- `getMultipleBalances(addresses[])` - Balances múltiples
- `getTransactions(address, options)` - Transacciones normales
- `getInternalTransactions(address, options)` - Transacciones internas
- `getTokenTransfers(address, options)` - 🆕 Transferencias ERC-20
- `getNFTTransfers(address, options)` - 🆕 Transferencias ERC-721

#### Contract Module
- `getContractSource(address)` - Código fuente del contrato
- `isContract(address)` - Verificar si es contrato

#### Stats Module
- `getEthPrice()` - Precio ETH/USD y ETH/BTC
- `getNetworkStats()` - 🆕 Estadísticas de la red
- `getGasTracker()` - 🆕 Precios de gas en tiempo real

#### Token Module
- `getTokenBalance(contractAddress, address)` - 🆕 Balance de token específico
- `getTokenInfo(contractAddress)` - 🆕 Información del token

#### Proxy Module
- `getBlockByNumber(blockNumber)` - Información del bloque
- `getTransactionByHash(hash)` - Detalles de transacción
- `getTransactionReceipt(hash)` - Recibo de transacción
- `getLatestBlock()` - 🆕 Último bloque minado

### 🎯 Mejoras en el Manejo de Respuestas

#### Tipado Fuerte
```typescript
interface EtherscanApiResponse<T> {
  status: string;
  message: string;
  result: T;
}
```

#### Manejo de Errores Mejorado
- Validación de respuestas API v2
- Manejo específico de casos válidos con status '0'
- Logging detallado de errores

#### Nuevas Interfaces
```typescript
interface EtherscanTokenTransfer {
  // Información completa de transferencias de tokens
}

interface EtherscanGasPrice {
  // Precios de gas en tiempo real
}
```

### 🖥️ Interfaz de Usuario Actualizada

#### Nuevos Tabs
- **🪙 Tokens**: Explorar transferencias ERC-20 y NFTs
- **🌐 Red**: Estadísticas en tiempo real de Ethereum

#### Dashboard Mejorado
- Información de gas en tiempo real
- Estadísticas de la red en el header
- Supply de ETH actualizado
- Último bloque minado

#### Funcionalidades Avanzadas
- Formateo automático de valores de tokens
- Enlaces directos a Etherscan.io
- Validación de direcciones y hashes
- Carga automática de datos de red

### 📊 Casos de Uso

1. **Compliance y KYT**:
   - Rastrear movimientos de fondos
   - Verificar fuentes de tokens
   - Analizar patrones de transacciones

2. **Auditoría de Contratos**:
   - Verificar código fuente
   - Validar implementaciones
   - Revisar historial de transacciones

3. **Monitoreo de Red**:
   - Seguimiento de congestión (gas prices)
   - Estadísticas de uso de la red
   - Análisis de bloques recientes

### 🔍 Ejemplos de Uso

```typescript
// Obtener balance y tokens de una dirección
const balance = await etherscanService.getBalance('0x...');
const tokens = await etherscanService.getTokenTransfers('0x...');

// Monitorear precios de gas
const gasPrice = await etherscanService.getGasTracker();
console.log(`Gas rápido: ${gasPrice.FastGasPrice} gwei`);

// Obtener estadísticas de la red
const stats = await etherscanService.getNetworkStats();
console.log(`Supply ETH: ${stats.totalSupply}`);
```

### ⚠️ Consideraciones

1. **Rate Limits**: La API gratuita tiene límites de 5 calls/segundo
2. **API Key**: Requerida para todas las solicitudes
3. **Datos en Tiempo Real**: Algunos datos pueden tener delay de ~15 segundos

### 🔗 Enlaces Útiles

- [Etherscan API v2 Documentation](https://docs.etherscan.io/)
- [Ethereum Developer Resources](https://ethereum.org/developers/)
- [EIP-1559 Gas Fee Mechanism](https://eips.ethereum.org/EIPS/eip-1559)