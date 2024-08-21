import React from "react";
import "./Header.scss";
import Avatar from "@mui/material/Avatar";
import HelpIcon from "@mui/icons-material/Help";
import mainLogo from "../components/images/logo.png";
import { IUser } from "../types/IUser";
import { IAppConfig } from "../types/IAppConfig";

interface IProps {
  config: IAppConfig;
  user: IUser;
}

const Header = (props: IProps) => {
  const { fullName } = props.user;

  return (
    <div className="header">
      <div className="left-content">
        <img className="logo" alt="Default Logo" src={mainLogo} />
        <div className="title">{props.config.app.webAppTitle}</div>
      </div>
      <div className="right-content">
        <Avatar className="avatar" />
        <div>{fullName}</div>
        {<HelpIcon className="help-icon"/>}
      </div>
    </div>
  );
};

export default Header;
