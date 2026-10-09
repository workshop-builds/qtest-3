import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// The editor saves to localStorage on every change, so each test starts from a clean store.
beforeEach(() => localStorage.clear())
afterEach(() => cleanup())
