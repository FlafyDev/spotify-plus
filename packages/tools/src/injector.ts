import fs from 'fs/promises';
import { isEqual } from 'lodash';
import StreamZip from 'node-stream-zip';
import path from "path";
import Config from "./config";
import { deepSearch, fileExists, insertString, modifyFile } from './utils';
const flowParser = require('flow-parser')
// const esprima = require('esprima');

class Injector {
  xpuiDir: string;
  private spotifyPlusVersionFilePath: string;


  constructor(public config: Config, public force: boolean) {
    this.xpuiDir = path.join(this.config.spotifyDirectory, 'Apps/xpui');
    this.spotifyPlusVersionFilePath = path.join(this.xpuiDir, 'spotifyPlusVersion');
  }

  async inject(inject: boolean = true) {
    if (inject) {
      console.log("Extracting...");
      await this.extractXpui();
      console.log("Injecting... (May take some time...)");
      await this.injectXpui();

      await this.setServerInfo();
      await fs.writeFile(this.spotifyPlusVersionFilePath, this.config.version);
    } else {
      if (await fileExists(this.xpuiDir)) {
        await fs.rm(this.xpuiDir, { recursive: true, force: true })
      }
    }
  }

  async setServerInfo() {
    await fs.writeFile(path.join(this.xpuiDir, 'serverInfo'), `${this.config.settings.port}:${this.config.settings.accessKey}`);
  }

  async blockUpdates(block: boolean = true) {
    // if (block) {
    //   process.env.LOCALAPPDATA

    // }

    // throw "Can only block updates in Windows."
  }

  private async extractXpui() {
    const xpuiSpa = path.join(this.config.spotifyDirectory, 'Apps/xpui.spa');

    let injectedVersion: string | undefined = undefined
    let extract = true;

    if (await fileExists(this.xpuiDir)) {
      if (!this.force && await fileExists(this.spotifyPlusVersionFilePath)) {
        injectedVersion = (await fs.readFile(this.spotifyPlusVersionFilePath)).toString();

        if (injectedVersion === this.config.version) {
          extract = false;
        }
      }

      if (extract) {
        this.inject(false);
      }
    }

    if (extract) {
      await fs.mkdir(this.xpuiDir);
      const zip = new StreamZip.async({ file: xpuiSpa });
      await zip.extract(null, this.xpuiDir);
      await zip.close();
    }
  }

  // TODO finish
  private async injectXpui() {
    if (await fileExists(this.spotifyPlusVersionFilePath)) {
      return;
    }
    const xpuiJSPath = path.join(this.xpuiDir, 'xpui.js');
    const vXpuiJSPath = path.join(this.xpuiDir, 'vendor~xpui.js');

    const xpuiInjector = new XpuiInjector(xpuiJSPath, vXpuiJSPath, 'globalThis.SPApiTemp');

    await xpuiInjector.injectPlatform();
    await xpuiInjector.injectSPInit();
    await xpuiInjector.injectReact();
    await xpuiInjector.injectReactDOM();
  }
};

class XpuiInjector {
  private reactProps = ['Children', 'createRef', 'Component', 'PureComponent', 'createContext', 'forwardRef', 'lazy', 'memo', 'useCallback', 'useContext', 'useEffect', 'useImperativeHandle', 'useDebugValue', 'useLayoutEffect', 'useMemo', 'useReducer', 'useRef', 'useState', 'Fragment', 'Profiler', 'StrictMode', 'Suspense', 'unstable_SuspenseList', 'createElement', 'cloneElement', 'createFactory', 'isValidElement', 'version', 'unstable_withSuspenseConfig', '__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED'];
  private reactDOMProps = ['createPortal', 'findDOMNode', 'hydrate', 'render', 'unstable_renderSubtreeIntoContainer', 'unmountComponentAtNode', 'unstable_createPortal', 'unstable_batchedUpdates', 'unstable_interactiveUpdates', 'unstable_discreteUpdates', 'unstable_flushDiscreteUpdates', 'flushSync', 'unstable_createRoot', 'unstable_createSyncRoot', 'unstable_flushControlled', '__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED'];
  private somePlatformProps = ['version', 'container', 'operatingSystem', 'isDeveloperMode'];

  constructor(public xpuiPath: string, public vXpuiPath: string, public apiVariable: string) { }

  async injectPlatform() {
    await modifyFile(this.xpuiPath, (content) => {
      const parsedXpui = flowParser.parse(content, {});

      // Looks for an object that has all of react's properties.
      const platformObjectExpression = deepSearch(parsedXpui['body'], (key, value) => key === 'type' && value === 'ObjectExpression').find((obj) => {
        const objProps = obj.properties.map((prop: any) => prop.key.name);
        return this.somePlatformProps.every((prop: string) => objProps.includes(prop));
      });

      const insertLoc = platformObjectExpression.loc.start;
      return insertString(content, insertLoc.line - 1, insertLoc.column, ` ${this.apiVariable}.platform=`);
    });
  }

  async injectReact() {
    await modifyFile(this.vXpuiPath, (content) => {
      const parsedVXpui = flowParser.parse(content, {});

      // Looks for an object that has all of react's properties.
      const reactObjectExpression = deepSearch(parsedVXpui['body'], (key, value) => key === 'type' && value === 'ObjectExpression').find((obj) => {
        return isEqual(obj.properties.map((prop: any) => prop.key.name), this.reactProps);
      });

      const insertLoc = reactObjectExpression.loc.start;
      return insertString(content, insertLoc.line - 1, insertLoc.column, ` ${this.apiVariable}.React=`);
    });
  }

  async injectReactDOM() {
    await modifyFile(this.vXpuiPath, (content) => {
      const parsedVXpui = flowParser.parse(content, {});

      // Looks for an object that has all of react-dom's properties.
      const reactDOMObjectExpression = deepSearch(parsedVXpui['body'], (key, value) => key === 'type' && value === 'ObjectExpression').find((obj) => {
        return isEqual(obj.properties.map((prop: any) => prop.key.name), this.reactDOMProps);
      });

      const insertLoc = reactDOMObjectExpression.loc.start;
      return insertString(content, insertLoc.line - 1, insertLoc.column, ` ${this.apiVariable}.ReactDOM=`);
    });
  }

  async injectSPInit() {
    await modifyFile(this.xpuiPath, async (content) => {
      return ((await fs.readFile(path.join(__dirname, '../files/SPApiInitializer.js'))).toString() + content);
    });
  }
}

export default Injector;