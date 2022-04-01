import Menu from "./menu";
import TopBarButton, { ITopBarButtonOptions } from "./topBarButton";

class UI {
  menu = new Menu();

  constructor(
    private React: any,
    private ReactDOM: any,
    private functions: any,
    public reactComponents: any,
    public namedComponents: any
  ) {}

  showFeedback(
    message: string,
    feedbackType: "NOTICE" | "ERROR" = "NOTICE",
    duration: number = 2500,
    errorKey: any
  ) {
    this.functions.getShowFeedback({
      message,
      feedbackType,
      msTimeout: duration,
      errorKey,
    });
  }

  createTopBarButton(child: any, options?: ITopBarButtonOptions) {
    return new TopBarButton(this.ReactDOM, child, options);
  }

  createPopup(children: any) {
    let genericModalContainer = document.createElement("div");

    this.ReactDOM.render(
      this.React.createElement(
        this.reactComponents.GenericModal,
        {
          isOpen: true,
          contentLabel: "user.edit-details.title",
          onRequestClose: (e: any) => e.target.remove(),
        },
        children
      ),
      genericModalContainer
    );

    genericModalContainer.remove();
  }
}

export default UI;
