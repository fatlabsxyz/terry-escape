import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const rl = readline.createInterface({ input, output });

export async function askInput(options: string[]) {
  const optionsNumbered = options.map((o: string, i: number) => `${i}) ${o}`)
  const answer = await rl.question('What would you like to do?\n' + optionsNumbered.join('\n') + '\n')
  // rl.close();
  return answer;
}
