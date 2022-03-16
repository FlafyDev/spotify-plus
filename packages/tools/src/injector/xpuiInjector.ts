import fs from 'fs/promises';
import { difference, isEqual } from 'lodash';
import path from "path";
import deepSearch from '../utils/deepSearch';
import JSModifyManager from '../utils/jsFileModifier';

class XpuiInjector {
  xpuiModifier;
  vxpuiModifier;
  private xpuiReactElements;


  constructor(public xpuiPath: string, public vxpuiPath: string, public apiVariable: string) {
    this.xpuiModifier = new JSModifyManager(this.xpuiPath);
    this.vxpuiModifier = new JSModifyManager(this.vxpuiPath);

    this.xpuiReactElements = XpuiInjector.getReactElements(this.xpuiModifier.parsed['body']);
  }

  async applyInjections() {
    await this.xpuiModifier.applyChanges();
    await this.vxpuiModifier.applyChanges();
  }

  async injectNamedComponents() {
    const injectedNamedComponents: any[] = [];

    const getValueExpression = (obj: any) => {
      let value = undefined;
      deepSearch(obj, (obj) => {
        if (obj?.type === 'CallExpression' &&
          obj.callee?.property?.name === 'createElement' &&
          obj.arguments?.[1]?.properties?.[0]?.key?.name === 'value') {
          value = obj.arguments[1].properties[0].value.value;
          return typeof value === 'string';
        }
        return false;
      }, 10, 1);
      return value;
    };

    while (true) {
      let value;

      const namedComponent = this.xpuiReactElements.find(reactElement => {
        value = getValueExpression(reactElement);
        return value && !injectedNamedComponents.includes(value);
      })

      if (namedComponent) {
        injectedNamedComponents.push(value);
        this.assignVariableToObject(this.xpuiModifier, namedComponent, `${this.apiVariable}.NamedComponents['${value}']`);
      } else {
        break;
      }
    }
  }

  async injectMenu() {
    const element = this.xpuiReactElements.find(reactElement => {
      const identifiers = deepSearch(reactElement, (obj) => obj?.type === 'Identifier').map(obj => obj?.name);
      return (difference(['children', 'onClose', 'getInitialFocusElement'], identifiers).length === 0)
    })

    this.assignVariableToObject(this.xpuiModifier, element, `${this.apiVariable}.Menu`);
  }

  async injectMenuItem() {
    const element = this.xpuiReactElements.find(reactElement => {
      const identifiers = deepSearch(reactElement, (obj) => obj?.type === 'Identifier').map(obj => obj?.name);
      return (difference(['children', 'icon', 'disabled', 'divider', 'onClick'], identifiers).length === 0)
    })

    this.assignVariableToObject(this.xpuiModifier, element, `${this.apiVariable}.MenuItem`);
  }

  async injectSubMenu() {
    const element = this.xpuiReactElements.find(reactElement => {
      const identifiers = deepSearch(reactElement, (obj) => obj?.type === 'Identifier').map(obj => obj?.name);
      return (difference(['displayText', 'depth', 'children', 'divider'], identifiers).length === 0)
    })

    this.assignVariableToObject(this.xpuiModifier, element, `${this.apiVariable}.SubMenu`);
  }

  async injectPopup() {
    const popupElement = this.xpuiReactElements.find(reactElement => {
      const identifiers = deepSearch(reactElement, (obj) => obj?.type === 'Identifier').map(obj => obj?.name);
      return (difference(['isOpen', 'contentLabel', 'children', 'className', 'overlayClassName', 'animated', 'animation'], identifiers).length === 0)
    })

    this.assignVariableToObject(this.xpuiModifier, popupElement, `${this.apiVariable}.GenericModal`);
  }

  async injectGetShowFeedback() {
    const variableDeclarator = deepSearch(this.xpuiModifier.parsed['body'],
      (obj) => {
        obj?.type === 'VariableDeclarator' && obj?.init?.type === 'SequenceExpression'
        const objectExpressions = deepSearch(obj.init?.expressions?.[1], (obj) => obj?.type === 'ObjectExpression', 10);
        return objectExpressions.some(exp => {
          const params = exp.properties.map((prop: any) => prop.key.name);
          return difference(['hide', 'show', 'msTimeout'], params).length === 0;
        });
      }
    )[0]

    this.assignVariableToObject(this.xpuiModifier, variableDeclarator, `${this.apiVariable}.getShowFeedback`);
  }

  async injectPlatform() {
    const somePlatformProps = ['version', 'container', 'operatingSystem', 'isDeveloperMode'];

    // Looks for an object that has all of react's properties.
    const platformObjectExpression = deepSearch(this.xpuiModifier.parsed['body'], (obj) => obj?.type === 'ObjectExpression').find((obj) => {
      const objProps = obj.properties.map((prop: any) => prop.key.name);
      return somePlatformProps.every((prop: string) => objProps.includes(prop));
    });

    await this.assignVariableToObject(this.xpuiModifier, platformObjectExpression, `${this.apiVariable}.platform`);
  }

  async injectReact() {
    const reactProps = ['Children', 'createRef', 'Component', 'PureComponent', 'createContext', 'forwardRef', 'lazy', 'memo', 'useCallback', 'useContext', 'useEffect', 'useImperativeHandle', 'useDebugValue', 'useLayoutEffect', 'useMemo', 'useReducer', 'useRef', 'useState', 'Fragment', 'Profiler', 'StrictMode', 'Suspense', 'unstable_SuspenseList', 'createElement', 'cloneElement', 'createFactory', 'isValidElement', 'version', 'unstable_withSuspenseConfig', '__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED'];

    // Looks for an object that has all of react's properties.
    const reactObjectExpression = deepSearch(this.vxpuiModifier.parsed['body'], (obj) => obj?.type === 'ObjectExpression').find((obj) => {
      return isEqual(obj.properties.map((prop: any) => prop.key.name), reactProps);
    });

    await this.assignVariableToObject(this.vxpuiModifier, reactObjectExpression, `${this.apiVariable}.React`);
  }

  async injectReactDOM() {
    const reactDOMProps = ['createPortal', 'findDOMNode', 'hydrate', 'render', 'unstable_renderSubtreeIntoContainer', 'unmountComponentAtNode', 'unstable_createPortal', 'unstable_batchedUpdates', 'unstable_interactiveUpdates', 'unstable_discreteUpdates', 'unstable_flushDiscreteUpdates', 'flushSync', 'unstable_createRoot', 'unstable_createSyncRoot', 'unstable_flushControlled', '__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED'];

    // Looks for an object that has all of react-dom's properties.
    const reactDOMObjectExpression = deepSearch(this.vxpuiModifier.parsed['body'], (obj) => obj?.type === 'ObjectExpression').find((obj) => {
      return isEqual(obj.properties.map((prop: any) => prop.key.name), reactDOMProps);
    });

    this.assignVariableToObject(this.vxpuiModifier, reactDOMObjectExpression, `${this.apiVariable}.ReactDOM`);
  }

  async injectSPInit() {
    const spApiInitializer = (await fs.readFile(path.join(__dirname, '../../files/SPApiInitializer.js'))).toString();
    this.xpuiModifier.insert(0, 0, spApiInitializer);
  }

  private assignVariableToObject(jsModifier: JSModifyManager, obj: any, variable: string) {
    switch (obj.type) {
      case 'VariableDeclarator': {
        const insertLoc = obj.id.loc.end;
        return jsModifier.insert(insertLoc.line - 1, insertLoc.column, `=${variable}`);
      }
      case 'Property': {
        const insertLoc = obj.value.loc.start;
        return jsModifier.insert(insertLoc.line - 1, insertLoc.column, `${variable}=`);
      }
      case 'ObjectExpression': {
        const insertLoc = obj.loc.start;
        return jsModifier.insert(insertLoc.line - 1, insertLoc.column, ` ${variable}=`);
      }
    }
  }

  static getReactElements(parsedBody: any) {
    return deepSearch(parsedBody,
      (obj) => {
        if (obj?.type === 'VariableDeclarator' || obj?.type === 'Property') {
          let blockStatement;
          switch (obj.type) {
            case 'VariableDeclarator': {
              blockStatement = obj?.init?.body || obj?.init?.arguments?.[0]?.body;
              break;
            }
            case 'Property': {
              blockStatement = obj?.value?.body || obj?.value?.arguments?.[0]?.body;
              break;
            }
          }

          if (blockStatement?.type !== 'BlockStatement' || blockStatement.body[blockStatement.body.length - 1]?.type !== 'ReturnStatement') {
            return false;
          }

          const returnStatement = blockStatement.body[blockStatement.body.length - 1];

          return deepSearch(returnStatement, (obj) => obj?.type === 'CallExpression' && obj?.callee?.property?.name === 'createElement', 10).length >= 1;
        }
        return false;
      }
    );
  }
}

export default XpuiInjector;