import { v4 as uuidV4 } from "uuid";

interface ITopBarButtonOptions {
  disabled?: boolean;
}

class TopBarButton {
  public static forwardButton: Element | null = null;
  public id;
  public disabled;
  private _element?: Element;
  get element() {
    return this._element;
  }

  constructor(
    private ReactDOM: any,
    public child: any = null,
    options: ITopBarButtonOptions = {}
  ) {
    this.id = uuidV4();
    this.disabled = options.disabled || false;
  }

  async register() {
    this.unregister();
    while (!TopBarButton.forwardButton) {
      TopBarButton.forwardButton = document.querySelector(
        '[data-testid="top-bar-forward-button"]'
      );
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    this._element = TopBarButton.forwardButton.cloneNode(false) as Element;
    this._element.id = this.id;
    this.disabled
      ? this._element.setAttribute("disabled", "")
      : this._element.removeAttribute("disabled");
    const buttonDiv = document.createElement("div");
    this._element.appendChild(buttonDiv);
    this.ReactDOM.render(this.child, buttonDiv);

    TopBarButton.forwardButton.parentNode?.insertBefore(
      this._element,
      TopBarButton.forwardButton.nextSibling
    );
  }

  unregister() {
    if (this._element) {
      this._element.remove();
    }
  }
}

export { ITopBarButtonOptions };
export default TopBarButton;
