import { GameMessage, GameMsg } from "../types/index.js";

export class MessageKey {

  constructor(
    private readonly turn: number,
    private readonly event: `${GameMsg}`,
    private readonly sender: string,
    private readonly recipient?: string,
  ) {
  }

  toString() {
    return `${this.turn}-${this.event}-${this.sender}-${this.recipient}`
  }

  static fromMsg(msg: GameMessage) {
    return new this(msg.turn, msg.event, msg.sender, msg.to)
  }

}

type Log<M extends GameMessage> = { [key: string]: M };

export class MessageLog<M extends GameMessage> {

  log: Log<M>;

  constructor() {
    this.log = {};
  }

  register(msg: M) {
    const msgKey = MessageKey.fromMsg(msg);
    this.log[msgKey.toString()] = msg;
  }

  find(turn: number, event: `${GameMsg}`, sender: string, to?: string): M | undefined {
    const msgKey = new MessageKey(turn, event, sender, to);
    return this.log[msgKey.toString()]
  }

  clear(msg: M) {
    const msgKey = MessageKey.fromMsg(msg);
    delete this.log[msgKey.toString()];
  }

}
