# Global Plan API Postman Collection

This collection contains API endpoints for managing Global Plans with Boolean and Count Features in the P4P Admin Backend system.

## Setup Instructions

1. Import the `GlobalPlan.postman_collection.json` file into Postman
2. Import the `GlobalPlan.postman_environment.json` file into Postman
3. Set up your environment variables:
   - `base_url`: The base URL of your API server (e.g., `http://localhost:5000`)
   - `token`: Your JWT authentication token
   - `globalPlanId`: The ID of a global plan to use for testing

## Available Endpoints

The collection includes the following endpoints:

### Global Plan Management

1. **Create Global Plan (Form-Data)**

   - Method: POST
   - Endpoint: `{{base_url}}/admin/global-plans`
   - Form-data fields:
     - name, category, price, remarks
     - imagefile (required file upload)
     - booleanFeatureList[i][name], booleanFeatureList[i][status], booleanFeatureList[i][type], booleanFeatureList[i][subType]
     - countFeatureList[i][name], countFeatureList[i][count], countFeatureList[i][type], countFeatureList[i][subType]

2. **Create Global Plan (JSON)**

   - Method: POST
   - Endpoint: `{{base_url}}/admin/global-plans`
   - Note: This version cannot include file uploads - use the form-data version for that

3. **Get All Global Plans**

   - Method: GET
   - Endpoint: `{{base_url}}/admin/global-plans`

4. **Get Global Plan By ID**

   - Method: GET
   - Endpoint: `{{base_url}}/admin/global-plans/id`
   - Request body: `{ "globalPlanId": "{{globalPlanId}}" }`

5. **Update Global Plan**

   - Method: PATCH
   - Endpoint: `{{base_url}}/admin/global-plans/:globalPlanId`
   - Path parameter: `globalPlanId`
   - Accepts partial updates to plan details, including boolean and count features

6. **Delete Global Plan**
   - Method: DELETE
   - Endpoint: `{{base_url}}/admin/global-plans/:globalPlanId`
   - Path parameter: `globalPlanId`

### Feature Management within Global Plans

7. **Get All Global Plan Categories**

   - Method: GET
   - Endpoint: `{{base_url}}/admin/global-plans/categories`
   - Optional query parameter: `search` to filter by category name

8. **Get All Boolean Feature Names**

   - Method: GET
   - Endpoint: `{{base_url}}/admin/global-plans/boolean-features`
   - Optional query parameter: `search` to filter by feature name

9. **Get All Count Feature Names**

   - Method: GET
   - Endpoint: `{{base_url}}/admin/global-plans/count-features`
   - Optional query parameter: `search` to filter by feature name

10. **Get Plans for Dashboard**
    - Method: GET
    - Endpoint: `{{base_url}}/admin/global-plans/dashboard`
    - Returns a simplified list of plans for the dashboard view

## Feature Handling

When creating or updating a Global Plan:

1. **Boolean Features:**

   - Each feature requires a `name` and optionally `status`, `type`, and `subType`
   - If a feature with the same name exists, it will update the type and subType
   - If the feature doesn't exist, it will create a new one with the provided details

2. **Count Features:**
   - Each feature requires a `name` and `count`, and optionally `type` and `subType`
   - If a feature with the same name exists, it will update the type and subType
   - If the feature doesn't exist, it will create a new one with the provided details

## Authentication

All endpoints require authentication using a JWT token. The token should be included in the Authorization header as a Bearer token:

```
Authorization: Bearer {{token}}
```

## Image Upload

When creating a Global Plan, an image file is required. Use the form-data version of the Create endpoint to upload the image.
