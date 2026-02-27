# API Methods Reference

Complete reference for Survey123WebForm class methods.

## Table of Contents

- [Constructor](#constructor)
- [Event Handling (.on / .off)](#event-handling-on--off)
- [Form Lifecycle (Legacy)](#form-lifecycle-legacy)
- [Question Methods](#question-methods)
- [Repeat Methods](#repeat-methods)
- [Geometry Methods](#geometry-methods)
- [Navigation Methods](#navigation-methods)
- [Configuration Methods](#configuration-methods)
- [Utility Methods](#utility-methods)

## Constructor

### `new Survey123WebForm(options)`

Create a Survey123WebForm instance.

**Parameters:**

- `options`: Survey123WebFormOptions object

**Example:**

```javascript
const webform = new Survey123WebForm({
  clientId: "ABC1234567890",
  container: "formDiv",
  itemId: "129132bbedcb490488a162aa996b12323",
});
```

## Event Handling (.on / .off)

Modern event handling system (supported in version ≥ 3.14). This is the **standard way** to register listeners.

### `on(eventName, callback)`

Register an event listener.

**Parameters:**

- `eventName: string` - The name of the event to listen for.
- `callback: (data) => void` - The function to execute when the event fires.

**Supported Events:**

- `'formLoaded'`: Triggered when the form is fully loaded.
- `'formFailed'`: Triggered if the form fails to load or submit.
- `'submit'`: Triggered before the form is submitted (return `false` to prevent).
- `'submitted'`: Triggered after successful submission.
- `'questionValueChanged'`: Triggered when any question value changes.
  - **Callback Object**:
    ```javascript
    {
      field: string,   // The name of the question that changed
      formId: string,  // The Survey123 form item ID
      path: string,    // The full path to the question (useful for nested forms)
      trigger: string, // The method that triggered the change (e.g., "user", "api")
      type: string,    // The type of change
      value: any       // The new value of the question
    }
    ```
- `'questionValidated'`: Triggered when a question is validated.
- `'formResized'`: Triggered when the iframe size changes.
- `'repeatIndexChanged'`: Triggered when the active repeat index changes.
- `'propertyChanged'`: Triggered when a form property changes.

**Example:**

```javascript
webform.on("formLoaded", (data) => {
  console.log("Form loaded!", data);
});

webform.on("submitted", (response) => {
  window.location.href = "/success";
});
```

### `off(eventName, callback)`

Remove a previously registered event listener.

**Parameters:**

- `eventName: string`
- `callback: function` - Reference to the original callback function.

**Example:**

```javascript
const onResize = (size) => console.log(size);
webform.on("formResized", onResize);
// Later...
webform.off("formResized", onResize);
```

## Form Lifecycle (Legacy)

> [!WARNING]
> These `setOn...` methods are **deprecated** in favor of the modern `.on()` and `.off()` API. Use `.on(eventName, callback)` instead.

### `setOnFormLoaded(callback)`

_Deprecated_. Use `.on('formLoaded', callback)`.

**Parameters:**

- `callback: (form) => void`

**Example:**

```javascript
webform.setOnFormLoaded((form) => {
  console.log("Form loaded:", form);
  // Pre-populate fields
  webform.setQuestionValue({ name: "John" });
});
```

### `setOnFormFailed(callback)`

_Deprecated_. Use `.on('formFailed', callback)`.

**Parameters:**

- `callback: (error) => void`

**Example:**

```javascript
webform.setOnFormFailed((error) => {
  console.error("Form error:", error);
});
```

### `setOnFormSubmit(callback)`

_Deprecated_. Use `.on('submit', callback)`.

**Parameters:**

- `callback: (data) => boolean | void`

**Example:**

```javascript
webform.setOnFormSubmit((data) => {
  if (!validateData(data)) {
    alert("Please check your inputs");
    return false; // Prevent submission
  }
});
```

### `setOnFormSubmitted(callback)`

_Deprecated_. Use `.on('submitted', callback)`.

**Parameters:**

- `callback: (response) => void`

**Example:**

```javascript
webform.setOnFormSubmitted((response) => {
  console.log("Submitted:", response);
  window.location.href = "/thank-you";
});
```

### `setOnFormResized(callback)`

_Deprecated_. Use `.on('formResized', callback)`.

**Parameters:**

- `callback: (size) => void`

**Example:**

```javascript
webform.setOnFormResized((size) => {
  console.log("New size:", size);
});
```

### `setOnQuestionValueChanged(callback)`

_Deprecated_. Use `.on('questionValueChanged', callback)`.

**Parameters:**

- `callback: (data) => void`

**Example:**

```javascript
webform.on("questionValueChanged", (data) => {
  console.log(
    `Question "${data.field}" changed by ${data.trigger} to:`,
    data.value,
  );
  console.log(`Path: ${data.path}, Form ID: ${data.formId}`);
});
```

### `setOnQuestionValidated(callback)`

_Deprecated_. Use `.on('questionValidated', callback)`.

**Parameters:**

- `callback: (data) => void`

**Example:**

```javascript
webform.setOnQuestionValidated((data) => {
  if (!data.valid) {
    console.log("Validation error:", data.error);
  }
});
```

## Question Methods

### `getQuestions()`

Get all questions in JSON format.

**Returns:** `any[]`

**IMPORTANT**: This returns only **top-level** nodes (including pages and groups). Nested questions must be found by recursing into child nodes that have a `questions` property.

**Example:**

```javascript
const topLevelQuestions = webform.getQuestions();
console.log(topLevelQuestions);
```

### `getQuestionValue()`

Get current question values.

**Returns:** `Promise<QuestionValue>`

**Example:**

```javascript
webform.getQuestionValue().then((values) => {
  console.log("Current values:", values);
});
```

### `setQuestionValue(value)`

Set question values dynamically. Set to `null` to clear.

**Parameters:**

- `value: object` - Key-value pairs of question names and values

**Example:**

```javascript
webform.setQuestionValue({
  name: "Jane Doe",
  email: "jane@example.com",
  age: 30,
});

// Clear a value
webform.setQuestionValue({ name: null });
```

### `scrollTo(name)`

Scroll to a specific question.

**Parameters:**

- `name: string` - Question name

**Example:**

```javascript
webform.scrollTo("email");
```

## Repeat Methods

### `addRepeat(options)`

Add repeat records.

**Parameters:**

- `options.questionName: string` - Repeat question name
- `options.count?: number` - Number of records to add
- `options.questionValues?: any[]` - Values for each record

**Returns:** `Promise<any>`

**Example:**

```javascript
webform.addRepeat({
  questionName: "CapturedFish",
  count: 2,
  questionValues: [
    {
      Species: "Mooneye",
      FishSize: 10,
      condition: "good",
      fishPosition: { x: 151.123, y: 13.123 },
    },
    {
      Species: "Paddlefish",
      FishSize: 20,
      condition: "normal",
      fishPosition: { x: 101.123, y: 29.123 },
    },
  ],
});
```

### `deleteRepeat(options)`

Delete repeat records.

**Parameters:**

- `options.questionName: string` - Repeat question name
- `options.index: number` - Index of record to delete

**Returns:** `Promise<any>`

**Example:**

```javascript
webform.deleteRepeat({
  questionName: "CapturedFish",
  index: 0,
});
```

### `getRepeatCount(questionName)`

Get count of records in repeat question.

**Parameters:**

- `questionName: string`

**Returns:** `Promise<number>`

**Example:**

```javascript
webform.getRepeatCount("CapturedFish").then((count) => {
  console.log("Repeat count:", count);
});
```

## Geometry Methods

### `setGeopoint(geopoint)`

Set geopoint question value. Set to `null` to clear.

**Parameters:**

- `geopoint: { x: number, y: number, z?: number }` - Coordinates

**Example:**

```javascript
webform.setGeopoint({
  x: -118.2437, // Longitude
  y: 34.0522, // Latitude
  z: 100, // Altitude (optional)
});
```

### `setGeometry(geometry)`

Set map question geometry. Supports GeoJSON, Esri Geometry, or XLSForm formats. Set to `null` to clear.

**Parameters:**

- `geometry: object` - Geometry object

**Example:**

```javascript
// Esri Geometry format
webform.setGeometry({
  rings: [
    [
      [86.0625, 56.927],
      [109.6875, 53.7292],
      [100.6875, 50.2683],
      [82.6875, 49.5437],
      [86.0625, 56.927],
    ],
  ],
});

// GeoJSON format
webform.setGeometry({
  type: "Polygon",
  coordinates: [
    [
      [86.0625, 56.927],
      [109.6875, 53.7292],
      [100.6875, 50.2683],
      [82.6875, 49.5437],
      [86.0625, 56.927],
    ],
  ],
});
```

### `associateMapDrawStart(options?)`

Start editing associate map.

**Parameters:**

- `options?: OnAssociateMapDrawStartedData`

**Example:**

```javascript
webform.associateMapDrawStart();
```

### `associateMapDrawComplete(options?)`

Complete editing associate map.

**Parameters:**

- `options?: OnAssociateMapDrawCompletedData`

**Example:**

```javascript
webform.associateMapDrawComplete({
  rings: [
    [
      [86.0625, 56.927],
      [109.6875, 53.7292],
      [100.6875, 50.2683],
      [82.6875, 49.5437],
      [86.0625, 56.927],
    ],
  ],
});
```

## Navigation Methods

### `getPages()`

Get current pages information.

**Returns:** `Promise<FormPagesInfo>`

**Example:**

```javascript
webform.getPages().then((pages) => {
  console.log("Total pages:", pages.total);
  console.log("Current page:", pages.current);
});
```

### `goToPage(pageIndex)`

Navigate to specified page.

**Parameters:**

- `pageIndex: number` - Page index (0-based)

**Returns:** `Promise<GoToPageResultInfo>`

**Example:**

```javascript
webform.goToPage(2).then((result) => {
  console.log("Navigated to page:", result.pageIndex);
});
```

### `expand(name)`

Expand group or repeat question.

**Parameters:**

- `name: string` - Question name

**Example:**

```javascript
webform.expand("addressGroup");
```

### `collapse(name)`

Collapse group or repeat question.

**Parameters:**

- `name: string` - Question name

**Example:**

```javascript
webform.collapse("addressGroup");
```

## Configuration Methods

### `setCredential(credential)`

Set authentication credential.

**Parameters:**

- `credential.token: string` - Access token
- `credential.server: string` - Server URL

**Example:**

```javascript
webform.setCredential({
  token: "YOUR_ACCESS_TOKEN",
  server: "https://www.arcgis.com/sharing/rest",
});
```

### `setItemId(itemId)`

Set survey item ID. IFrame will be reloaded.

**Parameters:**

- `itemId: string`

**Example:**

```javascript
webform.setItemId("NEW_SURVEY_ITEM_ID");
```

### `setMode(options)`

Set form mode.

**Parameters:**

- `options.mode: string` - Valid values: `'new'`, `'edit'`, `'view'`

**Example:**

```javascript
webform.setMode({ mode: "edit" });
```

### `setLanguage(language)`

Change form language (multilingual surveys only).

**Parameters:**

- `language: string` - Language code

**Example:**

```javascript
webform.setLanguage("es");
```

### `getLanguages()`

Get available languages.

**Returns:** `Promise<any[]>` - Array of locale objects: `{ code: string, label: string, isDefault?: boolean, isCustomLocale?: boolean, isActive?: boolean }`

**IMPORTANT**: The **recommended** way to get language list is from `formLoaded` event's `data.form.locales`, which is available synchronously after form load. Use `locale.code` (e.g., `"en-us"`, `"es-mx"`, `"ja"`) as the value for `setLanguage()`.

**Example:**

```javascript
// Recommended: get locales from formLoaded event
webform.on("formLoaded", (data) => {
  const locales = data.form.locales || [];
  // [{ code: "en-us", isDefault: true, label: "English" },
  //  { code: "es-mx", label: "Español-México" }]
  locales.forEach((locale) => {
    console.log(`${locale.label} (${locale.code})`);
  });
});

// Alternative: use getLanguages() method
webform.getLanguages().then((languages) => {
  console.log("Available languages:", languages);
});
```

### `setTheme(theme)`

Set form theme.

**Parameters:**

- `theme: object` - Theme configuration
- **IMPORTANT**: All color values must be in **HEX** format (e.g., `#FFFFFF`, `#000000`). RGBA or named colors are not supported.

**Example:**

```javascript
webform.setTheme({
  header: {
    backgroundColor: "#25838f",
    textColor: "#ffffff",
  },
  form: {
    backgroundColor: "#143438",
    backgroundOpacity: 1,
    backgroundImage: "image url",
    backgroundImageFit: "repeat | repeatY | fit | center",
    textColor: "#ffffff",
    primaryColor: "#25838f",
    primaryTextColor: "#ffffff",
    inputTextColor: "#505050",
    inputBackgroundColor: "#ffffff",
  },
  webpage: {
    backgroundColor: "#005d65",
    backgroundImageFit: "fill | fit | repeat | center",
    backgroundImage: "image url",
  },
});
```

### `setStyle(styleObj)`

Set CSS style using JSS syntax.

**Parameters:**

- `styleObj: object` - JSS style object
- **IMPORTANT**: All color values must be in **HEX** format.

**Example:**

```javascript
webform.setStyle({
  ".esri-survey__header": {
    backgroundColor: "#003366",
    color: "#ffffff",
  },
});
```

## Utility Methods

### `getForm()`

Get survey form object. Only available after `onFormLoaded()`.

**Returns:** `Form` (See [form_schema.md](form_schema.md) for details)

**IMPORTANT**: The `form.questions` array contains only **top-level** nodes. You must traverse it recursively to find nested questions.

**Example:**

```javascript
webform.setOnFormLoaded(() => {
  const form = webform.getForm();
  console.log("Top-level items:", form.questions.length);
});
```

### `getContainer()`

Get container element.

**Returns:** `any`

**Example:**

```javascript
const container = webform.getContainer();
```

### `getItemId()`

Get current survey item ID.

**Returns:** `string`

**Example:**

```javascript
const itemId = webform.getItemId();
console.log("Survey ID:", itemId);
```

### `getOptions(key?)`

Get configuration options.

**Parameters:**

- `key?: string` - Optional specific option key

**Returns:** `any`

**Example:**

```javascript
const allOptions = webform.getOptions();
const clientId = webform.getOptions("clientId");
```

### `submitForm()`

Programmatically submit the form.

**Example:**

```javascript
webform.submitForm();
```

### `validateForm()`

Validate form without submitting.

**Returns:** `Promise<any>`

**Example:**

```javascript
webform.validateForm().then((result) => {
  if (result.valid) {
    console.log("Form is valid");
  } else {
    console.log("Validation errors:", result.errors);
  }
});
```

### `copyFeature(globalId)`

Clone a new form populated with existing entry.

**Parameters:**

- `globalId: string` - Global ID of existing entry

**Example:**

```javascript
webform.copyFeature("{12345678-1234-1234-1234-123456789012}");
```
