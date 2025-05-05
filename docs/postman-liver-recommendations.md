# Liver Risk Assessment with Recommendations - Postman Setup

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
node scripts/seedLiverRecommendations.js
```

## 2. Get Liver Risk Assessments with Recommendations

### Request

```
POST {{baseUrl}}app/patient/liver-risk-calcs
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
      "riskScore": 9,
      "riskLevel": "LOW",
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
      "riskScore": 35,
      "riskLevel": "MODERATE",
      "recommendations": {
        "dietRecommendation": "Avoid sugar, alcohol, and oily foods; eat more steamed vegetables and pulses.",
        "medicalRecommendation": "Consult a physician for liver function tests and abdominal ultrasound.",
        "physicalActivityRecommendation": "Brisk walking or yoga, with adequate hydration.",
        "riskLevel": "Moderate"
      },
      "createdAt": "2023-04-20T14:15:30.456Z"
    }
  ],
  "message": "Liver risk assessments and recommendations found successfully",
  "statusCode": 200
}
```

## 3. Create a Liver Risk Assessment (Optional - existing functionality)

### Request

```
POST {{baseUrl}}app/patient/liver-risk-calc
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
  "age": "41-60",
  "gender": "Male",
  "riskReasons": ["I am overweight", "I drink alcohol frequently"],
  "diabetes": "Yes",
  "highBloodPressure": "Yes",
  "exercise": "Less than 1 Hour per Week",
  "alcohol": "2-3 Times per Week",
  "dietaryHabits": {
    "regularMeals": false,
    "frequentSnacks": true,
    "processedFoods": true,
    "sodaJuices": true,
    "restaurantFood": true
  }
}
```

## Important Notes:

1. Risk levels are determined based on the risk score:

   - Low Risk: 0-25
   - Moderate Risk: 26-50
   - High Risk: 51+

2. The API now returns:

   - The risk score
   - Risk level
   - Personalized recommendations for diet, medical care, and physical activity

3. The recommendations provided are based on the risk level and follow established medical guidelines.
