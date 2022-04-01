import SPApi from "../SPApi";
import Menu from "./menu";
import menuFilters, { MenuFilter } from "./menuFilters";

enum MenuItemDivider {
  None = "",
  Before = "before",
  After = "after",
  Both = "both",
}

interface IMenuItemOptions {
  divider?: MenuItemDivider;
  menuFilter?: MenuFilter;
  disabled?: boolean;
  toggle?: boolean;
  icon?: any;
}

class MenuItem {
  public divider: MenuItemDivider;
  public menuFilter: MenuFilter;
  public disabled: boolean;
  public toggle: boolean;
  public icon: any;

  constructor(
    public menu: Menu,
    public name: string | any,
    public onClick: (event: any, menuItem: MenuItem) => void,
    options: IMenuItemOptions = {}
  ) {
    this.divider = options.divider || MenuItemDivider.None;
    this.menuFilter = options.menuFilter || menuFilters.Any;
    this.disabled = options.disabled || false;
    this.toggle = options.toggle || false;
    this.icon = options.icon;
  }

  register() {
    this.unregister();
    this.menu.menuItems.push(this);
  }

  unregister() {
    this.menu.menuItems = this.menu.menuItems.filter(
      (menuItem) => menuItem !== this
    );
  }

  createElement(SPApi: SPApi) {
    const {
      modules: { React },
      ui,
    } = SPApi;

    return React.createElement(
      "div",
      {
        style: { display: "contents" },
        className: "SPApiMenuItem",
        "data-menuFilter": this.menuFilter.toString(),
      },
      React.createElement(
        ui.reactComponents.MenuItem,
        {
          name: this.name,
          divider: this.divider,
          disabled: this.disabled,
          icon: this.icon,
          ["aria-checked"]: this.toggle,
          onClick: (e: any) => this.onClick(e, this),
        },
        this.name
      )
    );
  }
}

export { IMenuItemOptions, MenuItemDivider };
export default MenuItem;
