import type { BisectSession, Extension } from "@/types"

export type ExtensionSnapshot = Extension[]

export const createIdleBisectSession = (): BisectSession => ({
  active: false,
  phase: "idle",
  baselineExtensions: [],
  allCandidateIds: [],
  candidateIds: [],
  currentTestIds: [],
  parkedIds: [],
  step: 0,
})

export const splitCandidateIds = (candidateIds: string[]) => {
  const midpoint = Math.ceil(candidateIds.length / 2)
  return {
    currentTestIds: candidateIds.slice(0, midpoint),
    parkedIds: candidateIds.slice(midpoint),
  }
}

export const buildBisectExtensions = (
  baselineExtensions: ExtensionSnapshot,
  allCandidateIds: string[],
  currentTestIds: string[]
) => {
  const allCandidates = new Set(allCandidateIds)
  const currentTests = new Set(currentTestIds)

  return baselineExtensions.map((extension) => {
    if (!allCandidates.has(extension.id)) {
      return {
        ...extension,
        permissions: [...extension.permissions],
      }
    }

    return {
      ...extension,
      permissions: [...extension.permissions],
      enabled: currentTests.has(extension.id),
    }
  })
}

export const isBisectSessionConsistent = (
  session: BisectSession,
  currentExtensions: ExtensionSnapshot
) => {
  if (!session.active) return false

  const currentById = new Map(currentExtensions.map((extension) => [extension.id, extension]))
  const baselineById = new Map(
    session.baselineExtensions.map((extension) => [extension.id, extension])
  )
  const trackedIds = Array.from(
    new Set([
      ...session.allCandidateIds,
      ...session.baselineExtensions.map((extension) => extension.id),
    ])
  )

  if (!trackedIds.every((id) => currentById.has(id) && baselineById.has(id))) {
    return false
  }

  const expectedExtensions = buildBisectExtensions(
    session.baselineExtensions,
    session.allCandidateIds,
    session.currentTestIds
  )
  const expectedById = new Map(
    expectedExtensions.map((extension) => [extension.id, extension.enabled])
  )

  return session.allCandidateIds.every(
    (id) => currentById.get(id)?.enabled === expectedById.get(id)
  )
}
