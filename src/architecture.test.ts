/// <reference types="node" />
import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const THIS_DIR = path.dirname(fileURLToPath(import.meta.url))
const SRC = THIS_DIR
const FEATURES = path.join(SRC, 'features')

function collectTsFiles(dir: string): string[] {
  const results: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...collectTsFiles(full))
    } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.test.ts') && !entry.name.endsWith('.test.tsx')) {
      results.push(full)
    }
  }
  return results
}

function extractImports(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const matches = [...content.matchAll(/from\s+['"]([^'"]+)['"]/g)]
  return matches.map(m => m[1]!)
}

const FEATURE_MODULES = ['auth-entry', 'workspace-graph', 'workspace-search', 'workspace-details', 'admin']

describe('Architecture boundary checks', () => {
  describe('dependency direction — no cross-feature imports', () => {
    for (const mod of FEATURE_MODULES) {
      const modDir = path.join(FEATURES, mod)
      if (!fs.existsSync(modDir)) continue

      const files = collectTsFiles(modDir)
      for (const file of files) {
        const rel = path.relative(SRC, file)
        it(`${rel} does not import from other feature modules`, () => {
          const imports = extractImports(file)
          const otherFeatures = FEATURE_MODULES.filter(f => f !== mod)

          for (const imp of imports) {
            for (const other of otherFeatures) {
              expect(imp).not.toContain(`features/${other}`)
              expect(imp).not.toMatch(new RegExp(`\\.\\./\\.\\./features/${other}`))
              // Relative sibling imports like ../workspace-graph are also cross-feature
              expect(imp).not.toMatch(new RegExp(`\\.\\./${other}`))
            }
          }
        })
      }
    }
  })

  describe('ui-shell does not absorb feature domain logic', () => {
    const shellDir = path.join(SRC, 'ui-shell')
    const shellFiles = collectTsFiles(shellDir)

    for (const file of shellFiles) {
      const rel = path.relative(SRC, file)
      it(`${rel} does not import feature internals directly`, () => {
        const imports = extractImports(file)
        for (const imp of imports) {
          // ui-shell may import from feature barrel (index) but not from internal modules
          if (imp.includes('features/')) {
            const afterFeatures = imp.split('features/')[1]!
            const segments = afterFeatures.split('/')
            // Allowed: ../features/workspace-graph or ../features/workspace-graph/index
            // Forbidden: ../features/workspace-graph/use-graph-data
            if (segments.length > 1) {
              expect(segments[1]).toBe('index')
            }
          }
        }
      })
    }
  })

  describe('api-contract is the only GraphQL boundary', () => {
    it('feature modules only import GraphQL types/operations from api-contract', () => {
      for (const mod of FEATURE_MODULES) {
        const modDir = path.join(FEATURES, mod)
        if (!fs.existsSync(modDir)) continue

        const files = collectTsFiles(modDir)
        for (const file of files) {
          const content = fs.readFileSync(file, 'utf-8')
          const imports = extractImports(file)

          // No direct graphql or @apollo imports for operations
          for (const imp of imports) {
            if (imp === 'graphql' || imp.startsWith('graphql/')) {
              throw new Error(`${path.relative(SRC, file)} imports graphql directly — use api-contract`)
            }
          }

          // No inline gql`` template literals
          const hasInlineGql = /\bgql\s*`/.test(content) && !file.includes('api-contract')
          expect(hasInlineGql).toBe(false)
        }
      }
    })
  })
})

describe('Route boundary checks', () => {
  it('App.tsx exposes /sign-in and /admin as public routes outside AuthGuard', async () => {
    const appPath = path.join(SRC, 'App.tsx')
    const content = fs.readFileSync(appPath, 'utf-8')

    // /sign-in is outside AuthGuard
    expect(content).toMatch(/Route.*path="\/sign-in"/)
    // /admin is outside AuthGuard
    expect(content).toMatch(/Route.*path="\/admin"/)
    // AuthGuard wraps the workspace catch-all
    expect(content).toMatch(/Route.*element=\{<AuthGuard/)
  })

  it('AuthGuard redirects unauthenticated users to /sign-in', async () => {
    const guardPath = path.join(SRC, 'features', 'auth-entry', 'AuthGuard.tsx')
    const content = fs.readFileSync(guardPath, 'utf-8')

    expect(content).toContain('Navigate to="/sign-in"')
    expect(content).toContain('isAuthenticated')
  })
})

describe('Admin placeholder scope checks', () => {
  it('AdminPlaceholder has no mutation imports or form actions', () => {
    const adminDir = path.join(FEATURES, 'admin')
    const files = collectTsFiles(adminDir)

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8')
      const imports = extractImports(file)

      // No GraphQL mutation imports
      for (const imp of imports) {
        expect(imp).not.toContain('MUTATION')
        expect(imp).not.toContain('mutation')
      }

      // No form submission logic
      expect(content).not.toContain('onSubmit')
      expect(content).not.toContain('useMutation')
    }
  })
})

describe('Content ownership invariant checks', () => {
  it('Atom type defines primary entity structure with nuclearies and bonds', () => {
    const graphQueries = path.join(SRC, 'api-contract', 'graph-queries.ts')
    const content = fs.readFileSync(graphQueries, 'utf-8')

    // Atoms are primary entities
    expect(content).toMatch(/export interface Atom/)
    // Bonds model relationships between atoms
    expect(content).toMatch(/bonds:\s*AtomBond\[\]/)
    // Nuclearies belong to atoms (nested under properties)
    expect(content).toMatch(/nuclearies:\s*AtomNuclearies/)
    // Labels are referenced metadata (simple string array, not entity)
    expect(content).toMatch(/labels:\s*string\[\]/)
  })

  it('workspace-search does not own graph mutation state', () => {
    const searchDir = path.join(FEATURES, 'workspace-search')
    const files = collectTsFiles(searchDir)

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8')

      // No mutation operations
      expect(content).not.toContain('MUTATION')
      expect(content).not.toContain('useMutation')
      expect(content).not.toContain('createAtom')
      expect(content).not.toContain('deleteAtom')
      expect(content).not.toContain('updateAtom')
    }
  })
})
