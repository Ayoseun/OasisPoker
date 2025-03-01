import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import CoinbaseWalletSDK from '@coinbase/wallet-sdk';

const useWallet = () => {
  const [provider, setProvider] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [signature, setSignature] = useState(null);
  const [walletType, setWalletType] = useState(null);
  const [signer, setSigner] = useState(null);

  // Clear any previous errors
  const resetError = () => setError(null);

  // Initialize ethers provider with the web3 provider
  const initializeProvider = (web3Provider) => {
    const ethersProvider = new ethers.providers.Web3Provider(web3Provider);
    setProvider(ethersProvider);
    
    // Get the signer
    const signerInstance = ethersProvider.getSigner();
    setSigner(signerInstance);
    
    return ethersProvider;
  };

  // Connect to Coinbase Wallet
  const connectCoinbaseWallet = async () => {
    resetError();
    setLoading(true);
    
    try {
      // Initialize Coinbase Wallet SDK
      const coinbaseWallet = new CoinbaseWalletSDK({
        appName: 'Poker Game',
        appLogoUrl: '', // Add your app logo URL here
        darkMode: false
      });
      
      // Initialize a Web3 Provider
      const web3Provider = coinbaseWallet.makeWeb3Provider();
      
      // Create ethers provider
      const ethersProvider = initializeProvider(web3Provider);
      
      // Request user accounts using the underlying provider
      await web3Provider.request({ method: 'eth_requestAccounts' });
      
      // Get the connected address
      const signerInstance = ethersProvider.getSigner();
      const address = await signerInstance.getAddress();
      setAccounts([address]);
      setConnected(true);
      setWalletType('coinbase');
      
      return { 
        accounts: [address], 
        provider: ethersProvider, 
        signer: signerInstance,
        web3Provider
      };
    } catch (err) {
      setError(err.message || 'Failed to connect Coinbase Wallet');
      console.error('Coinbase wallet connection error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Connect to MetaMask
  const connectMetaMask = async () => {
    resetError();
    setLoading(true);
    
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('MetaMask not installed. Please install MetaMask extension first.');
      }
      
      // Use existing provider
      const ethersProvider = initializeProvider(window.ethereum);
      
      // Request account access (this triggers the MetaMask popup)
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Get the connected address
      const signerInstance = ethersProvider.getSigner();
      const address = await signerInstance.getAddress();
      setAccounts([address]);
      setConnected(true);
      setWalletType('metamask');
      
      return { 
        accounts: [address], 
        provider: ethersProvider, 
        signer: signerInstance,
        web3Provider: window.ethereum
      };
    } catch (err) {
      setError(err.message || 'Failed to connect MetaMask');
      console.error('MetaMask connection error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Sign a message
  const signMessage = async (message) => {
    resetError();
    setLoading(true);
    
    try {
      if (!connected || !signer || accounts.length === 0) {
        throw new Error('Wallet not connected');
      }
      
      // Using ethers.js for signing
      const signedMessage = await signer.signMessage(message);
      
      setSignature(signedMessage);
      return signedMessage;
    } catch (err) {
      setError(err.message || 'Failed to sign message');
      console.error('Message signing error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Disconnect wallet
  const disconnect = () => {
    setProvider(null);
    setSigner(null);
    setAccounts([]);
    setConnected(false);
    setSignature(null);
    setWalletType(null);
  };

  // Listen for account changes
  useEffect(() => {
    const handleAccountsChanged = async (newAccounts) => {
      if (newAccounts.length === 0) {
        // User disconnected
        disconnect();
      } else if (provider) {
        // Update accounts
        setAccounts(newAccounts);
      }
    };

    const handleChainChanged = () => {
      // Handle chain changes by refreshing the page
      window.location.reload();
    };

    // Add event listeners for Metamask
    if (window.ethereum && walletType === 'metamask') {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [provider, walletType]);

  return {
    provider,
    signer,
    accounts,
    connected,
    loading,
    error,
    signature,
    walletType,
    connectCoinbaseWallet,
    connectMetaMask,
    signMessage,
    disconnect
  };
};

export default useWallet;