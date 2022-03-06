import fs from 'fs/promises';
import _, { difference, isEqual } from 'lodash';
import StreamZip from 'node-stream-zip';
import path from "path";
import Config from "./config";
import { deepSearch, fileExists, insertString, modifyFile } from './utils';
// const flowParser = require('flow-parser')
const esprima = require('esprima');

const readline = require('readline');

class Injector {
  xpuiDir;
  xpuiSpa;
  xpuiSpaBackup;
  private spotifyPlusVersionFilePath: string;


  constructor(public config: Config, public force: boolean) {
    this.xpuiDir = path.join(this.config.spotifyDirectory, 'Apps/xpui');
    this.xpuiSpa = path.join(this.config.spotifyDirectory, "Apps/xpui.spa");;
    this.xpuiSpaBackup = path.join(this.config.spotifyDirectory, "Apps/xpui.backup.spa");
    this.spotifyPlusVersionFilePath = path.join(this.xpuiDir, 'spotifyPlusVersion');
  }

  async inject(inject: boolean = true) {
    if (inject) {
      if (this.force || await this.needInjecting()) {
        console.log("Extracting...");

        await this.unInject()

        await this.extractXpui();

        console.log("Injecting... (May take some time...)");
        await this.injectXpui();

        fs.rename(this.xpuiSpa, this.xpuiSpaBackup);

        // TODO automatically add(and maybe also compile) SPApiCore.js
      }

      await this.setServerInfo();
      await fs.writeFile(this.spotifyPlusVersionFilePath, this.config.version);
    } else {
      await this.unInject();
    }
  }

  async unInject() {
    if (await fileExists(this.xpuiDir)) {
      await fs.rm(this.xpuiDir, { recursive: true, force: true })
    }
    if (await fileExists(this.xpuiSpaBackup)) {
      if (await fileExists(this.xpuiSpa)) {
        fs.rm(this.xpuiSpaBackup);
      } else {
        fs.rename(this.xpuiSpaBackup, this.xpuiSpa);
      }
    }
  }

  // If (xpui.spa doesn't exists && xpui.backup.spa exists) then { there is no need to inject }.
  // If (the injected injector version is the same as this injector) then { there is no need to inject }.
  async needInjecting() {
    let sameInjectedInjectorVersion = false;

    if (await fileExists(this.xpuiDir)) {
      if (!this.force && await fileExists(this.spotifyPlusVersionFilePath)) {
        let injectedInjectorVersion = (await fs.readFile(this.spotifyPlusVersionFilePath)).toString();

        if (injectedInjectorVersion === this.config.version) {
          sameInjectedInjectorVersion = true;
        }
      }
    }

    return !sameInjectedInjectorVersion || !(!(await fileExists(this.xpuiSpa)) && await fileExists(this.xpuiSpaBackup));
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
    this.inject(false);

    await fs.mkdir(this.xpuiDir);
    const zip = new StreamZip.async({ file: this.xpuiSpa });
    await zip.extract(null, this.xpuiDir);
    await zip.close();
  }

  private async injectXpui() {
    if (await fileExists(this.spotifyPlusVersionFilePath)) {
      return;
    }
    const xpuiJSPath = path.join(this.xpuiDir, 'xpui.js');
    const vXpuiJSPath = path.join(this.xpuiDir, 'vendor~xpui.js');

    const xpuiInjector = new XpuiInjector(xpuiJSPath, vXpuiJSPath, 'globalThis.SPApiTemp');

    await xpuiInjector.injectSPInit();
    await xpuiInjector.injectPopup();
    await xpuiInjector.injectGetShowFeedback();
    await xpuiInjector.injectPlatform();
    await xpuiInjector.injectReact();
    await xpuiInjector.injectReactDOM();
  }
};

class XpuiInjector {
  private reactProps = ['Children', 'createRef', 'Component', 'PureComponent', 'createContext', 'forwardRef', 'lazy', 'memo', 'useCallback', 'useContext', 'useEffect', 'useImperativeHandle', 'useDebugValue', 'useLayoutEffect', 'useMemo', 'useReducer', 'useRef', 'useState', 'Fragment', 'Profiler', 'StrictMode', 'Suspense', 'unstable_SuspenseList', 'createElement', 'cloneElement', 'createFactory', 'isValidElement', 'version', 'unstable_withSuspenseConfig', '__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED'];
  private reactDOMProps = ['createPortal', 'findDOMNode', 'hydrate', 'render', 'unstable_renderSubtreeIntoContainer', 'unmountComponentAtNode', 'unstable_createPortal', 'unstable_batchedUpdates', 'unstable_interactiveUpdates', 'unstable_discreteUpdates', 'unstable_flushDiscreteUpdates', 'flushSync', 'unstable_createRoot', 'unstable_createSyncRoot', 'unstable_flushControlled', '__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED'];
  private somePlatformProps = ['version', 'container', 'operatingSystem', 'isDeveloperMode'];

  constructor(public xpuiPath: string, public vXpuiPath: string, public apiVariable: string) { }

  async injectPopup() {
    await modifyFile(this.xpuiPath, async (content) => {
      const parsedXpui = esprima.parseScript(content, { loc: true });
      const reactElements = deepSearch(parsedXpui['body'],
        (obj) => {
          if (!(obj?.type === 'VariableDeclarator' && obj?.init?.body?.type === 'BlockStatement')) {
            return false;
          }

          const blockStatement = obj.init.body;

          if (blockStatement.body[blockStatement.body.length - 1]?.type !== 'ReturnStatement') {
            return false;
          }

          const returnStatement = blockStatement.body[blockStatement.body.length - 1];

          return deepSearch(returnStatement, (obj) => obj?.type === 'CallExpression' && obj?.callee?.property?.name === 'createElement', 5).length >= 1;
        }
      )

      const popupElement = reactElements.find(reactElement => {
        const identifiers = deepSearch(reactElement, (obj) => obj?.type === 'Identifier').map(obj => obj?.name);
        return (_.difference(['isOpen', 'contentLabel', 'children', 'className', 'overlayClassName', 'animated', 'animation'], identifiers).length === 0)
      })

      const insertLoc = popupElement.id.loc.end;
      return insertString(content, insertLoc.line - 1, insertLoc.column, `=${this.apiVariable}.GenericModal`);
    });
  }

  async injectGetShowFeedback() {
    await modifyFile(this.xpuiPath, async (content) => {
      const parsedXpui = esprima.parseScript(content, { loc: true });

      const variableDeclarator = deepSearch(parsedXpui['body'],
        (obj) => {
          obj?.type === 'VariableDeclarator' && obj?.init?.type === 'SequenceExpression'
          const objectExpressions = deepSearch(obj.init?.expressions?.[1], (obj) => obj?.type === 'ObjectExpression', 10);
          return objectExpressions.some(exp => {
            const params = exp.properties.map((prop: any) => prop.key.name);
            return difference(['hide', 'show', 'msTimeout'], params).length === 0;
          });
        }
      )[0]

      const insertLoc = variableDeclarator.id.loc.end;
      return insertString(content, insertLoc.line - 1, insertLoc.column, `=${this.apiVariable}.getShowFeedback`);
    });
  }

  async injectPlatform() {
    await modifyFile(this.xpuiPath, (content) => {
      const parsedXpui = esprima.parseScript(content, { loc: true });

      // Looks for an object that has all of react's properties.
      const platformObjectExpression = deepSearch(parsedXpui['body'], (obj) => obj?.type === 'ObjectExpression').find((obj) => {
        const objProps = obj.properties.map((prop: any) => prop.key.name);
        return this.somePlatformProps.every((prop: string) => objProps.includes(prop));
      });

      const insertLoc = platformObjectExpression.loc.start;
      return insertString(content, insertLoc.line - 1, insertLoc.column, ` ${this.apiVariable}.platform=`);
    });
  }

  async injectReact() {
    await modifyFile(this.vXpuiPath, (content) => {
      const parsedVXpui = esprima.parseScript(content, { loc: true });

      // Looks for an object that has all of react's properties.
      const reactObjectExpression = deepSearch(parsedVXpui['body'], (obj) => obj?.type === 'ObjectExpression').find((obj) => {
        return isEqual(obj.properties.map((prop: any) => prop.key.name), this.reactProps);
      });

      const insertLoc = reactObjectExpression.loc.start;
      return insertString(content, insertLoc.line - 1, insertLoc.column, ` ${this.apiVariable}.React=`);
    });
  }

  async injectReactDOM() {
    await modifyFile(this.vXpuiPath, (content) => {
      const parsedVXpui = esprima.parseScript(content, { loc: true });

      // Looks for an object that has all of react-dom's properties.
      const reactDOMObjectExpression = deepSearch(parsedVXpui['body'], (obj) => obj?.type === 'ObjectExpression').find((obj) => {
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