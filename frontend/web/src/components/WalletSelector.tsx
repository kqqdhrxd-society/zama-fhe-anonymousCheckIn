// WalletSelector.tsx
import React, { useState, useEffect } from 'react';

interface WalletInfo {
  name: string;
  provider: any;
  icon: string;
  isInstalled: boolean;
}

interface WalletSelectorProps {
  isOpen: boolean;
  onWalletSelect: (wallet: WalletInfo) => void;
  onClose: () => void;
}

const WalletSelector: React.FC<WalletSelectorProps> = ({ isOpen, onWalletSelect, onClose }) => {
  const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>([]);

  useEffect(() => {
    detectWallets();
  }, []);

  const detectWallets = () => {
    const wallets: WalletInfo[] = [];

    // MetaMask
    if (typeof (window as any).ethereum !== 'undefined') {
      wallets.push({
        name: 'MetaMask',
        provider: (window as any).ethereum,
        icon: '🦊',
        isInstalled: true
      });
    }

    // OKX Wallet
    if (typeof (window as any).okxwallet !== 'undefined') {
      wallets.push({
        name: 'OKX Wallet',
        provider: (window as any).okxwallet,
        icon: '🔵',
        isInstalled: true
      });
    }

    // Coinbase Wallet
    if (typeof (window as any).coinbaseWalletExtension !== 'undefined') {
      wallets.push({
        name: 'Coinbase Wallet',
        provider: (window as any).coinbaseWalletExtension,
        icon: '🟠',
        isInstalled: true
      });
    }

    // Trust Wallet
    if (typeof (window as any).trustwallet !== 'undefined') {
      wallets.push({
        name: 'Trust Wallet',
        provider: (window as any).trustwallet,
        icon: '🔷',
        isInstalled: true
      });
    }

    // Binance Wallet
    if (typeof (window as any).BinanceChain !== 'undefined') {
      wallets.push({
        name: 'Binance Wallet',
        provider: (window as any).BinanceChain,
        icon: '🟡',
        isInstalled: true
      });
    }

    // Add popular wallets that might not be installed
    const popularWallets = [
      { name: 'MetaMask', icon: '🦊', url: 'https://metamask.io/' },
      { name: 'OKX Wallet', icon: '🔵', url: 'https://www.okx.com/web3' },
      { name: 'Coinbase Wallet', icon: '🟠', url: 'https://www.coinbase.com/wallet' },
      { name: 'Trust Wallet', icon: '🔷', url: 'https://trustwallet.com/' },
      { name: 'Binance Wallet', icon: '🟡', url: 'https://www.bnbchain.org/en/binance-wallet' }
    ];

    // Add non-installed popular wallets
    popularWallets.forEach(wallet => {
      const isAlreadyAdded = wallets.some(w => w.name === wallet.name);
      if (!isAlreadyAdded) {
        wallets.push({
          name: wallet.name,
          provider: null,
          icon: wallet.icon,
          isInstalled: false
        });
      }
    });

    setAvailableWallets(wallets);
  };

  const handleWalletSelect = async (wallet: WalletInfo) => {
    if (!wallet.isInstalled) {
      // Open wallet download page
      const walletUrls: { [key: string]: string } = {
        'MetaMask': 'https://metamask.io/',
        'OKX Wallet': 'https://www.okx.com/web3',
        'Coinbase Wallet': 'https://www.coinbase.com/wallet',
        'Trust Wallet': 'https://trustwallet.com/',
        'Binance Wallet': 'https://www.bnbchain.org/en/binance-wallet'
      };
      
      const url = walletUrls[wallet.name];
      if (url) {
        window.open(url, '_blank');
      }
      return;
    }

    try {
      // Auto-switch to Sepolia testnet
      await switchToSepolia(wallet.provider);
      onWalletSelect(wallet);
    } catch (error) {
      console.error('Error switching network:', error);
      // Continue anyway, let the main app handle the connection
      onWalletSelect(wallet);
    }
  };

  const switchToSepolia = async (provider: any) => {
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia chainId
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xaa36a7',
              chainName: 'Sepolia',
              nativeCurrency: {
                name: 'Sepolia Ether',
                symbol: 'SEP',
                decimals: 18
              },
              rpcUrls: [
                'https://rpc.sepolia.org',
                'https://eth-sepolia.public.blastapi.io',
              ],
              blockExplorerUrls: ['https://sepolia.etherscan.io/']
            }]
          });
        } catch (addError) {
          console.error('Error adding Sepolia network:', addError);
          // Don't throw, let the main app handle it
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        borderRadius: '16px',
        padding: '24px',
        width: '90%',
        maxWidth: '400px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
        color: 'white'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Select Wallet</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'none';
            }}
          >
            ✕
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {availableWallets.map((wallet, index) => (
            <button
              key={index}
              onClick={() => handleWalletSelect(wallet)}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                border: wallet.isInstalled ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.1)',
                background: wallet.isInstalled ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                color: wallet.isInstalled ? 'white' : 'rgba(255, 255, 255, 0.7)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left'
              }}
              onMouseOver={(e) => {
                if (wallet.isInstalled) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }
              }}
              onMouseOut={(e) => {
                if (wallet.isInstalled) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }
              }}
            >
              <span style={{ fontSize: '24px' }}>{wallet.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '500', fontSize: '16px' }}>{wallet.name}</div>
                <div style={{ fontSize: '14px', opacity: 0.8 }}>
                  {wallet.isInstalled ? 'Installed' : 'Click to install'}
                </div>
              </div>
              {!wallet.isInstalled && (
                <span style={{
                  fontSize: '12px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontWeight: '500'
                }}>
                  Install
                </span>
              )}
            </button>
          ))}
        </div>
        
        <div style={{
          marginTop: '16px',
          fontSize: '12px',
          opacity: 0.8,
          textAlign: 'center',
          fontWeight: '500'
        }}>
          Wallet will automatically switch to Sepolia testnet after connection
        </div>
      </div>
    </div>
  );
};

export default WalletSelector;