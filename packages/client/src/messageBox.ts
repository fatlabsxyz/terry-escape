import EventEmitter from "events";
import { GameAnswerMsg, GameDeployMsg, GameDeployPayload, GameMessage, GameMessagePayload, GameMsg, GameQueryMsg, GameReportMsg, GameUpdateMsg } from "./types/gameMessages.js";


const MAX_PLAYERS = 4;
export type Turn = number;
export enum MsgEvents  {
  BROADCAST = "msg:broadcast",
  CLEAN = "msg:broadcast",
}

export class MessageBox extends EventEmitter {
  deploys: GameDeployMsg[];
  queries: Map<Turn, GameQueryMsg[]>;   
  updates: Map<Turn, GameUpdateMsg[]>;
  answers: Map<Turn, GameAnswerMsg[]>;
  reports: Map<Turn, GameReportMsg>;

  constructor() {
    super();
    this.deploys = new Array();
    this.queries = new Map();
    this.updates = new Map();
    this.answers = new Map();
    this.reports = new Map();
  }

  storeValue(msg: GameMessage) {
    
    const turn: Turn = msg.turn;
    const event: `${GameMsg}` = msg.event;

    switch (event) {
      case GameMsg.DEPLOY: { 
        this.deploys.push(msg as GameDeployMsg); 
        this.evalBroadcast(event, this.deploys);
        break; 
      }; 
      case GameMsg.QUERY: {
        if (this.queries.has(turn)) {
          const valueList = this.queries.get(turn)!;
          valueList.push(msg as GameQueryMsg);
          this.evalBroadcast(event, valueList);
          this.queries.set(turn, valueList);
        } else {
          const newValueList: GameQueryMsg[] = [msg as GameQueryMsg]
          this.queries.set(turn, newValueList);
        }
        break;
      };
      case GameMsg.ANSWER: {
         if (this.answers.has(turn)) {
          const valueList = this.answers.get(turn)!;
          valueList.push(msg as GameAnswerMsg);
          this.evalBroadcast(event, valueList);
          this.answers.set(turn, valueList);
        } else {
          const newValueList: GameAnswerMsg[] = [msg as GameAnswerMsg]
          this.answers.set(turn, newValueList);
        }
        break;
      };
      case GameMsg.UPDATE: { 
         if (this.updates.has(turn)) {
          const valueList = this.updates.get(turn)!;
          valueList.push(msg as GameUpdateMsg);
          this.evalBroadcast(event, valueList);
          this.updates.set(turn, valueList);
        } else {
          const newValueList: GameUpdateMsg[] = [msg as GameUpdateMsg]
          this.updates.set(turn, newValueList);
        }
        break;
      };
      case GameMsg.REPORT: { 
        this.reports.set(turn, msg as GameReportMsg); 
        this.evalBroadcast(event, [this.reports.get(turn)!]);
        break; 
      };
    }
  }

  evalBroadcast(event: `${GameMsg}`, values: GameMessage[]) {
    console.log(`EVALUATING EMISSION OF ${event}`)

    if (event === GameMsg.DEPLOY && (values.length === MAX_PLAYERS)) {  // 4 deploys
      this.emit(MsgEvents.BROADCAST, {type: event, messages: values});
    } else if (
      ( event === GameMsg.UPDATE ||
        event === GameMsg.QUERY  || 
        event === GameMsg.ANSWER
      ) && (values.length === MAX_PLAYERS - 1)) {                       // 3 queries/updates/answers
      this.emit(MsgEvents.BROADCAST, {type: event, messages: values});
    } else if (event === GameMsg.REPORT && (values.length === 1)){      // 1 report
      this.emit(MsgEvents.BROADCAST, {type: event, messages: values})
    }
  }

  clearOldMessages(){
    // if the amount of turns full of proofs exceed 2, remove the oldest set of proofs
    // (saves a lot of memory)
    if (this.queries.size === 2) {
      const firstKey = this.queries.keys().next().value;
      this.queries.delete(firstKey!);
    }   
    if (this.answers.size === 2) {
      const firstKey = this.answers.keys().next().value;
      this.answers.delete(firstKey!);
    }
    if (this.updates.size === 2) {
      const firstKey = this.updates.keys().next().value;
      this.updates.delete(firstKey!);
    }
    if (this.reports.size === 2) {
      const firstKey = this.reports.keys().next().value;
      this.reports.delete(firstKey!);
    }
  }
  
  emitClean() {
    this.emit(MsgEvents.CLEAN);
  }
} 

