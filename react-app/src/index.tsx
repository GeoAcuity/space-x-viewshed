import "./styles/themes.scss";
import App from "./components/App";
import reportWebVitals from "./reportWebVitals";
import { createRoot } from "react-dom/client";
import esriConfig from "@arcgis/core/config.js";
import { IAppConfig } from "./types/IAppConfig";
import { IUserInterfaceConfig } from "./types/IUserInterfaceConfig";

esriConfig.assetsPath = "./assets";

const esriThemes = async (theme: "light" | "dark") => {
  if (theme === "dark") {
    require("@arcgis/core/assets/esri/themes/dark/main.css");
  } else {
    require("@arcgis/core/assets/esri/themes/light/main.css");
  }
};

interface IProps {
  config: IAppConfig;
  uiConfig: IUserInterfaceConfig;
}

// This loads the contents of public/config.json
// into a JSON object and passes it into App as the config property
const { search } = window.location;
const configParamRegex = /config=([\w-]+)/;
const configFile = search.match(configParamRegex)
  ? RegExp.$1 + ".json"
  : "./config.json";
const uiConfigFile = search.match(configParamRegex)
  ? RegExp.$1 + ".json"
  : "./web-config-ui.json";
// const [theme, setTheme] = useState<"light" | "dark">("light");



fetch(configFile)
  .then((r) => r.json())
  .then((json) => {
    let config = json;
    fetch(uiConfigFile)
      .then((r) => r.json())
      .then((json) => {
        let uiConfig = json;
        console.log(uiConfig);
        const configuredTheme = uiConfig.theme || "light";
        document.body.className = `theme-${configuredTheme}`;
        // setTheme(configuredTheme);
        esriThemes(configuredTheme);
        const root = createRoot(document.getElementById("root")!);
        root.render(<App config={config} uiConfig={uiConfig} />);
      });
  });

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
