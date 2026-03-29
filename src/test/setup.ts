import '@testing-library/jest-dom'

// Basic jsdom environment setup
// vitest.config.ts sets environment: 'jsdom' which provides window, document, etc.

// Mock localStorage for store tests
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
    get length() { return Object.keys(store).length },
    key: (i: number) => Object.keys(store)[i] ?? null,
  }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })
