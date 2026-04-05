import type { StateCreator, StoreApi, UseBoundStore } from "zustand"

type AsyncFn<TArgs extends unknown[]> = (...args: TArgs) => Promise<void>

interface OptimisticMutationOptions<TState, TSnapshot> {
  snapshot: (state: TState) => TSnapshot
  apply: (state: TState) => Partial<TState>
  persist: () => Promise<void>
  rollback: (snapshot: TSnapshot, state: TState) => Partial<TState>
  onError: (error: unknown) => Partial<TState>
}

export async function runOptimisticMutation<TState, TSnapshot>(
  set: StoreApi<TState>["setState"],
  get: StoreApi<TState>["getState"],
  options: OptimisticMutationOptions<TState, TSnapshot>
) {
  const before = get()
  const snapshot = options.snapshot(before)

  set({
    ...options.apply(before)
  } as Partial<TState>)

  try {
    await options.persist()
  } catch (error) {
    const current = get()
    set({
      ...options.rollback(snapshot, current),
      ...options.onError(error)
    } as Partial<TState>)
  }
}
