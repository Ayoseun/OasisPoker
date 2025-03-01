import React from 'react'
import GlobalState from './global/GlobalState'
import { ThemeProvider } from 'styled-components'
import ModalProvider from './modal/ModalProvider'
import theme from '../styles/theme'
import Normalize from '../styles/Normalize'
import GlobalStyles from '../styles/Global'
import { BrowserRouter } from 'react-router-dom'
import WebSocketProvider from './websocket/WebsocketProvider'
import GameState from './game/GameState'
import { WalletProvider } from './walletContext'

const Providers = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <GlobalState>
        <ModalProvider>
          <WebSocketProvider>
          <WalletProvider>
            <GameState>
              <Normalize />
              <GlobalStyles />
              {children}
            </GameState>
            </WalletProvider>
          </WebSocketProvider>
        </ModalProvider>
      </GlobalState>
    </ThemeProvider>
  </BrowserRouter>
)

export default Providers
