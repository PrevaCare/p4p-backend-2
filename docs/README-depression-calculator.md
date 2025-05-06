# Depression Calculator API

This API implements the Patient Health Questionnaire (PHQ-9) assessment for measuring depression levels. It provides endpoints for creating new depression assessments, retrieving the latest assessment, and fetching assessment history.

## Endpoints

### Create Depression Assessment

**Endpoint:** `POST /app/healthtracker/depression`

**Authentication:** Requires authorization token

**Request Body:**

```json
{
  "patientId": "62f35d5c3e5b0e001da96f7a",
  "responses": [
    {
      "questionKey": "interestPleasure",
      "response": 2
    },
    {
      "questionKey": "downDepressedHopeless",
      "response": 3
    },
    {
      "questionKey": "sleepIssues",
      "response": 1
    },
    {
      "questionKey": "tiredLowEnergy",
      "response": 2
    },
    {
      "questionKey": "appetiteIssues",
      "response": 0
    },
    {
      "questionKey": "feelingBadFailure",
      "response": 2
    },
    {
      "questionKey": "concentrationIssues",
      "response": 1
    },
    {
      "questionKey": "movementIssues",
      "response": 1
    },
    {
      "questionKey": "selfHarmThoughts",
      "response": 0
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
        "questionKey": "interestPleasure",
        "score": 2
      }
      // ... other questions
    ],
    "totalScore": 12,
    "depressionLevel": "Moderate",
    "recommendation": "Use clinical judgment about treatment, based on patient's duration of symptoms and functional impairment.",
    "selfHarmRisk": false,
    "createdAt": "2023-04-25T12:00:00.000Z",
    "updatedAt": "2023-04-25T12:00:00.000Z"
  },
  "message": "Depression assessment created successfully!"
}
```

### Get Latest Depression Assessment

**Endpoint:** `POST /app/healthtracker/depression-last`

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
    "totalScore": 12,
    "depressionLevel": "Moderate",
    "recommendation": "Use clinical judgment about treatment, based on patient's duration of symptoms and functional impairment.",
    "selfHarmRisk": false,
    "createdAt": "2023-04-25T12:00:00.000Z",
    "updatedAt": "2023-04-25T12:00:00.000Z"
  },
  "message": "Latest depression assessment fetched successfully!"
}
```

### Get Depression Assessments by Date Range

**Endpoint:** `POST /app/healthtracker/depressions`

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
      "totalScore": 12,
      "depressionLevel": "Moderate",
      "recommendation": "Use clinical judgment about treatment, based on patient's duration of symptoms and functional impairment.",
      "selfHarmRisk": false,
      "createdAt": "2023-04-25T12:00:00.000Z",
      "updatedAt": "2023-04-25T12:00:00.000Z"
    }
    // ... other assessments within date range
  ],
  "message": "Depression assessments fetched successfully!"
}
```

## Question Keys and Meanings

The depression assessment uses the following question keys:

| Key                   | Question Text                                                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| interestPleasure      | Little interest or pleasure in doing things                                                                                                                              |
| downDepressedHopeless | Feeling down, depressed, or hopeless                                                                                                                                     |
| sleepIssues           | Trouble falling or staying asleep, or sleeping too much                                                                                                                  |
| tiredLowEnergy        | Feeling tired or having little energy                                                                                                                                    |
| appetiteIssues        | Poor appetite or overeating                                                                                                                                              |
| feelingBadFailure     | Feeling bad about yourself – or that you are a failure or have let yourself or your family down                                                                          |
| concentrationIssues   | Trouble concentrating on things, such as reading the newspaper or watching television                                                                                    |
| movementIssues        | Moving or speaking so slowly that other people could have noticed? Or the opposite – being so fidgety or restless that you have been moving around a lot more than usual |
| selfHarmThoughts      | Thoughts that you would be better off dead or of hurting yourself in some way                                                                                            |

## Response Values

For each question, use these response values:

- 0 = Not at all
- 1 = Several days
- 2 = More than half the days
- 3 = Nearly every day

## Scoring Method

The scoring is straightforward - simply add up the scores from all nine questions to get a total score that ranges from 0 to 27.

## Depression Level Interpretation

- 0-4 points: Minimal or none

  - Recommendation: Patient may not need depression treatment.

- 5-9 points: Mild depression

  - Recommendation: Use clinical judgment about treatment, based on patient's duration of symptoms and functional impairment.

- 10-14 points: Moderate depression

  - Recommendation: Use clinical judgment about treatment, based on patient's duration of symptoms and functional impairment.

- 15-19 points: Moderately severe depression

  - Recommendation: Treat using antidepressants, psychotherapy or a combination of treatment.

- 20-27 points: Severe depression
  - Recommendation: Treat using antidepressants with or without psychotherapy.

## Self-Harm Risk Assessment

The API automatically flags patients who indicate any level of self-harm thoughts (question 9 > 0) with `selfHarmRisk: true` and adds a warning message to the recommendation. This is a critical safety feature that helps identify patients who may need immediate intervention.
