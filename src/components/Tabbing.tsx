import "./Tabbing.scss";

import React, { forwardRef, useImperativeHandle, useState } from "react";
import { Tab, Tabs } from "@mui/material";

interface IProps {
  tabsConfig: string[];
}

interface TabOption {
  label: string;
}

const Tabbing: React.FC<IProps> = ({ tabsConfig }) => {
  const tabOptions: Record<string, TabOption> = {
    Draw: { label: "Draw" },
    Search: { label: "Search" },
    CoordEntry: { label: "Coord Entry" },
    AddData: { label: "Add Data" },
  };
  const [value, setValue] = React.useState("one");

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };


  return (
    <Tabs className="tab-container" value={value} onChange={handleChange}>
      {tabsConfig.map((key, index) => {
        const tab = tabOptions[key];
        return tab ? (
          <Tab key={index} label={tab.label} value={tab.label} />
        ) : null;
      })}
    </Tabs>
  );
};

export default Tabbing;
