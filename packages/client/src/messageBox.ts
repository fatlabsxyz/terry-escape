import { EventEmitter } from "eventemitter3";
import { GameAnswerMsg, GameDeployMsg, GameEndMsg, GameMessage, GameMsg, GameQueryMsg, GameReportMsg, GameUpdateMsg } from "./types/gameMessages.js";
import { PlayerId, PlayerSeat, TurnInfoPayload } from "./types/game.js";
import { TurnEmitMessage } from "./types/messages.js";


const MAX_PLAYERS = 4;
export type Turn = number;

export enum MsgEvents  {
  BROADCAST = "msg:broadcast",
  PROOFS    = "msg:proofs",
  PLAYERS   = "msg:players",
  CLEAN     = "msg:clean",
  NEWTURN   = "msg:new_turn",
  TURN      = "msg:turn",
  END       = "msg:end",
}

export type Players = Map<PlayerId, PlayerSeat>

export class MessageBox extends EventEmitter {

  private static instance: MessageBox;
  
  players: Players;
  deploys: GameDeployMsg[];
  queries: Map<Turn, GameQueryMsg[]>;   
  updates: Map<Turn, GameUpdateMsg[]>;
  answers: Map<Turn, GameAnswerMsg[]>;
  reports: Map<Turn, GameReportMsg>;
  winners: GameEndMsg[]

  constructor() {
    super();
    this.players = new Map();
    this.deploys = new Array();
    this.queries = new Map();
    this.updates = new Map();
    this.answers = new Map();
    this.reports = new Map();
    this.winners = new Array();
  }

  public static getInstance(): MessageBox {
    if (!MessageBox.instance) {
      console.log("PLAYER-STORAGE: creating new instance");
      MessageBox.instance = new MessageBox();
    }
    return MessageBox.instance;
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

    if (
      ( event === GameMsg.DEPLOY) && (values.length === MAX_PLAYERS)) { // 4 deploys
      this.broadcast(event, values);
    } else if (
      ( event === GameMsg.UPDATE ||
        event === GameMsg.QUERY  ||
        event === GameMsg.ANSWER
      ) && (values.length === MAX_PLAYERS - 1)) {                      // 3 queries/updates/answers
      this.broadcast(event, values);
    } else if (event === GameMsg.REPORT && (values.length === 1)){     // 1 report
      this.broadcast(event, values);
    }
  }

  broadcast(type: `${GameMsg}`, values: GameMessage[]) {
    this.emit(MsgEvents.BROADCAST, {type, messages: values})
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

  emitNewTurn(turnInfo: TurnInfoPayload) {
    console.log("\n\n BROADCASTING TURN new-turn-info: ", JSON.stringify(turnInfo))
    this.emit(MsgEvents.NEWTURN, turnInfo)
  }

  emitTurn(turnInfo: TurnEmitMessage) {
    this.emit(MsgEvents.TURN, turnInfo)
  }

  emitWinner(winner: PlayerId) {
    this.emit(MsgEvents.END, {winner});
  }
} 

