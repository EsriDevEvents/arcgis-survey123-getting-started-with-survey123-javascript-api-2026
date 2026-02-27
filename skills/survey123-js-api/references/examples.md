# Common Examples

Practical examples for common Survey123 JS API use cases.

## Table of Contents

- [Basic Embedding](#basic-embedding)
- [Authentication Examples](#authentication-examples)
- [Pre-populating Forms](#pre-populating-forms)
- [Handling Submissions](#handling-submissions)
- [Working with Repeats](#working-with-repeats)
- [Geometry and Location](#geometry-and-location)
- [Multi-language Switching](#multi-language-switching)
- [Multi-page Navigation](#multi-page-navigation)
- [Conditional Logic](#conditional-logic)
- [Inspecting Form Definition](#inspecting-form-definition)
- [AI Assistant Integration](#ai-assistant-integration)
- [Styling and Theming](#styling-and-theming)

## Basic Embedding

### Public Survey (No Auth)

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Public Survey</title>
    <script src="https://survey123.arcgis.com/api/jsapi"></script>
    <style>
      #surveyDiv {
        width: 100%;
        height: 100vh;
      }
    </style>
  </head>
  <body>
    <div id="surveyDiv"></div>

    <script>
      const webform = new Survey123WebForm({
        clientId: "YOUR_CLIENT_ID",
        container: "surveyDiv",
        itemId: "YOUR_PUBLIC_SURVEY_ID",
      });
    </script>
  </body>
</html>
```

### Embedded in Specific Container

```html
<div style="width: 800px; height: 600px; margin: 0 auto;">
  <div id="mySurvey"></div>
</div>

<script>
  const webform = new Survey123WebForm({
    clientId: "YOUR_CLIENT_ID",
    container: "mySurvey",
    itemId: "YOUR_SURVEY_ID",
  });
</script>
```

## Authentication Examples

### Complete OAuth Flow

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Authenticated Survey</title>
    <script src="https://survey123.arcgis.com/api/jsapi"></script>
  </head>
  <body>
    <div id="loginBtn" style="display: none;">
      <button onclick="login()">Login to Access Survey</button>
    </div>
    <div id="surveyDiv"></div>

    <script>
      const CONFIG = {
        clientId: "YOUR_CLIENT_ID",
        surveyId: "YOUR_SURVEY_ID",
        redirectUri: window.location.origin + window.location.pathname,
        portalUrl: "https://www.arcgis.com",
      };

      let webform;

      function login() {
        const state = Math.random().toString(36).substring(7);
        sessionStorage.setItem("oauth_state", state);

        const authUrl =
          `${CONFIG.portalUrl}/sharing/rest/oauth2/authorize?` +
          `client_id=${CONFIG.clientId}&` +
          `response_type=token&` +
          `redirect_uri=${encodeURIComponent(CONFIG.redirectUri)}&` +
          `state=${state}&` +
          `expiration=20160`;

        window.location.href = authUrl;
      }

      function handleAuth() {
        const hash = window.location.hash.substring(1);
        if (!hash) return null;

        const params = new URLSearchParams(hash);
        const token = params.get("access_token");
        const state = params.get("state");

        // Verify state
        const savedState = sessionStorage.getItem("oauth_state");
        if (state !== savedState) {
          console.error("State mismatch");
          return null;
        }

        if (token) {
          sessionStorage.setItem("arcgis_token", token);
          sessionStorage.setItem(
            "token_expires",
            Date.now() + params.get("expires_in") * 1000,
          );
          sessionStorage.removeItem("oauth_state");

          // Clean URL
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
          return token;
        }

        return null;
      }

      function initSurvey() {
        let token = sessionStorage.getItem("arcgis_token");
        const expiresAt = sessionStorage.getItem("token_expires");

        // Check for token in URL hash
        if (!token) {
          token = handleAuth();
        }

        // Check token expiration
        if (token && expiresAt && Date.now() >= parseInt(expiresAt)) {
          sessionStorage.removeItem("arcgis_token");
          sessionStorage.removeItem("token_expires");
          token = null;
        }

        if (!token) {
          document.getElementById("loginBtn").style.display = "block";
          return;
        }

        // Initialize survey with token
        webform = new Survey123WebForm({
          clientId: CONFIG.clientId,
          container: "surveyDiv",
          itemId: CONFIG.surveyId,
          token: token,
        });

        webform.on("formFailed", (error) => {
          console.error("Form error:", error);
          if (
            error.message &&
            (error.message.includes("token") || error.message.includes("401"))
          ) {
            sessionStorage.removeItem("arcgis_token");
            sessionStorage.removeItem("token_expires");
            document.getElementById("loginBtn").style.display = "block";
          }
        });
      }

      // Initialize on page load
      initSurvey();
    </script>
  </body>
</html>
```

## Pre-populating Forms

### From URL Parameters

```javascript
const webform = new Survey123WebForm({
  clientId: "YOUR_CLIENT_ID",
  container: "surveyDiv",
  itemId: "YOUR_SURVEY_ID",
});

webform.on("formLoaded", () => {
  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);

  const values = {
    name: urlParams.get("name"),
    email: urlParams.get("email"),
    department: urlParams.get("dept"),
  };

  // Remove null values
  Object.keys(values).forEach((key) => {
    if (values[key] === null) delete values[key];
  });

  if (Object.keys(values).length > 0) {
    webform.setQuestionValue(values);
  }
});
```

### From User Profile

```javascript
webform.on("formLoaded", () => {
  // Assuming you have user data from authentication
  const userData = {
    full_name: "John Doe",
    email: "john.doe@company.com",
    user_id: "12345",
    department: "Engineering",
  };

  webform.setQuestionValue(userData);
});
```

### From Database/API

```javascript
webform.setOnFormLoaded(async () => {
  try {
    const response = await fetch("/api/user-data");
    const data = await response.json();

    webform.setQuestionValue({
      customer_id: data.id,
      customer_name: data.name,
      account_type: data.accountType,
      registration_date: data.registeredAt,
    });
  } catch (error) {
    console.error("Failed to load user data:", error);
  }
});
```

## Handling Submissions

### Basic Submission Handler

```javascript
webform.on("submitted", (response) => {
  console.log("Submission successful:", response);

  // Show success message
  alert("Thank you for your submission!");

  // Redirect to thank you page
  setTimeout(() => {
    window.location.href = "/thank-you.html";
  }, 2000);
});

webform.on("formFailed", (error) => {
  console.error("Submission failed:", error);
  alert("Failed to submit form. Please try again.");
});
```

### Validation Before Submit

```javascript
webform.on("submit", (data) => {
  // Custom validation
  if (data.age && data.age < 18) {
    alert("You must be 18 or older to submit this form.");
    return false; // Prevent submission
  }

  if (data.email && !data.email.includes("@")) {
    alert("Please enter a valid email address.");
    webform.scrollTo("email");
    return false;
  }

  // Allow submission
  return true;
});
```

### Send Data to External API

```javascript
webform.setOnFormSubmitted(async (response) => {
  try {
    // Send to external system
    await fetch("/api/process-survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        surveyId: response.objectId,
        globalId: response.globalId,
        timestamp: new Date().toISOString(),
      }),
    });

    console.log("Data synced to external system");
  } catch (error) {
    console.error("Failed to sync data:", error);
  }
});
```

## Working with Repeats

### Add Multiple Repeat Records

```javascript
webform.on("formLoaded", () => {
  // Add inspection items
  webform.addRepeat({
    questionName: "inspection_items",
    count: 3,
    questionValues: [
      {
        item_name: "Fire Extinguisher",
        status: "Pass",
        notes: "Good condition",
      },
      {
        item_name: "Emergency Exit",
        status: "Pass",
        notes: "Clear and accessible",
      },
      {
        item_name: "First Aid Kit",
        status: "Fail",
        notes: "Needs restocking",
      },
    ],
  });
});
```

### Dynamic Repeat Management

```javascript
let repeatIndex = 0;

function addInspectionItem() {
  webform
    .addRepeat({
      questionName: "inspection_items",
      count: 1,
      questionValues: [
        {
          item_name: document.getElementById("itemName").value,
          status: document.getElementById("status").value,
          notes: document.getElementById("notes").value,
        },
      ],
    })
    .then(() => {
      repeatIndex++;
      console.log("Added item:", repeatIndex);
      clearForm();
    });
}

function removeLastItem() {
  webform.getRepeatCount("inspection_items").then((count) => {
    if (count > 0) {
      webform.deleteRepeat({
        questionName: "inspection_items",
        index: count - 1,
      });
    }
  });
}
```

## Geometry and Location

### Set User's Current Location

```javascript
webform.on("formLoaded", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        webform.setGeopoint({
          x: position.coords.longitude,
          y: position.coords.latitude,
          z: position.coords.altitude,
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
      },
    );
  }
});
```

### Set Predefined Location

```javascript
webform.on("formLoaded", () => {
  // Set office location
  webform.setGeopoint({
    x: -118.2437, // Los Angeles longitude
    y: 34.0522, // Los Angeles latitude
  });
});
```

### Set Polygon Geometry

```javascript
webform.on("formLoaded", () => {
  // Define service area
  webform.setGeometry({
    rings: [
      [
        [-118.3, 34.1],
        [-118.2, 34.1],
        [-118.2, 34.0],
        [-118.3, 34.0],
        [-118.3, 34.1],
      ],
    ],
  });
});
```

### Map Click → Survey Integration

A common pattern: click on an ArcGIS map to set the survey's geopoint and fill related text fields simultaneously.

```javascript
// Combined: setGeopoint + setQuestionValue on map click
mapView.on("click", (event) => {
  const lat = Math.round(event.mapPoint.latitude * 1e6) / 1e6;
  const lng = Math.round(event.mapPoint.longitude * 1e6) / 1e6;

  // 1. Set the geopoint/location question (x = longitude, y = latitude)
  webform.setGeopoint({ x: lng, y: lat });

  // 2. Fill text fields with coordinate info
  webform.setQuestionValue({
    location_info: `Lat: ${lat}, Lng: ${lng}`,
    nearest_city: findNearestCity(lat, lng),
  });
});
```

### Monitor Value Changes with questionValueChanged

Use the `questionValueChanged` event to track all field changes. The `trigger` field distinguishes user input from API-driven changes.

```javascript
webform.on("questionValueChanged", (data) => {
  // data.field   - question field name
  // data.value   - new value
  // data.trigger - "user" (manual input) or "api" (setQuestionValue/setGeopoint)
  // data.path    - full path to the question
  // data.formId  - survey item ID
  console.log(`[${data.trigger}] ${data.field} = ${JSON.stringify(data.value)}`);
});
```

## Multi-page Navigation

### Navigate Through Pages

```javascript
let currentPage = 0;

webform.on("formLoaded", () => {
  webform.getPages().then((pages) => {
    console.log(`Total pages: ${pages.total}`);
  });
});

function nextPage() {
  webform.getPages().then((pages) => {
    if (currentPage < pages.total - 1) {
      currentPage++;
      webform.goToPage(currentPage);
    }
  });
}

function previousPage() {
  if (currentPage > 0) {
    currentPage--;
    webform.goToPage(currentPage);
  }
}
```

## Conditional Logic

### Show/Hide Questions Based on Values

```javascript
webform.on("questionValueChanged", (data) => {
  // Use data.field to identify which question changed
  if (data.field === "has_pets") {
    // Only react to changes triggered by the user
    if (data.trigger === "user") {
      if (data.value === "yes") {
        webform.expand("pet_details");
      } else {
        webform.collapse("pet_details");
        webform.setQuestionValue({ pet_type: null, pet_count: null });
      }
    }
  }
});
```

### Calculate Values

```javascript
webform.on("questionValueChanged", (data) => {
  // Check if either of the target fields changed
  if (data.field === "quantity" || data.field === "unit_price") {
    webform.getQuestionValue().then((values) => {
      const total = (values.quantity || 0) * (values.unit_price || 0);
      webform.setQuestionValue({ total_price: total });
    });
  }
});
```

## Inspecting Form Definition

### Recursive Question Search (By Name)

Since `getQuestions()` only returns top-level nodes, use this recursive pattern to find a specific question anywhere in the form.

```javascript
function findQuestionByName(questions, name) {
  for (const q of questions) {
    if (q.name === name) return q;
    if (q.questions && Array.isArray(q.questions)) {
      const found = findQuestionByName(q.questions, name);
      if (found) return found;
    }
  }
  return null;
}

webform.on("formLoaded", () => {
  const allQuestions = webform.getQuestions();
  const target = findQuestionByName(allQuestions, "untitlit_question_1");

  if (target) {
    webform.setQuestionValue({ untitlit_question_1: "Value" });
  }
});
```

### Get Question Names and Types

```javascript
webform.setOnFormLoaded(() => {
  const form = webform.getForm();
  console.log("Form Version:", form.version);

  form.questions.forEach((q, index) => {
    console.log(`Question ${index + 1}: ${q.name} (${q.type})`);
    if (q.choices && q.choices.items) {
      console.log("Choices:", q.choices.items.map((c) => c.label).join(", "));
    }
  });
});
```

### Check for Required Fields

```javascript
webform.setOnFormLoaded(() => {
  const form = webform.getForm();
  const requiredFields = form.questions
    .filter((q) => q.isRequired === true)
    .map((q) => q.name);

  console.log("Required fields to fill:", requiredFields);
});
```

## AI Assistant Integration

### OpenAI Text Analysis

Enhance your survey with AI by sending user input to an LLM for analysis, summarization, or translation, and populating other fields with the result.

```javascript
const CONFIG = {
  openaiKey: "YOUR_OPENAI_API_KEY",
  endpoint: "https://api.openai.com/v1/chat/completions",
};

webform.on("questionValueChanged", async (data) => {
  // Trigger only on user input to 'user_comments' field
  if (data.field === "user_comments" && data.trigger === "user") {
    // Show a loading indicator (optional: using a temporary value)
    webform.setQuestionValue({ ai_summary: "Generating summary..." });

    try {
      const response = await fetch(CONFIG.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CONFIG.openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "Summarize the following text in one sentence.",
            },
            { role: "user", content: data.value },
          ],
        }),
      });

      const result = await response.json();
      const summary = result.choices[0].message.content;

      // Populate the summary field
      webform.setQuestionValue({ ai_summary: summary });
    } catch (error) {
      console.error("AI Error:", error);
      webform.setQuestionValue({ ai_summary: "Error generating summary." });
    }
  }
});
```

## Multi-language Switching

### Build a Language Dropdown

**IMPORTANT**: Get locales from `data.form.locales` in the `formLoaded` event. Pass `locale.code` to `setLanguage()`.

```javascript
webform.on("formLoaded", (data) => {
  const locales = data.form.locales || [];
  // locales example:
  // [{ code: "en-us", isDefault: true, label: "English" },
  //  { code: "es-mx", label: "Español-México" }]

  const select = document.querySelector("#languageSelect");
  locales.forEach((locale) => {
    const option = document.createElement("option");
    option.value = locale.code;
    option.textContent = locale.label;
    if (locale.isDefault) option.selected = true;
    select.appendChild(option);
  });
});

document.querySelector("#languageSelect").addEventListener("change", (e) => {
  webform.setLanguage(e.target.value); // e.g. "es-mx"
});
```

## Styling and Theming

### Custom Theme

> **Note:** `setTheme` and `setStyle` only support **HEX** color codes (e.g., `#003366`). Do not use `rgba()` or color names.

```javascript
const webform = new Survey123WebForm({
  clientId: "YOUR_CLIENT_ID",
  container: "surveyDiv",
  itemId: "YOUR_SURVEY_ID",
});

webform.setTheme({
  header: {
    backgroundColor: "#003366",
    textColor: "#ffffff",
  },
  form: {
    backgroundColor: "#f8f8f8",
    textColor: "#333333",
    primaryColor: "#0079c1",
    primaryTextColor: "#ffffff",
    inputBackgroundColor: "#ffffff",
    inputTextColor: "#000000",
  },
  webpage: {
    backgroundColor: "#eef2f5",
  },
});
```

### Custom CSS Styles

```javascript
webform.setStyle({
  ".esri-survey__header": {
    backgroundColor: "#003366",
    color: "#ffffff",
    padding: "20px",
    fontSize: "24px",
  },
  ".esri-survey__button--submit": {
    backgroundColor: "#28a745",
    color: "#ffffff",
    borderRadius: "5px",
    padding: "10px 20px",
  },
});
```

### Responsive Design

```html
<style>
  #surveyContainer {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }

  @media (max-width: 768px) {
    #surveyContainer {
      padding: 10px;
    }
  }
</style>

<div id="surveyContainer">
  <div id="surveyDiv"></div>
</div>
```
