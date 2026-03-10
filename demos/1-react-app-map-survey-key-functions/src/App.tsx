import { useRef, useEffect, useCallback, useState } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import "@arcgis/core/assets/esri/themes/light/main.css";
import "./App.css";

// Global type for Survey123 JS API loaded via script tag
interface Survey123WebFormInstance {
  on: (event: string, callback: (data: any) => void) => void;
  setGeopoint: (geopoint: { x: number; y: number } | null) => void;
  setQuestionValue: (value: Record<string, unknown>) => void;
}

declare const Survey123WebForm: {
  new (options: {
    container: string | HTMLElement;
    itemId: string;
  }): Survey123WebFormInstance;
};

interface Coordinates {
  latitude: number;
  longitude: number;
}

const BASEMAP_OPTIONS = [
  { id: "dark-gray-vector", label: "Streets" },
  { id: "satellite", label: "Satellite" },
  { id: "topo-vector", label: "Topographic" },
  { id: "dark-gray-vector", label: "Dark Gray" },
  { id: "streets-night-vector", label: "Night" },
];

const SURVEY_ITEM_ID = "9eaed5ee6a084bcd9c364e7a0057e3ac";

const FEATURE_SERVICE_URL =
  "https://services1.arcgis.com/oC086ufSSQ6Avnw2/arcgis/rest/services/survey123_9eaed5ee6a084bcd9c364e7a0057e3ac/FeatureServer/0";

const CITY_COORDS = [
  {
    latitude: 34.0522,
    longitude: -118.2437,
    city: "Los Angeles",
    animal: "Coyote",
  },
  { latitude: 34.1478, longitude: -118.1445, city: "Pasadena", animal: "Deer" },
  {
    latitude: 33.9425,
    longitude: -118.4081,
    city: "El Segundo",
    animal: "Pelican",
  },
  {
    latitude: 34.0195,
    longitude: -118.4912,
    city: "Santa Monica",
    animal: "Sea Lion",
  },
  {
    latitude: 34.1808,
    longitude: -118.309,
    city: "Burbank",
    animal: "Raccoon",
  },
  {
    latitude: 33.7701,
    longitude: -118.1937,
    city: "Long Beach",
    animal: "Dolphin",
  },
  {
    latitude: 34.0689,
    longitude: -118.0276,
    city: "West Covina",
    animal: "Hawk",
  },
  {
    latitude: 33.8886,
    longitude: -118.3096,
    city: "Torrance",
    animal: "Squirrel",
  },
];

// Find nearest city from known city coordinates
function findNearestLocation(lat: number, lng: number) {
  let nearest = CITY_COORDS[0];
  let minDist = Infinity;
  for (const pt of CITY_COORDS) {
    const dist = Math.sqrt(
      (pt.latitude - lat) ** 2 + (pt.longitude - lng) ** 2,
    );
    if (dist < minDist) {
      minDist = dist;
      nearest = pt;
    }
  }
  return { city: nearest.city, animal: nearest.animal };
}

function App() {
  const mapDiv = useRef<HTMLDivElement>(null);
  const surveyDiv = useRef<HTMLDivElement>(null);
  const surveyInitialized = useRef(false);
  const webformRef = useRef<Survey123WebFormInstance | null>(null);
  const viewRef = useRef<MapView | null>(null);
  const markerGraphicRef = useRef<Graphic | null>(null);
  const mapRef = useRef<Map | null>(null);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [activeBasemap, setActiveBasemap] = useState("dark-gray-vector");

  // Handle map click - update marker, survey geopoint and text field
  const handleMapClick = useCallback((lat: number, lng: number) => {
    setCoords({ latitude: lat, longitude: lng });

    // Update or create marker on map
    const view = viewRef.current;
    if (view) {
      if (markerGraphicRef.current) {
        view.graphics.remove(markerGraphicRef.current);
      }
      const marker = new Graphic({
        geometry: new Point({ longitude: lng, latitude: lat }),
        symbol: new SimpleMarkerSymbol({
          color: "#e74c3c",
          size: "14px",
          outline: { color: "#ffffff", width: 2 },
        }),
      });
      markerGraphicRef.current = marker;
      view.graphics.add(marker);
    }

    // Update survey form
    const webform = webformRef.current;
    if (webform) {
      const { city, animal } = findNearestLocation(lat, lng);
      webform.setGeopoint({ x: lng, y: lat });
      webform.setQuestionValue({
        nearest_city: city,
        what_type_of_wild_animal_have_y: animal,
      });
    }
  }, []);

  // Initialize ArcGIS Map
  useEffect(() => {
    if (!mapDiv.current) return;

    const map = new Map({ basemap: "dark-gray-vector" });
    mapRef.current = map;

    const surveyDataLayer = new FeatureLayer({
      url: FEATURE_SERVICE_URL,
      popupTemplate: {
        title: "Survey Response",
        content: [
          {
            type: "fields",
            fieldInfos: [
              {
                fieldName: "what_type_of_wild_animal_have_y",
                label: "Animal Description",
              },
              { fieldName: "animal_type", label: "Animal Type (AI)" },
              { fieldName: "nearest_city", label: "Nearest City" },
              {
                fieldName: "is_there_any_urgent_threat_to_t",
                label: "Urgent Threat",
              },
              {
                fieldName: "audio_transcription",
                label: "Audio Transcription (AI)",
              },
              { fieldName: "Creator", label: "Submitted By" },
              { fieldName: "CreationDate", label: "Submitted At" },
            ],
          },
        ],
      } as __esri.PopupTemplate,
      renderer: {
        type: "simple",
        symbol: {
          type: "simple-marker",
          color: [226, 40, 40, 0.8],
          size: 14,
          outline: { color: [255, 255, 255], width: 2 },
        },
      } as __esri.SimpleRenderer,
    });

    map.add(surveyDataLayer);

    const view = new MapView({
      container: mapDiv.current,
      map,
      center: [-118.2437, 34.0522],
      zoom: 10,
      popup: { autoOpenEnabled: false },
    });

    viewRef.current = view;

    view.on("click", (event) => {
      const lat = Math.round(event.mapPoint.latitude * 1e6) / 1e6;
      const lng = Math.round(event.mapPoint.longitude * 1e6) / 1e6;
      handleMapClick(lat, lng);
    });

    return () => {
      viewRef.current = null;
      view.destroy();
    };
  }, [handleMapClick]);

  // Initialize Survey123 Web Form
  useEffect(() => {
    if (!surveyDiv.current || surveyInitialized.current) return;
    surveyInitialized.current = true;

    const webform = new Survey123WebForm({
      container: surveyDiv.current,
      itemId: SURVEY_ITEM_ID,
    });

    webformRef.current = webform;

    webform.on("formLoaded", (data) => {
      console.log("Survey form loaded successfully:", data);
    });

    webform.on("submitted", (data) => {
      console.log("Survey submitted:", data);
    });
  }, []);

  const handleBasemapChange = (basemapId: string) => {
    if (mapRef.current) {
      mapRef.current.basemap = basemapId as any;
      setActiveBasemap(basemapId);
    }
  };

  return (
    <div className="app-layout">
      <div className="map-panel">
        <div className="basemap-switcher">
          {BASEMAP_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              className={`basemap-btn ${activeBasemap === opt.id ? "active" : ""}`}
              onClick={() => handleBasemapChange(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="map-container" ref={mapDiv} />
        {coords && (
          <div className="coord-panel">
            <h3>Clicked Location</h3>
            <div className="coord-row">
              <span className="coord-label">Lat</span>
              <span className="coord-value">{coords.latitude}</span>
            </div>
            <div className="coord-row">
              <span className="coord-label">Lng</span>
              <span className="coord-value">{coords.longitude}</span>
            </div>
          </div>
        )}
      </div>
      <div className="survey-panel" ref={surveyDiv} />
    </div>
  );
}

export default App;
