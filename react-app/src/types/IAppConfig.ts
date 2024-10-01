export interface IAppConfig {
  app: {
    portalUrl: string;
    appId: string;
    webAppTitle: string;
    bannerText: string;
  }
  map: { itemId: string };
  component: {
    esriToolbox: string[];
    buttons: string[];
    tabs: string[];
  }
}
