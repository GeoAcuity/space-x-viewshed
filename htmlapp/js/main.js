require([
  "esri/Map",
  "esri/views/SceneView",
  "esri/geometry/SpatialReference",
  "esri/analysis/ViewshedAnalysis",
  "esri/analysis/Viewshed",
  "esri/layers/IntegratedMeshLayer",
  "esri/layers/FeatureLayer",
  "esri/widgets/LayerList",
  "esri/core/reactiveUtils"
], function(Map, SceneView, SpatialReference, ViewshedAnalysis, Viewshed, IntegratedMeshLayer, FeatureLayer, LayerList, reactiveUtils) {

    let viewsheds = [];
    let viewshedAnalysis;
    let areViewshedsVisible = true; // Track visibility state
    const listNode = document.getElementById("cameraList");

    const featureLayer = new FeatureLayer({
      url: "https://services9.arcgis.com/pr9h1zugi5DEn134/arcgis/rest/services/Bastrop_Exterior_Cameras/FeatureServer/3",
      elevationInfo: {
        mode: "absolute-height",
        featureExpressionInfo: {
          expression: "$feature.Elevation_m"
        },
        unit: "meters"
      },
      popupTemplate: {
        title: "{devicename}",
        content: "<b>Device ID:</b> {deviceid}<br><b>Location:</b> {location}<br><b>Elevation:</b> {Elevation_m} meters"
      }
    });

    // Query features and create viewsheds
    featureLayer.queryFeatures().then(function(response) {
      convertFeatureSetToRows(response);

      const features = response.features;
      features.forEach(function(feature) {
        const viewshed = new Viewshed({
          observer: {
            x: feature.geometry.x,
            y: feature.geometry.y,
            z: feature.attributes.Elevation_m
          },
          farDistance: feature.attributes.fardistance_m,
          tilt: feature.attributes.Tilt,
          heading: feature.attributes.cameraheading,
          horizontalFieldOfView: feature.attributes.horizontalfieldofview_viewshed_,
          verticalFieldOfView: feature.attributes.verticalfieldofview
        });
        viewsheds.push(viewshed);
      });

      // Initialize ViewshedAnalysis after creating viewsheds
      viewshedAnalysis = new ViewshedAnalysis({
        viewsheds: viewsheds
      });

      view.analyses.add(viewshedAnalysis);
      console.log(viewshedAnalysis)
      view.whenAnalysisView(viewshedAnalysis).then(analysisView => {
        // analysisView.interactive = true;
        // analysisView.visible = false;
        analysisView.selectedViewshed = viewsheds[0]; // Set default viewshed
        analysisView.visible = true;
      });
    });

    const view = new SceneView({
      container: "viewDiv",
      camera: {
        position: {
          x: -97.4059591,
          y: 30.1521249,
          z: 700.477
        },
        heading: 1.2311944909542853,
        tilt: 45
      },
      map: new Map({
        basemap: "gray",
        // ground: "world-elevation",
        layers: [
          new IntegratedMeshLayer({
            url: "https://tiles.arcgis.com/tiles/pr9h1zugi5DEn134/arcgis/rest/services/Bastrop_3D_03MAR2024/SceneServer",
            elevationInfo: {
              mode: "absolute-height",
              offset: 24
            }
          }),
          featureLayer
          
        ]
      }),
    });

    const layerList = new LayerList({
      view: view
    });

    view.ui.add(layerList, {
      position: "top-right"
    });

    const onCameraClickHandler = (event) => {
      const target = event.target;
      const resultId = target.getAttribute("value");
      const selectedViewshed = viewsheds[parseInt(resultId, 10)];

      if (selectedViewshed) {
        view.goTo({
          target: selectedViewshed.observer,
          scale: 600
        })
        .then(() => {
          viewshedAnalysis.viewsheds = [selectedViewshed];
        })
        .catch((error) => {
          if (error.name !== "AbortError") {
            console.error(error);
          }
        });
      }
    };

    const convertFeatureSetToRows = (response) => {
        listNode.innerHTML = "";

      const graphics = response.features;
      graphics.forEach((result, index) => {
        const attributes = result.attributes;
        const name = attributes.devicename;

        const item = document.createElement("calcite-list-item");
        item.setAttribute("label", name);
        item.setAttribute("value", index);
        item.addEventListener("click", onCameraClickHandler);
        document.getElementById("cameraList").appendChild(item);
      });
    };   
 
    // Function to toggle viewsheds
    const toggleViewsheds = () => {
      if (areViewshedsVisible) {
        viewshedAnalysis.viewsheds = [];
        document.getElementById("toggleViewsheds").innerText = "Show All Viewsheds";
   
      } else {
        viewshedAnalysis.viewsheds = viewsheds;
        document.getElementById("toggleViewsheds").innerText = "Hide All Viewsheds";
        view.goTo({
          scale: 3000
        })
      }
      areViewshedsVisible = !areViewshedsVisible;
      console.log(`Viewsheds visibility: ${areViewshedsVisible ? 'Visible' : 'Hidden'}`); // Debug log
    };

    // Add event listener for the toggle button
    document.getElementById("toggleViewsheds").addEventListener("click", toggleViewsheds);
  });
