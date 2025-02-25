export interface SocketInit {
  token: string;
  serverUrl: string;
  forceNew: boolean;
  log: (...args: any[]) => void;
}

export interface PlayerOptions extends SocketInit {
  name: string;
  gameId: string;
}

export interface GameOptions extends SocketInit {
  gameId: string;
}

export interface LobbyOptions extends SocketInit {
}
