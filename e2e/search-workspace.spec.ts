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
    {
      labels: ['Project', 'Active'],
      bonds: [],
      properties: {
        shellies: { uuid: 'atom-3' },
        nuclearies: { title: 'Gamma', description: 'Third', content: 'Done', operation: '', constants: {} },
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
        body: JSON.stringify({ data: { list_labels: ['Active', 'Project', 'Task'] } }),
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

async function submitSearch(page: import('@playwright/test').Page) {
  const retrieveResponse = page.waitForResponse(
    (r) => r.url().includes('/graphql') && r.request().postData()?.includes('retrieve') === true,
  )
  await page.getByLabel(/search labels/i).click()
  await page.keyboard.press('Enter')
  await retrieveResponse
}

test.describe('Search and discoverability', () => {
  test('recommended label chips are visible in blank workspace before search', async ({ page }) => {
    await mockGraphQL(page)
    await signIn(page)

    await expect(page.getByLabel(/search labels/i)).toBeVisible()
    await expect(page.getByText('Alpha')).not.toBeVisible()
    // Recommended labels from list_labels are visible before any search
    await expect(page.getByRole('button', { name: 'Active' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Project' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Task' })).toBeVisible()
  })

  test('label chips remain available after search loads atoms', async ({ page }) => {
    await mockGraphQL(page)
    await signIn(page)
    await submitSearch(page)

    await expect(page.getByRole('button', { name: 'Project' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Task' })).toBeVisible()
  })

  test('label query filters graph and shows result panel', async ({ page }) => {
    await mockGraphQL(page)
    await signIn(page)
    await submitSearch(page)

    await page.getByLabel(/search labels/i).fill('proj')

    // Query summary appears
    await expect(page.getByRole('status', { name: /active query/i })).toBeVisible()
    await expect(page.getByText('2 results')).toBeVisible()

    // Result panel appears with matching atoms
    await expect(page.getByRole('complementary', { name: /search results/i })).toBeVisible()
    await expect(page.getByRole('complementary', { name: /search results/i }).getByText('Alpha')).toBeVisible()
    await expect(page.getByRole('complementary', { name: /search results/i }).getByText('Gamma')).toBeVisible()
  })

  test('label chip filter scopes results', async ({ page }) => {
    await mockGraphQL(page)
    await signIn(page)
    await submitSearch(page)

    await page.getByRole('button', { name: 'Task' }).click()

    await expect(page.getByText('1 result')).toBeVisible()
    await expect(page.getByRole('complementary', { name: /search results/i }).getByText('Beta')).toBeVisible()
  })

  test('clicking a search result selects the atom', async ({ page }) => {
    await mockGraphQL(page)
    await signIn(page)
    await submitSearch(page)

    await page.getByRole('button', { name: 'Task' }).click()

    const resultPanel = page.getByRole('complementary', { name: /search results/i })
    await resultPanel.getByText('Beta').click()

    // Detail panel opens for the clicked atom
    const detailPanel = page.getByRole('complementary', { name: /atom details/i })
    await expect(detailPanel).toBeVisible()
    await expect(detailPanel.getByLabel(/title/i)).toHaveValue('Beta')
  })

  test('clear button removes search and hides result panel', async ({ page }) => {
    await mockGraphQL(page)
    await signIn(page)
    await submitSearch(page)

    await page.getByLabel(/search labels/i).fill('proj')
    await expect(page.getByRole('complementary', { name: /search results/i })).toBeVisible()

    await page.getByLabel(/clear search/i).click()

    await expect(page.getByRole('complementary', { name: /search results/i })).not.toBeVisible()
    await expect(page.getByRole('status', { name: /active query/i })).not.toBeVisible()
  })
})
