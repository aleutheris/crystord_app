import { test, expect } from '@playwright/test'

function mockGraphQL(page: import('@playwright/test').Page) {
  return page.route('**/graphql', (route) => {
    const postData = route.request().postData()
    if (!postData) return route.continue()

    const body = JSON.parse(postData)
    const query: string = body.query ?? ''

    if (query.includes('schemaInfo')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            schemaInfo: {
              schemaVersion: '1.0.0',
              schemaHash: 'abc123',
              releasedAt: '2025-01-01T00:00:00Z',
            },
          },
        }),
      })
    }

    if (query.includes('signin')) {
      const { email, password } = body.variables ?? {}
      if (email === 'demo' && password === 'demo') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { signin: 'mock-bearer-token' } }),
        })
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { signin: null }, errors: [{ message: 'Invalid credentials' }] }),
      })
    }

    return route.continue()
  })
}

test.describe('Sign-in flow', () => {
  test('redirects unauthenticated user to sign-in page', async ({ page }) => {
    await mockGraphQL(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toHaveValue('demo')
    await expect(page.getByLabel(/password/i)).toHaveValue('demo')
  })

  test('signs in with demo credentials and reaches workspace', async ({ page }) => {
    await mockGraphQL(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()

    const responsePromise = page.waitForResponse((resp) =>
      resp.url().includes('/graphql') && resp.request().postData()?.includes('signin') === true
    )
    await page.getByRole('button', { name: /sign in/i }).click()
    await responsePromise

    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible()
  })

  test('sign out returns to sign-in page', async ({ page }) => {
    await mockGraphQL(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()

    const responsePromise = page.waitForResponse((resp) =>
      resp.url().includes('/graphql') && resp.request().postData()?.includes('signin') === true
    )
    await page.getByRole('button', { name: /sign in/i }).click()
    await responsePromise

    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible()
    await page.getByRole('button', { name: /sign out/i }).click()
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
  })
})
