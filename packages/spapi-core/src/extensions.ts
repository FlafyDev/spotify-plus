class Extensions {
  public loaded = new Map<string, any>();

  constructor(private url: string) { }

  async load(name: string) {
    this.unload(name);

    const extensionModule = await import(`${this.url}/extensions/${name}?time=${Date.now()}`)

    this.loaded.set(name, new Extension(extensionModule));
  }

  async unload(name: string) {
    if (this.loaded.get(name) === undefined) {
      return;
    }

    try {
      this.loaded.get(name).stop();
    } catch (e) {
      console.warn(`SPApi: Couldn't unload extension: "${name}". Reason: ${e}`);
    }

    this.loaded.delete(name);
  }
}

class Extension {
  public readonly config: any;

  constructor(
    private readonly _module: any,
  ) {
    this.config = _module.config;
  }

  public start() {
    this._module.start();
  }

  public stop() {
    this._module.stop();
  }

  public isRunning() {
    this._module.isRunning();
  }
}

export { Extension };
export default Extensions;
