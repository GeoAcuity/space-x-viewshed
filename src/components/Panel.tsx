import React, { useState, useCallback, useEffect } from "react";
import "./Panel.scss";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { IconButton } from "@mui/material";
import { IAppConfig } from "../types/IAppConfig";


// --Component Imports
import Buttons from "./Buttons";
import Tabbing from "./Tabbing";


interface IProps {
  position: "right" | "left";
  config: IAppConfig;
}

const Panel: React.FC<IProps> = ({ position, config }) => {
  const [width, setWidth] = useState(400); // Initial width
  const [isResizing, setIsResizing] = useState(false);
  const [lastDownX, setLastDownX] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setLastDownX(e.clientX);
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth =
        position === "right"
          ? width + (lastDownX - e.clientX) // Moving the mouse left decreases the width
          : width + (e.clientX - lastDownX); // Moving the mouse right increases the width

      if (newWidth > 400 && newWidth < 1100) {
        setWidth(newWidth);
        setLastDownX(e.clientX); // Update lastDownX for continuous resizing
      }
    },
    [isResizing, lastDownX, width, position]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };
  const panelClass = `panel ${position} ${isCollapsed ? "collapsed" : ""}`;

  return (
    <div
      className={panelClass}
      style={{ width: isCollapsed ? "40px" : `${width}px` }}
    >
      <IconButton className="collapse-button" onClick={toggleCollapse}>
        {isCollapsed ? (
          position === "right" ? (
            <ChevronLeftIcon />
          ) : (
            <ChevronRightIcon />
          )
        ) : position === "right" ? (
          <ChevronRightIcon />
        ) : (
          <ChevronLeftIcon />
        )}
      </IconButton>

      {!isCollapsed && (
        <div className={`resizer ${position}`} onMouseDown={handleMouseDown} />
      )}
        {!isCollapsed && <Buttons tabsConfig={config.component.tabs} buttonsConfig={config.component.buttons} />}
      {/* {!isCollapsed && <Tabbing />} */}
      {!isCollapsed && (
        <>
          <div className="placeholder">ACCORDION</div>
        </>
      )}
    </div>
  );
};

export default Panel;
