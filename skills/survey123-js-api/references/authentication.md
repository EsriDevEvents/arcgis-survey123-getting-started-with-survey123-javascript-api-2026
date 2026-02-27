# Authentication Guide

## Authentication Options

### 1. Automatic Authentication (Preferred)

The Survey123 Web Form JS API handles authentication automatically by default. If the embedded survey is not public, the iframe will detect the access requirement and display a "Sign In" button for the user.

**How it works:**

- When the `Survey123WebForm` is initialized with a private `itemId`, the JS API attempts to load it.
- If it fails due to permissions, the API automatically renders a login prompt inside the container.
- No additional JavaScript logic for redirects or token handling is required by the developer for this basic use case.

### 2. Manual Authentication

If you want more control over the user experience (e.g., a custom login UI, managing tokens in `sessionStorage`, or sharing tokens with other ArcGIS components), you can implement a custom OAuth 2.0 flow.

### Prerequisites

1. **Create OAuth Credentials** in ArcGIS Online/Portal
   - Go to your ArcGIS developer dashboard
   - Create new OAuth 2.0 credentials
   - Set redirect URIs for your application
   - Note your `client_id`

### Implementation Steps

#### Step 1: Redirect to Authorization Page

```javascript
function initiateLogin() {
  const clientId = "YOUR_CLIENT_ID";
  const redirectUri = encodeURIComponent("https://yourapp.com/callback");
  const portalUrl = "https://www.arcgis.com";

  const authUrl =
    `${portalUrl}/sharing/rest/oauth2/authorize?` +
    `client_id=${clientId}&` +
    `response_type=token&` +
    `redirect_uri=${redirectUri}&` +
    `expiration=20160`; // Token expiration in minutes

  window.location.href = authUrl;
}
```

#### Step 2: Handle Callback and Extract Token

```javascript
// On your callback page
function getTokenFromHash() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);

  return {
    access_token: params.get("access_token"),
    expires_in: params.get("expires_in"),
    username: params.get("username"),
  };
}

const credentials = getTokenFromHash();
if (credentials.access_token) {
  // Store token securely
  sessionStorage.setItem("arcgis_token", credentials.access_token);
}
```

#### Step 3: Pass Token to Survey123

```javascript
const webform = new Survey123WebForm({
  clientId: "YOUR_CLIENT_ID",
  container: "surveyDiv",
  itemId: "YOUR_SURVEY_ITEM_ID",
  token: credentials.access_token,
});

// Or set credential after initialization
webform.setCredential({
  token: credentials.access_token,
  server: "https://www.arcgis.com/sharing/rest",
});
```

## Complete Example

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Authenticated Survey</title>
    <script src="https://survey123.arcgis.com/api/jsapi"></script>
  </head>
  <body>
    <div id="surveyDiv"></div>

    <script>
      const CLIENT_ID = "YOUR_CLIENT_ID";
      const SURVEY_ITEM_ID = "YOUR_SURVEY_ITEM_ID";
      const REDIRECT_URI = window.location.origin + "/callback.html";

      // Check if we have a token
      let token = sessionStorage.getItem("arcgis_token");

      if (!token) {
        // Check if we're on callback page with token in hash
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        token = params.get("access_token");

        if (token) {
          sessionStorage.setItem("arcgis_token", token);
          // Clean URL
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
        } else {
          // No token, redirect to login
          const authUrl =
            `https://www.arcgis.com/sharing/rest/oauth2/authorize?` +
            `client_id=${CLIENT_ID}&` +
            `response_type=token&` +
            `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
            `expiration=20160`;
          window.location.href = authUrl;
        }
      }

      // Initialize survey with token
      if (token) {
        const webform = new Survey123WebForm({
          clientId: CLIENT_ID,
          container: "surveyDiv",
          itemId: SURVEY_ITEM_ID,
          token: token,
        });

        webform.setOnFormFailed((error) => {
          console.error("Form failed:", error);
          // Token might be expired, clear and retry
          if (error.message.includes("token")) {
            sessionStorage.removeItem("arcgis_token");
            location.reload();
          }
        });
      }
    </script>
  </body>
</html>
```

## Token Management

### Token Expiration

Tokens expire based on the `expiration` parameter (in minutes). Handle expiration gracefully:

```javascript
webform.setOnFormFailed((error) => {
  if (
    error.message.includes("token") ||
    error.message.includes("unauthorized")
  ) {
    // Clear expired token
    sessionStorage.removeItem("arcgis_token");
    // Redirect to login
    initiateLogin();
  }
});
```

### Refresh Token

For long-running applications, implement token refresh:

```javascript
// Store token expiration time
const expiresAt = Date.now() + credentials.expires_in * 1000;
sessionStorage.setItem("token_expires_at", expiresAt);

// Check before using
function getValidToken() {
  const token = sessionStorage.getItem("arcgis_token");
  const expiresAt = sessionStorage.getItem("token_expires_at");

  if (Date.now() >= expiresAt) {
    // Token expired, need to re-authenticate
    sessionStorage.removeItem("arcgis_token");
    initiateLogin();
    return null;
  }

  return token;
}
```

## Security Best Practices

1. **Never expose client secret** in client-side code (use implicit flow with `response_type=token`)
2. **Use HTTPS** for all OAuth redirects
3. **Validate redirect URIs** in your OAuth credentials settings
4. **Store tokens securely** (sessionStorage for single session, avoid localStorage for sensitive data)
5. **Implement CSRF protection** using the `state` parameter
6. **Set appropriate token expiration** times

## CSRF Protection

```javascript
function initiateLogin() {
  // Generate random state
  const state = generateRandomString(32);
  sessionStorage.setItem("oauth_state", state);

  const authUrl =
    `https://www.arcgis.com/sharing/rest/oauth2/authorize?` +
    `client_id=${CLIENT_ID}&` +
    `response_type=token&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `state=${state}&` +
    `expiration=20160`;

  window.location.href = authUrl;
}

function handleCallback() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);

  const returnedState = params.get("state");
  const savedState = sessionStorage.getItem("oauth_state");

  if (returnedState !== savedState) {
    console.error("State mismatch - possible CSRF attack");
    return;
  }

  sessionStorage.removeItem("oauth_state");
  // Continue with token extraction
}

function generateRandomString(length) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
```

## Resources

- [ArcGIS Rest JS - Create OAuth Credentials for User Authentication](https://developers.arcgis.com/arcgis-rest-js/authentication/tutorials/create-oauth-credentials-for-user-authentication/)
- [ArcGIS OAuth 2.0 Documentation](https://developers.arcgis.com/documentation/security-and-authentication/user-authentication/oauth-credentials-user/location-platform/)
- [Survey123 JS API Reference](https://developers.arcgis.com/survey123/api-reference/web-app/)
