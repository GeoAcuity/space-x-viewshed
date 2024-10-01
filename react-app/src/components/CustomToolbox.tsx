import "./CustomToolbox.scss";
import { useState } from "react";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import DrawIcon from "@mui/icons-material/Draw";
import PrintIcon from "@mui/icons-material/Print";
import GridViewIcon from "@mui/icons-material/GridView";

interface IProps {
    position: 'left' | 'right';
  }
  

const CustomToolbox : React.FC<IProps> = ({ position }) => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const tools = [
    { text: "basemap", icon: <GridViewIcon /> },
    { text: "draw", icon: <DrawIcon /> },
    { text: "print", icon: <PrintIcon /> },
  ];

  const togglePanelVisibility = (id: string) => {
    setActiveTool(activeTool === id ? null : id);
  };

  return (
    <div className={`custom-toolbox-container ${position}`}>
      <Stack direction="row" spacing={1}>
        {tools.map((item) => (
          <span key={item.text}>
            <IconButton
              sx={{ padding: "2px" }}
              onClick={() => togglePanelVisibility(item.text)}
              className="custom-toolbox-icons"
              //   className={`agc-icon ${activeTool === item.text ? "active" : ""}`}
            >
              {item.icon}
            </IconButton>
          </span>
        ))}
      </Stack>
    </div>
  );
};

export default CustomToolbox;
