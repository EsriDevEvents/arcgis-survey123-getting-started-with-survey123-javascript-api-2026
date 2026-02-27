# Survey123WebFormOptions Reference

Complete reference for all constructor options when creating a `Survey123WebForm` instance.

## Usage

```javascript
const webform = new Survey123WebForm({
  clientId: "YOUR_CLIENT_ID",
  container: "surveyDiv",
  itemId: "YOUR_SURVEY_ITEM_ID",
  // ... other options
});
```

## Properties

### Required

#### `container`

- **Type:** `string | HTMLElement`
- **Description:** The HTML element that contains the web form, typically a DIV. Can be an element ID string or a DOM element reference.

```javascript
// By ID
{ container: "surveyDiv" }

// By element reference
{ container: document.getElementById("surveyDiv") }
```

#### `itemId`

- **Type:** `string`
- **Description:** The ItemId of the Survey123 web form to load from ArcGIS Online or Portal.

```javascript
{ itemId: "129132bbedcb490488a162aa996b12323" }
```

### Authentication

#### `clientId`

- **Type:** `string`
- **Description:** _(Deprecated)_ Client ID registered on ArcGIS for Developers for domain authorization. Used for OAuth authentication flow.

```javascript
{ clientId: "ABC1234567890" }
```

#### `token`

- **Type:** `string`
- **Description:** Access token for authenticated (private or org-shared) surveys. Required when the survey is not public.

```javascript
{ token: "YOUR_ACCESS_TOKEN" }
```

#### `credential`

- **Type:** `object`
- **Description:** Authentication credential object. Has **higher priority** than `token` when both are provided. Use for more complex authentication scenarios.

```javascript
{
  credential: {
    token: "YOUR_ACCESS_TOKEN",
    server: "https://www.arcgis.com/sharing/rest"
  }
}
```

### Form Configuration

#### `portalUrl`

- **Type:** `string`
- **Default:** `"https://www.arcgis.com"`
- **Description:** ArcGIS portal URL. Set this when using ArcGIS Enterprise or a custom portal.

```javascript
{ portalUrl: "https://your-portal.example.com/portal" }
```

#### `mode`

- **Type:** `string`
- **Description:** Sets the mode of the web form. Valid values: `"edit"`, `"view"`, `"copy"`.
  - `"edit"`: Edit an existing record (requires `globalId` or `objectId`)
  - `"view"`: View-only mode for an existing record
  - `"copy"`: Copy mode to clone an existing record

```javascript
{ mode: "edit", globalId: "{12345678-1234-1234-1234-123456789012}" }
```

#### `globalId`

- **Type:** `string`
- **Since:** version >= 3.9
- **Description:** Global ID of an existing record. Used with `mode` to edit, view, or copy a specific record.

```javascript
{
  mode: "edit",
  globalId: "{12345678-1234-1234-1234-123456789012}"
}
```

#### `objectId`

- **Type:** `string`
- **Description:** Object ID of an existing record. Used with `mode` for versions <= 3.9. For newer versions, prefer `globalId`.

```javascript
{
  mode: "edit",
  objectId: "42"
}
```

#### `questionValue`

- **Type:** `object`
- **Description:** Sets question values upon form loading using field name references. This pre-populates the form with the specified values.

```javascript
{
  questionValue: {
    name: "John Doe",
    email: "john@example.com",
    department: "Engineering"
  }
}
```

#### `defaultQuestionValue`

- **Type:** `object`
- **Deprecated:** Since version 3.14. Use `questionValue` instead.
- **Description:** Sets default question values upon form loading.

### Display Options

#### `width`

- **Type:** `number`
- **Description:** Survey width. If value > 1, it is treated as pixels (minimum 660px). If value is between 0 and 1, it is treated as a fraction of the screen width.

```javascript
// Fixed width in pixels
{ width: 800 }

// 80% of screen width
{ width: 0.8 }
```

#### `hideElements`

- **Type:** `string[]`
- **Description:** Elements to hide in the form UI. Supported values include:
  - `"navbar"` - Navigation bar
  - `"theme"` - Theme styling
  - `"header"` - Form header
  - `"description"` - Form description
  - `"footer"` - Form footer
  - `"submit"` - Submit button

```javascript
// Hide header and footer
{ hideElements: ["header", "footer"] }

// Hide navigation bar and submit button
{ hideElements: ["navbar", "submit"] }
```

### Submission

#### `autoRefresh`

- **Type:** `number`
- **Description:** Enable auto-refresh of the survey after successful submission. Value is the number of seconds to wait before refreshing.

```javascript
// Auto refresh after 3 seconds
{ autoRefresh: 3 }
```

#### `isDisabledSubmitToFeatureService`

- **Type:** `boolean`
- **Default:** `false`
- **Description:** When set to `true`, prevents data from being submitted to the feature service. Useful for preview/testing scenarios or when you want to handle submission externally.

```javascript
{ isDisabledSubmitToFeatureService: true }
```

### Versioning

#### `version`

- **Type:** `string`
- **Default:** `"latest"`
- **Description:** Locks the API to a specific version. Use `"latest"` for the most recent version.

```javascript
{ version: "3.23" }
```

#### `jsApiVersion`

- **Type:** `string`
- **Default:** `"latest"`
- **Description:** Sets the JS API version to use. Defaults to `"latest"`.

```javascript
{ jsApiVersion: "3.22" }
```

### Advanced

#### `instanceId`

- **Type:** `string`
- **Description:** Marks different webform instances when embedding multiple surveys on the same page. Each instance should have a unique `instanceId`.

```javascript
// First survey
new Survey123WebForm({
  container: "survey1",
  itemId: "SURVEY_1_ID",
  instanceId: "instance-1"
});

// Second survey on same page
new Survey123WebForm({
  container: "survey2",
  itemId: "SURVEY_2_ID",
  instanceId: "instance-2"
});
```

#### `host`

- **Type:** `string`
- **Description:** Host URL used in IE and Edge browsers for sending messages to the parent domain. Only needed for legacy browser support.

```javascript
{ host: "https://yourapp.example.com" }
```

### Constructor Callbacks

These callbacks can be set directly in the constructor options as an alternative to using `.on()` or `.setOn...()` after initialization.

#### `onFormLoaded`

- **Type:** `(data) => void`
- **Description:** Callback invoked when the form is fully loaded. Receives form data, content height, and version.

```javascript
{
  onFormLoaded: (data) => {
    console.log("Form loaded:", data);
  }
}
```

#### `onFormSubmit`

- **Type:** `(data) => boolean | void`
- **Since:** version >= 3.22
- **Description:** Callback invoked when form submission starts. Return `false` to prevent submission.

```javascript
{
  onFormSubmit: (data) => {
    if (!isValid(data)) return false;
  }
}
```

#### `onFormSubmitted`

- **Type:** `(response) => void`
- **Description:** Callback invoked upon successful form submission.

```javascript
{
  onFormSubmitted: (response) => {
    console.log("Submitted:", response.globalId);
  }
}
```

#### `onFormResized`

- **Type:** `(size) => void`
- **Description:** Callback invoked when the form iframe is resized.

```javascript
{
  onFormResized: (size) => {
    console.log("New height:", size.contentHeight);
  }
}
```

#### `onQuestionValueChanged`

- **Type:** `(data) => void`
- **Description:** Callback invoked when any question value changes.

```javascript
{
  onQuestionValueChanged: (data) => {
    console.log(`${data.field} changed to:`, data.value);
  }
}
```

#### `onQuestionValidated`

- **Type:** `(data) => void`
- **Description:** Callback invoked when question validation is triggered.

```javascript
{
  onQuestionValidated: (data) => {
    if (!data.valid) {
      console.log("Validation error:", data.error);
    }
  }
}
```

## Complete Example

```javascript
const webform = new Survey123WebForm({
  // Required
  container: "surveyDiv",
  itemId: "YOUR_SURVEY_ITEM_ID",

  // Authentication
  clientId: "YOUR_CLIENT_ID",
  token: "YOUR_ACCESS_TOKEN",
  portalUrl: "https://www.arcgis.com",

  // Display
  width: 800,
  hideElements: ["navbar", "footer"],

  // Pre-populate values
  questionValue: {
    name: "John Doe",
    email: "john@example.com",
  },

  // Submission
  autoRefresh: 3,

  // Callbacks
  onFormLoaded: (data) => {
    console.log("Form loaded:", data);
  },
  onFormSubmitted: (response) => {
    console.log("Submitted:", response);
  },
  onQuestionValueChanged: (data) => {
    console.log(`${data.field} = ${data.value}`);
  },
});
```
