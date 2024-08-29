import React, { useState } from "react";
import { Button, Card, CardContent, Typography } from "@mui/material";
import "./ViewshedPanel.scss";

interface ViewshedPanelProps {
  onCreateViewshed: () => void;
  onCancelViewshed: () => void;
}

const ViewshedPanel: React.FC<ViewshedPanelProps> = ({
  onCreateViewshed,
  onCancelViewshed,
}) => {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateClick = () => {
    onCreateViewshed();
    setIsCreating(true);
  };

  const handleCancelClick = () => {
    onCancelViewshed();
    setIsCreating(false);
  };

  return (
    <Card className="viewshed-panel">
      <CardContent>
        <Button
          id="createButton"
          variant="contained"
          onClick={handleCreateClick}
          sx={{ display: !isCreating ? "flex" : "none", marginBottom: 1 }}
        >
          Create viewshed
        </Button>
        <Button
          id="cancelButton"
          variant="outlined"
          onClick={handleCancelClick}
          sx={{ display: isCreating ? "flex" : "none", marginBottom: 1 }}
        >
          Cancel
        </Button>
        <Typography
          id="promptText"
          variant="body2"
          sx={{ display: isCreating ? "flex" : "none", marginTop: 2 }}
        >
          <em>
            Start the analysis by clicking in the scene to place the observer
            point and set the target.
          </em>
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ViewshedPanel;
