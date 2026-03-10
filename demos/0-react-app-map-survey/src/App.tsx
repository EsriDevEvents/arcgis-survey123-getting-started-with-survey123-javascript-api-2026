import { useRef, useEffect, useState } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import "@arcgis/core/assets/esri/themes/light/main.css";
import "./App.css";

// Global type for Survey123 JS API loaded via script tag
declare const Survey123WebForm: new (options: {
  container: string | HTMLElement;
  itemId: string;
}) => {
  on: (event: string, callback: (data: unknown) => void) => void;
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

function App() {
  const mapDiv = useRef<HTMLDivElement>(null);
  const surveyDiv = useRef<HTMLDivElement>(null);
  const surveyInitialized = useRef(false);
  const mapRef = useRef<Map | null>(null);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [activeBasemap, setActiveBasemap] = useState("dark-gray-vector");

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
      center: [-118.2437, 34.0522], // Los Angeles
      zoom: 10,
    });

    view.on("click", (event) => {
      setCoords({
        latitude: Math.round(event.mapPoint.latitude * 1e6) / 1e6,
        longitude: Math.round(event.mapPoint.longitude * 1e6) / 1e6,
      });
    });

    return () => {
      view.destroy();
    };
  }, []);

  // Initialize Survey123 Web Form
  useEffect(() => {
    if (!surveyDiv.current || surveyInitialized.current) return;
    surveyInitialized.current = true;

    const webform = new Survey123WebForm({
      container: surveyDiv.current,
      itemId: SURVEY_ITEM_ID,
    });

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
