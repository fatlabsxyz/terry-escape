import { EventEmitter } from "events";

enum InterfacerEvents {
  Action = "inter:action",
}

class Interfacer extends EventEmitter {
  //TODO finish this later (it's the event interface between frontend and gameMachine turn for Active and NonActivePlayer 
  constructor(){
  super();
  }

  takeAction(action: string) {
    this.emit(InterfacerEvents.Action, {})
  }

}
