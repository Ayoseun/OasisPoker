// import React, { useContext, useEffect } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useLocation } from 'react-router-dom';
// import Swal from 'sweetalert2'
// import globalContext from './../../context/global/globalContext'
// import LoadingScreen from '../../components/loading/LoadingScreen'

// import socketContext from '../../context/websocket/socketContext'
// import { CS_FETCH_LOBBY_INFO } from '../../pokergame/actions'
// import './ConnectWallet.scss'

// const ConnectWallet = () => {
//   const { setWalletAddress, setChipsAmount } = useContext(globalContext)
   
//   const { socket } = useContext(socketContext)
//   const navigate = useNavigate()
//   const useQuery = () => new URLSearchParams(useLocation().search);
//   let query = useQuery()

//   useEffect(() => {
//     if(socket !== null && socket.connected === true){
//       const walletAddress = query.get('walletAddress')
//       const gameId = query.get('gameId')
//       const username = query.get('username')
//       if(walletAddress && gameId && username){
//         console.log(username)
//         setWalletAddress(walletAddress)
//         socket.emit(CS_FETCH_LOBBY_INFO, { walletAddress, socketId: socket.id, gameId, username })
//         console.log(CS_FETCH_LOBBY_INFO, { walletAddress, socketId: socket.id, gameId, username })
//         navigate('/play')
//       }
//     }
//   }, [socket])

//   return (
//     <>
//       <LoadingScreen />
//     </>
//   )
// }

// export default ConnectWallet


import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import globalContext from './../../context/global/globalContext';
import LoadingScreen from '../../components/loading/LoadingScreen';
import socketContext from '../../context/websocket/socketContext';
import { CS_FETCH_LOBBY_INFO } from '../../pokergame/actions';
import Button from '../../components/buttons/Button';
import { useWalletContext } from '../../context/walletContext';
import './ConnectWallet.scss';

const ConnectWallet = () => {
  const { setWalletAddress, setChipsAmount } = useContext(globalContext);
  const { socket } = useContext(socketContext);
  const navigate = useNavigate();
  const useQuery = () => new URLSearchParams(useLocation().search);
  let query = useQuery();
  
  const [loading, setLoading] = useState(true);
  const [addressMatch, setAddressMatch] = useState(null);
  
  // Use the wallet context
  const { 
    accounts, 
    connected, 
    loading: walletLoading, 
    error: walletError,
    connectCoinbaseWallet, 
    connectMetaMask, 
    signMessage 
  } = useWalletContext();
  
  // Get query parameters
  const walletAddressFromQuery = query.get('walletAddress');
  const gameId = query.get('gameId');
  const username = query.get('username');
  
  // Initial loading check
  useEffect(() => {
    if (socket !== null && socket.connected === true) {
      if (walletAddressFromQuery && gameId && username) {
        // Keep loading if we have all query params and socket is connected
        // We'll wait for wallet connection before proceeding
      } else {
        // No query params needed, just show connect UI
        setLoading(false);
      }
    } else if (socket === null) {
      // No socket, show connect UI
      setLoading(false);
    }
  }, [socket, walletAddressFromQuery, gameId, username]);
  
  // Handle wallet connection success and message signing
  const handleWalletConnect = async (connectFunction) => {
    try {
      const result = await connectFunction();
      
      if (result && result.accounts.length > 0) {
        const currentAddress = result.accounts[0];
        
        // Sign message and log it to console
        const signedMessage = await signMessage("Connected successfully");
        console.log('Signed message hash:', signedMessage);
        
        // Set wallet address in global context
        setWalletAddress(currentAddress);
        
        // Show success message
        Swal.fire({
          icon: 'success',
          title: 'Wallet Connected',
          text: `Connected with address: ${currentAddress.substring(0, 6)}...${currentAddress.substring(38)}`,
        });
        
        // Check if we have an address from query to compare
        if (walletAddressFromQuery) {
          const isMatch = currentAddress.toLowerCase() === walletAddressFromQuery.toLowerCase();
          setAddressMatch(isMatch);
          
          console.log(`Wallet address match: ${isMatch}`);
          console.log(`Connected wallet: ${currentAddress}`);
          console.log(`Query wallet: ${walletAddressFromQuery}`);
          
          if (!isMatch) {
            Swal.fire({
              icon: 'error',
              title: 'Wallet Mismatch',
              text: 'The connected wallet does not match the expected wallet address.',
            });
          }
        }
      }
    } catch (error) {
      console.error('Wallet connection flow error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Connection Failed',
        text: error.message || 'Failed to connect wallet',
      });
    }
  };
  
  // Handle game entry when wallet is connected and verified
  useEffect(() => {
    // Only proceed if we have the necessary conditions
    if (
      connected && 
      accounts.length > 0 && 
      walletAddressFromQuery && 
      gameId && 
      username && 
      socket && 
      socket.connected
    ) {
      // If address match is explicitly verified as true
      if (addressMatch === true) {
        socket.emit(CS_FETCH_LOBBY_INFO, { 
          walletAddress: accounts[0], 
          socketId: socket.id, 
          gameId, 
          username 
        });
        navigate('/play');
      }
    }
    
    // Turn off loading screen once wallet state is determined
    if (!walletLoading) {
      setLoading(false);
    }
  }, [connected, accounts, addressMatch, socket]);
  
  // Display errors from wallet connection
  useEffect(() => {
    if (walletError) {
      Swal.fire({
        icon: 'error',
        title: 'Wallet Error',
        text: walletError,
      });
    }
  }, [walletError]);
  
  if (loading || walletLoading) {
    return <LoadingScreen />;
  }
  
  return (
    <div className="connect-wallet-container">
      <div className="connect-wallet-box">
        <h1>Connect Your Wallet</h1>
        <p>Please connect your Ethereum wallet to continue to the game</p>
        
        <div className="wallet-buttons">
          <Button 
            primary 
            large 
            onClick={() => handleWalletConnect(connectCoinbaseWallet)}
            className="coinbase-button"
          >
            Connect with Coinbase Wallet
          </Button>
          
          <Button 
            secondary 
            large 
            onClick={() => handleWalletConnect(connectMetaMask)}
            className="metamask-button"
          >
            Connect with MetaMask
          </Button>
        </div>
        
        {connected && accounts.length > 0 && (
          <div className="connection-status">
            <p>✅ Connected: {accounts[0]}</p>
            {addressMatch === false && (
              <p className="address-mismatch-warning">⚠️ Address doesn't match expected wallet!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectWallet;