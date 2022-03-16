import MenuItem from "./menuItem";

class UI {
  MenuItem = MenuItem;

  constructor(
    private React: any,
    private ReactDOM: any,
    private functions: any,
    public reactComponents: any,
    public namedComponents: any
  ) { }

  showFeedback(message: string, feedbackType: "NOTICE" | "ERROR" = "NOTICE", duration: number = 2500, errorKey: any) {
    this.functions.getShowFeedback({
      message,
      feedbackType,
      msTimeout: duration,
      errorKey,
    });
  }

  createPopup(children: any) {
    let genericModalContainer = document.createElement("div");

    this.ReactDOM.render(this.React.createElement(this.reactComponents.GenericModal, {
      isOpen: true,
      contentLabel: 'user.edit-details.title',
      onRequestClose: (e: any) => e.target.remove(),
    },
      children
    ), genericModalContainer);

    genericModalContainer.remove();
  }

  onReactCreateElement(args: any) {
    return MenuItem.onReactCreateElement(this.React, this, args);
  }
}

export default UI;