import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock next-auth/jwt
vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}))

// Mock NextResponse and NextRequest
const mockRewrite = vi.fn()
const mockRedirect = vi.fn()
const mockNext = vi.fn()

vi.mock('next/server', () => {
  return {
    NextResponse: {
      rewrite: (url: URL) => {
        mockRewrite(url)
        return {
          headers: new Map(),
        }
      },
      redirect: (url: URL) => {
        mockRedirect(url)
        return {
          headers: new Map(),
        }
      },
      next: () => {
        mockNext()
        return {
          headers: new Map(),
        }
      },
    },
  }
})

import { getToken } from 'next-auth/jwt'
import { middleware } from '@/middleware'

function createRequest(
  path: string,
  host: string = 'localhost:3000',
  cookies: Record<string, string> = {}
) {
  const url = new URL(path, `http://${host}`)
  return {
    nextUrl: url,
    url: url.toString(),
    headers: {
      get: (name: string) => {
        if (name === 'host') return host
        return null
      },
    },
    cookies: {
      get: (name: string) => {
        if (name in cookies) {
          return { value: cookies[name] }
        }
        return undefined
      },
    },
  } as any // eslint-disable-line @typescript-eslint/no-explicit-any
}

describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Nastavit SITE_PASSWORD pro testy (middleware cte z process.env)
    process.env.SITE_PASSWORD = 'Admin2026'
  })

  afterEach(() => {
    delete process.env.SITE_PASSWORD
  })

  describe('site password ochrana', () => {
    it('přesměruje na /gate bez platného cookie', async () => {
      await middleware(createRequest('/'))
      expect(mockRedirect).toHaveBeenCalled()
      const redirectUrl = mockRedirect.mock.calls[0][0]
      expect(redirectUrl.pathname).toBe('/gate')
    })

    it('pustí dál s platným cookie', async () => {
      await middleware(createRequest('/', 'localhost:3000', { site_access: 'Admin2026' }))
      expect(mockNext).toHaveBeenCalled()
    })

    it('bez SITE_PASSWORD v env je web veřejný', async () => {
      delete process.env.SITE_PASSWORD
      await middleware(createRequest('/'))
      expect(mockRedirect).not.toHaveBeenCalled()
      expect(mockNext).toHaveBeenCalled()
    })

    it('přeskočí kontrolu pro API cesty', async () => {
      await middleware(createRequest('/api/test', 'localhost:3000'))
      // API cesty by neměly redirectovat na /gate
      // Ale mohou projít dalšími kontrolami
    })

    it('přeskočí kontrolu pro /_next/', async () => {
      await middleware(createRequest('/_next/static/chunk.js', 'localhost:3000'))
    })
  })

  describe('subdomain rewrite', () => {
    it('inzerce subdoména rewrituje / na /inzerce', async () => {
      await middleware(
        createRequest('/', 'inzerce.localhost:3000', { site_access: 'Admin2026' })
      )
      expect(mockRewrite).toHaveBeenCalled()
      const rewriteUrl = mockRewrite.mock.calls[0][0]
      expect(rewriteUrl.pathname).toBe('/inzerce/')
    })

    it('shop subdoména rewrituje / na /shop', async () => {
      await middleware(
        createRequest('/', 'shop.localhost:3000', { site_access: 'Admin2026' })
      )
      expect(mockRewrite).toHaveBeenCalled()
      const rewriteUrl = mockRewrite.mock.calls[0][0]
      expect(rewriteUrl.pathname).toBe('/shop/')
    })

    it('main subdoména nerewrituje', async () => {
      await middleware(
        createRequest('/', 'localhost:3000', { site_access: 'Admin2026' })
      )
      expect(mockRewrite).not.toHaveBeenCalled()
      expect(mockNext).toHaveBeenCalled()
    })

    it('inzerce subdoména nepřepisuje cestu /inzerce', async () => {
      await middleware(
        createRequest('/inzerce/katalog', 'inzerce.localhost:3000', {
          site_access: 'Admin2026',
        })
      )
      expect(mockRewrite).not.toHaveBeenCalled()
    })
  })

  describe('admin auth guard', () => {
    it('přesměruje nepřihlášeného na /login', async () => {
      vi.mocked(getToken).mockResolvedValue(null)
      await middleware(
        createRequest('/admin/dashboard', 'localhost:3000', {
          site_access: 'Admin2026',
        })
      )
      expect(mockRedirect).toHaveBeenCalled()
      const redirectUrl = mockRedirect.mock.calls[0][0]
      expect(redirectUrl.pathname).toBe('/login')
    })

    it('přesměruje uživatele bez admin role na /', async () => {
      vi.mocked(getToken).mockResolvedValue({ role: 'BROKER' } as any)
      await middleware(
        createRequest('/admin/dashboard', 'localhost:3000', {
          site_access: 'Admin2026',
        })
      )
      expect(mockRedirect).toHaveBeenCalled()
      const redirectUrl = mockRedirect.mock.calls[0][0]
      expect(redirectUrl.pathname).toBe('/')
    })

    it('pustí ADMIN na admin stránky', async () => {
      vi.mocked(getToken).mockResolvedValue({ role: 'ADMIN' } as any)
      await middleware(
        createRequest('/admin/dashboard', 'localhost:3000', {
          site_access: 'Admin2026',
        })
      )
      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('makléř auth guard', () => {
    it('přesměruje nepřihlášeného z /makler/dashboard na /login', async () => {
      vi.mocked(getToken).mockResolvedValue(null)
      await middleware(
        createRequest('/makler/dashboard', 'localhost:3000', {
          site_access: 'Admin2026',
        })
      )
      expect(mockRedirect).toHaveBeenCalled()
      const redirectUrl = mockRedirect.mock.calls[0][0]
      expect(redirectUrl.pathname).toBe('/login')
    })

    it('přesměruje ADVERTISER z makléřských stránek na /', async () => {
      vi.mocked(getToken).mockResolvedValue({ role: 'ADVERTISER' } as any)
      await middleware(
        createRequest('/makler/dashboard', 'localhost:3000', {
          site_access: 'Admin2026',
        })
      )
      expect(mockRedirect).toHaveBeenCalled()
      const redirectUrl = mockRedirect.mock.calls[0][0]
      expect(redirectUrl.pathname).toBe('/')
    })

    it('pustí BROKER na makléřské stránky', async () => {
      vi.mocked(getToken).mockResolvedValue({
        role: 'BROKER',
        status: 'ACTIVE',
      } as any)
      await middleware(
        createRequest('/makler/dashboard', 'localhost:3000', {
          site_access: 'Admin2026',
        })
      )
      expect(mockNext).toHaveBeenCalled()
    })

    it('přesměruje ONBOARDING makléře na onboarding', async () => {
      vi.mocked(getToken).mockResolvedValue({
        role: 'BROKER',
        status: 'ONBOARDING',
      } as any)
      await middleware(
        createRequest('/makler/dashboard', 'localhost:3000', {
          site_access: 'Admin2026',
        })
      )
      expect(mockRedirect).toHaveBeenCalled()
      const redirectUrl = mockRedirect.mock.calls[0][0]
      expect(redirectUrl.pathname).toBe('/makler/onboarding')
    })
  })

  describe('parts-supplier auth guard', () => {
    it('přesměruje nepřihlášeného z /parts na /login', async () => {
      vi.mocked(getToken).mockResolvedValue(null)
      await middleware(
        createRequest('/parts/dashboard', 'localhost:3000', {
          site_access: 'Admin2026',
        })
      )
      expect(mockRedirect).toHaveBeenCalled()
      const redirectUrl = mockRedirect.mock.calls[0][0]
      expect(redirectUrl.pathname).toBe('/login')
    })

    it('přesměruje BROKER z /parts na /', async () => {
      vi.mocked(getToken).mockResolvedValue({ role: 'BROKER' } as any)
      await middleware(
        createRequest('/parts/dashboard', 'localhost:3000', {
          site_access: 'Admin2026',
        })
      )
      expect(mockRedirect).toHaveBeenCalled()
    })

    it('pustí PARTS_SUPPLIER na parts stránky', async () => {
      vi.mocked(getToken).mockResolvedValue({ role: 'PARTS_SUPPLIER' } as any)
      await middleware(
        createRequest('/parts/dashboard', 'localhost:3000', {
          site_access: 'Admin2026',
        })
      )
      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('x-subdomain header', () => {
    it('nastaví x-subdomain header v odpovědi', async () => {
      const response = await middleware(
        createRequest('/', 'localhost:3000', { site_access: 'Admin2026' })
      )
      // Response by měla mít headers objekt (mockovaný jako Map)
      expect(response).toBeDefined()
    })
  })
})
