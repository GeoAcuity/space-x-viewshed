import "./SecurityBanner.scss";
import { IAppConfig } from "../types/IAppConfig";

interface IProps {
    config: IAppConfig;
}
  
const SecurityBanner = (props: IProps) => {
  return (
    <div className="banner">{props.config.app.bannerText}</div>
  );
};

export default SecurityBanner;
