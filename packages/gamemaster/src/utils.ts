import { customAlphabet } from  'nanoid';

export const nanoidAlphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
export const nanoid = customAlphabet(nanoidAlphabet, 21);
