# API Documentation

## Medicine Schedule Endpoints

### Corporate Employee Medicines API

**Endpoint:** `GET /v1/corporate/employee/:employeeId/medicines`

**Description:** Retrieve all medicines for a corporate employee from their recent EMRs. This endpoint collects medication data from the employee's most recent EMRs (up to 3), including prescription medicines, past history medicines, and allergy-related medicines.

**Authentication:** Required (JWT token)

**URL Parameters:**

- `employeeId` (required): MongoDB ID of the corporate employee

**Response:**

```json
{
  "data": {
    "medicines": [
      {
        "drugName": "Paracetamol",
        "dosage": "500mg",
        "frequency": "TID",
        "instructions": "Take after food",
        "status": "Active",
        "source": "EMR Prescription",
        "emrDate": "2023-06-15T00:00:00.000Z",
        "doctor": "Dr. John Doe",
        "scheduleType": "EMR"
      },
      {
        "drugName": "Amlodipine",
        "dosage": "As prescribed",
        "frequency": "Once daily",
        "instructions": "Controlled with medication",
        "status": "Active",
        "source": "EMR Past History",
        "emrDate": "2023-06-15T00:00:00.000Z",
        "doctor": "Dr. John Doe",
        "scheduleType": "EMR"
      }
    ]
  },
  "message": "Employee medicines retrieved successfully",
  "statusCode": 200,
  "status": "Success"
}
```

**Error Responses:**

- `400 Bad Request`: Invalid employee ID format
- `404 Not Found`: Employee not found
- `400 Bad Request`: User is not a corporate employee
- `500 Internal Server Error`: Server-side error

**Notes:**

1. This endpoint returns the most recent medication for each unique medicine name from up to 3 recent EMRs
2. Medicines are collected from multiple sources including prescriptions, past history, and allergies
3. Each medicine includes details about its source, prescribing doctor, and usage instructions
