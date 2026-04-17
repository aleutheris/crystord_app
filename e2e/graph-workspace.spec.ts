import { test, expect } from '@playwright/test'

function mockGraphQL(page: import('@playwright/test').Page) {
  const atoms = [
    {
      labels: ['Project'],
      bonds: [{ uuid: 'atom-2', name: 'DEPENDS_ON', direction: 'from' }],
      properties: {
        shellies: { uuid: 'atom-1' },
        nuclearies: { title: 'Alpha', description: 'First', content: 'Active', operation: '', constants: {} },
      },
    },
    {
      labels: ['Task'],
      bonds: [],
      properties: {
        shellies: { uuid: 'atom-2' },
        nuclearies: { title: 'Beta', description: 'Second', content: 'Pending', operation: '', constants: {} },
      },
    },
  ]

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
          data: { schemaInfo: { schemaVersion: '1.0.0', schemaHash: 'abc', releasedAt: '2025-01-01T00:00:00Z' } },
        }),
      })
    }

    if (query.includes('signin')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { signin: 'mock-token' } }),
      })
    }

    if (query.includes('list_labels')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { list_labels: ['Project', 'Task'] } }),
      })
    }

    if (query.includes('retrieve')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { retrieve: atoms } }),
      })
    }

    if (query.includes('change')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { change: ['new-uuid'] } }),
      })
    }

    if (query.includes('destroy')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { destroy: true } }),
      })
    }

    return route.continue()
  })
}

async function signIn(page: import('@playwright/test').Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
  const responsePromise = page.waitForResponse((r) =>
    r.url().includes('/graphql') && r.request().postData()?.includes('signin') === true,
  )
  await page.getByRole('button', { name: /sign in/i }).click()
  await responsePromise
}

test.describe('Graph workspace', () => {
  test('shows graph canvas with atom nodes after sign-in', async ({ page }) => {
    await mockGraphQL(page)
    await signIn(page)

    await expect(page.getByText('Alpha')).toBeVisible()
    await expect(page.getByText('Beta')).toBeVisible()
  })

  test('opens detail panel when clicking an atom node', async ({ page }) => {
    await mockGraphQL(page)
    await signIn(page)

    await page.getByText('Alpha').click()
    await expect(page.getByRole('complementary', { name: /atom details/i })).toBeVisible()
    await expect(page.getByLabel(/title/i)).toHaveValue('Alpha')
    await expect(page.getByLabel(/labels/i)).toHaveValue('Project')
    await expect(page.getByLabel(/description/i)).toHaveValue('First')
  })

  test('closes detail panel', async ({ page }) => {
    await mockGraphQL(page)
    await signIn(page)

    await page.getByText('Alpha').click()
    await expect(page.getByRole('complementary', { name: /atom details/i })).toBeVisible()

    await page.getByRole('button', { name: /close panel/i }).click()
    await expect(page.getByRole('complementary', { name: /atom details/i })).not.toBeVisible()
  })

  test('switches detail panel between atoms', async ({ page }) => {
    await mockGraphQL(page)
    await signIn(page)

    await page.getByText('Alpha').click()
    await expect(page.getByLabel(/title/i)).toHaveValue('Alpha')

    await page.getByText('Beta').click()
    await expect(page.getByLabel(/title/i)).toHaveValue('Beta')
    await expect(page.getByLabel(/labels/i)).toHaveValue('Task')
  })
})
