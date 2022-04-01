import { isEqual } from "lodash";
import SPApi, { ReactEmitterEvents } from "../SPApi";
import copyArrayToArray from "../utils/copyArrayToArray";
import deepSearch from "../utils/deepSearch";
import menuFilters from "./menuFilters";
import MenuItem, { IMenuItemOptions } from "./menuItem";

class Menu {
  menuFilters = menuFilters;
  preContextmenuPath: string[] = [];
  afterContextmenuPath: string[] = [];
  menuItems: MenuItem[] = [];
  private _patchedMenuRender = false;

  createMenuItem(
    name: any,
    onClick: (event: any, menuItem: MenuItem) => void,
    options?: IMenuItemOptions
  ) {
    return new MenuItem(this, name, onClick, options);
  }

  patch(SPApi: SPApi) {
    const { ui } = SPApi;

    SPApi.reactEmitter.on("onReactCreateElement", (args) => {
      if (args[0] === ui.reactComponents.Menu) {
        const newArgs = [
          ...args,
          ...this.menuItems.map((menuItem) => menuItem.createElement(SPApi)),
        ];
        copyArrayToArray(args, newArgs);
      }
    });

    SPApi.reactEmitter.on("onElementPath", (path) => {
      const contextmenuIndex = path.findIndex((p) => p === "contextmenu");
      if (contextmenuIndex !== -1) {
        this.preContextmenuPath = path.slice(0, contextmenuIndex);
        this.afterContextmenuPath = path.slice(contextmenuIndex + 1);
      }
    });

    const onWillMount: ReactEmitterEvents["onReactComponentWillMount"] = (
      _this,
      args
    ) => {
      if (
        _this?.state &&
        isEqual(Object.keys(_this?.state), ["error", "info"])
      ) {
        SPApi.reactEmitter.removeListener(
          "onReactComponentWillMount",
          onWillMount
        );
        SPApi.modules.Patcher.after(
          "SPApi",
          Object.getPrototypeOf(_this),
          "render",
          (_this: any, args: any[], ret: any) => {
            if (this.menuItems.length > 0) {
              const reactMenuItems = deepSearch(
                _this?.props?.children?.props?.children || {},
                (obj) => obj?.className === "SPApiMenuItem",
                10
              );
              reactMenuItems.forEach((reactMenuItem) => {
                const menuFilter = (0, eval)(reactMenuItem["data-menuFilter"]);
                if (
                  !menuFilter(
                    this.preContextmenuPath,
                    this.afterContextmenuPath
                  )
                ) {
                  reactMenuItem.style.display = "none";
                  reactMenuItem.className = "SPApiMenuItemDone";
                }
              });
            }

            return ret;
          }
        );
      }
    };

    SPApi.reactEmitter.on("onReactComponentWillMount", onWillMount);
  }
}

export default Menu;
