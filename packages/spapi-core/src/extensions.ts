// Adds a .js extension to the provided filename.
const addJS = (filename: string) => {
  filename = filename.trim();
  return filename.endsWith(".js") ? filename : filename + ".js";
}

class Extensions {
  private _loaded = new Map<string, any>();

  constructor(private url: string) { }

  async start(name: string) {
    name = addJS(name);

    return this._loaded.get(name).start();
  }

  async stop(name: string) {
    name = addJS(name);

    return this._loaded.get(name).stop();
  }

  async load(name: string) {
    name = addJS(name);

    this.unload(name);
    this._loaded.set(name, await import(`${this.url}/extensions/${name}?time=${Date.now()}`));
  }

  async unload(name: string) {
    name = addJS(name);

    if (this._loaded.get(name) === undefined) {
      return;
    }

    try {
      this._loaded.get(name).stop();
    } catch (e) {
      console.warn(`SPApi: Couldn't unload extension: "${name}". Reason: ${e}`);
    }

    this._loaded.delete(name);
  }
}

export default Extensions;