import type { StoreApi } from "zustand"

interface OptimisticMutationOptions<TState, TSnapshot> {
  snapshot: (state: TState) => TSnapshot
  apply: (state: TState) => Partial<TState>
  persist: (snapshot: TSnapshot, nextState: TState) => Promise<void>
  rollback: (snapshot: TSnapshot, state: TState) => Partial<TState>
  onError: (error: unknown) => Partial<TState>
  /**
   * Optional patch applied AFTER persist() succeeds (e.g. write to history).
   * Receives the original snapshot AND current state (post-apply, post-persist)
   * so it can both reference the pre-mutation values and read fresh state.
   */
  commit?: (snapshot: TSnapshot, state: TState) => Partial<TState>
}

export async function runOptimisticMutation<TState, TSnapshot>(
  set: StoreApi<TState>["setState"],
  get: StoreApi<TState>["getState"],
  options: OptimisticMutationOptions<TState, TSnapshot>
) {
  const before = get()
  const snapshot = options.snapshot(before)

  set({
    ...options.apply(before),
  } as Partial<TState>)

  try {
    const afterApply = get()
    await options.persist(snapshot, afterApply)
    if (options.commit) {
      set({
        ...options.commit(snapshot, get()),
      } as Partial<TState>)
    }
  } catch (error) {
    const current = get()
    set({
      ...options.rollback(snapshot, current),
      ...options.onError(error),
    } as Partial<TState>)
  }
}
