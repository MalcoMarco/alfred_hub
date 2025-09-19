// Servicio para manejar wallets registradas
import { authService } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface Wallet {
  id: number;
  address: string;
  name: string;
  description?: string;
  tag?: string;
  is_contract: boolean;
  balance_eth: number;
  last_balance_check?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  transaction_count?: number;
  token_count?: number;
}

export interface CreateWalletRequest {
  address: string;
  name: string;
  description?: string;
  tag?: string;
}

export interface UpdateWalletRequest {
  id: number;
  name?: string;
  description?: string;
  tag?: string;
  balance_eth?: number;
  is_contract?: boolean;
}

class WalletsService {
  private getHeaders(): HeadersInit {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Obtener todas las wallets registradas
  async getWallets(): Promise<Wallet[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/wallets.php`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching wallets:', error);
      throw error;
    }
  }

  // Registrar una nueva wallet
  async createWallet(walletData: CreateWalletRequest): Promise<{ message: string; wallet: Wallet }> {
    try {
      const response = await fetch(`${API_BASE_URL}/wallets.php`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(walletData),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw error;
    }
  }

  // Actualizar una wallet existente
  async updateWallet(walletData: UpdateWalletRequest): Promise<{ message: string; wallet: Wallet }> {
    try {
      const response = await fetch(`${API_BASE_URL}/wallets.php`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(walletData),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error updating wallet:', error);
      throw error;
    }
  }

  // Eliminar una wallet
  async deleteWallet(walletId: number): Promise<{ message: string; address: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/wallets.php`, {
        method: 'DELETE',
        headers: this.getHeaders(),
        body: JSON.stringify({ id: walletId }),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error deleting wallet:', error);
      throw error;
    }
  }

  // Validar formato de dirección Ethereum
  isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  // Formatear dirección para mostrar (truncada)
  formatAddress(address: string, startLength: number = 6, endLength: number = 4): string {
    if (!address) return '';
    if (address.length <= startLength + endLength + 2) return address;
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
  }

  // Obtener etiqueta con color para mostrar en UI
  getTagColor(tag?: string): { bg: string; text: string } {
    const tagColors: Record<string, { bg: string; text: string }> = {
      exchange: { bg: 'bg-blue-100', text: 'text-blue-700' },
      defi: { bg: 'bg-green-100', text: 'text-green-700' },
      nft: { bg: 'bg-purple-100', text: 'text-purple-700' },
      gaming: { bg: 'bg-pink-100', text: 'text-pink-700' },
      dao: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
      foundation: { bg: 'bg-orange-100', text: 'text-orange-700' },
      vip: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      institution: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
      suspicious: { bg: 'bg-red-100', text: 'text-red-700' },
    };

    return tagColors[tag || ''] || { bg: 'bg-gray-100', text: 'text-gray-700' };
  }

  // Obtener icono basado en tag o tipo
  getWalletIcon(wallet: Wallet): string {
    if (wallet.is_contract) return '📜';
    
    const tagIcons: Record<string, string> = {
      exchange: '🏦',
      defi: '🌾',
      nft: '🖼️',
      gaming: '🎮',
      dao: '🏛️',
      foundation: '🏗️',
      vip: '⭐',
      institution: '🏢',
      suspicious: '⚠️',
    };

    return tagIcons[wallet.tag || ''] || '👤';
  }

  // Formatear balance ETH
  formatBalance(balance: number): string {
    if (balance === 0) return '0.000000';
    if (balance < 0.000001) return balance.toExponential(2);
    if (balance < 1) return balance.toFixed(6);
    if (balance < 1000) return balance.toFixed(4);
    return balance.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  // Calcular valor en USD basado en precio ETH
  calculateUSDValue(ethBalance: number, ethPrice: number): string {
    const usdValue = ethBalance * ethPrice;
    if (usdValue < 0.01) return '$0.00';
    return `$${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // Obtener estadísticas de las wallets
  getWalletsStats(wallets: Wallet[]) {
    const totalWallets = wallets.length;
    const contractsCount = wallets.filter(w => w.is_contract).length;
    const totalBalance = wallets.reduce((sum, w) => sum + w.balance_eth, 0);
    const walletsWithBalance = wallets.filter(w => w.balance_eth > 0).length;
    
    const tagStats = wallets.reduce((acc, wallet) => {
      const tag = wallet.tag || 'sin-etiqueta';
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostCommonTag = Object.entries(tagStats)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'sin-etiqueta';

    return {
      totalWallets,
      contractsCount,
      regularWallets: totalWallets - contractsCount,
      totalBalance,
      walletsWithBalance,
      emptyWallets: totalWallets - walletsWithBalance,
      tagStats,
      mostCommonTag,
      averageBalance: totalWallets > 0 ? totalBalance / totalWallets : 0,
    };
  }

  // Exportar wallets a CSV
  exportToCSV(wallets: Wallet[]): string {
    const headers = [
      'Dirección',
      'Nombre',
      'Descripción',
      'Etiqueta',
      'Es Contrato',
      'Balance ETH',
      'Último Check Balance',
      'Fecha Creación',
      'Transacciones',
      'Tokens'
    ];

    const rows = wallets.map(wallet => [
      wallet.address,
      wallet.name,
      wallet.description || '',
      wallet.tag || '',
      wallet.is_contract ? 'Sí' : 'No',
      wallet.balance_eth.toString(),
      wallet.last_balance_check || '',
      new Date(wallet.created_at).toLocaleString(),
      (wallet.transaction_count || 0).toString(),
      (wallet.token_count || 0).toString()
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  // Descargar CSV
  downloadCSV(wallets: Wallet[], filename: string = 'wallets-export.csv'): void {
    const csvContent = this.exportToCSV(wallets);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}

export const walletsService = new WalletsService();