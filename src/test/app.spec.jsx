import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import App from '../App.jsx'

describe('App', () => {
  it('shows the postcode submit action', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /check my bins/i })).toBeInTheDocument()
  })
})

