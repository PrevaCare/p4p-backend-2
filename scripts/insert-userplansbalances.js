require("dotenv").config();
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const UserPlansBalance = require("../models/corporates/individualPlan.model");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
    insertData();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Insert data
async function insertData() {
  try {
    // Data to insert
    const userPlanBalance = {
      _id: ObjectId("68149692405b1d88ed13f187"),
      userId: ObjectId("67f26be75b241e27b15d0a3e"),
      roleType: "employee",
      corporateCompanyId: ObjectId("669765df54185d1310d5b860"),
      activeBooleanFeatures: [
        {
          featureId: ObjectId("681494bf7362b51b62d61ac1"),
          featureType: "yearly",
          featureName: "Onsite – General Physical Exam",
          planType: "yearly",
          type: "Onsite",
          subType: "General Physical Exam",
          status: true,
          assignedAt: new Date("2025-05-02T10:00:00Z"),
          expiresAt: new Date("2026-05-02T10:00:00Z"),
          totalAllowed: 1,
          totalUsed: 0,
          totalRemaining: 1,
          periodAllowed: 1,
          periodUsed: 0,
          periodRemaining: 1,
          history: [
            {
              timestamp: new Date("2025-05-02T10:00:00Z"),
              usedDelta: 0,
              remainingAfter: 1,
              note: "Feature assigned",
            },
          ],
        },
      ],
      activeCountFeatures: [
        {
          featureId: ObjectId("681494c07362b51b62d61ac6"),
          featureType: "monthly",
          featureName: "Onsite – Consultation",
          planType: "yearly",
          type: "Onsite",
          subType: "Consultation",
          status: true,
          assignedAt: new Date("2025-05-02T10:00:00Z"),
          expiresAt: new Date("2026-05-02T10:00:00Z"),
          totalAllowed: 12,
          totalUsed: 0,
          totalRemaining: 12,
          periodAllowed: 1,
          periodUsed: 0,
          periodRemaining: 1,
          history: [
            {
              timestamp: new Date("2025-05-02T10:00:00Z"),
              usedDelta: 0,
              remainingAfter: 12,
              note: "Feature assigned",
            },
          ],
        },
      ],
      createdAt: new Date("2025-05-02T10:00:00Z"),
      updatedAt: new Date("2025-05-02T10:00:00Z"),
      __v: 0,
    };

    // Insert the data
    await UserPlansBalance.create(userPlanBalance);
    console.log("Data inserted successfully");

    // Verify by retrieving the inserted document
    const insertedData = await UserPlansBalance.findById(
      "68149692405b1d88ed13f187"
    );
    console.log("Inserted data:", JSON.stringify(insertedData, null, 2));

    mongoose.connection.close();
    console.log("MongoDB connection closed");
  } catch (error) {
    console.error("Error inserting data:", error);
    mongoose.connection.close();
    process.exit(1);
  }
}
