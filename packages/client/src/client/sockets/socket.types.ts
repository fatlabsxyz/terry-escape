export interface SocketInit {
  token: string;
  serverUrl: string;
  forceNew: boolean;
  // log: (...args: any[]) => void;
}

export interface PlayerOptions extends SocketInit {
  token: string;
  gameId: string;
}

export interface GameOptions extends SocketInit {
  token: string;
  gameId: string;
}

export interface LobbyOptions extends SocketInit {
}
