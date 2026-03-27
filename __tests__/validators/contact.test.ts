import { describe, it, expect } from 'vitest'
import { createContactSchema } from '@/lib/validators/contact'

describe('createContactSchema', () => {
  const validContact = {
    name: 'Jan Novák',
    phone: '777123456',
  }

  it('platný input projde', () => {
    const result = createContactSchema.safeParse(validContact)
    expect(result.success).toBe(true)
  })

  it('s volitelným emailem projde', () => {
    const result = createContactSchema.safeParse({
      ...validContact,
      email: 'jan@example.com',
    })
    expect(result.success).toBe(true)
  })

  it('prázdné jméno selže', () => {
    const result = createContactSchema.safeParse({ ...validContact, name: '' })
    expect(result.success).toBe(false)
  })

  it('chybějící jméno selže', () => {
    const { name, ...without } = validContact
    const result = createContactSchema.safeParse(without)
    expect(result.success).toBe(false)
  })

  it('neplatný email selže', () => {
    const result = createContactSchema.safeParse({
      ...validContact,
      email: 'not-an-email',
    })
    expect(result.success).toBe(false)
  })

  it('prázdný telefon selže', () => {
    const result = createContactSchema.safeParse({ ...validContact, phone: '' })
    expect(result.success).toBe(false)
  })

  it('null email projde (nullable)', () => {
    const result = createContactSchema.safeParse({
      ...validContact,
      email: null,
    })
    expect(result.success).toBe(true)
  })
})
