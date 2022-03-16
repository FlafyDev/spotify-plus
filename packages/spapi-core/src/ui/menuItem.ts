import UI from './ui';

interface MenuItemOptions {
  divider?: "before" | "after" | "both" | "";
  disabled?: boolean,
  toggle?: boolean
  icon?: any,
}

class MenuItem {
  public static registers: MenuItem[] = [];
  constructor(
    public name: string | any,
    public onClick: (event: any, menuItem: MenuItem) => void,
    public options: MenuItemOptions = {},
  ) {
    if (options.divider === undefined)
      options.divider = "";
  }

  register() {
    MenuItem.registers.push(this);
  }

  unregister() {
    MenuItem.registers = MenuItem.registers.filter(item => item !== this);
  }

  static onReactCreateElement(React: any, ui: UI, args: any) {
    if (args[0] === ui.reactComponents.Menu) {
      args = [...args, ...this.registers.map(menuItem => {
        return React.createElement(ui.reactComponents.MenuItem, {
          name: menuItem.name,
          divider: menuItem.options.divider,
          disabled: menuItem.options.disabled,
          icon: menuItem.options.icon,
          ['aria-checked']: menuItem.options.toggle,
          onClick: (e: any) => menuItem.onClick(e, menuItem),
        }, menuItem.name);
      })];
    }
    return args;
  }
}

export { MenuItemOptions };
export default MenuItem;