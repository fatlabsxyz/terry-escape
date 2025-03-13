export function passTime(ms: number): Promise<void> {
  return new Promise((res, rej) => {
    setTimeout(res, ms)
  })
}

export function setEqual<T>(set1: Set<T>, set2: Set<T>): boolean {
  // we need compile option "lib": "esnext" for symmetricDifference
  return set1.symmetricDifference(set2).size === 0
}
