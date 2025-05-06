# Stress Calculator API

This API implements the Perceived Stress Scale (PSS) assessment for measuring stress levels. It provides endpoints for creating new stress assessments, retrieving the latest assessment, and fetching assessment history.

## Endpoints

### Create Stress Assessment

**Endpoint:** `POST /app/healthtracker/stress`

**Authentication:** Requires authorization token

**Request Body:**

```json
{
  "patientId": "62f35d5c3e5b0e001da96f7a",
  "responses": [
    {
      "questionKey": "unexpectedEvents",
      "response": 2
    },
    {
      "questionKey": "controlImportantThings",
      "response": 3
    },
    {
      "questionKey": "nervousStressed",
      "response": 4
    },
    {
      "questionKey": "handleProblems",
      "response": 1
    },
    {
      "questionKey": "goingYourWay",
      "response": 2
    },
    {
      "questionKey": "copeWithThings",
      "response": 3
    },
    {
      "questionKey": "controlIrritations",
      "response": 1
    },
    {
      "questionKey": "onTopOfThings",
      "response": 0
    },
    {
      "questionKey": "outsideControl",
      "response": 4
    },
    {
      "questionKey": "difficultiesPilingUp",
      "response": 3
    }
  ]
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "_id": "62f35d5c3e5b0e001da96f7b",
    "patientId": "62f35d5c3e5b0e001da96f7a",
    "questions": [
      {
        "questionKey": "unexpectedEvents",
        "score": 2
      }
      // ... other questions
    ],
    "totalScore": 25,
    "stressLevel": "Moderate",
    "recommendation": "Consider incorporating regular physical activity and deep-breathing exercises into your routine to manage stress more effectively.",
    "createdAt": "2023-04-25T12:00:00.000Z",
    "updatedAt": "2023-04-25T12:00:00.000Z"
  },
  "message": "Stress assessment created successfully!"
}
```

### Get Latest Stress Assessment

**Endpoint:** `POST /app/healthtracker/stress-last`

**Authentication:** Requires authorization token

**Request Body:**

```json
{
  "patientId": "62f35d5c3e5b0e001da96f7a"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "_id": "62f35d5c3e5b0e001da96f7b",
    "patientId": "62f35d5c3e5b0e001da96f7a",
    "questions": [
      // ... questions with responses
    ],
    "totalScore": 25,
    "stressLevel": "Moderate",
    "recommendation": "Consider incorporating regular physical activity and deep-breathing exercises into your routine to manage stress more effectively.",
    "createdAt": "2023-04-25T12:00:00.000Z",
    "updatedAt": "2023-04-25T12:00:00.000Z"
  },
  "message": "Latest stress assessment fetched successfully!"
}
```

### Get Stress Assessments by Date Range

**Endpoint:** `POST /app/healthtracker/stresses`

**Authentication:** Requires authorization token

**Request Body:**

```json
{
  "patientId": "62f35d5c3e5b0e001da96f7a",
  "startDate": "2023-04-01",
  "endDate": "2023-04-30"
}
```

**Response:**

```json
{
  "status": "success",
  "data": [
    {
      "_id": "62f35d5c3e5b0e001da96f7b",
      "patientId": "62f35d5c3e5b0e001da96f7a",
      "questions": [
        // ... questions with responses
      ],
      "totalScore": 25,
      "stressLevel": "Moderate",
      "recommendation": "Consider incorporating regular physical activity and deep-breathing exercises into your routine to manage stress more effectively.",
      "createdAt": "2023-04-25T12:00:00.000Z",
      "updatedAt": "2023-04-25T12:00:00.000Z"
    }
    // ... other assessments within date range
  ],
  "message": "Stress assessments fetched successfully!"
}
```

## Question Keys and Meanings

The stress assessment uses the following question keys:

| Key                    | Question Text                                                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------- |
| unexpectedEvents       | In the last month, how often have you been upset because of something that happened unexpectedly?                     |
| controlImportantThings | In the last month, how often have you felt that you were unable to control the important things in your life?         |
| nervousStressed        | In the last month, how often have you felt nervous and stressed?                                                      |
| handleProblems         | In the last month, how often have you felt confident about your ability to handle your personal problems?             |
| goingYourWay           | In the last month, how often have you felt that things were going your way?                                           |
| copeWithThings         | In the last month, how often have you found that you could not cope with all the things that you had to do?           |
| controlIrritations     | In the last month, how often have you been able to control irritations in your life?                                  |
| onTopOfThings          | In the last month, how often have you felt that you were on top of things?                                            |
| outsideControl         | In the last month, how often have you been angered because of things that happened that were outside of your control? |
| difficultiesPilingUp   | In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?      |

## Response Values

For each question, use these response values:

- 0 = Never
- 1 = Almost Never
- 2 = Sometimes
- 3 = Fairly Often
- 4 = Very Often

## Scoring Method

The total score is calculated as follows:

1. Regular scoring: Questions with keys `unexpectedEvents`, `controlImportantThings`, `nervousStressed`, `copeWithThings`, `outsideControl`, and `difficultiesPilingUp` are scored as entered (0-4).
2. Reverse scoring: Questions with keys `handleProblems`, `goingYourWay`, `controlIrritations`, and `onTopOfThings` are scored in reverse (0=4, 1=3, 2=2, 3=1, 4=0).
3. The total score is the sum of all values after applying reverse scoring where needed.

## Stress Level Interpretation

- 0-13 points: Low stress level

  - Recommendation: Great job maintaining a low stress level! Continue practicing relaxation techniques like mindfulness or meditation to keep your stress in check.

- 14-26 points: Moderate stress level

  - Recommendation: Consider incorporating regular physical activity and deep-breathing exercises into your routine to manage stress more effectively.

- 27-40 points: High stress level
  - Recommendation: It's important to prioritize self-care. Try engaging in activities that you enjoy and consider seeking support from friends, family, or a mental health professional.
