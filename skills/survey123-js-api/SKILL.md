---
name: survey123-js-api
description: Embed ArcGIS Survey123 forms into web applications using the Survey123 Web Form JavaScript API. Use when users need to (1) embed Survey123 surveys in webpages, (2) interact with survey forms programmatically, (3) handle survey submissions and events, (4) set question values dynamically, (5) implement authentication for private/org-shared surveys, (6) customize survey appearance, (7) analyze or modify survey definitions (form.json), or (8) handle complex question types and validation.
---

# Survey123 JS API

Embed and interact with ArcGIS Survey123 forms in web applications using the Survey123 Web Form JavaScript API.

## Overview

The Survey123 JS API allows you to embed Survey123 surveys into webpages using only the ArcGIS Online form item ID. The API provides methods to control form behavior, handle events, and manage authentication.

## Quick Start

### Basic Embedding

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Survey123 Embed</title>
    <script src="https://survey123.arcgis.com/api/jsapi"></script>
  </head>
  <body>
    <div id="surveyDiv"></div>

    <script>
      const webform = new Survey123WebForm({
        clientId: "YOUR_CLIENT_ID",
        container: "surveyDiv",
        itemId: "YOUR_SURVEY_ITEM_ID",
      });
    </script>
  </body>
</html>
```

### Key Constructor Options

- `clientId`: OAuth client ID for authentication
- `container`: DOM element ID or element reference
- `itemId`: ArcGIS Online survey form item ID
- `token`: (Optional) Access token for authenticated surveys
- `portalUrl`: (Optional) Custom portal URL (defaults to ArcGIS Online)

## Authentication

### Built-in Authentication

The Survey123 JS API's embedded iframe automatically detects if a survey requires authentication. If the user is unauthenticated, it will display a **Sign In** button directly within the iframe. Clicking this button initiates the ArcGIS OAuth2 flow. This is the simplest way to handle authentication.

### Manual Authentication

If you need to handle authentication manually (e.g., to manage tokens yourself or for a custom UX), follow the OAuth 2.0 flow:

1. **Redirect to ArcGIS OAuth authorize page**
2. **Receive authorization code/token**
3. **Pass token to Survey123 API**

See [references/authentication.md](references/authentication.md) for a detailed guide on both automatic and manual authentication methods.

### Setting Credentials

```javascript
// After obtaining token
webform.setCredential({
  token: "YOUR_ACCESS_TOKEN",
  server: "https://www.arcgis.com/sharing/rest",
});
```

## Core Methods

### Form Lifecycle

- `on('formLoaded', callback)` - Triggered when form loads
- `on('submit', callback)` - Before form submission
- `on('submitted', callback)` - After successful submission
- `on('formFailed', callback)` - On form load/submit failure

### Question Interaction

- `setQuestionValue(value)` - Set question values dynamically
- `getQuestionValue()` - Get current question values
- `getQuestions()` - Get all questions in JSON format
- `scrollTo(questionName)` - Scroll to specific question

### Event Handling

```javascript
// Modern event handling (v3.14+)
webform.on("submit", (data) => {
  console.log("Form submitted:", data);
});

webform.off("submit", callback); // Remove listener
```

### Repeat Questions

- `addRepeat(options)` - Add repeat records
- `deleteRepeat(options)` - Delete repeat records
- `getRepeatCount(questionName)` - Get repeat count

### Geometry Questions

- `setGeopoint(geopoint)` - Set geopoint question value
- `setGeometry(geometry)` - Set map question geometry
- Supports GeoJSON, Esri Geometry, or XLSForm formats

## Common Patterns

### Pre-populate Survey

```javascript
webform.on("formLoaded", () => {
  webform.setQuestionValue({
    field_name: "John Doe",
    email: "john@example.com",
    location: { x: -118.2437, y: 34.0522 },
  });
});
```

### Handle Submission

```javascript
webform.on("submitted", (response) => {
  console.log("Submission successful:", response);
  // Redirect or show success message
});
```

### Multi-language Support

**IMPORTANT**: Get language list from `formLoaded` event's `data.form.locales`, NOT from `getLanguages()`.
Each locale object has `{ code, label, isDefault?, isCustomLocale?, isActive? }`.
Pass `locale.code` to `setLanguage()`.

```javascript
webform.on("formLoaded", (data) => {
  // Get locales from the form data - this is the reliable way
  const locales = data.form.locales || [];
  // Example: [{ code: "en-us", isDefault: true, label: "English" },
  //           { code: "es-mx", label: "Español-México" }]

  locales.forEach((locale) => {
    console.log(`${locale.label} (${locale.code})`);
  });
});

// Switch language using locale.code
webform.setLanguage("es-mx");
```

## Reference Documentation

- **[references/api_methods.md](references/api_methods.md)** - Complete API method reference
- **[references/authentication.md](references/authentication.md)** - OAuth authentication implementation
- **[references/form_schema.md](references/form_schema.md)** - Detailed form.json / Survey Definition schema
- **[references/examples.md](references/examples.md)** - Common use cases and code examples

## Resources

- [Official API Documentation](https://developers.arcgis.com/survey123/api-reference/web-app/)
- [Survey123WebFormOptions](https://developers.arcgis.com/survey123/api-reference/web-app/Survey123WebFormOptions/)
