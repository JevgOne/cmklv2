// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import {
  getCart,
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  getCartTotal,
  getCartCount,
} from '@/lib/cart'

describe('Cart (localStorage)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('getCart vrací prázdné pole na začátku', () => {
    expect(getCart()).toEqual([])
  })

  it('addToCart přidá položku', () => {
    addToCart({ id: '1', name: 'Brzdové destičky', price: 500 })
    const cart = getCart()
    expect(cart).toHaveLength(1)
    expect(cart[0].id).toBe('1')
    expect(cart[0].name).toBe('Brzdové destičky')
    expect(cart[0].quantity).toBe(1)
  })

  it('addToCart zvyšuje quantity u existující položky', () => {
    addToCart({ id: '1', name: 'Brzdové destičky', price: 500 })
    addToCart({ id: '1', name: 'Brzdové destičky', price: 500 })
    const cart = getCart()
    expect(cart).toHaveLength(1)
    expect(cart[0].quantity).toBe(2)
  })

  it('addToCart s vlastní quantity', () => {
    addToCart({ id: '1', name: 'Díl', price: 100, quantity: 5 })
    const cart = getCart()
    expect(cart[0].quantity).toBe(5)
  })

  it('removeFromCart odebere položku', () => {
    addToCart({ id: '1', name: 'Díl A', price: 100 })
    addToCart({ id: '2', name: 'Díl B', price: 200 })
    removeFromCart('1')
    const cart = getCart()
    expect(cart).toHaveLength(1)
    expect(cart[0].id).toBe('2')
  })

  it('updateQuantity změní množství', () => {
    addToCart({ id: '1', name: 'Díl', price: 100 })
    updateQuantity('1', 3)
    const cart = getCart()
    expect(cart[0].quantity).toBe(3)
  })

  it('updateQuantity s 0 odebere položku', () => {
    addToCart({ id: '1', name: 'Díl', price: 100 })
    updateQuantity('1', 0)
    const cart = getCart()
    expect(cart).toHaveLength(0)
  })

  it('clearCart vymaže celý košík', () => {
    addToCart({ id: '1', name: 'Díl A', price: 100 })
    addToCart({ id: '2', name: 'Díl B', price: 200 })
    clearCart()
    expect(getCart()).toEqual([])
  })

  it('getCartTotal vrací celkovou cenu', () => {
    addToCart({ id: '1', name: 'Díl A', price: 100 })
    addToCart({ id: '2', name: 'Díl B', price: 200, quantity: 2 })
    // 100*1 + 200*2 = 500
    expect(getCartTotal()).toBe(500)
  })

  it('getCartCount vrací celkový počet kusů', () => {
    addToCart({ id: '1', name: 'Díl A', price: 100 })
    addToCart({ id: '2', name: 'Díl B', price: 200, quantity: 3 })
    // 1 + 3 = 4
    expect(getCartCount()).toBe(4)
  })

  it('prázdný košík — total=0, count=0', () => {
    expect(getCartTotal()).toBe(0)
    expect(getCartCount()).toBe(0)
  })
})
