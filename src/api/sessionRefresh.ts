export function createSessionRefreshCoordinator(
  performRefresh: (activity: boolean) => Promise<void>,
  isCurrent: () => boolean,
) {
  let pending: { activity: boolean; promise: Promise<void> } | undefined

  return async function refresh(activity: boolean): Promise<void> {
    if (!isCurrent()) return
    if (pending) {
      const previous = pending
      await previous.promise
      if (!isCurrent() || !activity || previous.activity) return
      return refresh(true)
    }

    const job = { activity, promise: performRefresh(activity) }
    pending = job
    try {
      await job.promise
    } finally {
      if (pending === job) pending = undefined
    }
  }
}
