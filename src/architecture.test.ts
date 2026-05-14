/// <reference types="node" />
import { describe, it, expect, beforeAll } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const THIS_DIR = path.dirname(fileURLToPath(import.meta.url))
const SRC = THIS_DIR
const ROOT = path.resolve(SRC, '..')
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

// --- BI-260015: Frontend architecture baseline (G1-G5) ---

describe('State partition checks (G2)', () => {
  it('server state is accessed through api-contract query adapters only', () => {
    // Features that talk to the server must go through api-contract
    for (const mod of FEATURE_MODULES) {
      const modDir = path.join(FEATURES, mod)
      if (!fs.existsSync(modDir)) continue

      const files = collectTsFiles(modDir)
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8')
        // No raw fetch/XMLHttpRequest for data
        expect(content).not.toMatch(/\bfetch\s*\(/)
        expect(content).not.toContain('XMLHttpRequest')
        // No direct ApolloClient construction inside features
        expect(content).not.toContain('new ApolloClient')
        expect(content).not.toContain('createApolloClient')
      }
    }
  })

  it('workspace shell owns shared workspace state composition', () => {
    const shell = fs.readFileSync(path.join(SRC, 'ui-shell', 'WorkspaceShell.tsx'), 'utf-8')

    // Shell composes feature hooks and passes data down
    expect(shell).toContain('useGraphData')
    expect(shell).toContain('useSearch')
    expect(shell).toContain('selectedAtomId')
  })

  it('feature-local state stays inside feature boundaries', () => {
    // useSearch holds its own filter state (labelQuery, selectedLabels)
    const useSearchFile = fs.readFileSync(
      path.join(FEATURES, 'workspace-search', 'use-search.ts'), 'utf-8',
    )
    expect(useSearchFile).toContain('useState')
    expect(useSearchFile).toContain('labelQuery')
    expect(useSearchFile).toContain('selectedLabels')

    // useGraphData holds its own atoms/loading/error state
    const useGraphFile = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'use-graph-data.ts'), 'utf-8',
    )
    expect(useGraphFile).toContain('useState<Atom[]>')
    expect(useGraphFile).toContain('useState(false)')
    expect(useGraphFile).toContain('useState<string | null>')
  })
})

describe('Contract stability — barrel export checks (G5)', () => {
  const EXPECTED_BARRELS: Record<string, string[]> = {
    'auth-entry': ['AuthProvider', 'useAuth', 'SignInPage', 'AuthGuard'],
    'workspace-graph': ['GraphCanvas', 'useGraphData', 'GraphData'],
    'workspace-search': ['SearchBar', 'QuerySummary', 'SearchResultPanel', 'useSearch', 'SearchState', 'SearchFilters'],
    'workspace-details': ['DetailPanel'],
    'admin': ['AdminPlaceholder'],
  }

  for (const [mod, expectedExports] of Object.entries(EXPECTED_BARRELS)) {
    it(`${mod}/index.ts exports the approved public API`, () => {
      const barrel = fs.readFileSync(path.join(FEATURES, mod, 'index.ts'), 'utf-8')

      for (const name of expectedExports) {
        expect(barrel).toContain(name)
      }
    })
  }

  it('api-contract/index.ts exports the approved public API', () => {
    const barrel = fs.readFileSync(path.join(SRC, 'api-contract', 'index.ts'), 'utf-8')

    const expectedExports = [
      'createApolloClient', 'getAuthToken', 'setAuthToken',
      'SCHEMA_INFO_QUERY', 'SchemaInfo', 'SchemaInfoResponse',
      'SIGN_IN_QUERY', 'SignInResponse',
      'checkSchemaCompatibility', 'CompatibilityResult',
      'LIST_LABELS_QUERY', 'RETRIEVE_QUERY',
      'CREATE_ATOMS_MUTATION', 'UPDATE_ATOM_MUTATION', 'DESTROY_ATOMS_MUTATION',
      'Atom', 'AtomBond', 'AtomNuclearies', 'RetrieveResponse', 'ListLabelsResponse',
    ]

    for (const name of expectedExports) {
      expect(barrel).toContain(name)
    }
  })
})

describe('CSR-first runtime lock (G3)', () => {
  it('no SSR framework dependencies in package.json', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8')) as Record<string, Record<string, string>>
    const allDeps = { ...pkg['dependencies'], ...pkg['devDependencies'] }

    const ssrPackages = ['next', 'nuxt', 'remix', '@remix-run/node', 'gatsby', 'astro']
    for (const ssr of ssrPackages) {
      expect(allDeps).not.toHaveProperty(ssr)
    }
  })

  it('no SSR-specific patterns in source code', () => {
    const allFiles = collectTsFiles(SRC)
    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf-8')
      expect(content).not.toContain('getServerSideProps')
      expect(content).not.toContain('getStaticProps')
      expect(content).not.toContain('renderToString')
      expect(content).not.toContain('renderToPipeableStream')
    }
  })
})

describe('Single-app constraint — no micro-frontend split (G1/CR)', () => {
  it('vite config has no module federation plugin', () => {
    const viteConfig = fs.readFileSync(path.join(ROOT, 'vite.config.ts'), 'utf-8')
    expect(viteConfig).not.toContain('federation')
    expect(viteConfig).not.toContain('ModuleFederation')
  })

  it('package.json has no module federation dependencies', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8')) as Record<string, Record<string, string>>
    const allDeps = { ...pkg['dependencies'], ...pkg['devDependencies'] }

    const mfPackages = ['@module-federation/vite', '@originjs/vite-plugin-federation', 'webpack']
    for (const mf of mfPackages) {
      expect(allDeps).not.toHaveProperty(mf)
    }
  })

  it('single entry point in main.tsx', () => {
    const main = fs.readFileSync(path.join(SRC, 'main.tsx'), 'utf-8')
    expect(main).toContain('createRoot')
    expect(main).toContain('<App')
  })
})

// --- BI-260016: Stack selection criteria and concrete MVP stack (H1-H9) ---

describe('MVP stack baseline conformance (H9)', () => {
  let deps: Record<string, string>
  let devDeps: Record<string, string>

  beforeAll(() => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8')) as Record<string, Record<string, string>>
    deps = pkg['dependencies'] ?? {}
    devDeps = pkg['devDependencies'] ?? {}
  })

  it('includes React + TypeScript runtime', () => {
    expect(deps).toHaveProperty('react')
    expect(deps).toHaveProperty('react-dom')
    expect(devDeps).toHaveProperty('typescript')
  })

  it('includes React Router', () => {
    expect(deps).toHaveProperty('react-router')
  })

  it('includes Apollo Client for GraphQL', () => {
    expect(deps).toHaveProperty('@apollo/client')
    expect(deps).toHaveProperty('graphql')
  })

  it('includes editor-grade graph library (React Flow)', () => {
    expect(deps).toHaveProperty('@xyflow/react')
  })

  it('includes Vitest + Testing Library + Playwright testing stack', () => {
    expect(devDeps).toHaveProperty('vitest')
    expect(devDeps).toHaveProperty('@testing-library/react')
    expect(devDeps).toHaveProperty('@playwright/test')
  })

  it('includes Vite + ESLint build/lint tooling', () => {
    expect(devDeps).toHaveProperty('vite')
    expect(devDeps).toHaveProperty('eslint')
  })
})

describe('CI gate scripts exist (H5)', () => {
  let scripts: Record<string, string>

  beforeAll(() => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8')) as Record<string, Record<string, string>>
    scripts = pkg['scripts'] ?? {}
  })

  it('has lint script', () => {
    expect(scripts).toHaveProperty('lint')
  })

  it('has typecheck script', () => {
    expect(scripts).toHaveProperty('typecheck')
  })

  it('has test script', () => {
    expect(scripts).toHaveProperty('test')
  })

  it('has E2E test script', () => {
    expect(scripts).toHaveProperty('test:e2e')
  })

  it('has build script that includes type checking', () => {
    expect(scripts['build']).toContain('tsc')
  })
})

describe('Environment separation (H5/H7)', () => {
  it('config.ts reads from environment variables only', () => {
    const config = fs.readFileSync(path.join(SRC, 'config.ts'), 'utf-8')

    // Uses Vite env vars
    expect(config).toContain('import.meta.env.VITE_GRAPHQL_ENDPOINT')
    expect(config).toContain('import.meta.env.VITE_SUPPORTED_SCHEMA_RANGE')

    // No hardcoded endpoints
    expect(config).not.toMatch(/https?:\/\/[a-zA-Z]/)
    expect(config).not.toContain('localhost')
  })

  it('no hardcoded API endpoints in source files', () => {
    const allFiles = collectTsFiles(SRC)
    for (const file of allFiles) {
      // Skip config.ts which is the approved env-var gateway
      if (file.endsWith('config.ts')) continue
      const content = fs.readFileSync(file, 'utf-8')
      expect(content).not.toMatch(/https?:\/\/localhost/)
      expect(content).not.toMatch(/https?:\/\/127\.0\.0\.1/)
    }
  })
})

describe('Auth adapter seam preservation (H8)', () => {
  it('auth is context/adapter-based — replaceable without route rewrites', () => {
    const provider = fs.readFileSync(
      path.join(FEATURES, 'auth-entry', 'AuthProvider.tsx'), 'utf-8',
    )

    // Uses React Context pattern (adapter seam)
    expect(provider).toContain('createContext')
    expect(provider).toContain('useContext')
    // Token sync goes through api-contract adapter
    expect(provider).toContain('setAuthToken')
  })

  it('AuthGuard depends on useAuth interface only — not implementation details', () => {
    const guard = fs.readFileSync(
      path.join(FEATURES, 'auth-entry', 'AuthGuard.tsx'), 'utf-8',
    )

    // Uses the hook (interface), not direct token checks
    expect(guard).toContain('useAuth')
    expect(guard).toContain('isAuthenticated')
    // Does not directly access token storage
    expect(guard).not.toContain('getAuthToken')
    expect(guard).not.toContain('localStorage')
    expect(guard).not.toContain('sessionStorage')
  })

  it('route structure does not embed auth implementation', () => {
    const app = fs.readFileSync(path.join(SRC, 'App.tsx'), 'utf-8')

    // AuthProvider wraps routes (can be swapped)
    expect(app).toContain('AuthProvider')
    // AuthGuard is a route element (can be replaced)
    expect(app).toContain('AuthGuard')
    // No inline auth logic in routing
    expect(app).not.toContain('getAuthToken')
    expect(app).not.toContain('localStorage')
  })
})

describe('Graph-first workflow support (H2)', () => {
  it('workspace-graph uses React Flow for editor-grade interaction', () => {
    const graphCanvas = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'GraphCanvas.tsx'), 'utf-8',
    )

    expect(graphCanvas).toContain('@xyflow/react')
    // Core graph interactions
    expect(graphCanvas).toContain('ReactFlow')
  })

  it('workspace shell composes graph/search/detail for integrated workflow', () => {
    const shell = fs.readFileSync(path.join(SRC, 'ui-shell', 'WorkspaceShell.tsx'), 'utf-8')

    expect(shell).toContain('GraphCanvas')
    expect(shell).toContain('SearchBar')
    expect(shell).toContain('DetailPanel')
    expect(shell).toContain('ReactFlowProvider')
  })
})

// --- BI-260017: Delivery and quality baseline (I1-I6) ---

describe('Critical E2E flow coverage (I1 / REQ-FR-260019)', () => {
  const E2E_DIR = path.join(ROOT, 'e2e')

  it('E2E spec files exist for sign-in, graph workspace, and search', () => {
    expect(fs.existsSync(path.join(E2E_DIR, 'sign-in.spec.ts'))).toBe(true)
    expect(fs.existsSync(path.join(E2E_DIR, 'graph-workspace.spec.ts'))).toBe(true)
    expect(fs.existsSync(path.join(E2E_DIR, 'search-workspace.spec.ts'))).toBe(true)
  })

  it('sign-in flow is covered (demo sign-in entry)', () => {
    const spec = fs.readFileSync(path.join(E2E_DIR, 'sign-in.spec.ts'), 'utf-8')
    expect(spec).toContain('signin')
    expect(spec).toContain('sign in')
  })

  it('bootstrap graph load is covered', () => {
    const spec = fs.readFileSync(path.join(E2E_DIR, 'graph-workspace.spec.ts'), 'utf-8')
    expect(spec).toContain('retrieve')
    expect(spec).toContain('list_labels')
  })

  it('atom create/edit persistence is covered', () => {
    const spec = fs.readFileSync(path.join(E2E_DIR, 'graph-workspace.spec.ts'), 'utf-8')
    // Atom create via double-click
    expect(spec).toMatch(/creates? a new atom/i)
    // Atom edit via detail panel save
    expect(spec).toMatch(/edit.*atom.*properties|atom.*save/i)
  })

  it('deletion safety behavior is covered', () => {
    const spec = fs.readFileSync(path.join(E2E_DIR, 'graph-workspace.spec.ts'), 'utf-8')
    expect(spec).toMatch(/delete.*confirm|confirm.*delet/i)
    expect(spec).toContain('destroy')
  })

  it('error-path resilience is covered', () => {
    const spec = fs.readFileSync(path.join(E2E_DIR, 'graph-workspace.spec.ts'), 'utf-8')
    expect(spec).toMatch(/error|resilien/i)
    // Workspace doesn't crash on error
    expect(spec).toMatch(/sign out/i)
  })
})

describe('Accessibility baseline (I2 / REQ-QR-260002)', () => {
  it('dialogs use role="dialog" with aria-label', () => {
    const deleteDialog = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'DeleteConfirmDialog.tsx'), 'utf-8',
    )
    expect(deleteDialog).toContain('role="dialog"')
    expect(deleteDialog).toContain('aria-label')

    const bondDialog = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'BondNameDialog.tsx'), 'utf-8',
    )
    expect(bondDialog).toContain('role="dialog"')
    expect(bondDialog).toContain('aria-label')
  })

  it('forms associate labels with inputs via htmlFor', () => {
    const detailPanel = fs.readFileSync(
      path.join(FEATURES, 'workspace-details', 'DetailPanel.tsx'), 'utf-8',
    )
    expect(detailPanel).toContain('htmlFor=')
    expect(detailPanel).toContain('<label')
    expect(detailPanel).toContain('<form')

    const signIn = fs.readFileSync(
      path.join(FEATURES, 'auth-entry', 'SignInPage.tsx'), 'utf-8',
    )
    expect(signIn).toContain('htmlFor=')
    expect(signIn).toContain('<label')
  })

  it('search components use semantic roles and ARIA labels', () => {
    const searchBar = fs.readFileSync(
      path.join(FEATURES, 'workspace-search', 'SearchBar.tsx'), 'utf-8',
    )
    expect(searchBar).toContain('role="search"')
    expect(searchBar).toContain('aria-label')

    const querySummary = fs.readFileSync(
      path.join(FEATURES, 'workspace-search', 'QuerySummary.tsx'), 'utf-8',
    )
    expect(querySummary).toContain('role="status"')

    const resultPanel = fs.readFileSync(
      path.join(FEATURES, 'workspace-search', 'SearchResultPanel.tsx'), 'utf-8',
    )
    expect(resultPanel).toContain('aria-label')
    expect(resultPanel).toContain('<aside')
  })

  it('detail panel uses complementary landmark with aria-label', () => {
    const detailPanel = fs.readFileSync(
      path.join(FEATURES, 'workspace-details', 'DetailPanel.tsx'), 'utf-8',
    )
    expect(detailPanel).toContain('<aside')
    expect(detailPanel).toContain('aria-label="Atom details"')
  })

  it('error states use role="alert" for screen-reader announcement', () => {
    const signIn = fs.readFileSync(
      path.join(FEATURES, 'auth-entry', 'SignInPage.tsx'), 'utf-8',
    )
    expect(signIn).toContain('role="alert"')

    const schemaError = fs.readFileSync(
      path.join(SRC, 'ui-shell', 'SchemaErrorScreen.tsx'), 'utf-8',
    )
    expect(schemaError).toContain('role="alert"')

    const startupError = fs.readFileSync(
      path.join(SRC, 'ui-shell', 'StartupErrorScreen.tsx'), 'utf-8',
    )
    expect(startupError).toContain('role="alert"')
  })

  it('workspace shell uses semantic header landmark', () => {
    const shell = fs.readFileSync(path.join(SRC, 'ui-shell', 'WorkspaceShell.tsx'), 'utf-8')
    expect(shell).toContain('<header')
  })

  it('keyboard interaction is supported on graph canvas', () => {
    const canvas = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'GraphCanvas.tsx'), 'utf-8',
    )
    const interactions = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'use-canvas-interactions.ts'), 'utf-8',
    )
    expect(canvas).toContain('onKeyDown')
    expect(interactions).toContain('Delete')
    expect(interactions).toContain('Backspace')
  })
})

describe('Observability error-handling seams (I3 / REQ-OR-260005)', () => {
  it('mutation operations have try/catch error handling', () => {
    const interactions = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'use-canvas-interactions.ts'), 'utf-8',
    )
    // Multiple try/catch blocks around mutation calls
    const tryCatchCount = (interactions.match(/try\s*\{/g) ?? []).length
    expect(tryCatchCount).toBeGreaterThanOrEqual(4)

    const signIn = fs.readFileSync(
      path.join(FEATURES, 'auth-entry', 'SignInPage.tsx'), 'utf-8',
    )
    expect(signIn).toMatch(/try\s*\{/)
  })

  it('graph data hook surfaces error state to consumers', () => {
    const useGraphData = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'use-graph-data.ts'), 'utf-8',
    )
    expect(useGraphData).toContain('error: string | null')
    expect(useGraphData).toContain('setError')
    expect(useGraphData).toContain('catch')
  })

  it('startup bootstrap has error handling with dedicated error screens', () => {
    const app = fs.readFileSync(path.join(SRC, 'App.tsx'), 'utf-8')
    expect(app).toMatch(/try\s*\{/)
    expect(app).toMatch(/catch/)

    // Dedicated error screens exist
    expect(fs.existsSync(path.join(SRC, 'ui-shell', 'SchemaErrorScreen.tsx'))).toBe(true)
    expect(fs.existsSync(path.join(SRC, 'ui-shell', 'StartupErrorScreen.tsx'))).toBe(true)
  })

  it('GraphCanvas shows error state instead of crashing', () => {
    const canvas = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'GraphCanvas.tsx'), 'utf-8',
    )
    // Error display path — shows error text, does not throw
    expect(canvas).toContain('if (error)')
    expect(canvas).toContain('{error}')
  })
})

describe('Reliability blocker policy (I4 / REQ-QR-260002)', () => {
  it('route guard prevents unauthorized workspace access', () => {
    const guard = fs.readFileSync(
      path.join(FEATURES, 'auth-entry', 'AuthGuard.tsx'), 'utf-8',
    )
    expect(guard).toContain('isAuthenticated')
    expect(guard).toContain('Navigate')
  })

  it('delete operations require explicit user confirmation', () => {
    const canvas = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'GraphCanvas.tsx'), 'utf-8',
    )
    // Delete goes through confirmation — not direct
    expect(canvas).toContain('setConfirmDelete')
    expect(canvas).toContain('confirmDelete')
    expect(canvas).toContain('DeleteConfirmDialog')
  })

  it('mutations do not silently discard errors', () => {
    const useGraphData = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'use-graph-data.ts'), 'utf-8',
    )
    // Fetch errors are captured in state, not swallowed
    expect(useGraphData).toContain('setError')
    // Mutations re-throw to callers (no catch in mutation functions)
    expect(useGraphData).toContain('await client.mutate')
    expect(useGraphData).toContain('await fetchAtoms()')
  })

  it('React Flow deleteKeyCode is disabled to prevent accidental deletion', () => {
    const canvas = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'GraphCanvas.tsx'), 'utf-8',
    )
    expect(canvas).toContain('deleteKeyCode={null}')
  })
})

describe('Release and rollback operations (I5 / REQ-OR-260005)', () => {
  let pkg: Record<string, unknown>
  let scripts: Record<string, string>

  beforeAll(() => {
    pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8')) as Record<string, unknown>
    scripts = (pkg['scripts'] ?? {}) as Record<string, string>
  })

  it('package.json has version field for artifact versioning', () => {
    expect(pkg).toHaveProperty('version')
    expect(typeof pkg['version']).toBe('string')
  })

  it('build script produces distributable artifacts with type checking', () => {
    expect(scripts).toHaveProperty('build')
    expect(scripts['build']).toContain('tsc')
    expect(scripts['build']).toContain('vite build')
  })

  it('preflight quality gates are scriptable (lint + typecheck + test)', () => {
    expect(scripts).toHaveProperty('lint')
    expect(scripts).toHaveProperty('typecheck')
    expect(scripts).toHaveProperty('test')
    expect(scripts).toHaveProperty('test:e2e')
  })
})

describe('Placeholder and fallback trust constraints (I6 / REQ-CR-260009)', () => {
  it('admin placeholder provides clear non-deceptive messaging', () => {
    const admin = fs.readFileSync(
      path.join(FEATURES, 'admin', 'AdminPlaceholder.tsx'), 'utf-8',
    )
    // Honest placeholder messaging
    expect(admin).toMatch(/planned|future|coming/i)
    // No fake-functional controls
    expect(admin).not.toContain('onSubmit')
    expect(admin).not.toContain('useMutation')
  })

  it('admin placeholder has clear return path to workspace', () => {
    const admin = fs.readFileSync(
      path.join(FEATURES, 'admin', 'AdminPlaceholder.tsx'), 'utf-8',
    )
    // Link or navigation back to workspace
    expect(admin).toMatch(/href="\/"|to="\/"/)
  })

  it('placeholder routes do not import mutation operations', () => {
    const adminDir = path.join(FEATURES, 'admin')
    const files = collectTsFiles(adminDir)

    for (const file of files) {
      const imports = extractImports(file)
      for (const imp of imports) {
        expect(imp).not.toContain('MUTATION')
        expect(imp).not.toContain('mutation')
      }
    }
  })
})

// --- BI-260018: Evolution and extensibility baseline (J1-J5) ---

describe('Extension seam preservation (J1 / REQ-FR-260020)', () => {
  it('graph visualization is wrapped behind a seam (GraphCanvas + barrel)', () => {
    const barrel = fs.readFileSync(path.join(FEATURES, 'workspace-graph', 'index.ts'), 'utf-8')
    expect(barrel).toContain('GraphCanvas')
    expect(barrel).toContain('useGraphData')
    expect(barrel).toContain('GraphData')
  })

  it('search capability exposes a public seam for future saved queries/views', () => {
    const barrel = fs.readFileSync(path.join(FEATURES, 'workspace-search', 'index.ts'), 'utf-8')
    expect(barrel).toContain('useSearch')
    expect(barrel).toContain('SearchState')
    expect(barrel).toContain('SearchFilters')
  })

  it('admin/governance is isolated behind its own seam for future expansion', () => {
    const barrel = fs.readFileSync(path.join(FEATURES, 'admin', 'index.ts'), 'utf-8')
    expect(barrel).toContain('AdminPlaceholder')
    // Admin is a separate route — not embedded in workspace
    const app = fs.readFileSync(path.join(SRC, 'App.tsx'), 'utf-8')
    expect(app).toMatch(/Route.*path="\/admin"/)
  })

  it('auth is context/adapter-based — ready for production auth replacement', () => {
    const barrel = fs.readFileSync(path.join(FEATURES, 'auth-entry', 'index.ts'), 'utf-8')
    expect(barrel).toContain('AuthProvider')
    expect(barrel).toContain('useAuth')
    expect(barrel).toContain('AuthGuard')

    const provider = fs.readFileSync(path.join(FEATURES, 'auth-entry', 'AuthProvider.tsx'), 'utf-8')
    expect(provider).toContain('createContext')
  })

  it('workspace shell composes features — seam for collaboration overlay', () => {
    const shell = fs.readFileSync(path.join(SRC, 'ui-shell', 'WorkspaceShell.tsx'), 'utf-8')
    // Major feature compositions are imported via barrel
    expect(shell).toContain('GraphCanvas')
    expect(shell).toContain('SearchBar')
    expect(shell).toContain('DetailPanel')
  })
})

describe('Adapter boundary — backend schema isolation (J3 / REQ-FR-260021)', () => {
  it('api-contract defines typed interfaces that mediate backend schema', () => {
    const queries = fs.readFileSync(path.join(SRC, 'api-contract', 'graph-queries.ts'), 'utf-8')
    expect(queries).toContain('export interface Atom')
    expect(queries).toContain('export interface AtomBond')
    expect(queries).toContain('export interface AtomNuclearies')
    expect(queries).toContain('export interface RetrieveResponse')
    expect(queries).toContain('export interface ListLabelsResponse')
  })

  it('graph-types adapter maps backend Atom to React Flow nodes/edges', () => {
    const graphTypes = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'graph-types.ts'), 'utf-8',
    )
    // Adapter maps backend Atom[] to view-model Node[]/Edge[]
    expect(graphTypes).toContain('atomsToNodes')
    expect(graphTypes).toContain('atomsToEdges')
    expect(graphTypes).toContain('Atom')
    expect(graphTypes).toContain('Node')
    expect(graphTypes).toContain('Edge')
  })

  it('schema compatibility adapter isolates version semantics', () => {
    const compat = fs.readFileSync(
      path.join(SRC, 'api-contract', 'schema-compatibility.ts'), 'utf-8',
    )
    expect(compat).toContain('export interface CompatibilityResult')
    expect(compat).toContain('checkSchemaCompatibility')
    expect(compat).toContain('SchemaInfo')
  })

  it('auth token adapter isolates credential storage from features', () => {
    const authToken = fs.readFileSync(
      path.join(SRC, 'api-contract', 'auth-token.ts'), 'utf-8',
    )
    expect(authToken).toContain('getAuthToken')
    expect(authToken).toContain('setAuthToken')

    // Features do not access token storage directly
    for (const mod of FEATURE_MODULES) {
      const modDir = path.join(FEATURES, mod)
      if (!fs.existsSync(modDir)) continue
      const files = collectTsFiles(modDir)
      for (const file of files) {
        // AuthProvider is allowed to use setAuthToken
        if (file.includes('AuthProvider')) continue
        const content = fs.readFileSync(file, 'utf-8')
        expect(content).not.toContain('getAuthToken')
      }
    }
  })

  it('apollo client wrapper isolates GraphQL transport from features', () => {
    const client = fs.readFileSync(
      path.join(SRC, 'api-contract', 'apollo-client.ts'), 'utf-8',
    )
    expect(client).toContain('createApolloClient')
    expect(client).toContain('ApolloClient')
    expect(client).toContain('getAuthToken')
  })
})

describe('MVP growth boundary — excluded capabilities (J2 / REQ-CR-260010)', () => {
  let allDeps: Record<string, string>

  beforeAll(() => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8')) as Record<string, Record<string, string>>
    allDeps = { ...pkg['dependencies'], ...pkg['devDependencies'] }
  })

  it('no real-time collaboration engine dependencies', () => {
    const rtcPackages = ['socket.io', 'socket.io-client', 'ws', 'yjs', '@liveblocks/client', 'pusher-js', 'ably']
    for (const pkg of rtcPackages) {
      expect(allDeps).not.toHaveProperty(pkg)
    }
  })

  it('no plugin runtime system dependencies', () => {
    const pluginPackages = ['@module-federation/vite', '@originjs/vite-plugin-federation', 'webpack']
    for (const pkg of pluginPackages) {
      expect(allDeps).not.toHaveProperty(pkg)
    }
  })

  it('no multi-runtime frontend split', () => {
    const multiRuntimePackages = ['next', 'nuxt', 'remix', '@remix-run/node', 'astro', 'qwik']
    for (const pkg of multiRuntimePackages) {
      expect(allDeps).not.toHaveProperty(pkg)
    }
  })

  it('no heavy analytics surface dependencies', () => {
    const analyticsPackages = ['d3', 'chart.js', 'recharts', 'nivo', 'plotly.js', 'victory']
    for (const pkg of analyticsPackages) {
      expect(allDeps).not.toHaveProperty(pkg)
    }
  })

  it('admin is placeholder-only — no full admin suite', () => {
    const adminFiles = collectTsFiles(path.join(FEATURES, 'admin'))
    // Admin should have minimal files — not a full suite
    expect(adminFiles.length).toBeLessThanOrEqual(2)

    for (const file of adminFiles) {
      const content = fs.readFileSync(file, 'utf-8')
      expect(content).not.toContain('useMutation')
      expect(content).not.toContain('useQuery')
    }
  })
})

describe('Collaboration-readiness architecture (J4 / REQ-FR-260020)', () => {
  it('graph data uses persisted-vs-local state separation', () => {
    const useGraphData = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'use-graph-data.ts'), 'utf-8',
    )
    // Server state managed via Apollo queries (persisted)
    expect(useGraphData).toContain('client.query')
    expect(useGraphData).toContain('client.mutate')
    // Local UI state via React state (local)
    expect(useGraphData).toContain('useState')
    // Refetch ensures server truth (no stale local-only state)
    expect(useGraphData).toContain('fetchAtoms')
  })

  it('no hard single-editor assumptions in workspace shell', () => {
    const shell = fs.readFileSync(path.join(SRC, 'ui-shell', 'WorkspaceShell.tsx'), 'utf-8')
    // Shell composes hooks — doesn't hardcode single-user assumptions
    expect(shell).not.toContain('currentUser')
    expect(shell).not.toContain('singleUser')
    expect(shell).not.toContain('onlyEditor')
  })
})

describe('Wrapper boundaries and contract coverage (J5 / REQ-CR-260010)', () => {
  it('api-contract barrel re-exports all public interfaces', () => {
    const barrel = fs.readFileSync(path.join(SRC, 'api-contract', 'index.ts'), 'utf-8')
    // Graph data contract
    expect(barrel).toContain('Atom')
    expect(barrel).toContain('AtomBond')
    expect(barrel).toContain('AtomNuclearies')
    // Auth contract
    expect(barrel).toContain('getAuthToken')
    expect(barrel).toContain('setAuthToken')
    // Compatibility contract
    expect(barrel).toContain('checkSchemaCompatibility')
    expect(barrel).toContain('CompatibilityResult')
    // Client wrapper
    expect(barrel).toContain('createApolloClient')
  })

  it('feature modules import graph types from api-contract only', () => {
    for (const mod of FEATURE_MODULES) {
      const modDir = path.join(FEATURES, mod)
      if (!fs.existsSync(modDir)) continue
      const files = collectTsFiles(modDir)
      for (const file of files) {
        const imports = extractImports(file)
        for (const imp of imports) {
          // Must not import directly from @apollo/client for type construction
          if (imp === 'graphql' || imp.startsWith('graphql/')) {
            throw new Error(`${path.relative(SRC, file)} imports graphql directly`)
          }
        }
      }
    }
  })

  it('schema compatibility contract has dedicated test coverage', () => {
    expect(
      fs.existsSync(path.join(SRC, 'api-contract', 'schema-compatibility.test.ts')),
    ).toBe(true)

    const testContent = fs.readFileSync(
      path.join(SRC, 'api-contract', 'schema-compatibility.test.ts'), 'utf-8',
    )
    expect(testContent).toContain('checkSchemaCompatibility')
  })

  it('graph-types mapping adapter has dedicated test coverage', () => {
    expect(
      fs.existsSync(path.join(FEATURES, 'workspace-graph', 'graph-types.test.ts')),
    ).toBe(true)

    const testContent = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'graph-types.test.ts'), 'utf-8',
    )
    expect(testContent).toContain('atomsToNodes')
    expect(testContent).toContain('atomsToEdges')
  })

  it('all feature modules have barrel exports (public API boundary)', () => {
    for (const mod of FEATURE_MODULES) {
      const barrelPath = path.join(FEATURES, mod, 'index.ts')
      expect(fs.existsSync(barrelPath)).toBe(true)
    }
  })
})

// --- BI-260019: Branding governance operationalization ---

describe('Branding source-of-truth (ADR-260022)', () => {
  it('branding policy file exists at .github/project/branding.md', () => {
    expect(
      fs.existsSync(path.join(ROOT, '.github', 'project', 'branding.md')),
    ).toBe(true)
  })

  it('branding ADR exists at ADR-260022.md', () => {
    expect(
      fs.existsSync(path.join(ROOT, '.github', 'project', 'evolution', 'adr', 'ADR-260022.md')),
    ).toBe(true)
  })

  it('branding requirement exists at REQ-CR-260011.md', () => {
    expect(
      fs.existsSync(path.join(ROOT, '.github', 'project', 'evolution', 'requirements', 'REQ-CR-260011.md')),
    ).toBe(true)
  })
})

describe('Project instructions include branding governance (REQ-CR-260011)', () => {
  let instructions: string

  beforeAll(() => {
    instructions = fs.readFileSync(
      path.join(ROOT, '.github', 'project', 'project-instructions.md'), 'utf-8',
    )
  })

  it('constraints section references branding.md', () => {
    expect(instructions).toContain('branding.md')
    expect(instructions).toMatch(/[Cc]onstraint.*brand|brand.*[Cc]onstraint/s)
  })

  it('verification/quality section includes branding checks', () => {
    expect(instructions).toMatch(/[Bb]randing.*check|[Bb]randing.*accept/i)
    expect(instructions).toContain('brand tokens')
  })

  it('loading matrix includes branding.md as always-on', () => {
    // branding.md should appear in the always-on section
    const alwaysOnMatch = instructions.match(/Always-on:[\s\S]*?(?=Usually|$)/i)
    expect(alwaysOnMatch).not.toBeNull()
    expect(alwaysOnMatch![0]).toContain('branding.md')
  })
})

describe('Governance traceability (BI-260019 / ADR-260022 / REQ-CR-260011)', () => {
  it('ADR-260022 references REQ-CR-260011', () => {
    const adr = fs.readFileSync(
      path.join(ROOT, '.github', 'project', 'evolution', 'adr', 'ADR-260022.md'), 'utf-8',
    )
    expect(adr).toContain('REQ-CR-260011')
  })

  it('REQ-CR-260011 references ADR-260022 and BI-260019', () => {
    const req = fs.readFileSync(
      path.join(ROOT, '.github', 'project', 'evolution', 'requirements', 'REQ-CR-260011.md'), 'utf-8',
    )
    expect(req).toContain('ADR-260022')
    expect(req).toContain('BI-260019')
  })

  it('BI-260019 references ADR-260022, REQ-CR-260011, and branding.md', () => {
    const bi = fs.readFileSync(
      path.join(ROOT, '.github', 'project', 'evolution', 'backlog-items', 'BI-260019.md'), 'utf-8',
    )
    expect(bi).toContain('ADR-260022')
    expect(bi).toContain('REQ-CR-260011')
    expect(bi).toContain('branding.md')
  })
})

describe('Non-deceptive status communication (branding design constraint)', () => {
  it('error states pair color with text or role="alert" — not color alone', () => {
    // SignInPage error uses role="alert" with text content
    const signIn = fs.readFileSync(
      path.join(FEATURES, 'auth-entry', 'SignInPage.tsx'), 'utf-8',
    )
    expect(signIn).toContain('role="alert"')
    expect(signIn).toMatch(/\{error\}/)

    // GraphCanvas error shows error text, not color alone
    const canvas = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'GraphCanvas.tsx'), 'utf-8',
    )
    expect(canvas).toContain('{error}')

    // Startup/schema error screens show text messages
    const schemaErr = fs.readFileSync(
      path.join(SRC, 'ui-shell', 'SchemaErrorScreen.tsx'), 'utf-8',
    )
    expect(schemaErr).toContain('role="alert"')
  })

  it('delete action uses explicit text labels — not color-only danger indication', () => {
    const dialog = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'DeleteConfirmDialog.tsx'), 'utf-8',
    )
    // Has text content "Delete Atom?" heading and confirmation text
    expect(dialog).toContain('Delete Atom?')
    expect(dialog).toContain('Are you sure')
    // Button has visible text label
    expect(dialog).toMatch(/>[\s]*Delete[\s]*</)
  })

  it('undo notification uses text label alongside visual cues', () => {
    const undo = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'UndoNotification.tsx'), 'utf-8',
    )
    expect(undo).toContain('role="status"')
    expect(undo).toContain('Undo')
  })

  it('search toggle buttons use aria-pressed for state — not color alone', () => {
    const searchBar = fs.readFileSync(
      path.join(FEATURES, 'workspace-search', 'SearchBar.tsx'), 'utf-8',
    )
    expect(searchBar).toContain('aria-pressed')
  })
})

describe('Branding policy content completeness', () => {
  let branding: string

  beforeAll(() => {
    branding = fs.readFileSync(
      path.join(ROOT, '.github', 'project', 'branding.md'), 'utf-8',
    )
  })

  it('defines brand color tokens with hex values', () => {
    expect(branding).toContain('Trust Blue')
    expect(branding).toContain('#0066CC')
    expect(branding).toContain('Control Green')
    expect(branding).toContain('#00A676')
    expect(branding).toContain('Privacy Red')
    expect(branding).toContain('#D64545')
  })

  it('includes design constraints and forbidden patterns', () => {
    expect(branding).toMatch(/[Dd]o not/)
    expect(branding).toMatch(/neon|glow/i)
    expect(branding).toContain('color alone')
  })

  it('includes semantic meaning map', () => {
    expect(branding).toContain('Semantic Meaning Map')
    expect(branding).toContain('Transparency')
    expect(branding).toContain('User Control')
  })

  it('includes token structure for machine readability', () => {
    expect(branding).toContain('Token Structure')
    expect(branding).toContain('trustBlue')
    expect(branding).toContain('controlGreen')
    expect(branding).toContain('error')
  })
})

// --- BI-260033: Dual-view delivery and validation baseline (D1-D3 / ADR-260032) ---

describe('Feature flag rollout control (D3 / REQ-OR-260011)', () => {
  it('feature-flags module exists at src/feature-flags.ts', () => {
    expect(fs.existsSync(path.join(SRC, 'feature-flags.ts'))).toBe(true)
  })

  it('feature-flags module exports networkViewEnabled derived from VITE env var', () => {
    const flags = fs.readFileSync(path.join(SRC, 'feature-flags.ts'), 'utf-8')
    expect(flags).toContain('networkViewEnabled')
    expect(flags).toContain('VITE_NETWORK_VIEW_ENABLED')
    expect(flags).toContain('import.meta.env')
  })

  it('WorkspaceShell imports networkViewEnabled from feature-flags', () => {
    const shell = fs.readFileSync(path.join(SRC, 'ui-shell', 'WorkspaceShell.tsx'), 'utf-8')
    expect(shell).toContain('networkViewEnabled')
    expect(shell).toContain('feature-flags')
  })

  it('WorkspaceShell gates GraphViewTabs rendering behind networkViewEnabled', () => {
    const shell = fs.readFileSync(path.join(SRC, 'ui-shell', 'WorkspaceShell.tsx'), 'utf-8')
    // Flag guards tab rendering — both identifiers appear in the same conditional expression
    expect(shell).toMatch(/networkViewEnabled[\s\S]{0,40}GraphViewTabs/)
  })

  it('Flow view remains always available as immediate fallback (GraphCanvas in barrel)', () => {
    const barrel = fs.readFileSync(path.join(FEATURES, 'workspace-graph', 'index.ts'), 'utf-8')
    expect(barrel).toContain('GraphCanvas')
  })

  it('default view falls back to Flow when networkViewEnabled is false (initialised from flag)', () => {
    const shell = fs.readFileSync(path.join(SRC, 'ui-shell', 'WorkspaceShell.tsx'), 'utf-8')
    // useState initialiser references the flag so the default view is flag-driven
    expect(shell).toMatch(/useState.*networkViewEnabled/)
  })
})

describe('Shared-state dual-view architecture (D1 / REQ-FR-260034)', () => {
  it('selectedAtomId is lifted to WorkspaceShell and passed to both canvases', () => {
    const shell = fs.readFileSync(path.join(SRC, 'ui-shell', 'WorkspaceShell.tsx'), 'utf-8')
    expect(shell).toContain('selectedAtomId')
    expect(shell).toMatch(/GraphCanvas[\s\S]{0,200}selectedAtomId/)
    expect(shell).toMatch(/NetworkCanvas[\s\S]{0,200}selectedAtomId/)
  })

  it('single useGraphData call feeds both canvas views', () => {
    const shell = fs.readFileSync(path.join(SRC, 'ui-shell', 'WorkspaceShell.tsx'), 'utf-8')
    const hookCallCount = (shell.match(/useGraphData\(\)/g) ?? []).length
    expect(hookCallCount).toBe(1)
    const dataPropCount = (shell.match(/data=\{graphData\}/g) ?? []).length
    expect(dataPropCount).toBeGreaterThanOrEqual(2)
  })

  it('mutations update shared atoms state so all views reflect changes', () => {
    const useGraphData = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'use-graph-data.ts'), 'utf-8',
    )
    expect(useGraphData).toContain('fetchAtoms')
    expect(useGraphData).toContain('setAtoms')
    expect(useGraphData).toContain('await fetchAtoms()')
  })

  it('NetworkCanvas uses the shared graph-types edge adapter', () => {
    const networkCanvas = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'NetworkCanvas.tsx'), 'utf-8',
    )
    expect(networkCanvas).toContain('atomsToNetworkEdges')
    expect(networkCanvas).toContain('graph-types')
  })
})

describe('Large-graph degrade policy seam (D2 / REQ-QR-260005)', () => {
  it('degrade hook enforces full mode below 150 nodes (REDUCED_THRESHOLD)', () => {
    const degrade = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'use-graph-degrade.ts'), 'utf-8',
    )
    expect(degrade).toContain('REDUCED_THRESHOLD')
    expect(degrade).toContain('150')
  })

  it('degrade hook enforces blocked mode above 400 nodes (BLOCKED_THRESHOLD)', () => {
    const degrade = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'use-graph-degrade.ts'), 'utf-8',
    )
    expect(degrade).toContain('BLOCKED_THRESHOLD')
    expect(degrade).toContain('400')
  })

  it('GraphRenderGate blocks render and exposes confirm path when mode is blocked', () => {
    const gate = fs.readFileSync(path.join(SRC, 'ui-shell', 'GraphRenderGate.tsx'), 'utf-8')
    expect(gate).toContain('blocked')
    expect(gate).toContain('onConfirm')
  })

  it('both canvas components accept renderMode prop for reduced rendering', () => {
    const graphCanvas = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'GraphCanvas.tsx'), 'utf-8',
    )
    const networkCanvas = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'NetworkCanvas.tsx'), 'utf-8',
    )
    expect(graphCanvas).toContain('renderMode')
    expect(networkCanvas).toContain('renderMode')
  })

  it('reduced mode strips edge labels on both canvases', () => {
    const graphCanvas = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'GraphCanvas.tsx'), 'utf-8',
    )
    const networkCanvas = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'NetworkCanvas.tsx'), 'utf-8',
    )
    expect(graphCanvas).toContain('reduced')
    expect(networkCanvas).toContain('reduced')
  })

  it('degrade threshold constants are exported from the workspace-graph barrel', () => {
    const barrel = fs.readFileSync(path.join(FEATURES, 'workspace-graph', 'index.ts'), 'utf-8')
    expect(barrel).toContain('REDUCED_THRESHOLD')
    expect(barrel).toContain('BLOCKED_THRESHOLD')
  })
})

describe('Dual-view E2E coverage baseline (D1 / REQ-FR-260034)', () => {
  const E2E_DIR = path.join(ROOT, 'e2e')

  it('E2E spec covers default Network view after login', () => {
    const spec = fs.readFileSync(path.join(E2E_DIR, 'graph-workspace.spec.ts'), 'utf-8')
    expect(spec).toMatch(/network.*view.*default|default.*network.*view/i)
  })

  it('E2E spec covers view switching between Network and Flow tabs', () => {
    const spec = fs.readFileSync(path.join(E2E_DIR, 'graph-workspace.spec.ts'), 'utf-8')
    expect(spec).toMatch(/flow.*tab|switch.*view/i)
  })

  it('E2E spec covers keyboard-driven view switch via ArrowRight on tablist', () => {
    const spec = fs.readFileSync(path.join(E2E_DIR, 'graph-workspace.spec.ts'), 'utf-8')
    expect(spec).toMatch(/ArrowRight|keyboard.*view|view.*keyboard/i)
  })
})

// --- BI-260034: Geometric closest-point bond anchoring baseline (D1-D4 / ADR-260033) ---

describe('FloatingEdge geometry module (D1 / REQ-FR-260035)', () => {
  it('graph-geometry.ts exists with floatingEdgePath helper', () => {
    expect(fs.existsSync(path.join(FEATURES, 'workspace-graph', 'graph-geometry.ts'))).toBe(true)
    const geo = fs.readFileSync(path.join(FEATURES, 'workspace-graph', 'graph-geometry.ts'), 'utf-8')
    expect(geo).toContain('floatingEdgePath')
  })

  it('graph-geometry.ts has dedicated test coverage', () => {
    expect(
      fs.existsSync(path.join(FEATURES, 'workspace-graph', 'graph-geometry.test.ts')),
    ).toBe(true)
  })

  it('FloatingEdge.tsx exists and uses useInternalNode for geometry-driven anchoring', () => {
    expect(fs.existsSync(path.join(FEATURES, 'workspace-graph', 'FloatingEdge.tsx'))).toBe(true)
    const edge = fs.readFileSync(path.join(FEATURES, 'workspace-graph', 'FloatingEdge.tsx'), 'utf-8')
    expect(edge).toContain('useInternalNode')
    expect(edge).toContain('positionAbsolute')
  })

  it('FloatingEdge uses floatingEdgePath from graph-geometry (not hand-rolled inline)', () => {
    const edge = fs.readFileSync(path.join(FEATURES, 'workspace-graph', 'FloatingEdge.tsx'), 'utf-8')
    expect(edge).toContain('floatingEdgePath')
    expect(edge).toContain('graph-geometry')
  })

  it('FloatingEdge has dedicated test coverage', () => {
    expect(
      fs.existsSync(path.join(FEATURES, 'workspace-graph', 'FloatingEdge.test.tsx')),
    ).toBe(true)
  })
})

describe('Network view anchoring wiring (D1-D2 / REQ-FR-260035)', () => {
  it('NetworkCanvas registers FloatingEdge as a custom edge type', () => {
    const canvas = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'NetworkCanvas.tsx'), 'utf-8',
    )
    expect(canvas).toContain('FloatingEdge')
    expect(canvas).toContain('edgeTypes')
    expect(canvas).toContain('floating')
  })

  it('NetworkCanvas uses atomsToNetworkEdges (not raw atomsToEdges) for displayed edges', () => {
    const canvas = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'NetworkCanvas.tsx'), 'utf-8',
    )
    expect(canvas).toContain('atomsToNetworkEdges')
    expect(canvas).not.toContain('atomsToEdges')
  })

  it('atomsToNetworkEdges produces edges typed as floating', () => {
    const types = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'graph-types.ts'), 'utf-8',
    )
    expect(types).toContain('atomsToNetworkEdges')
    expect(types).toContain("'floating'")
  })
})

describe('Flow view unchanged — scope boundary preservation (D3 / ADR-260033)', () => {
  it('GraphCanvas.tsx does not reference FloatingEdge or floating edge type', () => {
    const canvas = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'GraphCanvas.tsx'), 'utf-8',
    )
    expect(canvas).not.toContain('FloatingEdge')
    expect(canvas).not.toContain("'floating'")
  })

  it('GraphCanvas.tsx still uses atomsToEdges (Flow view behavior unchanged)', () => {
    const canvas = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'GraphCanvas.tsx'), 'utf-8',
    )
    expect(canvas).toContain('atomsToEdges')
  })
})

describe('Label extensibility seam (D4 / ADR-260033)', () => {
  it('atomsToEdges still sets label from bond name (seam preserved for future rendering)', () => {
    const types = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'graph-types.ts'), 'utf-8',
    )
    expect(types).toContain('label: bond.name')
  })

  it('atomsToNetworkEdges strips label for default Network view (off-by-default policy)', () => {
    const types = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'graph-types.ts'), 'utf-8',
    )
    expect(types).toContain('atomsToNetworkEdges')
    expect(types).toContain('label: undefined')
  })
})

// --- BI-260035: Directional arrowheads baseline for Network-view bonds (D1-D4 / ADR-260034) ---

describe('Target-end arrowhead on Network-view bonds (D1 / REQ-FR-260036)', () => {
  it('atomsToNetworkEdges sets markerEnd using MarkerType.ArrowClosed', () => {
    const types = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'graph-types.ts'), 'utf-8',
    )
    expect(types).toContain('markerEnd')
    expect(types).toContain('MarkerType')
    expect(types).toContain('ArrowClosed')
  })

  it('FloatingEdge passes markerEnd to BaseEdge for rendering', () => {
    const edge = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'FloatingEdge.tsx'), 'utf-8',
    )
    expect(edge).toContain('markerEnd')
    expect(edge).toContain('BaseEdge')
  })

  it('FloatingEdge applies selected-state strokeWidth emphasis without color change (D3)', () => {
    const edge = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'FloatingEdge.tsx'), 'utf-8',
    )
    expect(edge).toContain('selected')
    expect(edge).toContain('strokeWidth')
  })
})

describe('Arrowheads in full and reduced render modes (D2 / REQ-FR-260036)', () => {
  it('markerEnd is set in atomsToNetworkEdges for all edges regardless of render mode', () => {
    const types = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'graph-types.ts'), 'utf-8',
    )
    // markerEnd is set unconditionally — no renderMode branch in atomsToNetworkEdges
    expect(types).toContain('markerEnd: { type: MarkerType.ArrowClosed }')
  })
})

describe('Flow view unchanged — direction scope boundary (D4 / ADR-260034)', () => {
  it('GraphCanvas.tsx does not set markerEnd or MarkerType on edges', () => {
    const canvas = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'GraphCanvas.tsx'), 'utf-8',
    )
    expect(canvas).not.toContain('MarkerType')
    expect(canvas).not.toContain('ArrowClosed')
  })

  it('label seam still intact in atomsToEdges (bond name preserved for optional future rendering)', () => {
    const types = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'graph-types.ts'), 'utf-8',
    )
    expect(types).toContain('label: bond.name')
  })
})

// --- BI-260036: Force-directed automatic layout baseline for Network view (D1-D6 / ADR-260035) ---

describe('Force-directed layout engine (D1 / REQ-FR-260037)', () => {
  it('d3-force is a listed dependency in package.json', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8')) as Record<string, Record<string, string>>
    expect(pkg['dependencies']).toHaveProperty('d3-force')
  })

  it('use-network-layout.ts exists and exports applyForceLayout', () => {
    expect(fs.existsSync(path.join(FEATURES, 'workspace-graph', 'use-network-layout.ts'))).toBe(true)
    const layout = fs.readFileSync(path.join(FEATURES, 'workspace-graph', 'use-network-layout.ts'), 'utf-8')
    expect(layout).toContain('applyForceLayout')
    expect(layout).toContain('d3-force')
  })

  it('synchronous iteration cap FORCE_TICK_COUNT is 300 (D3)', () => {
    const layout = fs.readFileSync(path.join(FEATURES, 'workspace-graph', 'use-network-layout.ts'), 'utf-8')
    expect(layout).toContain('FORCE_TICK_COUNT')
    expect(layout).toContain('300')
  })

  it('use-network-layout.ts has dedicated test coverage', () => {
    expect(
      fs.existsSync(path.join(FEATURES, 'workspace-graph', 'use-network-layout.test.ts')),
    ).toBe(true)
  })
})

describe('Layout trigger and drag-position preservation (D2 / REQ-FR-260037)', () => {
  it('NetworkCanvas imports and uses applyForceLayout', () => {
    const canvas = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'NetworkCanvas.tsx'), 'utf-8',
    )
    expect(canvas).toContain('applyForceLayout')
    expect(canvas).toContain('use-network-layout')
  })

  it('NetworkCanvas uses mergeNodePositions to preserve dragged positions', () => {
    const canvas = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'NetworkCanvas.tsx'), 'utf-8',
    )
    expect(canvas).toContain('mergeNodePositions')
  })

  it('NetworkCanvas exposes a Re-layout action for on-demand recompute', () => {
    const canvas = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'NetworkCanvas.tsx'), 'utf-8',
    )
    expect(canvas).toContain('Re-layout')
    expect(canvas).toContain('handleRelayout')
  })
})

describe('Grid fallback above blocked threshold (D4 / REQ-FR-260037)', () => {
  it('applyForceLayout returns nodes unchanged above BLOCKED_THRESHOLD', () => {
    const layout = fs.readFileSync(path.join(FEATURES, 'workspace-graph', 'use-network-layout.ts'), 'utf-8')
    expect(layout).toContain('BLOCKED_THRESHOLD')
    expect(layout).toContain('return nodes')
  })
})

describe('Self-loop exclusion from simulation (D5 / REQ-FR-260037)', () => {
  it('applyForceLayout filters self-loop edges before forceLink', () => {
    const layout = fs.readFileSync(path.join(FEATURES, 'workspace-graph', 'use-network-layout.ts'), 'utf-8')
    expect(layout).toContain('source !== e.target')
  })
})

describe('Flow view layout unchanged — scope boundary (ADR-260035)', () => {
  it('GraphCanvas.tsx does not import applyForceLayout or d3-force', () => {
    const canvas = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'GraphCanvas.tsx'), 'utf-8',
    )
    expect(canvas).not.toContain('applyForceLayout')
    expect(canvas).not.toContain('d3-force')
  })
})

// --- BI-260037: Outer-circumference edge initiation baseline for Network view (D1-D5 / ADR-260036) ---

describe('Ring affordance replaces connector dot (D1 / REQ-FR-260038)', () => {
  it('CircleAtomNode exports RING_THICKNESS constant', () => {
    const node = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'CircleAtomNode.tsx'), 'utf-8',
    )
    expect(node).toContain('RING_THICKNESS')
    expect(node).toContain('export')
  })

  it('CircleAtomNode exports CLICK_DRAG_THRESHOLD constant', () => {
    const node = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'CircleAtomNode.tsx'), 'utf-8',
    )
    expect(node).toContain('CLICK_DRAG_THRESHOLD')
    expect(node).toContain('export')
  })

  it('CircleAtomNode uses ring-handle as source Handle (no connector dot)', () => {
    const node = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'CircleAtomNode.tsx'), 'utf-8',
    )
    expect(node).toContain('ring-handle')
    expect(node).not.toContain('connector-handle')
  })

  it('CircleAtomNode has dedicated test coverage', () => {
    expect(
      fs.existsSync(path.join(FEATURES, 'workspace-graph', 'CircleAtomNode.test.tsx')),
    ).toBe(true)
  })
})

describe('Ring visibility and state rules (D2 / REQ-FR-260038)', () => {
  it('CircleAtomNode ring opacity is controlled by hover and selected state', () => {
    const node = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'CircleAtomNode.tsx'), 'utf-8',
    )
    expect(node).toContain('ringVisible')
    expect(node).toContain('hovered')
    expect(node).toContain('selected')
    expect(node).toContain('opacity')
  })

  it('CircleAtomNode ring references a color token (not a hardcoded literal)', () => {
    const node = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'CircleAtomNode.tsx'), 'utf-8',
    )
    expect(node).toContain('RING_COLOR')
    expect(node).toContain('ring-handle')
  })
})

describe('Self-connection no-op (D4 / REQ-FR-260038)', () => {
  it('useCanvasInteractions onConnect guards against source === target', () => {
    const ix = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'use-canvas-interactions.ts'), 'utf-8',
    )
    expect(ix).toContain('source !== connection.target')
  })
})

describe('Flow view scope boundary — ring affordance (D5 / ADR-260036)', () => {
  it('GraphCanvas.tsx does not reference ring-handle or RING_THICKNESS', () => {
    const canvas = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'GraphCanvas.tsx'), 'utf-8',
    )
    expect(canvas).not.toContain('ring-handle')
    expect(canvas).not.toContain('RING_THICKNESS')
  })

  it('GraphCanvas.tsx does not import CircleAtomNode', () => {
    const canvas = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'GraphCanvas.tsx'), 'utf-8',
    )
    expect(canvas).not.toContain('CircleAtomNode')
  })
})

// --- BI-260038: Correct Network-view target-circle drop compliance (ADR-260036 D4) ---

describe('Full-circle connection drop zone (D4 / REQ-FR-260038)', () => {
  it('NetworkCanvas sets connectionRadius covering the full node circle', () => {
    const canvas = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'NetworkCanvas.tsx'), 'utf-8',
    )
    expect(canvas).toContain('connectionRadius')
    expect(canvas).toContain('CIRCLE_DROP_RADIUS')
  })

  it('CIRCLE_DROP_RADIUS value is at least 40 (node radius) to cover the full circle', () => {
    const canvas = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'NetworkCanvas.tsx'), 'utf-8',
    )
    const match = canvas.match(/CIRCLE_DROP_RADIUS\s*=\s*(\d+)/)
    expect(match).not.toBeNull()
    expect(Number(match![1])).toBeGreaterThanOrEqual(40)
  })

  it('GraphCanvas does not set connectionRadius (Flow view drop behavior unchanged)', () => {
    const canvas = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'GraphCanvas.tsx'), 'utf-8',
    )
    expect(canvas).not.toContain('connectionRadius')
    expect(canvas).not.toContain('CIRCLE_DROP_RADIUS')
  })
})

// --- BI-260039: Network-view preview-line and ring-token refinements (ADR-260037 D2-D3) ---

describe('Straight-line connection drag preview (D2 / REQ-FR-260039)', () => {
  it('NetworkCanvas sets connectionLineType to Straight', () => {
    const canvas = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'NetworkCanvas.tsx'), 'utf-8',
    )
    expect(canvas).toContain('connectionLineType')
    expect(canvas).toContain('ConnectionLineType')
    expect(canvas).toContain('Straight')
  })

  it('GraphCanvas does not set connectionLineType (Flow view preview unchanged)', () => {
    const canvas = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'GraphCanvas.tsx'), 'utf-8',
    )
    expect(canvas).not.toContain('connectionLineType')
    expect(canvas).not.toContain('ConnectionLineType')
  })
})

describe('Tokenized ring and selection colors (D3 / REQ-CR-260017)', () => {
  it('network-tokens.ts exists and exports RING_COLOR and SELECTION_BORDER_COLOR', () => {
    expect(
      fs.existsSync(path.join(FEATURES, 'workspace-graph', 'network-tokens.ts')),
    ).toBe(true)
    const tokens = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'network-tokens.ts'), 'utf-8',
    )
    expect(tokens).toContain('RING_COLOR')
    expect(tokens).toContain('SELECTION_BORDER_COLOR')
  })

  it('CircleAtomNode imports interaction colors from network-tokens (no local hardcoded ring/selection literals)', () => {
    const node = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'CircleAtomNode.tsx'), 'utf-8',
    )
    expect(node).toContain('network-tokens')
    expect(node).toContain('RING_COLOR')
    expect(node).toContain('SELECTION_BORDER_COLOR')
    // Ring and selection colors must not appear as hardcoded literals in the component
    expect(node).not.toMatch(/#0066CC|#00A676|#E8F4FF|#D6DEE5/)
  })

  it('RING_COLOR and SELECTION_BORDER_COLOR are distinct values', () => {
    const tokens = fs.readFileSync(
      path.join(FEATURES, 'workspace-graph', 'network-tokens.ts'), 'utf-8',
    )
    const ringMatch = tokens.match(/RING_COLOR\s*=\s*'(#[0-9A-Fa-f]+)'/)
    const selectionMatch = tokens.match(/SELECTION_BORDER_COLOR\s*=\s*'(#[0-9A-Fa-f]+)'/)
    expect(ringMatch).not.toBeNull()
    expect(selectionMatch).not.toBeNull()
    expect(ringMatch![1]).not.toBe(selectionMatch![1])
  })
})
