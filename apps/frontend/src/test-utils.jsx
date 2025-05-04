// src/test-utils.jsx
import React from 'react'
import { render } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import { MemoryRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import store from './store'

const AllTheProviders = ({ children }) => {
  return (
    <Provider store={store}>
      <ChakraProvider>
        <MemoryRouter>
          {children}
        </MemoryRouter>
      </ChakraProvider>
    </Provider>
  )
}

const customRender = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'

// Override render method
export { customRender as render }