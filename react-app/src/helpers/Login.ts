import { IUser } from "../types/IUser";
import OAuthInfo from "@arcgis/core/identity/OAuthInfo";
import esriId from "@arcgis/core/identity/IdentityManager";
import Portal from "@arcgis/core/portal/Portal";

// Replaces all occurences of backslash with "*" in the string
export const formatDomainUsername = (username: string) => {
  if (username && username.length > 0) {
    username = username.replace(/\\/g, "*");
  }
  return username;
};

export const Login = async (appId: string, portalUrl: string): Promise<IUser> => {
  const info = new OAuthInfo({
    appId,
    portalUrl,
    popup: false,
  });
  esriId.registerOAuthInfos([info]);
  await esriId.getCredential(info.portalUrl + "/sharing", { oAuthPopupConfirmation: false });
  await esriId.checkSignInStatus(info.portalUrl + "/sharing");
  const portal = new Portal({ url: portalUrl });
  portal.authMode = "immediate";
  await portal.load();
  return {
    username: formatDomainUsername(portal.user.username),
    fullName: portal.user.fullName,
    email: portal.user.email,
  };
};
