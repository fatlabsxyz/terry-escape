import { GameDeployMsg, GameMessage, GameMsg } from "client/types";

export class MessageKey {

  constructor(
    private readonly turn: number,
    private readonly event: `${GameMsg}`,
    private readonly sender: string,
    private readonly recipient?: string,
  ) {
  }

  toString() {
    return `${this.turn}~${this.event}~${this.sender}~${this.recipient}`
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

  findMessageListForTurn(turn: number, event: `${GameMsg}`): M[] {
    const msgKey = `${turn}~${event}`;

    const messageKeyVals: string[] = Object.keys(this.log)
    const messageKeyValsFiltered = messageKeyVals.filter(key => key.includes(msgKey))
    const messageMapped = messageKeyValsFiltered.map(key => this.log[key]);
    const result = messageMapped.filter(value => value !== undefined);
  
    //TODO: remove this later (variables and prints)
    console.log(`\n\n\n\nMSGKEY: ${msgKey} \n`);
    console.log(`\nMESSAGE KEY VALUES: ${messageKeyVals}, LEN: ${messageKeyVals.length} \n`);
    console.log(`\nMESSAGE KEY VALUES FILTERED: ${messageKeyValsFiltered}, LEN: ${messageKeyValsFiltered.length} \n`);
    console.log(`\nMESSAGE MAPPED: ${messageMapped} \n`);
    console.log(`\nMESSAGE RESULT: ${result} \n\n\n\n`);
    
    return result
  }

  clear(msg: M) {
    const msgKey = MessageKey.fromMsg(msg);
    delete this.log[msgKey.toString()];
  }

}
