# Config Files Information

## XXXX Items Used by Product Library Web App

- WebApp Admin (Editor) Group
  https://arcgis.com

- WebApp User (Viewer) Group
  https://arcgis.com

- WebApp (Web Mapping Application) OAuth
  https://arcgis.com

## Web Application Json Configuration Files

### Config.json
- public/config.json - defines the following properties used by the application:

```
# src/types/IAppConfig.ts definition:
app: {
      portalUrl: string;	# ArcGIS Online portal url
      appId: string;		# ArcGIS Online application id
    webAppTitle: string;
    bannerText: string;
},
map: {
	itemId: string		# web map portal id
},
component: {
    esriToolbox: string[];
  }
],
```
### Web-config-ui.json
- public/web-config-ui.json - defines the following properties used by the application:
```
# src/types/IAppConIUserInterfaceConfig.ts definition: 

esriToolboxPosition: "left" | "right";
showSecurityBanner: boolean;
panelPosition: "left" | "right";
customToolboxPosition: "left" | "right";
theme: "dark" | "light";
```