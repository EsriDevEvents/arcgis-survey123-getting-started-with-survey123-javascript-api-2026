import { useRef, useEffect, useState, useCallback } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import "@arcgis/core/assets/esri/themes/light/main.css";
import "./App.css";
import config from "../../config.json";

// Global type for Survey123 JS API loaded via script tag
interface Survey123WebFormInstance {
  on: (event: string, callback: (data: any) => void) => void;
  setGeopoint: (geopoint: { x: number; y: number } | null) => void;
  setQuestionValue: (value: Record<string, unknown>) => void;
  getQuestionValue: () => Promise<Record<string, any>>;
  setTheme: (theme: Record<string, unknown>) => void;
  setLanguage: (language: string) => void;
}

declare const Survey123WebForm: {
  new (options: Record<string, any>): Survey123WebFormInstance;
};

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface AINotification {
  id: number;
  type: "image" | "audio";
  status: "processing" | "success" | "error";
  message: string;
}

const SURVEY_ITEM_ID = config.surveyItemId;
const FEATURE_SERVICE_URL = config.featureServiceUrl;
const CLIENT_ID = config.clientId;
const PORTAL_URL = config.portalUrl;
const IMAGE_ANALYSIS_URL = config.imageAnalysisUrl;
const AUDIO_TRANSCRIBE_URL = config.audioTranscribeUrl;

const BASEMAP_OPTIONS = [
  { id: "dark-gray-vector", label: "Streets" },
  { id: "satellite", label: "Satellite" },
  { id: "topo-vector", label: "Topographic" },
  { id: "dark-gray-vector", label: "Dark Gray" },
];

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

async function generateToken(): Promise<string> {
  const params = new URLSearchParams({
    username: config.username,
    password: config.password,
    referer: window.location.origin,
    f: "json",
  });

  const response = await fetch(`${PORTAL_URL}/sharing/rest/generateToken`, {
    method: "POST",
    body: params,
  });
  const data = await response.json();

  if (data.token) {
    return data.token;
  }
  throw new Error(data.error?.message || "Failed to generate token");
}

async function analyzeImage(file: File, token: string): Promise<string> {
  const formData = new FormData();
  formData.append("f", "json");
  formData.append("file", file, file.name);
  formData.append(
    "attributes",
    JSON.stringify([{ name: "key1", prompt: "Please describe this image" }]),
  );
  formData.append("portalUrl", PORTAL_URL);
  formData.append("token", token);

  const response = await fetch(IMAGE_ANALYSIS_URL, {
    method: "POST",
    body: formData,
  });
  const data = await response.json();

  if (data.results && data.results.length > 0) {
    return (
      data.results[0].value ||
      data.results[0].text ||
      JSON.stringify(data.results[0])
    );
  }
  if (data.error) {
    throw new Error(data.error.message || "Image analysis failed");
  }
  return JSON.stringify(data);
}

interface TranscribeResult {
  animalType: string;
  fullDetail: string;
}

async function callAudioApi(
  file: File,
  token: string,
  attributes: Array<{ name: string; prompt: string }>,
): Promise<Record<string, string>> {
  const formData = new FormData();
  formData.append("f", "json");
  formData.append("file", file, file.name);
  formData.append("attributes", JSON.stringify(attributes));
  formData.append("portalUrl", PORTAL_URL);
  formData.append("token", token);

  const response = await fetch(AUDIO_TRANSCRIBE_URL, {
    method: "POST",
    body: formData,
  });
  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || "Audio API call failed");
  }
  const resultMap: Record<string, string> = {};
  if (data.results) {
    for (const r of data.results) {
      resultMap[r.name] = r.value || r.text || JSON.stringify(r);
    }
  }
  return resultMap;
}

async function transcribeAudio(
  file: File,
  token: string,
): Promise<TranscribeResult> {
  // Two separate calls: mixing prompt and empty prompt in one request
  // causes the API to switch all attributes to extraction mode
  const [transcription, extraction] = await Promise.all([
    callAudioApi(file, token, [{ name: "full_detail", prompt: "" }]),
    callAudioApi(file, token, [
      {
        name: "animal_type",
        prompt:
          "What type of animal is being described? Return only the animal name.",
      },
    ]),
  ]);

  return {
    animalType: extraction["animal_type"] || "",
    fullDetail: transcription["full_detail"] || "",
  };
}

let notificationCounter = 0;

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
  const [token, setToken] = useState("");
  const [notifications, setNotifications] = useState<AINotification[]>([]);

  const tokenRef = useRef(token);
  tokenRef.current = token;

  const pushNotification = useCallback((n: Omit<AINotification, "id">) => {
    const id = ++notificationCounter;
    setNotifications((prev) => [{ ...n, id }, ...prev].slice(0, 3));
    return id;
  }, []);

  const updateNotification = useCallback(
    (id: number, updates: Partial<AINotification>) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...updates } : n)),
      );
    },
    [],
  );

  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Refs for stable access in event callbacks
  const pushNotificationRef = useRef(pushNotification);
  pushNotificationRef.current = pushNotification;
  const updateNotificationRef = useRef(updateNotification);
  updateNotificationRef.current = updateNotification;
  const removeNotificationRef = useRef(removeNotification);
  removeNotificationRef.current = removeNotification;

  // Handle map click
  const handleMapClick = useCallback((lat: number, lng: number) => {
    setCoords({ latitude: lat, longitude: lng });

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

  const handleBasemapChange = (basemapId: string) => {
    if (mapRef.current) {
      mapRef.current.basemap = basemapId as any;
      setActiveBasemap(basemapId);
    }
  };

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
                label: "Animal",
              },
              { fieldName: "nearest_city", label: "City" },
              {
                fieldName: "please_describe_the_animal_as_b",
                label: "Description (AI)",
              },
            ],
          },
        ],
      } as any,
      renderer: {
        type: "simple",
        symbol: {
          type: "simple-marker",
          color: [226, 40, 40, 0.8],
          size: 14,
          outline: { color: [255, 255, 255], width: 2 },
        },
      } as any,
    });

    map.add(surveyDataLayer);

    const view = new MapView({
      container: mapDiv.current,
      map,
      center: [-118.2437, 34.0522],
      zoom: 10,
      popup: { autoCloseEnabled: false },
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
      clientId: CLIENT_ID,
      portalUrl: PORTAL_URL,
      autoRefresh: -1,
      onFormLoaded: (data: any) => {
        console.log("Survey form loaded:", data);
      },
      onFormSubmitted: (data: any) => {
        console.log("Survey submitted:", data);
      },
    } as any);

    webformRef.current = webform;

    // Listen for question value changes via .on() method
    // When user uploads image/audio, use getQuestionValue() to get the File object
    webform.on("questionValueChanged", async (event: any) => {
      console.log("questionValueChanged:", event);

      // Image uploaded by user
      if (
        event.field === "upload_or_take_a_photo_of_the_a" &&
        event.trigger === "user" &&
        event.value
      ) {
        const currentToken = tokenRef.current;
        if (!currentToken) {
          console.warn("Token not ready, skipping image analysis");
          return;
        }

        const nid = pushNotificationRef.current({
          type: "image",
          status: "processing",
          message: "Analyzing uploaded image...",
        });

        try {
          // Get the actual File object via getQuestionValue()
          const values = await webform.getQuestionValue();
          const imageData = values["upload_or_take_a_photo_of_the_a"];
          const rawFile = imageData?.[0]?.file;

          if (!rawFile) {
            throw new Error("Could not retrieve image file from survey form");
          }

          // Re-instantiate the File object to avoid cross-origin generic fetch issues
          const file = new File([rawFile], rawFile.name, {
            type: rawFile.type,
          });

          console.log("Got image file from getQuestionValue:", file);
          const result = await analyzeImage(file, currentToken);

          updateNotificationRef.current(nid, {
            status: "success",
            message: result,
          });

          // Auto-fill description
          webform.setQuestionValue({
            please_describe_the_animal_as_b: result,
          });

          setTimeout(() => removeNotificationRef.current(nid), 8000);
        } catch (err: any) {
          console.error("Image analysis failed:", err);
          updateNotificationRef.current(nid, {
            status: "error",
            message: `Image analysis failed: ${err.message}`,
          });
        }
      }

      // Audio uploaded by user
      if (
        event.field === "record_or_upload_an_audio_messa" &&
        event.trigger === "user" &&
        event.value
      ) {
        const currentToken = tokenRef.current;
        if (!currentToken) {
          console.warn("Token not ready, skipping audio transcription");
          return;
        }

        const nid = pushNotificationRef.current({
          type: "audio",
          status: "processing",
          message: "Transcribing uploaded audio...",
        });

        try {
          // Get the actual File object via getQuestionValue()
          const values = await webform.getQuestionValue();
          const audioData = values["record_or_upload_an_audio_messa"];
          const rawFile = audioData?.[0]?.file;

          if (!rawFile) {
            throw new Error("Could not retrieve audio file from survey form");
          }

          // Re-instantiate the File object to avoid cross-origin generic fetch issues
          const file = new File([rawFile], rawFile.name, {
            type: rawFile.type,
          });

          console.log("Got audio file from getQuestionValue:", file);
          const result = await transcribeAudio(file, currentToken);

          updateNotificationRef.current(nid, {
            status: "success",
            message: `Animal: ${result.animalType} | Detail: ${result.fullDetail}`,
          });

          // Auto-fill animal type and description from transcription
          webform.setQuestionValue({
            what_type_of_wild_animal_have_y: result.animalType,
            please_describe_the_animal_as_b: result.fullDetail,
          });

          setTimeout(() => removeNotificationRef.current(nid), 8000);
        } catch (err: any) {
          console.error("Audio transcription failed:", err);
          updateNotificationRef.current(nid, {
            status: "error",
            message: `Audio transcription failed: ${err.message}`,
          });
        }
      }
    });
  }, []);

  // Fetch token on mount
  useEffect(() => {
    generateToken()
      .then((t) => setToken(t))
      .catch((err) => console.error("Failed to generate token:", err));
  }, []);

  return (
    <div className="app-layout">
      {/* Left Panel: Map */}
      <div className="left-panel">
        <div className="toolbar">
          <div className="toolbar-section">
            <span className="toolbar-label">Basemap</span>
            <div className="basemap-buttons">
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
          </div>
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

      {/* Right Panel: Survey Form + AI Notifications */}
      <div className="right-panel">
        <div className="survey-panel" ref={surveyDiv} />

        {/* Floating AI notifications */}
        {notifications.length > 0 && (
          <div className="ai-toast-container">
            {notifications.map((n) => (
              <div key={n.id} className={`ai-toast ai-toast-${n.status}`}>
                <span className="ai-toast-icon">
                  {n.status === "processing" && "..."}
                  {n.status === "success" &&
                    (n.type === "image" ? "IMG" : "AUD")}
                  {n.status === "error" && "!"}
                </span>
                <span className="ai-toast-message">{n.message}</span>
                <button
                  className="ai-toast-close"
                  onClick={() => removeNotification(n.id)}
                >
                  x
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
