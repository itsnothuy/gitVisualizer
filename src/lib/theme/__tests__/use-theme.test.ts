import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTheme } from '../use-theme'

describe('useTheme', () => {
  beforeEach(() => {
    sessionStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  afterEach(() => {
    sessionStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('should initialize with default theme', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('default')
    // mounted state may be true depending on timing, so we don't check it initially
  })

  it('should mark as mounted after effect runs', async () => {
    const { result } = renderHook(() => useTheme())
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
    })
    expect(result.current.mounted).toBe(true)
  })

  it('should set theme and persist to sessionStorage', async () => {
    const { result } = renderHook(() => useTheme())
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
    })
    act(() => {
      result.current.setTheme('lgb')
    })
    expect(result.current.theme).toBe('lgb')
    expect(sessionStorage.getItem('git-viz-theme')).toBe('lgb')
    expect(document.documentElement.getAttribute('data-theme')).toBe('lgb')
  })

  it('should restore theme from sessionStorage on mount', async () => {
    sessionStorage.setItem('git-viz-theme', 'lgb')
    const { result } = renderHook(() => useTheme())
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
    })
    expect(result.current.theme).toBe('lgb')
    expect(document.documentElement.getAttribute('data-theme')).toBe('lgb')
  })

  it('should switch from lgb back to default', async () => {
    const { result } = renderHook(() => useTheme())
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
    })
    act(() => {
      result.current.setTheme('lgb')
    })
    expect(result.current.theme).toBe('lgb')
    act(() => {
      result.current.setTheme('default')
    })
    expect(result.current.theme).toBe('default')
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })
})
