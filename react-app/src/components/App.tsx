import { useState, useEffect } from "react";
import "./App.scss";
import { Login } from "../helpers/Login";
import SecurityBanner from "./SecurityBanner";
import Header from "./Header";
import { Map } from "./Map";
import { IAppConfig } from "../types/IAppConfig";
import { IUserInterfaceConfig } from "../types/IUserInterfaceConfig";
import { IUser } from "../types/IUser";

interface IProps {
  config: IAppConfig;
  uiConfig: IUserInterfaceConfig;
}

const App = (props: IProps) => {
  const [user, setUser] = useState<IUser>({
    username: "",
    fullName: "",
    email: "",
  });

  // Runs once on startup to login the user and get their user info
  useEffect(() => {
    Login(props.config.app.appId, props.config.app.portalUrl).then(setUser);

  }, []);

  const bannersVisible = props.uiConfig.elementVisibility.showSecurityBanner;
  // If bannersVisible is true, use the default layout including space for both banners
  // If bannersVisible is false, use the layout that excludes space for both banners
  const appClass = bannersVisible ? "app" : "app no-banners";


  return (
    <div className={appClass}>
      {/* wait until the username is loaded, then display the map. */}
      {user.username && (
          <>
          {bannersVisible && (
            <>
              <SecurityBanner config={props.config} />
              <SecurityBanner config={props.config} />
            </>
          )}
          <Header config={props.config} user={user} />
          <Map config={props.config} uiConfig={props.uiConfig} />
        </>
      )}
    </div>
  );
};

export default App;
