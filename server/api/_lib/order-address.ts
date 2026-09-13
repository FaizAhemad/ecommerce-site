type AddressStore = {
  address: {
    findFirst: (args: {
      where: { id: string; userId: string }
      select: { id: true }
    }) => Promise<{ id: string } | null>
  }
}

// Missing and foreign IDs deliberately produce the same result, with no address data.
export async function ownedOrderAddress(store: AddressStore, userId: string, value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return null
  return store.address.findFirst({
    where: { id: value.trim(), userId },
    select: { id: true },
  })
}
