import React, { useEffect } from "react";
import { loadModules } from "esri-loader";

interface LayerListProps {
  view: __esri.MapView;
  map: __esri.Map;
}

const LayerList: React.FC<LayerListProps> = ({ view, map }) => {
  useEffect(() => {
    let layerList: __esri.LayerList;
    let viewshedLayer: __esri.GraphicsLayer;

    loadModules([
      "esri/widgets/LayerList",
      "esri/layers/GraphicsLayer",
      "esri/Graphic",
    ])
      .then(([LayerList, GraphicsLayer, Graphic]) => {
        // Initialize the viewshed layer
        viewshedLayer = new GraphicsLayer({ title: "Viewsheds" });

        // Add the viewshed layer to the map
        map.add(viewshedLayer);

        // Create and add the LayerList widget
        layerList = new LayerList({
          view,
          container: "layerListDiv", // Place the widget in the specified div
        });

        // Example viewshed creation (this is just a placeholder)
        const createViewshed = (point: __esri.Point) => {
          const viewshed = new Graphic({
            geometry: point,
            symbol: {
              type: "simple-fill",
              color: [150, 150, 150, 0.4],
              outline: {
                color: [255, 255, 255],
                width: 1,
              },
            },
          });

          viewshedLayer.add(viewshed);
        };

        // Example point for creating a viewshed
        createViewshed({
          type: "point",
          latitude: 34.0522,
          longitude: -118.2437,
        } as __esri.Point);
      })
      .catch((err) => console.error("Failed to load modules:", err));

    return () => {
      // Clean up the LayerList and viewshedLayer when the component unmounts
      if (layerList) {
        layerList.destroy();
      }
      if (viewshedLayer) {
        viewshedLayer.removeAll();
      }
    };
  }, [view, map]);

  return <div id="layerListDiv" style={{ height: "100%", width: "100%" }} />;
};

export default LayerList;
