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
], function(EsriMap, SceneView, SpatialReference, ViewshedAnalysis, Viewshed, IntegratedMeshLayer, FeatureLayer, LayerList, Expand, reactiveUtils,Graphic, GraphicsLayer, SimpleMarkerSymbol, ElevationLayer, Point, Multipoint, promiseUtils) {

    let viewsheds = [];
    const viewshedMap = new Map();
    let selectedViewsheds = new Set(); 
    selectedViewsheds.clear();  
    let viewshedAnalysis;
    let areViewshedsVisible = false; 
    const listNode = document.getElementById("cameraList");

    const cameraLayer = new FeatureLayer({
      url: "https://ht-arcgis-app01.spacex.corp/arcgis/sharing/servers/88759b17e8184026ae90c9c092df9dac/rest/services/Bastrop_Exterior_Cameras/FeatureServer",
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
      url: "https://ht-arcgis-app01.spacex.corp/server/rest/services/Hosted/service_e634e21092674f1ba7e243ab7200ce78/FeatureServer  ",
      title: "Incident Reporting",
      elevationInfo: {
        mode: "on-the-ground",
      },
      popupTemplate: {
        title: "Incident",
        // content: [
        //   {
        //     // It is also possible to set the fieldInfos outside of the content
        //     // directly in the popupTemplate. If no fieldInfos is specifically set
        //     // in the content, it defaults to whatever may be set within the popupTemplate.
        //     // type: "fields",
        //     // fieldInfos: [
        //     //   {
        //     //     fieldName: "cameraheading",
        //     //     label: "Heading:"
        //     //   },
        //     //   {
        //     //     fieldName: "horizontalfieldofview",
        //     //     label: "H FOV:"
        //     //   },
        //     ]
        //   }
        // ]
      }
    });
    // Create elevation layers
    const WorldElevationLayer = new ElevationLayer({
      url: "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer"
    });
    const meshLayer = new IntegratedMeshLayer({
      url: "https://ht-arcgis-app01.spacex.corp/arcgis/sharing/servers/b45505e6448945c1bc31cdae21ddd602/rest/services/Bastrop_Factory_3D_3D_Mesh_Clip/SceneServer",
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
      map: new EsriMap({
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
        const elevation = 119 // set for Bastrop Esri World Elevation value
        
          const viewshed = new Viewshed({
            observer: {
              x: feature.geometry.x,
              y: feature.geometry.y,
              z: feature.attributes.camera_height_off_ground_m  + elevation
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
        // });

        
      });

      
      // Have Button prompt to show viewsheds
      document.getElementById("toggleViewsheds").innerText = "Show All Viewsheds"

      view.analyses.add(viewshedAnalysis);
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
      console.log(viewshedMap)
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
      // Create a div to hold the content
      const contentDiv = document.createElement("div");
      
      const cameraHeading = document.createElement("p");
      cameraHeading.textContent = `Camera Heading: ${attributes.camera_heading}`;
      contentDiv.appendChild(cameraHeading);
      
      const horizontalFOV = document.createElement("p");
      horizontalFOV.textContent = `Horizontal Field of View: ${attributes.horizontal_field_of_view}`;
      contentDiv.appendChild(horizontalFOV);
      
      const verticalFOV = document.createElement("p");
      verticalFOV.textContent = `Vertical Field of View: ${attributes.vertical_field_of_view_}`;
      contentDiv.appendChild(verticalFOV);
      
      const cameraHeight = document.createElement("p");
      cameraHeight.textContent = `Camera Height: ${attributes.camera_height_off_ground_m}`;
      contentDiv.appendChild(cameraHeight);
      
      const cameraLink = document.createElement("p");
      const link = document.createElement("a");
      link.textContent = "View Camera";
      link.href = attributes.ip_url;
      
      link.style.color = "orange";
      link.style.fontWeight = "bold";
      link.style.fontSize = "14px";
    

      link.addEventListener("click", (event) => {
        event.preventDefault(); 
    
        const popupWidth = 600;
        const popupHeight = 400;
        const left = (window.innerWidth / 2) - (popupWidth / 2);
        const top = (window.innerHeight / 2) - (popupHeight / 2);
        
        window.open(link.href, "CameraPopup", `width=${popupWidth},height=${popupHeight},top=${top},left=${left}`);
      });
      
      cameraLink.appendChild(link);
      contentDiv.appendChild(cameraLink);
      
      view.popup.content = contentDiv;
      view.popup.alignment = "bottom-right"; 
      view.popup.dockEnabled = true; 
      view.popup.dockOptions = {
        buttonEnabled: false,
        breakpoint: false,   
        position: "bottom-right"
      };
    
      view.openPopup({
        title: attributes.camera_device_name,
        location: geometry,
      });
      
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
