// Servicio para interactuar con la API de Etherscan
// Documentación: https://docs.etherscan.io/

const ETHERSCAN_API_KEY = import.meta.env.VITE_ETHERSCAN_API_KEY || 'YourApiKeyToken';
const ETHERSCAN_BASE_URL = 'https://api.etherscan.io/v2/api';

// Configuración de redes soportadas
export enum SupportedChains {
  ETHEREUM = '1',
  GOERLI = '5',
  SEPOLIA = '11155111',
  POLYGON = '137',
  MUMBAI = '80001',
  BSC = '56',
  BSC_TESTNET = '97',
  ARBITRUM = '42161',
  OPTIMISM = '10'
}

const DEFAULT_CHAIN_ID = SupportedChains.ETHEREUM;
const SELECTED_CHAIN_ID = import.meta.env.VITE_ETHERSCAN_CHAIN_ID || DEFAULT_CHAIN_ID;

// Configuración de Rate Limiting
const FREE_TIER_RATE_LIMIT = 5; // 5 calls per second
const RATE_LIMIT_WINDOW = 1000; // 1 second in milliseconds
const REQUEST_DELAY = Math.ceil(RATE_LIMIT_WINDOW / FREE_TIER_RATE_LIMIT); // 200ms between requests

// Queue para manejar requests secuencialmente
interface QueuedRequest {
  resolve: (value: any) => void;
  reject: (error: any) => void;
  params: Record<string, string>;
}

export interface EtherscanApiResponse<T> {
  status: string;
  message: string;
  result: T;
}

export interface EtherscanTransaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  transactionIndex: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  isError: string;
  txreceipt_status: string;
  input: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  gasUsed: string;
  confirmations: string;
  methodId: string;
  functionName: string;
}

export interface EtherscanBalance {
  account: string;
  balance: string;
}

export interface EtherscanContract {
  SourceCode: string;
  ABI: string;
  ContractName: string;
  CompilerVersion: string;
  OptimizationUsed: string;
  Runs: string;
  ConstructorArguments: string;
  EVMVersion: string;
  Library: string;
  LicenseType: string;
  Proxy: string;
  Implementation: string;
  SwarmSource: string;
}

export interface EtherscanTokenTransfer {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  contractAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  transactionIndex: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  cumulativeGasUsed: string;
  input: string;
  confirmations: string;
}

export interface EtherscanGasPrice {
  LastBlock: string;
  SafeGasPrice: string;
  StandardGasPrice: string;
  FastGasPrice: string;
  suggestBaseFee: string;
  gasUsedRatio: string;
}

class EtherscanService {
  private requestQueue: QueuedRequest[] = [];
  private isProcessingQueue = false;
  private lastRequestTime = 0;

  private async makeRequest<T>(params: Record<string, string>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Agregar request a la cola
      this.requestQueue.push({ resolve, reject, params });
      // Procesar cola si no está ya procesándose
      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this.requestQueue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }

    this.isProcessingQueue = true;
    const queuedRequest = this.requestQueue.shift()!;

    try {
      // Calcular delay necesario para respetar rate limit
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      const delayNeeded = Math.max(0, REQUEST_DELAY - timeSinceLastRequest);

      if (delayNeeded > 0) {
        await new Promise(resolve => setTimeout(resolve, delayNeeded));
      }

      const result = await this.executeRequest<any>(queuedRequest.params);
      queuedRequest.resolve(result);
      
      this.lastRequestTime = Date.now();
    } catch (error) {
      queuedRequest.reject(error);
    }

    // Procesar siguiente request en la cola
    setTimeout(() => this.processQueue(), 0);
  }

  private async executeRequest<T>(params: Record<string, string>): Promise<T> {
    const url = new URL(ETHERSCAN_BASE_URL);
    
    // Añadir parámetros comunes requeridos por API v2
    params.apikey = ETHERSCAN_API_KEY;
    params.chainid = SELECTED_CHAIN_ID;
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    try {
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: EtherscanApiResponse<T> = await response.json();
      
      // Verificar rate limiting específicamente
      if (data.status === '0' && data.message === 'NOTOK') {
        const errorResult = data.result as string;
        if (errorResult.includes('rate limit')) {
          throw new Error('Rate limit alcanzado. Reintenta en unos segundos.');
        }
      }
      
      // En API v2, verificar el status de la respuesta
      if (data.status === '0') {
        // Algunos casos válidos donde status es '0'
        const validMessages = [
          'No transactions found',
          'No internal transactions found',
          'Contract source code not verified'
        ];
        
        if (!validMessages.some(msg => data.message.includes(msg))) {
          throw new Error(data.result as string || data.message || 'API Error');
        }
      }
      
      return data.result;
    } catch (error) {
      console.error('Etherscan API v2 Error:', {
        url: url.toString(),
        chainId: SELECTED_CHAIN_ID,
        queueLength: this.requestQueue.length,
        error: error
      });
      throw error;
    }
  }

  // Obtener balance de ETH de una dirección
  async getBalance(address: string): Promise<string> {
    const params = {
      module: 'account',
      action: 'balance',
      address: address,
      tag: 'latest'
    };
    
    const balance = await this.makeRequest<string>(params);
    // Convertir de wei a ETH
    return (parseInt(balance) / 1e18).toFixed(6);
  }

  // Obtener balances múltiples
  async getMultipleBalances(addresses: string[]): Promise<EtherscanBalance[]> {
    const params = {
      module: 'account',
      action: 'balancemulti',
      address: addresses.join(','),
      tag: 'latest'
    };
    
    const balances = await this.makeRequest<EtherscanBalance[]>(params);
    return balances.map((item: any) => ({
      account: item.account,
      balance: (parseInt(item.balance) / 1e18).toFixed(6)
    }));
  }

  // Obtener transacciones de una dirección
  async getTransactions(
    address: string, 
    startBlock: number = 0, 
    endBlock: number = 99999999, 
    page: number = 1, 
    offset: number = 10
  ): Promise<EtherscanTransaction[]> {
    const params = {
      module: 'account',
      action: 'txlist',
      address: address,
      startblock: startBlock.toString(),
      endblock: endBlock.toString(),
      page: page.toString(),
      offset: offset.toString(),
      sort: 'desc'
    };
    
    return await this.makeRequest<EtherscanTransaction[]>(params);
  }

  // Obtener transacciones internas de una dirección
  async getInternalTransactions(
    address: string, 
    startBlock: number = 0, 
    endBlock: number = 99999999, 
    page: number = 1, 
    offset: number = 10
  ): Promise<EtherscanTransaction[]> {
    const params = {
      module: 'account',
      action: 'txlistinternal',
      address: address,
      startblock: startBlock.toString(),
      endblock: endBlock.toString(),
      page: page.toString(),
      offset: offset.toString(),
      sort: 'desc'
    };
    
    return await this.makeRequest<EtherscanTransaction[]>(params);
  }

  // Obtener información del contrato
  async getContractSource(address: string): Promise<EtherscanContract> {
    const params = {
      module: 'contract',
      action: 'getsourcecode',
      address: address
    };
    
    const result = await this.makeRequest<EtherscanContract[]>(params);
    return result[0];
  }

  // Verificar si una dirección es un contrato
  async isContract(address: string): Promise<boolean> {
    try {
      const contract = await this.getContractSource(address);
      return contract.SourceCode !== '';
    } catch (error) {
      return false;
    }
  }

  // Obtener precio actual de ETH
  async getEthPrice(): Promise<{ ethusd: string; ethbtc: string }> {
    const params = {
      module: 'stats',
      action: 'ethprice'
    };
    
    return await this.makeRequest<{ ethusd: string; ethbtc: string }>(params);
  }

  // Obtener información de un bloque
  async getBlockByNumber(blockNumber: string): Promise<any> {
    const params = {
      module: 'proxy',
      action: 'eth_getBlockByNumber',
      tag: blockNumber,
      boolean: 'true'
    };
    
    return await this.makeRequest<any>(params);
  }

  // Obtener detalles de una transacción
  async getTransactionByHash(txHash: string): Promise<any> {
    const params = {
      module: 'proxy',
      action: 'eth_getTransactionByHash',
      txhash: txHash
    };
    
    return await this.makeRequest<any>(params);
  }

  // Obtener recibo de una transacción
  async getTransactionReceipt(txHash: string): Promise<any> {
    const params = {
      module: 'proxy',
      action: 'eth_getTransactionReceipt',
      txhash: txHash
    };
    
    return await this.makeRequest<any>(params);
  }

  // Validar formato de dirección Ethereum
  isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  // Obtener transferencias de tokens ERC-20
  async getTokenTransfers(
    address: string,
    contractAddress?: string,
    startBlock: number = 0,
    endBlock: number = 99999999,
    page: number = 1,
    offset: number = 100
  ): Promise<EtherscanTokenTransfer[]> {
    const params: Record<string, string> = {
      module: 'account',
      action: 'tokentx',
      address: address,
      startblock: startBlock.toString(),
      endblock: endBlock.toString(),
      page: page.toString(),
      offset: offset.toString(),
      sort: 'desc'
    };
    
    if (contractAddress) {
      params.contractaddress = contractAddress;
    }
    
    return await this.makeRequest<EtherscanTokenTransfer[]>(params);
  }

  // Obtener transferencias de tokens ERC-721 (NFTs)
  async getNFTTransfers(
    address: string,
    contractAddress?: string,
    startBlock: number = 0,
    endBlock: number = 99999999,
    page: number = 1,
    offset: number = 100
  ): Promise<EtherscanTokenTransfer[]> {
    const params: Record<string, string> = {
      module: 'account',
      action: 'tokennfttx',
      address: address,
      startblock: startBlock.toString(),
      endblock: endBlock.toString(),
      page: page.toString(),
      offset: offset.toString(),
      sort: 'desc'
    };
    
    if (contractAddress) {
      params.contractaddress = contractAddress;
    }
    
    return await this.makeRequest<EtherscanTokenTransfer[]>(params);
  }

  // Obtener información de gas tracker (v2)
  async getGasTracker(): Promise<EtherscanGasPrice> {
    const params = {
      module: 'gastracker',
      action: 'gasoracle'
    };
    
    return await this.makeRequest<EtherscanGasPrice>(params);
  }

  // Obtener balance de token ERC-20
  async getTokenBalance(contractAddress: string, address: string): Promise<string> {
    const params = {
      module: 'account',
      action: 'tokenbalance',
      contractaddress: contractAddress,
      address: address,
      tag: 'latest'
    };
    
    const balance = await this.makeRequest<string>(params);
    return balance;
  }

  // Obtener información del token ERC-20
  async getTokenInfo(contractAddress: string): Promise<{
    name: string;
    symbol: string;
    decimals: string;
    totalSupply: string;
  }> {
    try {
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        this.makeRequest<string>({
          module: 'token',
          action: 'tokenname',
          contractaddress: contractAddress
        }),
        this.makeRequest<string>({
          module: 'token',
          action: 'tokensymbol',
          contractaddress: contractAddress
        }),
        this.makeRequest<string>({
          module: 'token',
          action: 'tokendecimals',
          contractaddress: contractAddress
        }),
        this.makeRequest<string>({
          module: 'token',
          action: 'tokensupply',
          contractaddress: contractAddress
        })
      ]);
      
      return { name, symbol, decimals, totalSupply };
    } catch (error) {
      throw new Error('No se pudo obtener información del token');
    }
  }

  // Obtener estadísticas de la red
  async getNetworkStats(): Promise<{
    totalSupply: string;
    circulatingSupply: string;
    dailyTransactions: string;
  }> {
    try {
      const [totalSupply, dailyTxs] = await Promise.all([
        this.makeRequest<string>({
          module: 'stats',
          action: 'ethsupply'
        }),
        this.makeRequest<string>({
          module: 'stats',
          action: 'dailytxncount',
          date: new Date().toISOString().split('T')[0]
        })
      ]);
      
      return {
        totalSupply,
        circulatingSupply: totalSupply, // En Ethereum son iguales
        dailyTransactions: dailyTxs
      };
    } catch (error) {
      throw new Error('No se pudieron obtener estadísticas de la red');
    }
  }



  // Formatear valor de token considerando decimales
  formatTokenValue(value: string, decimals: string): string {
    const divisor = Math.pow(10, parseInt(decimals));
    return (parseInt(value) / divisor).toFixed(6);
  }

  // Obtener el último bloque minado
  async getLatestBlock(): Promise<string> {
    const params = {
      module: 'proxy',
      action: 'eth_blockNumber'
    };
    
    const blockHex = await this.makeRequest<string>(params);
    return parseInt(blockHex, 16).toString();
  }

  // Obtener información de la red actual
  getCurrentChainInfo(): {
    chainId: string;
    chainName: string;
    isTestnet: boolean;
  } {
    const chainInfo = {
      [SupportedChains.ETHEREUM]: { name: 'Ethereum Mainnet', isTestnet: false },
      [SupportedChains.GOERLI]: { name: 'Goerli Testnet', isTestnet: true },
      [SupportedChains.SEPOLIA]: { name: 'Sepolia Testnet', isTestnet: true },
      [SupportedChains.POLYGON]: { name: 'Polygon Mainnet', isTestnet: false },
      [SupportedChains.MUMBAI]: { name: 'Mumbai Testnet', isTestnet: true },
      [SupportedChains.BSC]: { name: 'BSC Mainnet', isTestnet: false },
      [SupportedChains.BSC_TESTNET]: { name: 'BSC Testnet', isTestnet: true },
      [SupportedChains.ARBITRUM]: { name: 'Arbitrum One', isTestnet: false },
      [SupportedChains.OPTIMISM]: { name: 'Optimism', isTestnet: false }
    };

    const info = chainInfo[SELECTED_CHAIN_ID as SupportedChains] || { name: 'Unknown Chain', isTestnet: false };
    
    return {
      chainId: SELECTED_CHAIN_ID,
      chainName: info.name,
      isTestnet: info.isTestnet
    };
  }

  // Verificar si la API Key está configurada
  isApiKeyConfigured(): boolean {
    return ETHERSCAN_API_KEY !== 'YourApiKeyToken' && ETHERSCAN_API_KEY.length > 10;
  }

  // Obtener estadísticas del rate limiting
  getRateLimitStats(): {
    queueLength: number;
    isProcessing: boolean;
    requestDelay: number;
    rateLimitPerSecond: number;
  } {
    return {
      queueLength: this.requestQueue.length,
      isProcessing: this.isProcessingQueue,
      requestDelay: REQUEST_DELAY,
      rateLimitPerSecond: FREE_TIER_RATE_LIMIT
    };
  }

  // Limpiar cola de requests (usar con precaución)
  clearQueue(): void {
    this.requestQueue.forEach(req => {
      req.reject(new Error('Queue cleared'));
    });
    this.requestQueue = [];
    this.isProcessingQueue = false;
  }

  // Obtener tiempo estimado para procesar cola actual
  getEstimatedWaitTime(): number {
    return this.requestQueue.length * REQUEST_DELAY;
  }
}

export const etherscanService = new EtherscanService();