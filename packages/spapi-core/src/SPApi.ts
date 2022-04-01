import EventEmitter from "events";
import { io, Socket } from "socket.io-client";
import TypedEmitter from "typed-emitter";
import Extensions from "./extensions";
import Patcher from "./patcher";
import UI from "./ui/ui";

const exitError = (message: string) => {
  if (confirm(`${message}\nDo you want to restart Spotify?`)) {
    window.location.reload();
  } else {
    window.close();
  }
};

type ReactEmitterEvents = {
  onElementPath: (path: string[]) => void;
  onReactCreateElement: (args: any[]) => void;
  onReactComponentWillMount: (_this: any, args: any[]) => void;
};

class SPApi {
  public extensions: Extensions;
  public modules;
  public ui;
  public reactEmitter;
  private _socket?: Socket;
  private _url;

  constructor(
    private _port: string | number,
    private _accessKey: string,
    private _SPApiTemp: any
  ) {
    this.reactEmitter = new EventEmitter() as TypedEmitter<ReactEmitterEvents>;
    this.modules = {
      React: this._SPApiTemp.React,
      ReactDOM: this._SPApiTemp.ReactDOM,
      Patcher: Patcher,
      Platform: {} as any,
    };

    this._url = `http://localhost:${this._port}`;
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
        RightClickOpenContextMenu: this._SPApiTemp.RightClickOpenContextMenu,
      },
      this._SPApiTemp.NamedComponents
    );
  }

  async initialize() {
    for (const key of Object.keys(this.modules.Platform).filter((key) =>
      key.startsWith("get")
    )) {
      const newKey = key[3].toLowerCase() + key.slice(4);
      this.modules.Platform[newKey] = await this._SPApiTemp.platform[key]();
    }
    Object.keys(this.modules.Platform)
      .filter((key) => !key.startsWith("get"))
      .forEach(
        (key) => (this.modules.Platform[key] = this._SPApiTemp.platform[key])
      );

    this.patch();
  }

  async connect() {
    const socket = io(this._url);
    this._socket = socket;

    socket.on("connect", () => {
      socket.emit("access", this._accessKey, (hasAccess: boolean) => {
        if (!hasAccess) {
          exitError("Incorrect access key.");
        }
      });
    });

    socket.on("connect_error", () => {
      exitError("Couldn't connect to Spotify+'s server.");
    });

    socket.on("disconnect", (reason) => {
      exitError(`Disconnected from Spotify+'s server. Reason: "${reason}".`);
    });

    socket.on("loadExtension", (extension: string | string[]) => {
      if (typeof extension === "string") this.extensions.load(extension);
      else extension.forEach((ext) => this.extensions.load(ext));
    });

    socket.on("refresh", () => {
      window.location.reload();
    });
  }

  private patch() {
    this.modules.Patcher.unPatchAll("SPApi");

    this.modules.Patcher.before(
      "SPApi",
      this.modules.React,
      "createElement",
      (_this: any, args: any[]) => {
        this.reactEmitter.emit("onReactCreateElement", args);
      }
    );

    this.modules.Patcher.after(
      "SPApi",
      this.modules.React.Component.prototype,
      "componentWillMount",
      (_this: any, args: any) => {
        this.reactEmitter.emit("onReactComponentWillMount", _this, args);
      }
    );

    this.reactEmitter.on("onReactCreateElement", (args) => {
      const props = args[1];
      const propsValue: string | undefined = props?.value;
      if (propsValue?.includes?.("/") && Object.keys(props).length === 1) {
        const path = propsValue.split("/");
        if (path.length > 0) this.reactEmitter.emit("onElementPath", path);
      }
    });

    this.ui.menu.patch(this);
  }
}

export { ReactEmitterEvents };
export default SPApi;
