# Stroke Risk Assessment with Recommendations - Postman Setup

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
node scripts/seedStrokeRecommendations.js
```

## 2. Get Stroke Risk Assessments with Recommendations

### Request

```
POST {{baseUrl}}app/patient/stroke-risk-calcs
```

### Headers

```
Authorization: Bearer {{token}}
Content-Type: application/json
```

### Body (raw JSON)

```json
{
  "patientId": "{{userId}}"
}
```

### Response (example)

```json
{
  "status": "success",
  "data": [
    {
      "_id": "6818c123456789abcdef1234",
      "lowerRiskScore": 5,
      "higherRiskScore": 5,
      "meanRiskScore": 5,
      "desc": "Your score indicates a lower risk, but always consult with a healthcare professional for a thorough assessment.",
      "recommendations": {
        "dietRecommendation": "Maintain a balanced diet; avoid alcohol; reduce oily and processed foods.",
        "medicalRecommendation": "Undergo liver function tests once a year.",
        "physicalActivityRecommendation": "Daily moderate activity (walking or yoga).",
        "riskLevel": "Low"
      },
      "createdAt": "2023-05-15T10:30:15.123Z"
    },
    {
      "_id": "6818c123456789abcdef1235",
      "lowerRiskScore": 30,
      "higherRiskScore": 40,
      "meanRiskScore": 35,
      "desc": "Your score indicates a moderate risk. It's recommended to consult with a healthcare professional.",
      "recommendations": {
        "dietRecommendation": "Avoid sugar, alcohol, and oily foods; eat more steamed vegetables and pulses.",
        "medicalRecommendation": "Consult a physician for liver function tests and abdominal ultrasound.",
        "physicalActivityRecommendation": "Brisk walking or yoga, with adequate hydration.",
        "riskLevel": "Moderate"
      },
      "createdAt": "2023-04-20T14:15:30.456Z"
    }
  ],
  "message": "Stroke risk assessments and recommendations found successfully",
  "statusCode": 200
}
```

## 3. Create a Stroke Risk Assessment (Optional - existing functionality)

### Request

```
POST {{baseUrl}}app/patient/stroke-risk-calc
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
  "bloodPressure": 2,
  "atrialFibrillation": 0,
  "bloodSugar": 1,
  "bmi": 0,
  "diet": 1,
  "cholesterol": 1,
  "diabetes": 0,
  "physicalActivity": 0,
  "history": 0,
  "tobacco": 0
}
```

## Important Notes:

1. Risk levels are determined based on the mean of lower and higher risk scores:

   - Low Risk: 0-25
   - Moderate Risk: 26-50
   - High Risk: 51+

2. The API now calculates and returns:

   - The mean risk score (average of lower and higher risk scores)
   - Risk level based on the mean score
   - Personalized recommendations for diet, medical care, and physical activity

3. The recommendations provided are based on the risk level and follow established medical guidelines.
