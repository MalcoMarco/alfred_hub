import React, { useState, useEffect } from 'react';
import { walletsService, Wallet } from '../services/wallets';
import { etherscanService } from '../services/etherscan';

const WalletsPage: React.FC = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [ethPrice, setEthPrice] = useState<number>(0);
  const [updatingBalance, setUpdatingBalance] = useState<number | null>(null);

  // Estados del formulario
  const [formData, setFormData] = useState({
    address: '',
    name: '',
    description: '',
    tag: '',
  });

  // Cargar datos iniciales
  useEffect(() => {
    loadWallets();
    loadEthPrice();
  }, []);

  const loadWallets = async () => {
    try {
      setLoading(true);
      const walletsData = await walletsService.getWallets();
      setWallets(walletsData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar wallets');
    } finally {
      setLoading(false);
    }
  };

  const loadEthPrice = async () => {
    try {
      const price = await etherscanService.getEthPrice();
      setEthPrice(parseFloat(price.ethusd));
    } catch (err) {
      console.error('Error loading ETH price:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walletsService.isValidAddress(formData.address)) {
      setError('Formato de dirección Ethereum inválido');
      return;
    }

    try {
      setLoading(true);
      
      if (editingWallet) {
        await walletsService.updateWallet({
          id: editingWallet.id,
          ...formData
        });
      } else {
        await walletsService.createWallet(formData);
      }
      
      await loadWallets();
      resetForm();
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al guardar wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (wallet: Wallet) => {
    if (!confirm(`¿Estás seguro de eliminar la wallet "${wallet.name}"?`)) {
      return;
    }

    try {
      await walletsService.deleteWallet(wallet.id);
      await loadWallets();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar wallet');
    }
  };

  const handleUpdateBalance = async (wallet: Wallet) => {
    try {
      setUpdatingBalance(wallet.id);
      const balance = await etherscanService.getBalance(wallet.address);
      
      await walletsService.updateWallet({
        id: wallet.id,
        balance_eth: parseFloat(balance)
      });
      
      await loadWallets();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar balance');
    } finally {
      setUpdatingBalance(null);
    }
  };

  const resetForm = () => {
    setFormData({ address: '', name: '', description: '', tag: '' });
    setEditingWallet(null);
    setShowAddModal(false);
  };

  const openEditModal = (wallet: Wallet) => {
    setFormData({
      address: wallet.address,
      name: wallet.name,
      description: wallet.description || '',
      tag: wallet.tag || '',
    });
    setEditingWallet(wallet);
    setShowAddModal(true);
  };

  // Filtrar wallets
  const filteredWallets = wallets.filter(wallet => {
    const matchesSearch = 
      wallet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wallet.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (wallet.description && wallet.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTag = selectedTag === 'all' || wallet.tag === selectedTag || (selectedTag === 'no-tag' && !wallet.tag);
    
    return matchesSearch && matchesTag;
  });

  // Obtener estadísticas
  const stats = walletsService.getWalletsStats(wallets);
  
  // Obtener tags únicos para el filtro
  const uniqueTags = Array.from(new Set(wallets.map(w => w.tag).filter(Boolean))).sort();

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Wallets</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalWallets}</p>
            </div>
            <div className="text-blue-500">👥</div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Balance Total</p>
              <p className="text-2xl font-bold text-green-900">{walletsService.formatBalance(stats.totalBalance)} ETH</p>
              {ethPrice > 0 && (
                <p className="text-xs text-green-600">{walletsService.calculateUSDValue(stats.totalBalance, ethPrice)}</p>
              )}
            </div>
            <div className="text-green-500">💰</div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Contratos</p>
              <p className="text-2xl font-bold text-purple-900">{stats.contractsCount}</p>
            </div>
            <div className="text-purple-500">📜</div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Con Balance</p>
              <p className="text-2xl font-bold text-orange-900">{stats.walletsWithBalance}</p>
            </div>
            <div className="text-orange-500">💎</div>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Wallets Registradas</h2>
          <div className="flex gap-2">
            <button
              onClick={() => walletsService.downloadCSV(wallets)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              📥 Exportar CSV
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Agregar Wallet
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por nombre, dirección o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todas las etiquetas</option>
            <option value="no-tag">Sin etiqueta</option>
            {uniqueTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Lista de wallets */}
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Cargando wallets...</span>
          </div>
        ) : filteredWallets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || selectedTag !== 'all' ? 'No se encontraron wallets con los filtros aplicados' : 'No hay wallets registradas'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wallet</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Última Act.</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actualizar</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredWallets.map((wallet) => {
                  const tagColor = walletsService.getTagColor(wallet.tag);
                  return (
                    <tr key={wallet.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{walletsService.getWalletIcon(wallet)}</span>
                          <div>
                            <div className="font-medium text-gray-900">{wallet.name}</div>
                            <div className="text-sm text-gray-500 font-mono">
                              {walletsService.formatAddress(wallet.address)}
                            </div>
                            {wallet.description && (
                              <div className="text-xs text-gray-400 mt-1">{wallet.description}</div>
                            )}
                            {wallet.tag && (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${tagColor.bg} ${tagColor.text}`}>
                                {wallet.tag}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {walletsService.formatBalance(wallet.balance_eth)} ETH
                          </div>
                          {ethPrice > 0 && wallet.balance_eth > 0 && (
                            <div className="text-gray-500">
                              {walletsService.calculateUSDValue(wallet.balance_eth, ethPrice)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          wallet.is_contract 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {wallet.is_contract ? 'Contrato' : 'EOA'}
                        </span>
                        {wallet.transaction_count !== undefined && (
                          <div className="text-xs text-gray-500 mt-1">
                            {wallet.transaction_count} tx
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {wallet.last_balance_check 
                            ? new Date(wallet.last_balance_check).toLocaleString()
                            : 'Nunca'
                        }
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleUpdateBalance(wallet)}
                          disabled={updatingBalance === wallet.id}
                          className={`px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                            updatingBalance === wallet.id
                              ? 'bg-purple-100 text-purple-700 cursor-not-allowed'
                              : 'bg-purple-600 hover:bg-purple-700 text-white hover:scale-105 shadow-md hover:shadow-lg'
                          }`}
                          title="Actualizar balance desde Etherscan"
                        >
                          {updatingBalance === wallet.id ? (
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                              <span>Actualizando...</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1">
                              <span></span>
                              <span>Actualizar</span>
                            </div>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(wallet)}
                            className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="Editar wallet"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(wallet)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar wallet"
                          >
                            🗑️
                          </button>
                          <a
                            href={`https://etherscan.io/address/${wallet.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver en Etherscan"
                          >
                            🔍
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para agregar/editar wallet */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingWallet ? 'Editar Wallet' : 'Agregar Nueva Wallet'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección Ethereum *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="0x..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={!!editingWallet}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nombre descriptivo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción opcional"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Etiqueta
                </label>
                <select
                  value={formData.tag}
                  onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sin etiqueta</option>
                  <option value="exchange">Exchange</option>
                  <option value="defi">DeFi</option>
                  <option value="nft">NFT</option>
                  <option value="gaming">Gaming</option>
                  <option value="dao">DAO</option>
                  <option value="foundation">Foundation</option>
                  <option value="vip">VIP</option>
                  <option value="institution">Institution</option>
                  <option value="suspicious">Suspicious</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : (editingWallet ? 'Actualizar' : 'Crear')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletsPage;