# Diabetic Risk Calculator

This module calculates a user's risk of diabetes based on various factors and provides personalized recommendations.

## Risk Scoring

The diabetic risk calculator uses the following factors to calculate risk:

1. **Age**:

   - Age < 35: 0 points
   - Age 35-49: 20 points
   - Age ≥ 50: 30 points

2. **Waist Circumference**:

   - For females:
     - < 80 cm: 0 points
     - 80-89 cm: 10 points
     - ≥ 90 cm: 20 points
   - For males:
     - < 90 cm: 0 points
     - 90-99 cm: 10 points
     - ≥ 100 cm: 20 points

3. **Physical Activity**:

   - Vigorous/strenuous activity: 0 points
   - Moderate activity: 10 points
   - Mild activity: 20 points
   - Sedentary/no exercise: 30 points

4. **Family History**:
   - No parents with diabetes: 0 points
   - One parent with diabetes: 10 points
   - Both parents with diabetes: 20 points

## Risk Interpretation

Total Score Range: 0-100

| Score Range | Risk Level    |
| ----------- | ------------- |
| <30         | Low Risk      |
| 30-50       | Moderate Risk |
| >50         | High Risk     |

## Personalized Recommendations

The system provides personalized recommendations based on:

- Age group (20-39, 40-59, 60+)
- Gender
- Risk level

### Recommendation Categories

- Dietary recommendations
- Medical recommendations
- Physical activity recommendations

## Setup

To populate the recommendation database with the predefined recommendations:

1. Make sure MongoDB is running
2. Run the seed script:

```bash
node scripts/seedDiabeticRecommendations.js
```

### Migration from Legacy Risk Levels

If you have existing diabetic risk calculator data with the old format risk levels, run the migration script to update them to the new format:

```bash
node scripts/updateDiabeticRiskLevels.js
```

This script will convert the legacy descriptive risk levels to the standardized "Low", "Moderate", or "High" format required for the recommendation system.

## API Endpoints

### Calculate Diabetic Risk

POST `/admin/patient/diabetic-risk-calc`

Input parameters:

- user (User ID)
- Either raw data (age, gender, waistCircumference, physicalActivity, familyHistory)
- Or calculated scores (ageScore, waistScore, physicalActivityScore, familyHistoryScore)

### Get User's Diabetic Risk History

POST `/admin/patient/diabetic-risk-calcs`

Input parameters:

- patientId (User ID)

Returns the user's risk assessment history, sorted by date, with personalized recommendations for the latest assessment.
