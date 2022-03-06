import { io } from "socket.io-client";
import Extensions from "./extensions";
import Patcher from "./patcher";

const exitError = (message: string) => {
  if (confirm(`${message}\nDo you want to restart Spotify?`)) {
    window.location.reload();
  } else {
    window.close();
  }
}

class SPApi {
  public Patcher;
  public extensions;
  public React;
  public ReactDOM;
  public platform: any;
  private _platform;
  private _socket;
  private _url;
  private _genericModal;
  private _getShowFeedback;

  constructor(private _port: string | number, private _accessKey: string, spapiTemp: any) {
    this.Patcher = Patcher;

    this.React = spapiTemp.React;
    this.ReactDOM = spapiTemp.ReactDOM;
    this._platform = spapiTemp.platform;

    this._url = `http://localhost:${this._port}`;
    this._socket = io(this._url);
    this.extensions = new Extensions(this._url);

    this._genericModal = spapiTemp.GenericModal;
    this._getShowFeedback = spapiTemp.getShowFeedback;

    this.platform = {};

    this.initializeEvents();
  }

  async makePlatform() {
    for (const key of Object.keys(this._platform).filter(key => key.startsWith("get"))) {
      const newKey = key[3].toLowerCase() + key.slice(4)
      this.platform[newKey] = await this._platform[key]()
    };
    Object.keys(this._platform).filter(key => !key.startsWith("get")).forEach(key => this.platform[key] = this._platform[key])
  }

  showFeedback(message: string, feedbackType: "NOTICE" | "ERROR" = "NOTICE", duration: number = 2500, errorKey: any) {
    this._getShowFeedback({
      message,
      feedbackType,
      msTimeout: duration,
      errorKey,
    });
  }

  createPopup(children: any) {
    let genericModalContainer = document.createElement("div");

    this.ReactDOM.render(this.React.createElement(this._genericModal, {
      isOpen: true,
      contentLabel: 'user.edit-details.title',
      onRequestClose: (e: any) => e.target.remove(),
    },
      children
    ), genericModalContainer);

    genericModalContainer.remove();
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