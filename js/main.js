require([
  "esri/Map",
  "esri/views/SceneView",
  "esri/geometry/SpatialReference",
  "esri/analysis/ViewshedAnalysis",
  "esri/analysis/Viewshed",
  "esri/layers/IntegratedMeshLayer",
  "esri/layers/FeatureLayer",
  "esri/widgets/LayerList",
   "esri/widgets/Expand",
  "esri/core/reactiveUtils",
  "esri/Graphic",
  "esri/layers/GraphicsLayer",
  "esri/symbols/SimpleMarkerSymbol"
], function(Map, SceneView, SpatialReference, ViewshedAnalysis, Viewshed, IntegratedMeshLayer, FeatureLayer, LayerList, Expand, reactiveUtils,Graphic, GraphicsLayer, SimpleMarkerSymbol) {

    let viewsheds = [];
    let selectedViewsheds = new Set(); 
    selectedViewsheds.clear();
    let viewshedAnalysis;
    let areViewshedsVisible = false; 
    const listNode = document.getElementById("cameraList");

    const featureLayer = new FeatureLayer({
      url: "https://ht-arcgis-app01.spacex.corp/arcgis/sharing/servers/88759b17e8184026ae90c9c092df9dac/rest/services/Bastrop_Exterior_Cameras/FeatureServer",
      elevationInfo: {
        mode: "absolute-height",
        featureExpressionInfo: {
          expression: "$feature.elevation_m_Jun2024"
        },
        unit: "meters"
      },
      popupTemplate: {
        title: "{devicename}{cameraheading}{horizontalfieldofview_viewshed_}{verticalfieldofview}{locationheight}{IP}",
        content:

        function(event) {
          // `event.graphic` holds the feature clicked on the map
          const geometry = event.graphic.geometry;
          const attributes = event.graphic.attributes;
          console.log("Attributes:", attributes);  // Log to see if attributes exist

          // Call the custom showPopup function
          showPopup(geometry, attributes,  false);

          // Return an empty string as the popup content will be handled in the `showPopup` function.
          return""
        }
      }
    });

    const view = new SceneView({
      container: "viewDiv",
      camera: {
        position: {
          x: -97.406953,
          y: 30.149714,
          z: 700.477
        },
        heading: 1.2311944909542853,
        tilt: 45
      },
      map: new Map({
        basemap: "satellite",
        ground: "world-elevation",

        layers: [
          new IntegratedMeshLayer({
            url: "https://ht-arcgis-app01.spacex.corp/arcgis/sharing/servers/b45505e6448945c1bc31cdae21ddd602/rest/services/Bastrop_Factory_3D_3D_Mesh_Clip/SceneServer",
            elevationInfo: {
              mode: "absolute-height",
              offset: 9
            }
          }),
          featureLayer
        ]
      }),

    });

    view.when(function() {
      view.environment = {
        atmosphereEnabled: true,
        starsEnabled: true,
        surfaceColor: '#004C73'  // Set the ground color here
      };
    });
const query = featureLayer.createQuery();
// query.geometry = aoi;
// query.spatialRelationship = "intersects"; // this is the default
query.returnGeometry = true;
    // Query features and create viewsheds
    featureLayer.queryFeatures(query).then(function(response) {
      convertFeatureSetToRows(response);

      const features = response.features;
      features.forEach(function(feature) {
        const viewshed = new Viewshed({
          observer: {
            x: feature.geometry.x,
            y: feature.geometry.y,
            z: feature.attributes.elevation_m_Jun2024
          },
          farDistance: feature.attributes.fardistance_m,
          tilt: feature.attributes.Tilt,
          heading: feature.attributes.cameraheading,
          horizontalFieldOfView: feature.attributes.horizontalfieldofview_viewshed_,
          verticalFieldOfView: feature.attributes.verticalfieldofview
        });
        viewsheds.push(viewshed);
      });

      // Initialize ViewshedAnalysis as being empty after creating viewsheds
      viewshedAnalysis = new ViewshedAnalysis({
        viewsheds: []
      });
      // Have Button prompt to show viewsheds
      document.getElementById("toggleViewsheds").innerText = "Show All Viewsheds"

      view.analyses.add(viewshedAnalysis);
      console.log(viewshedAnalysis)
      view.whenAnalysisView(viewshedAnalysis).then(analysisView => {
        // analysisView.interactive = true;
        analysisView.selectedViewshed = viewsheds[0]; // Set default viewshed
        analysisView.visible = true;
      });
    });


    const layerListWidget = new LayerList({
      view: view
    });

    const layerListExpand = new Expand({
      view: view,
      content: layerListWidget,
      expandIconClass: "esri-icon-layer-list", // Icon for the expand button
      expandTooltip: "Layer List"
    });

    view.ui.add(layerListExpand, {
      position: "top-right"
    });

    
    const toggleViewsheds = () => {
      if (areViewshedsVisible) {
        // Hide all viewsheds
        viewshedAnalysis.viewsheds = [];
        document.getElementById("toggleViewsheds").innerText = "Show All Viewsheds";
        areViewshedsVisible = false;
      } else {
        // Show all viewsheds
        viewshedAnalysis.viewsheds = viewsheds; // Show all viewsheds
    
        // Clear selection if it was previously set
        selectedViewsheds.clear();
        const listItems = document.querySelectorAll("#cameraList calcite-list-item");
        listItems.forEach(item => {
          item.setAttribute("selected", false); // Clear selection styling
        });
    
        // Ensure the button text and state reflect that all viewsheds are shown
        document.getElementById("toggleViewsheds").innerText = "Hide All Viewsheds";
        areViewshedsVisible = true;
    
        // Update the map view
        view.goTo({
          target: viewsheds.length > 0 ? viewsheds[0].observer : view.camera.position,
          scale: viewsheds.length > 0 ? 3000 : 10000
        }).catch((error) => {
          if (error.name !== "AbortError") {
            console.error(error);
          }
        });
      }
    };

    // Update button text based on the state of selected viewsheds
    const updateButtonState = () => {
      if (selectedViewsheds.size > 0) {
        document.getElementById("toggleViewsheds").innerText = "Show All Viewsheds";
      } else {
        document.getElementById("toggleViewsheds").innerText = "Hide All Viewsheds";
      }
    };
    
    // Update the event listener logic when a camera is clicked
    const onCameraClickHandler = (event) => {
      const target = event.target;
      const resultId = target.getAttribute("value");
      const selectedViewshed = viewsheds[parseInt(resultId, 10)];
    
      if (selectedViewshed) {
        view.popup.close();
    
        const wasSelected = selectedViewsheds.has(selectedViewshed);
    
        if (wasSelected) {
          selectedViewsheds.delete(selectedViewshed);
        } else {
          selectedViewsheds.add(selectedViewshed);
        }
    
        viewshedAnalysis.viewsheds = Array.from(selectedViewsheds);
    
        if (!wasSelected && selectedViewsheds.size > 0) {
          view.goTo({
            target: selectedViewshed.observer,
            scale: 600
          });
        }
    
        // If no viewsheds are selected, display all viewsheds

        // feature off
        // if (selectedViewsheds.size === 0) {
        //   viewshedAnalysis.viewsheds = viewsheds;
        //   view.goTo({
        //     scale: 3000
        //   });
        // }
    
        updateButtonState();  // Update the button state after selection
        console.log(`Selected viewsheds count: ${selectedViewsheds.size}`); // Debug log
      }
    };
    
    // Add the event listener for the toggle button
    document.getElementById("toggleViewsheds").addEventListener("click", toggleViewsheds);

    const convertFeatureSetToRows = (response) => {
      listNode.innerHTML = ""; // Clear the list before adding new items
    
      const graphics = response.features;
      graphics.forEach((result, index) => {
        const attributes = result.attributes;
        const name = attributes.devicename;
    
        // Create a list item
        const item = document.createElement("calcite-list-item");
        item.setAttribute("label", name);
        item.setAttribute("value", index);
    
        // Create an action icon with a video icon
        const actionIcon = document.createElement("calcite-action");
        actionIcon.setAttribute("slot", "actions-end");
        actionIcon.setAttribute("text", "Show Video");
    
        const videoIcon = document.createElement("calcite-icon");
        videoIcon.setAttribute("icon", "video");
        videoIcon.setAttribute("scale", "s"); // Set the scale to small

        actionIcon.appendChild(videoIcon); // Add the video icon to the action
    
        //Add an event listener to the action icon to show the popup
        actionIcon.addEventListener("click", (event) => {
          event.stopPropagation(); // Prevent triggering the list item click event
          showPopup(result.geometry, attributes, true);
        });
    
        item.appendChild(actionIcon);
    
        // Add the list item to the list
        document.getElementById("cameraList").appendChild(item);
    
        // Add an event listener to the list item for camera view change
        item.addEventListener("click", onCameraClickHandler);
      });
    };
    
    const iFrameUrl = "https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=default&metricTemp=default&metricWind=default&zoom=5&overlay=wind&product=ecmwf&level=surface&lat=43.421&lon=-110.789"
    
    // "http://10.64.152.142/";

    const showPopup = (geometry, attributes, shouldZoom = false) => {
      // Create a calcite-card element
      const card = document.createElement("calcite-card");
    
      // Set the title and subtitle
      card.setAttribute("heading", attributes.devicename);
      card.setAttribute("subheading", "Camera Details");
    
      // Create a div to hold the attribute information
      const attributesDiv = document.createElement("div");
      attributesDiv.style.padding = "10px"; // Optional styling for spacing
    
      // Add attribute details as paragraphs
      const cameraHeading = document.createElement("p");
      cameraHeading.textContent = `Camera Heading: ${attributes.cameraheading}`;
      attributesDiv.appendChild(cameraHeading);
    
      const horizontalFOV = document.createElement("p");
      horizontalFOV.textContent = `Horizontal Field of View: ${attributes.horizontalfieldofview_viewshed_}`;
      attributesDiv.appendChild(horizontalFOV);
    
      const verticalFOV = document.createElement("p");
      verticalFOV.textContent = `Vertical Field of View: ${attributes.verticalfieldofview}`;
      attributesDiv.appendChild(verticalFOV);
    
      const cameraHeight = document.createElement("p");
      cameraHeight.textContent = `Camera Height: ${attributes.locationheight}`;
      attributesDiv.appendChild(cameraHeight);
    
      // Append the attributes div to the card
      card.appendChild(attributesDiv);
    
      // Create the iframe element
      const iframe = document.createElement("iframe");
      iframe.height = "250"; // Adjust height as needed
      iframe.src = `${attributes.IP}`;
      iframe.style.width = "100%"; // Make the iframe take the full width of the card
      iframe.setAttribute("frameborder", "0");
      iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-popups allow-forms"); // Set sandbox permissions

      // Create a content div and add the iframe to it
      const contentDiv = document.createElement("div");
      contentDiv.appendChild(iframe);
    
      // Append the content div to the card
      card.appendChild(contentDiv);
    
      // Optional: Add actions or additional information to the card
      const actionIcon = document.createElement("calcite-action");
      actionIcon.setAttribute("slot", "actions-end");
      actionIcon.setAttribute("icon", "video");
      actionIcon.setAttribute("text", "View Camera");
    
      card.appendChild(actionIcon);
    
      view.popup.alignment = "bottom-right"; 
      view.popup.dockEnabled = true; 
      view.popup.dockOptions = {
        buttonEnabled: false, // Hide the dock button
        breakpoint: false,   
        position: "bottom-right" // Pin the popup to the bottom-right corner
      };

      // Append the card directly to the popup's content element
      view.popup.content = card;

      // Open the popup and directly append the card element
      view.openPopup({
        title: attributes.devicename, // Still show the title in the popup header
        location: geometry,
      });
    
   // Zoom to the camera location
   if (shouldZoom) {
    view.goTo({
      target: geometry,
      scale: 800
    }).catch((error) => {
      if (error.name !== "AbortError") {
        console.error(error);
      }
    });
  }
};
});
