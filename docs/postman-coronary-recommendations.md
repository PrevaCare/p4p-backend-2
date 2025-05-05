# Coronary Heart Disease Assessment with Recommendations - Postman Setup

## Environment Variables

Set up these environment variables in Postman:

```
baseUrl: http://localhost:3000/v1/
token: <your-auth-token>
userId: <your-user-id>
```

## 1. First, Run the Seeding Script

Before using the enhanced API, run the seeding script to populate the recommendations database:

```bash
node scripts/seedCoronaryRecommendations.js
```

## 2. Create a Coronary Heart Disease Assessment with Recommendations

### Request

```
POST {{baseUrl}}app/patient/coronaryheart-diseases
```

### Headers

```
Authorization: Bearer {{token}}
Content-Type: application/json
```

### Body (raw JSON)

```json
{
  "user": "{{userId}}",
  "age": 45,
  "gender": "Male",
  "race": 0,
  "smoker": true,
  "systolicBP": 130,
  "onHypertensionMed": false,
  "diabetes": false,
  "totalCholesterol": 210,
  "hdlCholesterol": 55
}
```

### Response (example)

```json
{
  "status": "success",
  "data": {
    "_id": "60f...",
    "user": "{{userId}}",
    "age": 45,
    "gender": "Male",
    "race": 0,
    "smoker": true,
    "systolicBP": 130,
    "onHypertensionMed": false,
    "diabetes": false,
    "totalCholesterol": 210,
    "hdlCholesterol": 55,
    "riskPercentage": 15.2,
    "riskLevel": "Moderate",
    "createdAt": "2023-07-20T12:34:56.789Z",
    "updatedAt": "2023-07-20T12:34:56.789Z",
    "recommendations": {
      "dietAdjustments": "Heart-healthy diet with reduced saturated fats. Increase fiber intake and limit processed foods and added sugars.",
      "physicalActivity": "200-250 minutes of exercise weekly, including both cardio and resistance training. Consider high-intensity interval training if appropriate.",
      "medicalInterventions": "Bi-annual check-ups. Consider low-dose aspirin if recommended by your doctor."
    }
  },
  "message": "Coronary heart disease risk assessment created successfully.",
  "statusCode": 201
}
```

## 3. Get Coronary Heart Disease Assessments with Recommendations

### Request

```
GET {{baseUrl}}app/patient/coronaryheart-diseases?employeeId={{userId}}
```

### Headers

```
Authorization: Bearer {{token}}
```

### Response (example)

```json
{
  "status": "success",
  "data": {
    "assessments": [
      {
        "_id": "60f...",
        "riskPercentage": 15.2,
        "riskLevel": "Moderate",
        "createdAt": "2023-07-20T12:34:56.789Z"
      },
      {
        "_id": "60e...",
        "riskPercentage": 18.7,
        "riskLevel": "Moderate",
        "createdAt": "2023-06-15T09:22:33.123Z"
      }
    ],
    "recommendations": {
      "dietAdjustments": "Heart-healthy diet with reduced saturated fats. Increase fiber intake and limit processed foods and added sugars.",
      "physicalActivity": "200-250 minutes of exercise weekly, including both cardio and resistance training. Consider high-intensity interval training if appropriate.",
      "medicalInterventions": "Bi-annual check-ups. Consider low-dose aspirin if recommended by your doctor.",
      "riskLevel": "Moderate"
    }
  },
  "message": "Coronary data and recommendations found successfully!",
  "statusCode": 200
}
```

## Important Notes:

1. The risk percentage is calculated based on the input parameters using existing algorithm
2. The risk level is determined based on the risk percentage:
   - Low: < 10%
   - Moderate: 10-20%
   - High: 20-30%
   - Very High: > 30%
3. Recommendations are provided based on:
   - Age group (18-30, 31-45, 46-60, 61+)
   - Gender (Male/Female)
   - Risk level (Low, Moderate, High, Very High)
4. The API now returns personalized recommendations for:
   - Diet adjustments
   - Physical activity
   - Medical interventions
