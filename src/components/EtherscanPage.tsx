import React, { useState, useEffect } from 'react';
import { 
  etherscanService, 
  EtherscanTransaction, 
  EtherscanTokenTransfer,
  EtherscanGasPrice 
} from '../services/etherscan';

interface EthPriceData {
  ethusd: string;
  ethbtc: string;
}

interface NetworkStats {
  totalSupply: string;
  circulatingSupply: string;
  dailyTransactions: string;
}

const EtherscanPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'balance' | 'transactions' | 'tokens' | 'contract' | 'block' | 'network'>('network');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ethPrice, setEthPrice] = useState<EthPriceData | null>(null);
  const [gasPrice, setGasPrice] = useState<EtherscanGasPrice | null>(null);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [chainInfo, setChainInfo] = useState<any>(null);
  const [rateLimitStats, setRateLimitStats] = useState<any>(null);
  
  // Estados para diferentes consultas
  const [balance, setBalance] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<EtherscanTransaction[]>([]);
  const [tokenTransfers, setTokenTransfers] = useState<EtherscanTokenTransfer[]>([]);
  const [contractInfo, setContractInfo] = useState<any>(null);
  const [blockInfo, setBlockInfo] = useState<any>(null);

  // Cargar datos iniciales al montar el componente
  useEffect(() => {
    loadInitialData();
    
    // Monitorear rate limiting cada 500ms
    const interval = setInterval(() => {
      const stats = etherscanService.getRateLimitStats();
      setRateLimitStats(stats);
    }, 500);
    
    return () => clearInterval(interval);
  }, []);

  const loadInitialData = async () => {
    // Obtener información de la red
    const networkInfo = etherscanService.getCurrentChainInfo();
    setChainInfo(networkInfo);

    // Verificar configuración
    if (!etherscanService.isApiKeyConfigured()) {
      setError('API Key de Etherscan no configurada. Por favor configura VITE_ETHERSCAN_API_KEY en tu archivo .env.local');
      return;
    }

    try {
      const [price, gas, stats] = await Promise.allSettled([
        etherscanService.getEthPrice(),
        etherscanService.getGasTracker(),
        etherscanService.getNetworkStats()
      ]);
      
      if (price.status === 'fulfilled') setEthPrice(price.value);
      if (gas.status === 'fulfilled') setGasPrice(gas.value);
      if (stats.status === 'fulfilled') setNetworkStats(stats.value);
      
      // Limpiar error si todo sale bien
      setError(null);
    } catch (err: any) {
      console.error('Error loading initial data:', err);
      setError(`Error cargando datos: ${err.message}`);
    }
  };

  const handleSearch = async () => {
    if (!searchInput.trim()) {
      setError('Por favor ingresa una dirección, hash de transacción o número de bloque');
      return;
    }

    setLoading(true);
    setError(null);
    
    // Mostrar tiempo estimado si hay cola
    const waitTime = etherscanService.getEstimatedWaitTime();
    if (waitTime > 1000) {
      setError(`Request en cola. Tiempo estimado: ${Math.ceil(waitTime / 1000)}s`);
    }

    try {
      switch (activeTab) {
        case 'balance':
          await searchBalance();
          break;
        case 'transactions':
          await searchTransactions();
          break;
        case 'tokens':
          await searchTokens();
          break;
        case 'contract':
          await searchContract();
          break;
        case 'block':
          await searchBlock();
          break;
        case 'network':
          // Ya se cargan automáticamente
          break;
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Error en la búsqueda';
      
      if (errorMessage.includes('rate limit')) {
        setError('Rate limit alcanzado. La búsqueda se reintenta automáticamente. Espera unos segundos.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const searchBalance = async () => {
    if (!etherscanService.isValidAddress(searchInput)) {
      throw new Error('Formato de dirección inválido');
    }
    const bal = await etherscanService.getBalance(searchInput);
    setBalance(bal);
  };

  const searchTransactions = async () => {
    if (!etherscanService.isValidAddress(searchInput)) {
      throw new Error('Formato de dirección inválido');
    }
    const txs = await etherscanService.getTransactions(searchInput, 0, 99999999, 1, 20);
    setTransactions(txs);
  };

  const searchTokens = async () => {
    if (!etherscanService.isValidAddress(searchInput)) {
      throw new Error('Formato de dirección inválido');
    }
    const tokens = await etherscanService.getTokenTransfers(searchInput, undefined, 0, 99999999, 1, 20);
    setTokenTransfers(tokens);
  };

  const searchContract = async () => {
    if (!etherscanService.isValidAddress(searchInput)) {
      throw new Error('Formato de dirección inválido');
    }
    const contract = await etherscanService.getContractSource(searchInput);
    setContractInfo(contract);
  };

  const searchBlock = async () => {
    const blockNumber = searchInput.startsWith('0x') ? searchInput : `0x${parseInt(searchInput).toString(16)}`;
    const block = await etherscanService.getBlockByNumber(blockNumber);
    setBlockInfo(block);
  };

  const formatAddress = (address: string, length = 10) => {
    if (!address) return '';
    return `${address.slice(0, length)}...${address.slice(-6)}`;
  };

  const formatValue = (value: string) => {
    const eth = parseFloat(value) / 1e18;
    return eth.toFixed(6);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleString();
  };

  const tabs = [
    { id: 'network' as const, label: 'Red', icon: '🌐' },
    { id: 'balance' as const, label: 'Balance', icon: '💰' },
    { id: 'transactions' as const, label: 'Transacciones', icon: '📊' },
    { id: 'tokens' as const, label: 'Tokens', icon: '🪙' },
    { id: 'contract' as const, label: 'Contrato', icon: '📜' },
    { id: 'block' as const, label: 'Bloque', icon: '🧊' }
  ];

  return (
    <div className="space-y-6">
      {/* Header con información de la red */}
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Ethereum Network Explorer v2</h2>
            {chainInfo && (
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  chainInfo.isTestnet ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                }`}>
                  {chainInfo.chainName}
                </span>
                <span className="text-xs text-gray-500">Chain ID: {chainInfo.chainId}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end text-xs text-gray-500">
            <div>API v2 • Tiempo real</div>
            {rateLimitStats && (
              <div className="flex items-center gap-2 mt-1">
                {rateLimitStats.queueLength > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                    Cola: {rateLimitStats.queueLength}
                  </span>
                )}
                {rateLimitStats.isProcessing && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    • Procesando
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  {rateLimitStats.rateLimitPerSecond}/sec
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {ethPrice && (
            <>
              <div className="text-gray-600">
                <div className="font-medium">ETH/USD</div>
                <div className="font-semibold text-green-600">${parseFloat(ethPrice.ethusd).toFixed(2)}</div>
              </div>
              <div className="text-gray-600">
                <div className="font-medium">ETH/BTC</div>
                <div className="font-semibold">{parseFloat(ethPrice.ethbtc).toFixed(6)}</div>
              </div>
            </>
          )}
          
          {gasPrice && (
            <>
              <div className="text-gray-600">
                <div className="font-medium">Gas Rápido</div>
                <div className="font-semibold text-blue-600">{gasPrice.FastGasPrice} gwei</div>
              </div>
              <div className="text-gray-600">
                <div className="font-medium">Gas Estándar</div>
                <div className="font-semibold text-yellow-600">{gasPrice.StandardGasPrice} gwei</div>
              </div>
            </>
          )}
        </div>
        
        {networkStats && (
          <div className="mt-4 pt-3 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-gray-600">
              <div className="font-medium">Supply Total</div>
              <div className="font-semibold">{(parseInt(networkStats.totalSupply) / 1e18).toFixed(0)} ETH</div>
            </div>
            <div className="text-gray-600">
              <div className="font-medium">Transacciones Diarias</div>
              <div className="font-semibold">{parseInt(networkStats.dailyTransactions).toLocaleString()}</div>
            </div>
            <div className="text-gray-600">
              <div className="font-medium">Último Bloque</div>
              <div className="font-semibold">#{gasPrice?.LastBlock || '...'}</div>
            </div>
          </div>
        )}
      </div>

      {/* Búsqueda */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Explorar Blockchain</h3>
          <p className="text-sm text-gray-600">
            Busca direcciones, transacciones, contratos o bloques en la red Ethereum
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Input de búsqueda */}
        <div className="flex gap-3">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={
              activeTab === 'balance' || activeTab === 'transactions' || activeTab === 'tokens' || activeTab === 'contract'
                ? 'Ingresa una dirección Ethereum (0x...)'
                : activeTab === 'block' 
                ? 'Ingresa un número de bloque'
                : 'Las estadísticas se cargan automáticamente'
            }
            disabled={activeTab === 'network'}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {error && (
          <div className={`mt-3 rounded-lg border p-3 text-sm ${
            error.includes('cola') || error.includes('Rate limit')
              ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {error}
          </div>
        )}
        
        {rateLimitStats && rateLimitStats.queueLength > 0 && (
          <div className="mt-3 rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700">
            <div className="flex items-center justify-between">
              <span>
                📊 {rateLimitStats.queueLength} requests en cola 
                {rateLimitStats.isProcessing && ' • Procesando...'}
              </span>
              <span className="text-xs">
                ~{Math.ceil(etherscanService.getEstimatedWaitTime() / 1000)}s restantes
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Resultados */}
      {activeTab === 'balance' && balance && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Balance de ETH</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Dirección:</div>
            <div className="font-mono text-sm text-gray-900 mb-3">{searchInput}</div>
            <div className="text-sm text-gray-600 mb-1">Balance:</div>
            <div className="text-2xl font-bold text-green-600">{balance} ETH</div>
            {ethPrice && (
              <div className="text-sm text-gray-500 mt-1">
                ≈ ${(parseFloat(balance) * parseFloat(ethPrice.ethusd)).toFixed(2)} USD
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'transactions' && transactions.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Transacciones Recientes ({transactions.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Hash</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Desde</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Hacia</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Valor (ETH)</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Fecha</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Estado</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, index) => (
                  <tr key={index} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <a
                        href={`https://etherscan.io/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-blue-600 hover:underline"
                      >
                        {formatAddress(tx.hash, 12)}
                      </a>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600">
                      {formatAddress(tx.from)}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600">
                      {formatAddress(tx.to)}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {formatValue(tx.value)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatTimestamp(tx.timeStamp)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        tx.txreceipt_status === '1' 
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {tx.txreceipt_status === '1' ? 'Exitoso' : 'Fallido'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'contract' && contractInfo && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Contrato</h3>
          <div className="space-y-4">
            {contractInfo.ContractName && (
              <div>
                <div className="text-sm font-medium text-gray-700">Nombre del Contrato:</div>
                <div className="text-gray-900">{contractInfo.ContractName}</div>
              </div>
            )}
            {contractInfo.CompilerVersion && (
              <div>
                <div className="text-sm font-medium text-gray-700">Versión del Compilador:</div>
                <div className="text-gray-900">{contractInfo.CompilerVersion}</div>
              </div>
            )}
            {contractInfo.OptimizationUsed && (
              <div>
                <div className="text-sm font-medium text-gray-700">Optimización:</div>
                <div className="text-gray-900">{contractInfo.OptimizationUsed === '1' ? 'Habilitada' : 'Deshabilitada'}</div>
              </div>
            )}
            {contractInfo.SourceCode && contractInfo.SourceCode !== '' ? (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Código Fuente:</div>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono max-h-96 overflow-y-auto">
                  <pre>{contractInfo.SourceCode}</pre>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-yellow-800">
                  Esta dirección no parece ser un contrato verificado o no tiene código fuente público.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'block' && blockInfo && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Bloque</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-700">Número de Bloque:</div>
              <div className="font-mono text-gray-900">{parseInt(blockInfo.number, 16)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700">Hash:</div>
              <div className="font-mono text-sm text-gray-900 break-all">{blockInfo.hash}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700">Timestamp:</div>
              <div className="text-gray-900">{formatTimestamp(parseInt(blockInfo.timestamp, 16).toString())}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700">Transacciones:</div>
              <div className="text-gray-900">{blockInfo.transactions?.length || 0}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700">Gas Used:</div>
              <div className="font-mono text-gray-900">{parseInt(blockInfo.gasUsed, 16).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700">Gas Limit:</div>
              <div className="font-mono text-gray-900">{parseInt(blockInfo.gasLimit, 16).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tokens' && tokenTransfers.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Transferencias de Tokens ({tokenTransfers.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Hash</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Token</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Desde</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Hacia</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Cantidad</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {tokenTransfers.map((token, index) => (
                  <tr key={index} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <a
                        href={`https://etherscan.io/tx/${token.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-blue-600 hover:underline"
                      >
                        {formatAddress(token.hash, 12)}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium">{token.tokenSymbol}</span>
                        <span className="text-xs text-gray-500">{token.tokenName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600">
                      {formatAddress(token.from)}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600">
                      {formatAddress(token.to)}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {etherscanService.formatTokenValue(token.value, token.tokenDecimal)} {token.tokenSymbol}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatTimestamp(token.timeStamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'network' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas de la Red Ethereum</h3>
            
            {networkStats && (
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-blue-700">Supply Total de ETH</div>
                  <div className="text-2xl font-bold text-blue-900 mt-1">
                    {(parseInt(networkStats.totalSupply) / 1e18).toFixed(0)}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">ETH en circulación</div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-green-700">Transacciones Diarias</div>
                  <div className="text-2xl font-bold text-green-900 mt-1">
                    {parseInt(networkStats.dailyTransactions).toLocaleString()}
                  </div>
                  <div className="text-xs text-green-600 mt-1">Últimas 24 horas</div>
                </div>
                
                {gasPrice && (
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-purple-700">Último Bloque</div>
                    <div className="text-2xl font-bold text-purple-900 mt-1">
                      #{gasPrice.LastBlock}
                    </div>
                    <div className="text-xs text-purple-600 mt-1">Altura actual</div>
                  </div>
                )}
              </div>
            )}
            
            {gasPrice && (
              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-900 mb-4">Gas Tracker (Tiempo Real)</h4>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-red-700">Rápido</div>
                    <div className="text-xl font-bold text-red-900">{gasPrice.FastGasPrice}</div>
                    <div className="text-xs text-red-600">gwei (~15s)</div>
                  </div>
                  
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-yellow-700">Estándar</div>
                    <div className="text-xl font-bold text-yellow-900">{gasPrice.StandardGasPrice}</div>
                    <div className="text-xs text-yellow-600">gwei (~1min)</div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-green-700">Seguro</div>
                    <div className="text-xl font-bold text-green-900">{gasPrice.SafeGasPrice}</div>
                    <div className="text-xs text-green-600">gwei (~5min)</div>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-blue-700">Base Fee</div>
                    <div className="text-xl font-bold text-blue-900">{gasPrice.suggestBaseFee}</div>
                    <div className="text-xs text-blue-600">gwei (EIP-1559)</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Información de Rate Limiting */}
      <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="text-yellow-600 mt-1">⚡</div>
          <div className="flex-1">
            <h4 className="font-semibold text-yellow-800 mb-2">Rate Limiting - Versión Gratuita</h4>
            <p className="text-sm text-yellow-700 mb-2">
              Tu cuenta gratuita está limitada a <strong>5 requests por segundo</strong>. 
              Hemos implementado una cola automática para manejar tus búsquedas.
            </p>
            {rateLimitStats && (
              <div className="flex flex-wrap gap-4 text-xs text-yellow-600">
                <span>• Delay entre requests: {rateLimitStats.requestDelay}ms</span>
                <span>• Límite: {rateLimitStats.rateLimitPerSecond}/seg</span>
                {rateLimitStats.queueLength > 0 && (
                  <span>• En cola: {rateLimitStats.queueLength} requests</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enlaces útiles */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Enlaces Útiles</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <a
            href="https://etherscan.io"
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="font-medium text-gray-900">Etherscan.io</div>
            <div className="text-sm text-gray-600 mt-1">Explorador principal de Ethereum</div>
          </a>
          <a
            href="https://docs.etherscan.io"
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="font-medium text-gray-900">API Documentation</div>
            <div className="text-sm text-gray-600 mt-1">Documentación de la API de Etherscan</div>
          </a>
          <a
            href="https://ethereum.org"
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="font-medium text-gray-900">Ethereum.org</div>
            <div className="text-sm text-gray-600 mt-1">Sitio oficial de Ethereum</div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default EtherscanPage;