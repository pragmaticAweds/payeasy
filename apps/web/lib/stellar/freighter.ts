/**
 * @file freighter.ts
 * @description Centralized Freighter wallet API wrapper.
 * All extension calls go through here. SSR-guarded.
 */

// ──────────────────────────────────────────────────────────────
// Error types
// ──────────────────────────────────────────────────────────────

export type FreighterErrorCode =
  | 'NOT_INSTALLED'
  | 'NOT_ALLOWED'
  | 'USER_CANCELLED'
  | 'UNKNOWN'

export class FreighterError extends Error {
  code: FreighterErrorCode

  constructor(code: FreighterErrorCode, message: string) {
    super(message)
    this.name = 'FreighterError'
    this.code = code
  }
}

// ──────────────────────────────────────────────────────────────
// SSR guard
// ──────────────────────────────────────────────────────────────

const isBrowser = typeof window !== 'undefined'

async function getFreighterApi() {
  if (!isBrowser) {
    throw new FreighterError('NOT_INSTALLED', 'Freighter is not available during SSR.')
  }
  const mod = await import('@stellar/freighter-api')
  return mod.default ?? mod
}

// ──────────────────────────────────────────────────────────────
// Wrapper functions
// ──────────────────────────────────────────────────────────────

/**
 * Check if the Freighter extension is installed and reachable.
 */
export async function checkFreighterInstalled(): Promise<boolean> {
  if (!isBrowser) return false
  try {
    const api = await getFreighterApi()
    return await api.isConnected()
  } catch {
    return false
  }
}

/**
 * Check if this app is already allowed by the user in Freighter.
 */
export async function checkFreighterAllowed(): Promise<boolean> {
  if (!isBrowser) return false
  try {
    const api = await getFreighterApi()
    return await api.isAllowed()
  } catch {
    return false
  }
}

/**
 * Request Freighter access (prompts the user to allow the app).
 */
export async function requestFreighterAccess(): Promise<boolean> {
  try {
    const api = await getFreighterApi()
    return await api.setAllowed()
  } catch (err) {
    throw mapFreighterError(err)
  }
}

/**
 * Get the user's active Stellar public key from Freighter.
 */
export async function getFreighterPublicKey(): Promise<string> {
  try {
    const api = await getFreighterApi()
    const key = await api.getPublicKey()
    if (!key) {
      throw new FreighterError('NOT_ALLOWED', 'Could not retrieve public key from Freighter.')
    }
    return key
  } catch (err) {
    if (err instanceof FreighterError) throw err
    throw mapFreighterError(err)
  }
}

/**
 * Get the network Freighter is connected to.
 */
export async function getFreighterNetwork(): Promise<{
  network: string
  networkPassphrase: string
}> {
  try {
    const api = await getFreighterApi()
    const details = await api.getNetworkDetails()
    return {
      network: details.network,
      networkPassphrase: details.networkPassphrase,
    }
  } catch (err) {
    throw mapFreighterError(err)
  }
}

/**
 * Sign an arbitrary blob with Freighter.
 */
export async function signBlobWithFreighter(
  blob: string,
  opts?: { accountToSign?: string }
): Promise<string> {
  try {
    const api = await getFreighterApi()
    const result = await api.signBlob(blob, opts)
    if (!result) {
      throw new FreighterError('USER_CANCELLED', 'Blob signing was cancelled or returned empty.')
    }
    return result
  } catch (err) {
    if (err instanceof FreighterError) throw err
    throw mapFreighterError(err)
  }
}

/**
 * Sign a Stellar transaction XDR with Freighter.
 */
export async function signTransactionWithFreighter(
  xdr: string,
  opts?: { network?: string; networkPassphrase?: string; accountToSign?: string }
): Promise<string> {
  try {
    const api = await getFreighterApi()
    const result = await api.signTransaction(xdr, opts)
    if (!result) {
      throw new FreighterError('USER_CANCELLED', 'Transaction signing was cancelled or returned empty.')
    }
    return result
  } catch (err) {
    if (err instanceof FreighterError) throw err
    throw mapFreighterError(err)
  }
}

// ──────────────────────────────────────────────────────────────
// Probe (non-throwing, for init)
// ──────────────────────────────────────────────────────────────

export type FreighterStatus = 'not-installed' | 'installed' | 'connected'

export interface FreighterProbeResult {
  status: FreighterStatus
  publicKey: string | null
  network: string | null
}

/**
 * Non-throwing probe of Freighter state. Used at init to determine
 * wallet status without surfacing errors to the user.
 */
export async function probeFreighterStatus(): Promise<FreighterProbeResult> {
  if (!isBrowser) {
    return { status: 'not-installed', publicKey: null, network: null }
  }

  try {
    const api = await getFreighterApi()
    const installed = await api.isConnected()

    if (!installed) {
      return { status: 'not-installed', publicKey: null, network: null }
    }

    const allowed = await api.isAllowed()
    if (!allowed) {
      return { status: 'installed', publicKey: null, network: null }
    }

    const publicKey = await api.getPublicKey()
    if (!publicKey) {
      return { status: 'installed', publicKey: null, network: null }
    }

    let network: string | null = null
    try {
      const details = await api.getNetworkDetails()
      network = details.network
    } catch {
      // non-critical
    }

    return { status: 'connected', publicKey, network }
  } catch {
    return { status: 'not-installed', publicKey: null, network: null }
  }
}

// ──────────────────────────────────────────────────────────────
// Error mapping
// ──────────────────────────────────────────────────────────────

function mapFreighterError(err: unknown): FreighterError {
  const message = err instanceof Error ? err.message : String(err)
  const lower = message.toLowerCase()

  if (lower.includes('not installed') || lower.includes('not found') || lower.includes('not connected')) {
    return new FreighterError('NOT_INSTALLED', message)
  }
  if (lower.includes('denied') || lower.includes('not allowed') || lower.includes('rejected')) {
    return new FreighterError('NOT_ALLOWED', message)
  }
  if (lower.includes('cancel') || lower.includes('user')) {
    return new FreighterError('USER_CANCELLED', message)
  }
  return new FreighterError('UNKNOWN', message)
}
