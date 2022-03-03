import { io } from "socket.io-client";
import Extensions from "./extensions";

const exitError = (message: string) => {
  alert(message);
  window.close();
}

class SPApi {
  public extensions;
  public React;
  public ReactDOM;
  public platform;
  private _socket;
  private _url;

  constructor(private _port: string | number, private _accessKey: string, spapiTemp: any) {
    this.React = spapiTemp.React;
    this.ReactDOM = spapiTemp.ReactDOM;
    this.platform = spapiTemp.platform;

    this._url = `http://localhost:${this._port}`;
    this._socket = io(this._url);
    this.extensions = new Extensions(this._url);

    this.initializeEvents();
  }

  private initializeEvents() {
    this._socket.on("connect", () => {
      this._socket.emit("access", this._accessKey, (hasAccess: boolean) => {
        if (!hasAccess) {
          exitError("Incorrect access key.");
        }
      });
    });

    this._socket.on("connect_error", () => {
      exitError("Couldn't connect to Spotify+'s server.");
    });

    this._socket.on("disconnect", (reason) => {
      exitError(`Disconnected from Spotify+'s server. Reason: "${reason}".`);
    });

    this._socket.on("loadExtension", (extension: string | string[]) => {
      if (typeof extension === 'string')
        this.extensions.load(extension);
      else
        extension.forEach(ext => this.extensions.load(ext));
    });

    this._socket.on("refresh", () => {
      window.location.reload();
    });
  }


}

export default SPApi;