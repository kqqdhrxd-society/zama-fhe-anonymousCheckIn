// WalletManager.tsx
import React, { useState } from 'react';
import { Wallet, LogOut, RefreshCw } from 'lucide-react';

interface WalletManagerProps {
  account: string;
  onConnect: () => void;
  onDisconnect: () => void;
}

export default function WalletManager({ account, onConnect, onDisconnect }: WalletManagerProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await onConnect();
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    onDisconnect();
  };

  if (!account) {
    return (
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        style={{
          padding: '10px 16px',
          borderRadius: '8px',
          background: 'linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s ease',
          opacity: isConnecting ? 0.7 : 1
        }}
        onMouseOver={(e) => {
          if (!isConnecting) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.15)';
          }
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
        }}
      >
        <Wallet size={16} />
        <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {/* Account Info */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '8px',
        padding: '10px 16px'
      }}>
        <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
          {account.slice(0, 6)}...{account.slice(-4)}
        </span>
      </div>

      {/* Refresh Button */}
      <button
        onClick={handleConnect}
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: 'white',
          padding: '10px',
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        }}
      >
        <RefreshCw size={16} />
      </button>

      {/* Disconnect Button */}
      <button
        onClick={handleDisconnect}
        style={{
          background: 'rgba(239, 68, 68, 0.2)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          padding: '10px',
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
        }}
      >
        <LogOut size={16} />
      </button>
    </div>
  );
}