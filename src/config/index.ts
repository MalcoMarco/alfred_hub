// Configuración centralizada de la aplicación usando variables de entorno

export const config = {
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: 10000, // 10 segundos
  },
  
  // App Configuration
  app: {
    name: import.meta.env.VITE_APP_NAME || 'AlfredPay Compliance',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
  },
  
  // Authentication Configuration
  auth: {
    tokenKey: 'auth_token',
    tokenExpireTime: 24 * 60 * 60 * 1000, // 24 horas en milisegundos
  },
  
  // Etherscan Configuration
  etherscan: {
    apiKey: import.meta.env.VITE_ETHERSCAN_API_KEY || '',
    chainId: import.meta.env.VITE_ETHERSCAN_CHAIN_ID || '1', // 1 = mainnet, 5 = goerli
    baseUrl: 'https://api.etherscan.io/api',
    rateLimit: {
      calls: 5,        // Calls per second for free tier
      interval: 1000,  // 1 second
    }
  },
  
  // Environment helpers
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.MODE,
} as const;

// Función para validar que las variables requeridas estén configuradas
export function validateConfig(): string[] {
  const errors: string[] = [];
  
  if (!config.api.baseUrl) {
    errors.push('VITE_API_BASE_URL es requerida');
  }
  
  if (!config.app.name) {
    errors.push('VITE_APP_NAME es requerida');
  }
  
  if (!config.etherscan.apiKey) {
    errors.push('VITE_ETHERSCAN_API_KEY es requerida para usar Etherscan');
  }
  
  return errors;
}

// Helpers para construir URLs
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = config.api.baseUrl.endsWith('/') 
    ? config.api.baseUrl.slice(0, -1) 
    : config.api.baseUrl;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

// Helpers para headers de autenticación
export const getAuthHeaders = (token?: string): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  const authToken = token || localStorage.getItem(config.auth.tokenKey);
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  return headers;
};

// Logger configurado basado en el modo debug
export const logger = {
  debug: (message: string, data?: any) => {
    if (config.app.debugMode) {
      console.log(`[DEBUG] ${message}`, data || '');
    }
  },
  
  info: (message: string, data?: any) => {
    if (config.app.debugMode || !config.isProduction) {
      console.info(`[INFO] ${message}`, data || '');
    }
  },
  
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data || '');
  },
  
  error: (message: string, data?: any) => {
    console.error(`[ERROR] ${message}`, data || '');
  },
};

// Información del entorno para debugging
if (config.app.debugMode) {
  logger.info('Configuración cargada', {
    mode: config.mode,
    isDev: config.isDevelopment,
    isProd: config.isProduction,
    apiBaseUrl: config.api.baseUrl,
    appName: config.app.name,
    version: config.app.version,
  });
}