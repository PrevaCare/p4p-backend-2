# Boolean Feature API Postman Collection

This collection contains API endpoints for managing Boolean Features in the P4P Admin Backend system.

## Setup Instructions

1. Import the `BooleanFeature.postman_collection.json` file into Postman
2. Set up your environment variables:
   - `base_url`: The base URL of your API server (e.g., `http://localhost:5000`)
   - `token`: Your JWT authentication token

## Available Endpoints

The collection includes the following endpoints:

1. **Create Boolean Feature**

   - Method: POST
   - Endpoint: `{{base_url}}/admin/boolean-features`
   - Required fields: `name`
   - Optional fields: `status`, `type`, `subType`

2. **Get All Boolean Features**

   - Method: GET
   - Endpoint: `{{base_url}}/admin/boolean-features`
   - Optional query parameter: `search` to filter by name

3. **Get Boolean Feature By ID**

   - Method: GET
   - Endpoint: `{{base_url}}/admin/boolean-features/:featureId`
   - Path parameter: `featureId` - The MongoDB ID of the feature

4. **Update Boolean Feature**

   - Method: PATCH
   - Endpoint: `{{base_url}}/admin/boolean-features/:featureId`
   - Path parameter: `featureId` - The MongoDB ID of the feature
   - Optional fields to update: `name`, `status`, `type`, `subType`

5. **Delete Boolean Feature**
   - Method: DELETE
   - Endpoint: `{{base_url}}/admin/boolean-features/:featureId`
   - Path parameter: `featureId` - The MongoDB ID of the feature

## Authentication

All endpoints require authentication using a JWT token. The token should be included in the Authorization header as a Bearer token:

```
Authorization: Bearer {{token}}
```

## Permissions

All endpoints require Superadmin permissions with the appropriate permission type (CREATE, READ, UPDATE, DELETE).
