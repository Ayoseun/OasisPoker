import React, { createContext, useContext, useState, useEffect } from 'react';
import useWallet from '../hooks/useWallet';

// Create context
const WalletContext = createContext(null);

// Custom hook to use the wallet context
export const useWalletContext = () => useContext(WalletContext);

// Provider component
export const WalletProvider = ({ children }) => {
  const wallet = useWallet();
  const [isInitialized, setIsInitialized] = useState(false);

  // Check for cached wallet connection on mount
  useEffect(() => {
    const checkCachedConnection = async () => {
      // You can implement logic to reconnect based on localStorage or other persistence
      // For example, checking if user was previously connected with a specific wallet type
      setIsInitialized(true);
    };

    checkCachedConnection();
  }, []);

  // The context value that will be supplied to any descendants of this provider
  const contextValue = {
    ...wallet,
    isInitialized
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

export default WalletContext;