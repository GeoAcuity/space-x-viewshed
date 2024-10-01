import "./Buttons.scss";

// -- MUI Imports
import { styled } from "@mui/material/styles";
import { Stack, IconButton, Tooltip } from "@mui/material";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import Badge, { BadgeProps } from "@mui/material/Badge";

// -- React
import React, { useState } from "react";

// -- Product Library Components
import Tabbing from "./Tabbing";

interface IProps {
  buttonsConfig: string[];
  tabsConfig: string[];
}

interface ButtonOption {
  icon: JSX.Element;
  tooltip: string;
  panelContent: JSX.Element;
}

const Buttons: React.FC<IProps> = ({ buttonsConfig, tabsConfig }) => {
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const handleClick = (buttonKey: string) => {
    setActiveButton(activeButton === buttonKey ? null : buttonKey);
  };

  const buttonOptions: Record<string, ButtonOption> = {
    Search: {
      icon: <TravelExploreIcon />,
      tooltip: "Search",
      panelContent: <Tabbing tabsConfig={tabsConfig}  />,
    },
    Cart: {
      icon: <ShoppingCartIcon />,
      tooltip: "Cart",
      panelContent: <div>Cart Panel Content</div>,
    },
    Filter: {
      icon: <FilterAltIcon />,
      tooltip: "Filter",
      panelContent: <div>Filter Panel Content</div>, // Replace with your actual panel component

    }
  };

  const StyledBadge = styled(Badge)<BadgeProps>(({ theme }) => ({
    "& .MuiBadge-badge": {
      top: 2,
      right: -5,
      padding: "2px 4px",
    },
  }));

  return (
    <div>
      <Stack className="button-container">
        {buttonsConfig.map((buttonKey) => {
          const item = buttonOptions[buttonKey];
          return item ? (
            <Tooltip key={buttonKey} title={item.tooltip} arrow>
              <IconButton
                className={activeButton === buttonKey ? "active-button" : "inactive-button"}
                onClick={() => handleClick(buttonKey)}
              >
                {item.icon}
              </IconButton>
            </Tooltip>
          ) : null;
        })}
      </Stack>
      {activeButton && (
        <div>
          {buttonOptions[activeButton].panelContent}
        </div>
      )}
    </div>
  );
};

export default Buttons;
