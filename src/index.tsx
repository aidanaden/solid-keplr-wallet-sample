/* @refresh reload */
import "./index.css";
import { render } from "solid-js/web";

import App from "./App";
import { StoreProvider } from "./store";

render(
  () => (
    <StoreProvider>
      <App />
    </StoreProvider>
  ),
  document.getElementById("root") as HTMLElement
);
