import "./Map.scss";
import { useRef, useEffect, useState  } from "react";
import esriConfig from "@arcgis/core/config";
import WebScene from "@arcgis/core/WebScene";
import SceneView from "@arcgis/core/views/SceneView";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Viewshed from "@arcgis/core/analysis/Viewshed";
import ViewshedAnalysis from "@arcgis/core/analysis/ViewshedAnalysis";
import { IUserInterfaceConfig } from "../types/IUserInterfaceConfig";
import { IAppConfig } from "../types/IAppConfig";
import ViewshedPanel from "./ViewshedPanel"; 
import Panel from "./Panel";

interface Props {
  uiConfig: IUserInterfaceConfig;
  config: IAppConfig;
}

const featureLayer = new FeatureLayer({
  url: "https://services6.arcgis.com/nV1fU1SoaIYplaVX/arcgis/rest/services/All_Exterior_Cameras_Test_Data/FeatureServer/0",
});
// const groundHeight = feature.attributes.locationheight || 0; // Replace with actual attribute for ground height if needed

export const Map = (props: Props) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const webSceneRef = useRef<WebScene | null>(null);
  const sceneViewRef = useRef<SceneView | null>(null);
  const [viewshedAnalysis, setViewshedAnalysis] = useState<ViewshedAnalysis | null>(null);

  // Set the portal URL if it is provided
  useEffect(() => {
    if (props.config.app.portalUrl !== "") {
      esriConfig.portalUrl = props.config.app.portalUrl;
    }
  }, [props.config.app.portalUrl]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    // Create a WebScene and SceneView
    const webScene = new WebScene({
      portalItem: {
        id: props.config.map.itemId,
      },
    });

    const view = new SceneView({
      map: webScene,
      container: mapRef.current!,
      // center: [-97.4, 30.1551083],
      // zoom: 60,
      // camera: {
      //   position: {
      //     x: -97.4,
      //     y: 30.1551083,
      //     z: 995.4546383377165,
      //   },
      //   heading: 1.2311944909542853,
      //   tilt: 60,
      // },
    });

    webSceneRef.current = webScene;
    sceneViewRef.current = view;

    view.when(async () => {
      try {
        const response = await featureLayer.queryFeatures();
        const features = response.features;

        features.forEach((feature) => {
          const viewshed = new Viewshed({
            observer: {
              x: feature.attributes.x,
              y: feature.attributes.y,
              z: feature.attributes.locationheight,
            },
            farDistance: 150,
            tilt: feature.attributes.camerapitch,
            heading: feature.attributes.cameraheading,
            horizontalFieldOfView: feature.attributes.horizontalfieldofview,
            verticalFieldOfView: feature.attributes.verticalfieldofview,
          });

          const newViewshedAnalysis = new ViewshedAnalysis({
            viewsheds: [viewshed],
          });

          view.analyses.add(newViewshedAnalysis);
          setViewshedAnalysis(newViewshedAnalysis);
        });
      } catch (error) {
        console.error(
          "Error querying features or creating viewshed analysis:",
          error
        );
      }
    });

    return () => {
      if (sceneViewRef.current) {
        sceneViewRef.current.destroy();
      }
    };
  }, [props.config.map.itemId]);
// Function to create a new viewshed
  const createViewshed = () => {
    if (sceneViewRef.current && viewshedAnalysis) {
      // Allow the user to interactively create viewsheds
      sceneViewRef.current.whenAnalysisView(viewshedAnalysis).then(analysisView => {
        analysisView.interactive = true;
        analysisView.createViewsheds();
      });
    }
  };

  // Function to cancel the viewshed creation
  const cancelViewshed = () => {
    if (sceneViewRef.current && viewshedAnalysis) {
      sceneViewRef.current.whenAnalysisView(viewshedAnalysis).then(analysisView => {
        analysisView.interactive = false;
      });
    }
  };
  return (
    <div className="map-component">
      <div ref={mapRef}></div>
      <ViewshedPanel
        onCreateViewshed={createViewshed}
        onCancelViewshed={cancelViewshed}
      />
       <Panel position={props.uiConfig.elementPositioning.panelPosition} config={props.config} />
    </div>
  );
};
