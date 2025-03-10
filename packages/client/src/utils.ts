export function passTime(ms: number): Promise<void> {
  return new Promise((res, rej) => {
    setTimeout(res, ms)
  })
}
