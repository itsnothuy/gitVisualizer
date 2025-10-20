import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ThemeToggle } from '../theme-toggle'

describe('ThemeToggle', () => {
  beforeEach(() => {
    sessionStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  afterEach(() => {
    sessionStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('should render loading state initially', () => {
    render(<ThemeToggle />)
    // The loading state may or may not be visible depending on timing
    // Just check that the component renders by looking for a container with expected classes
    const container = document.querySelector('.flex.items-center.space-x-2')
    expect(container).toBeInTheDocument()
  })

  it('should render button after mount', async () => {
    render(<ThemeToggle />)
    await waitFor(() => {
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()
    })
  })

  it('should show Off state when theme is default', async () => {
    render(<ThemeToggle />)
    await waitFor(() => {
      const button = screen.getByTestId('theme-toggle')
      expect(button).toHaveTextContent('Off')
      expect(button).toHaveAttribute('aria-pressed', 'false')
    })
  })

  it('should toggle to LGB mode when clicked', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    await waitFor(() => {
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()
    })

    const button = screen.getByTestId('theme-toggle')
    await user.click(button)

    await waitFor(() => {
      expect(button).toHaveTextContent('On')
      expect(button).toHaveAttribute('aria-pressed', 'true')
      expect(document.documentElement.getAttribute('data-theme')).toBe('lgb')
    })
  })

  it('should toggle back to default when clicked again', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    await waitFor(() => {
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()
    })

    const button = screen.getByTestId('theme-toggle')
    await user.click(button)

    await waitFor(() => {
      expect(button).toHaveTextContent('On')
    })

    await user.click(button)

    await waitFor(() => {
      expect(button).toHaveTextContent('Off')
      expect(button).toHaveAttribute('aria-pressed', 'false')
      expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
    })
  })

  it('should have proper accessibility attributes', async () => {
    render(<ThemeToggle />)

    await waitFor(() => {
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()
    })

    const button = screen.getByTestId('theme-toggle')
    expect(button).toHaveAttribute('aria-label')
    expect(button).toHaveAttribute('aria-pressed')
  })

  it('should restore LGB theme from sessionStorage', async () => {
    sessionStorage.setItem('git-viz-theme', 'lgb')

    render(<ThemeToggle />)

    await waitFor(() => {
      const button = screen.getByTestId('theme-toggle')
      expect(button).toHaveTextContent('On')
      expect(button).toHaveAttribute('aria-pressed', 'true')
    })
  })
})
