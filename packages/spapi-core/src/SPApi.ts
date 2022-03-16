import { io } from "socket.io-client";
import Extensions from "./extensions";
import Patcher from "./patcher";
import UI from "./ui/ui";

const exitError = (message: string) => {
  if (confirm(`${message}\nDo you want to restart Spotify?`)) {
    window.location.reload();
  } else {
    window.close();
  }
}

class SPApi {
  public extensions: Extensions;
  public modules;
  public ui;
  private _socket;
  private _url;

  constructor(private _port: string | number, private _accessKey: string, private _SPApiTemp: any) {
    this.modules = {
      React: this._SPApiTemp.React,
      ReactDOM: this._SPApiTemp.ReactDOM,
      Patcher: Patcher,
      Platform: {} as any,
    }

    this._url = `http://localhost:${this._port}`;
    this._socket = io(this._url);
    this.extensions = new Extensions(this._url);

    this.ui = new UI(
      this.modules.React,
      this.modules.ReactDOM,
      {
        getShowFeedback: this._SPApiTemp.getShowFeedback,
      },
      {
        GenericModal: this._SPApiTemp.GenericModal,
        Menu: this._SPApiTemp.Menu,
        MenuItem: this._SPApiTemp.MenuItem,
        SubMenu: this._SPApiTemp.SubMenu,
      },
      this._SPApiTemp.NamedComponents
    );
  }

  async initialize() {
    for (const key of Object.keys(this.modules.Platform).filter(key => key.startsWith("get"))) {
      const newKey = key[3].toLowerCase() + key.slice(4)
      this.modules.Platform[newKey] = await this._SPApiTemp.platform[key]()
    };
    Object.keys(this.modules.Platform).filter(key => !key.startsWith("get")).forEach(key => this.modules.Platform[key] = this._SPApiTemp.platform[key])

    this.patch();
  }

  async connect() {
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

  private patch() {
    this.modules.Patcher.unPatchAll("SPApi");

    this.modules.Patcher.instead("SPApi", this.modules.React, "createElement", (_this: any, args: any[], ogFunc: Function) => {
      args = this.ui.onReactCreateElement(args);
      return ogFunc.call(_this, ...args)
    });
  }
}

export default SPApi;