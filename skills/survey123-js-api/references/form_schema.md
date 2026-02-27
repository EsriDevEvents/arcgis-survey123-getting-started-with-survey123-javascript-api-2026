# Survey Definition (form.json) Schema

The `form.json` object defines the complete structure, behavior, and appearance of a Survey123 form. You can retrieve this object using `webform.getForm()`.

## Core Properties

- `portalUrl`: ArcGIS Online or Enterprise portal URL.
- `layerName`: The name of the feature layer for the survey.
- `header`: Object with `content` (HTML string) and `isVisible` (boolean).
- `subHeader`: Object with `content` (HTML string) and `isVisible` (boolean).
- `submit`: Object with `buttonText`.
- `footer`: Object with `content` (HTML string) and `isVisible` (boolean).
- `version`: Survey123 version (e.g., "3.23").
- `locales`: Array of locale objects (e.g., `[{ "code": "en", "label": "English", "isDefault": true }]`).

## Questions Hierarchy

**IMPORTANT**: `form.questions` is a hierarchical structure. Questions can be nested within layout elements like **pages** (`page`) or **groups** (`esriQuestionTypeGroup`).

- The top-level `questions` array only contains direct children.
- If a question node has a `questions` property (e.g., a Page or a Group), it contains nested questions.
- When searching for a specific question by name, you must implement a **recursive search** to traverse the entire tree.

## Common Question Properties

- `id`: Unique identifier (string).
- `name`: Field name for the question (system name).
- `type`: The question type (see [Question Types](#question-types)).
- `label`: Display title for the question.
- `description`: Optional help text (supports HTML).
- `defaultValue`: Initial value for the question.
- `isRequired`: Boolean or XLSForm expression string.
- `readOnly`: Object with `expression`.
- `calculation`: Object with `expression`.
- `visibility`: Object with `expression`.
- `relevant`: Object with `type` (usually "xlsform") and `expression` (skip logic).
- `isCachedAnswer`: Boolean (cache answer for local storage).
- `appearance`: Object with `layout` options.
- `validation`: Object for constraints and masks.

## Question Types

| Type                           | Description                       |
| :----------------------------- | :-------------------------------- |
| `esriQuestionTypeText`         | Single-line text input.           |
| `esriQuestionTypeTextArea`     | Multi-line text area.             |
| `esriQuestionTypeSingleChoice` | Radio buttons / single selection. |
| `esriQuestionTypeMultiChoice`  | Checkboxes / multiple selection.  |
| `esriQuestionTypeDropdown`     | Select menu.                      |
| `esriQuestionTypeNumber`       | Numeric input.                    |
| `esriQuestionTypeDate`         | Date picker.                      |
| `esriQuestionTypeTime`         | Time picker.                      |
| `esriQuestionTypeDateTime`     | Date and time picker.             |
| `esriQuestionTypeGeoPoint`     | Map location (Point).             |
| `esriQuestionTypePolyline`     | Map line (Polyline).              |
| `esriQuestionTypePolygon`      | Map area (Polygon).               |
| `esriQuestionTypeImage`        | Image upload / Camera.            |
| `esriQuestionTypeAudio`        | Audio recording / upload.         |
| `esriQuestionTypeFile`         | General file upload.              |
| `esriQuestionTypeGroup`        | Group of questions.               |
| `esriQuestionTypeNote`         | Read-only information note.       |
| `esriQuestionTypeRating`       | Star or image rating.             |
| `esriQuestionTypeLikert`       | Likert scale.                     |
| `esriQuestionTypeSignature`    | Signature pad.                    |
| `esriQuestionTypeRanking`      | Drag-to-rank items.               |
| `esriQuestionTypeSlider`       | Numeric slider.                   |
| `esriQuestionTypeBarcode`      | Barcode scanner.                  |
| `esriQuestionTypeAddress`      | Geocoding address input.          |

## Advanced Field Examples

### Choices (Single/Multi/Dropdown)

```json
"choices": {
  "items": [
    { "label": "Label 1", "value": "val1" },
    { "label": "Label 2", "value": "val2" }
  ],
  "other": {
    "isEnabled": true,
    "label": "Other",
    "value": "other",
    "name": "other_field"
  }
}
```

### Map Question (GeoPoint/Polyline/Polygon)

```json
"mapTools": ["zoom", "home"],
"displayFormats": ["DD", "DMS", "UTM"],
"defaultMap": { "type": "webmap", "itemId": "..." },
"deviceLocation": { "trigger": "interaction" }
```

### Validation

```json
"validation": {
  "constraint": {
    "expression": "string-length(${question1}) >= 1",
    "message": "Too short!"
  },
  "inputMask": ">AAA-AAA-AAA;_"
}
```

## Settings Schema

- `valueUpdateTrigger`: e.g., "onBlur".
- `thankYouScreenContent`: HTML for success message.
- `instanceName`: Template for record name (e.g., "${name_field}").
- `multiSubmissionsInfo`: Restriction settings (`maxAllowed`, `autoReload`, etc.).
- `openStatusInfo`: Schedule settings (`status`: "open/closed/scheduled").
- `captcha`: Object for enabling/configuring CAPTCHA.
- `notificationsInfo`: Webhook configurations.

## Themes Schema

Defines colors and images for `header`, `form`, and `webpage`.

```json
"themes": [{
  "name": "custom-theme",
  "header": { "backgroundColor": "#ff9900", "textColor": "#000000" },
  "form": { "primaryColor": "#ff9900", "backgroundColor": "#ffffff" }
}]
```
