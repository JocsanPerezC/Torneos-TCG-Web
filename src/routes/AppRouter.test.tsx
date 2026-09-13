import { fireEvent, render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppRouter } from './AppRouter'
import { TournamentProvider } from '../state/TournamentContext'
import { AuthProvider } from '../state/AuthContext'

describe('formularios críticos', () => {
  it('crea un torneo desde el formulario', () => {
    window.history.pushState({}, '', '/tournaments/new')
    render(<BrowserRouter><AuthProvider><TournamentProvider><AppRouter /></TournamentProvider></AuthProvider></BrowserRouter>)
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Copa de prueba' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Crear torneo' }).closest('form')!)
    expect(screen.getByRole('heading', { name: 'Copa de prueba' })).toBeInTheDocument()
  })
})
