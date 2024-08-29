export interface IUserInterfaceConfig {
  elementVisibility: {
    showSecurityBanner: boolean;
    showPannel: boolean;
    showCustomToolbox: boolean;
  };
  elementPositioning: {
    panelPosition: "left" | "right";
    esriToolboxPosition: "left" | "right";
    customToolboxPosition: "left" | "right" ;
  };
  theming: {
    theme: "light" | "dark";
  };
}