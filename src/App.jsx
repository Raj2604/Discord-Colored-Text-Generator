import React from "react";
import ReactDOM from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";

import { ColoredTextGenerator } from "./components/ColoredTextGenerator";

const App = () => {
  return (
    <MantineProvider defaultColorScheme="dark">
      <ColoredTextGenerator />
    </MantineProvider>
  );
};

const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

export default App;
