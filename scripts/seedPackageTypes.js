const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

// Import the TypeSubtype model
const TypeSubtype = require("../models/common/types.subtypes.model");

// Sample data based on requirements
const packageTypesData = [
  {
    name: "Onsite",
    description: "On-site healthcare services",
    subtypes: [
      { name: "Consultation", description: "On-site medical consultation" },
      {
        name: "General Physical Exam",
        description: "Complete physical examination",
      },
      {
        name: "Vitals",
        description: "BP, Sugar, Pulse, BMI, SpO2 measurements",
      },
      {
        name: "Mental Health Assessment",
        description: "Evaluation of mental health state",
      },
      { name: "Vision Testing", description: "Assessment of visual acuity" },
    ],
  },
  {
    name: "Software",
    description: "Software solutions for healthcare management",
    subtypes: [
      {
        name: "CorporateAdmin",
        description: "Admin panel for corporate healthcare management",
      },
      {
        name: "EmployeeApp",
        description: "Mobile app for employees (Android/iOS)",
      },
    ],
  },
  {
    name: "CorporateAdmin",
    description: "Features available in corporate admin panel",
    subtypes: [
      { name: "Health Score", description: "Measure and track health scores" },
      {
        name: "Data Analytics",
        description: "Advanced analytics for health data",
      },
      {
        name: "Employee Health Certificate",
        description: "Generate health certificates for employees",
      },
      {
        name: "Employee Engagement Activity",
        description: "Activities to improve health awareness",
      },
    ],
  },
  {
    name: "EmployeeApp",
    description: "Features available in employee mobile app",
    subtypes: [
      { name: "Healthscore", description: "Track personal health score" },
      {
        name: "Health Tracking",
        description: "Monitor health metrics over time",
      },
      {
        name: "Predictive Analytics",
        description: "AI-based health predictions",
      },
      {
        name: "Employee EMR",
        description: "Access to electronic medical records",
      },
      {
        name: "Fitness Certificate",
        description: "Digital fitness certificates",
      },
    ],
  },
  {
    name: "Diagnostics",
    description: "Diagnostic services",
    subtypes: [
      { name: "Lab Tests", description: "Various laboratory tests" },
      { name: "ECG", description: "Electrocardiogram service" },
      { name: "Audiometry", description: "Hearing assessment" },
      { name: "Chest X-Ray", description: "Radiological examination" },
    ],
  },
  {
    name: "Tele-Consultation",
    description: "Remote consultation services",
    subtypes: [
      { name: "Follow Up", description: "Follow-up consultation" },
      { name: "First", description: "Initial consultation" },
      {
        name: "Specialist Access",
        description: "Access to specialist doctors",
      },
      {
        name: "Health Expert",
        description: "Consultation with health experts",
      },
      { name: "Mental Health", description: "Mental health consultation" },
    ],
  },
  {
    name: "Ambulance",
    description: "Emergency ambulance services",
    subtypes: [],
  },
  {
    name: "Seminar",
    description: "On-site educational seminars",
    subtypes: [
      { name: "First Aid", description: "First aid training" },
      { name: "Diabetes", description: "Diabetes awareness and management" },
      { name: "Training", description: "Various health-related training" },
    ],
  },
  {
    name: "Webinar",
    description: "Online educational webinars",
    subtypes: [
      {
        name: "Customised Webinars",
        description: "Tailored webinars for employee engagement",
      },
      { name: "Training", description: "Online health training sessions" },
    ],
  },
  {
    name: "Others",
    description: "Additional services not covered in other categories",
    subtypes: [],
  },
];

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connection successful");
    seedDatabase();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Seed the database
async function seedDatabase() {
  try {
    // Clear existing data
    await TypeSubtype.deleteMany({});
    console.log("Cleared existing package types data");

    // Insert new data
    const result = await TypeSubtype.insertMany(packageTypesData);
    console.log(`Successfully seeded ${result.length} package types`);

    // Display created types
    console.log("Created package types:");
    result.forEach((type) => {
      console.log(`- ${type.name} (${type.subtypes.length} subtypes)`);
    });

    // Disconnect from MongoDB
    mongoose.disconnect();
    console.log("MongoDB disconnected");
  } catch (error) {
    console.error("Error seeding database:", error);
    mongoose.disconnect();
    process.exit(1);
  }
}

// Handle the promise rejection
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
  mongoose.disconnect();
  process.exit(1);
});
