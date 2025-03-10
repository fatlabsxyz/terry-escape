import { customAlphabet } from 'nanoid';

export const nanoidAlphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
export const nanoid = customAlphabet(nanoidAlphabet, 21);

export function passTime(ms: number): Promise<void> {
  return new Promise((res, rej) => {
    setTimeout(res, ms)
  })
}
