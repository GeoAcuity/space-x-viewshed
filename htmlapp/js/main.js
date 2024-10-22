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
  "esri/symbols/SimpleMarkerSymbol",
  "esri/layers/ElevationLayer",
  "esri/geometry/Point",
  "esri/geometry/Multipoint",
  "esri/core/promiseUtils"
], function(Map, SceneView, SpatialReference, ViewshedAnalysis, Viewshed, IntegratedMeshLayer, FeatureLayer, LayerList, Expand, reactiveUtils,Graphic, GraphicsLayer, SimpleMarkerSymbol, ElevationLayer, Point, Multipoint, promiseUtils) {

    let viewsheds = [];
    let selectedViewsheds = new Set(); 
    selectedViewsheds.clear();  
    let viewshedAnalysis;
    let areViewshedsVisible = false; 
    const listNode = document.getElementById("cameraList");

    const cameraLayer = new FeatureLayer({
      url: "https://services9.arcgis.com/pr9h1zugi5DEn134/arcgis/rest/services/survey123_bb295afa11d447ceb080c4513cc00856_results/FeatureServer/0",
      elevationInfo: {
        mode: "relative-to-ground",
        featureExpressionInfo: {
          expression: "$feature.camera_height_off_ground_m"
        },
        unit: "meters"
      },
      title: "Bastrop Camera Locations",
      popupTemplate: {
        title: "{camera_device_name}{camera_heading}{horizontal_field_of_view}{vertical_field_of_view_}{camera_height_off_ground_m}{ip_url}",
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

    const incidentLayer = new FeatureLayer({
      url: "https://services9.arcgis.com/pr9h1zugi5DEn134/arcgis/rest/services/Bastrop_Exterior_Cameras/FeatureServer",
      title: "Incident Reporting",
      elevationInfo: {
        mode: "on-the-ground",
      },
      popupTemplate: {
        title: "Incident: {devicename}",
        content: [
          {
            // It is also possible to set the fieldInfos outside of the content
            // directly in the popupTemplate. If no fieldInfos is specifically set
            // in the content, it defaults to whatever may be set within the popupTemplate.
            type: "fields",
            fieldInfos: [
              {
                fieldName: "cameraheading",
                label: "Heading:"
              },
              {
                fieldName: "horizontalfieldofview",
                label: "H FOV:"
              },
            ]
          }
        ]
      }
    });
    // Create elevation layers
    const WorldElevationLayer = new ElevationLayer({
      url: "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer"
    });
    const meshLayer = new IntegratedMeshLayer({
      url: "https://tiles.arcgis.com/tiles/pr9h1zugi5DEn134/arcgis/rest/services/Bastrop_Factory_3D_3D_Mesh_Clip/SceneServer",
      title: "Bastrop Factory Mesh",
      elevationInfo: {
        mode: "absolute-height",
        offset: 9
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
          meshLayer,
          cameraLayer,
          incidentLayer
        ]
      }),

    });

    // Wait for the scene layer to load
    meshLayer.load().then(function() {
    // Get the extent of the mesh layer
    var extent = meshLayer.fullExtent;

    // Create a query to filter the incidents layer
    var query = incidentLayer.createQuery();
    query.geometry = extent; // Set the geometry to the extent of the first layer
    query.spatialRelationship = "intersects"; // Use "intersects" to filter

    // Execute the query and update the second layer's definition expression
    incidentLayer.queryFeatures(query).then(function(response) {
        // Create an array of ObjectIds from the features
        var objectIds = response.features.map(function(feature) {
            return feature.attributes[incidentLayer.objectIdField];
        });

        // Apply a definitionExpression to filter the layer
        incidentLayer.definitionExpression = incidentLayer.objectIdField + " IN (" + objectIds.join(", ") + ")";
      });
    });

    view.when(function() {
      view.environment = {
        atmosphereEnabled: true,
        starsEnabled: true,
        surfaceColor: '#004C73'
      };
    });

    
const query = cameraLayer.createQuery();
query.returnGeometry = true;
    // Query features and create viewsheds
    cameraLayer.queryFeatures(query).then(function(response) {
      convertFeatureSetToRows(response);

      const features = response.features;
      
      features.forEach(function(feature) {
        const position = feature.geometry;
        WorldElevationLayer
          .queryElevation(new Multipoint({ points: [[position.x, position.y]] }), {
            returnSampleInfo: true
        })
        // sample points
        .then(function (result) {
          // print result
          // result.geometry.points.forEach(function (point, index) {
          const elevation = Math.round(result.geometry.points[0][2]);
          // console.log(elevation);
        
          const viewshed = new Viewshed({
            observer: {
              x: feature.geometry.x,
              y: feature.geometry.y,
              z: elevation + feature.attributes.camera_height_off_ground_m
            },
            farDistance: feature.attributes.far_distance_m,
            tilt: feature.attributes.camera_tilt,
            heading: feature.attributes.camera_heading,
            horizontalFieldOfView: feature.attributes.horizontal_field_of_view,
            verticalFieldOfView: feature.attributes.vertical_field_of_view_
          });
          viewsheds.push(viewshed);


        });
        // Initialize ViewshedAnalysis as being empty after creating viewsheds
        viewshedAnalysis = new ViewshedAnalysis({
          viewsheds: []
        });
        
      });

      
      // Have Button prompt to show viewsheds
      document.getElementById("toggleViewsheds").innerText = "Show All Viewsheds"

      view.analyses.add(viewshedAnalysis);
      console.log(viewshedAnalysis)
      view.whenAnalysisView(viewshedAnalysis).then(analysisView => {
        // analysisView.interactive = true;
        analysisView.selectedViewshed = viewsheds[0];
        analysisView.visible = true;
      });
    });


    const layerListWidget = new LayerList({
      view: view
    });

    const layerListExpand = new Expand({
      view: view,
      content: layerListWidget,
      expandIconClass: "esri-icon-layer-list",
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
        view.closePopup();
    
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
    
        updateButtonState(); 
      }
    };
    
    // Add the event listener for the toggle button
    document.getElementById("toggleViewsheds").addEventListener("click", toggleViewsheds);

    const convertFeatureSetToRows = (response) => {
      listNode.innerHTML = "";
    
      const graphics = response.features;
      graphics.forEach((result, index) => {
        const attributes = result.attributes;
        const name = attributes.camera_device_name;
    
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
        videoIcon.setAttribute("scale", "s");

        actionIcon.appendChild(videoIcon); 
    
        //Add an event listener to the action icon to show the popup
        actionIcon.addEventListener("click", (event) => {
          event.stopPropagation();
          showPopup(result.geometry, attributes, true);
        });
    
        item.appendChild(actionIcon);
    
        // Add the list item to the list
        document.getElementById("cameraList").appendChild(item);
    
        // Add an event listener to the list item for camera view change
        item.addEventListener("click", onCameraClickHandler);
      });
    };

    //const iFrameUrl = "https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=default&metricTemp=default&metricWind=default&zoom=5&overlay=wind&product=ecmwf&level=surface&lat=40.772&lon=-111.868"
    
    const showPopup = (geometry, attributes, shouldZoom = false) => {
      
       
      // Create a calcite-card element
      const card = document.createElement("calcite-card");
    
      // Set the title and subtitle
      card.setAttribute("heading", attributes.camera_device_name);
      // card.setAttribute("subheading", "Camera Details");
    
      // Create a div to hold the attribute information
      const attributesDiv = document.createElement("div");
      // attributesDiv.style.padding = "10px"; // Optional styling for spacing
    
      // Add attribute details as paragraphs

      const cameraHeading = document.createElement("p");
      cameraHeading.textContent = `Camera Heading: ${attributes.camera_heading}`;
      attributesDiv.appendChild(cameraHeading);
    
      const horizontalFOV = document.createElement("p");
      horizontalFOV.textContent = `Horizontal Field of View: ${attributes.horizontal_field_of_view}`;
      attributesDiv.appendChild(horizontalFOV);
    
      const verticalFOV = document.createElement("p");
      verticalFOV.textContent = `Vertical Field of View: ${attributes.vertical_field_of_view_}`;
      attributesDiv.appendChild(verticalFOV);
    
      const cameraHeight = document.createElement("p");
      cameraHeight.textContent = `Camera Height: ${attributes.camera_height_off_ground_m}`;
      attributesDiv.appendChild(cameraHeight);
    
      // Append the attributes div to the card
      card.appendChild(attributesDiv);
    
      const cameraLink = document.createElement("p");

      const link = document.createElement("a");
      link.textContent = "View Live Camera Feed";
      link.href = attributes.ip_url;
      
      link.style.color = "orange";
      link.style.fontWeight = "bold";
      link.style.fontSize = "16px";


      // Add a click event listener to open in a small popup
      link.addEventListener("click", (event) => {
        event.preventDefault(); 
      
        const popupWidth = 600;
        const popupHeight = 400;
        const left = (window.innerWidth / 2) - (popupWidth / 2);
        const top = (window.innerHeight / 2) - (popupHeight / 2);
      
        // Open the popup window with specified size and position
        window.open(link.href, "CameraPopup", `width=${popupWidth},height=${popupHeight},top=${top},left=${left}`);
      });
      
      // Append the link to the paragraph and then to the attributesDiv
      cameraLink.appendChild(link);
      attributesDiv.appendChild(cameraLink);
     
      // Create a content div and add the iframe to it
      const contentDiv = document.createElement("div");
    //  contentDiv.appendChild(iframe);
    
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
        buttonEnabled: false,
        breakpoint: false,   
        position: "bottom-right"
      };

      // Append the card directly to the popup's content element
      view.popup.content = card;

      // Open the popup and directly append the card element
      view.openPopup({
        title: attributes.camera_device_name,
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
