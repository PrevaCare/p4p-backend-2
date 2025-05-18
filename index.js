const path = require("path");
const express = require("express");

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const userRoute = require("./routes/user.route");
const doctorRoute = require("./routes/admin/doctor.route");
const commonDoctorRoute = require("./routes/common/doctor/doctor.route");
const patientRiskAssessmentRoute = require("./routes/common/patient/riskAssessment.route");
const instituteRoute = require("./routes/common/institute/institute.route");
const commonCorporateRoute = require("./routes/common/corporates/getCorporate.route");
const commonPatientRoute = require("./routes/common/patient/patient.route");
const commonSchoolRoute = require("./routes/common/school/schools.route");
const healthTrackerRoute = require("./routes/healthTracker/healthTracker.route");
const labRoute = require("./routes/common/lab/lab.route");
const labAdminRoute = require("./routes/common/lab/labAdmin.route");
const labDetailsRoute = require("./routes/common/lab/labDetails.route");
const labUserFacingRoute = require("./routes/common/lab/labUserFacing.route");
const labBookingRoute = require("./routes/common/lab/labBooking.route");
const labReportRoute = require("./routes/common/lab/labReport/labReport.route");
const ePrescriptionRoute = require("./routes/common/patient/eprescription/ePrescription.route");
const emrRoute = require("./routes/common/emr/emr.route");
const addressRoute = require("./routes/common/address/address.route");
const globalPlanRoute = require("./routes/admin/globalPlan.route");
const corporatePlanRoute = require("./routes/admin/corporatePlan.route");
const employeePlanRoute = require("./routes/admin/employeePlan.route");
const booleanFeatureRoute = require("./routes/admin/booleanFeature.route");
const countFeatureRoute = require("./routes/admin/countFeature.route");
const corporateFeatureRoute = require("./routes/admin/corporateFeature.route");
const corporateDashboardGraphRoute = require("./routes/common/corporates/corporateDashboardGraph.route");
const employeeRoute = require("./routes/employee/employee.route");
const individualUserRoute = require("./routes/common/individualUser/individualUser.route");
const appointmentRoute = require("./routes/appointment/appointment.route");
const healthSummarytRoute = require("./routes/common/patient/healthSummary/healthSummary.route");
const doctorBankDetailRoute = require("./routes/common/doctor/doctorBankDetail.route");
const doctorCategoriesRoute = require("./routes/common/doctor/doctorCategories.route");
const packageTypeRoute = require("./routes/common/packageFeatures/packageType.route");
const superAdminRoute = require("./routes/admin/superadmin.route");
const cron = require("node-cron");
const {
  paymentLinkExpireAtAppointmentStartDate,
  updateNoShowAppointments,
} = require("./cron-jobs/appointments/cancelAppointment.cron");
const { sendMessage } = require("./helper/otp/sentOtp.helper");
const planAssignmentRoute = require("./routes/employee/planAssignment.route");
const medicineScheduleRoutes = require("./routes/patient/medicineSchedule.routes");
const app = express();
dotenv.config();
const port = process.env.PORT;

// Import performance monitoring middleware
const apiPerformanceMonitor = require("./middlewares/performance/apiPerformanceMonitor");
const {
  sendAppointmentNotification,
} = require("./cron-jobs/appointments/appointmentNotification.cron");

// Add browser pool manager for Puppeteer
const puppeteer = require("puppeteer");
const genericPool = require("generic-pool");

// Create a browser pool that can be reused across requests
const browserPool = genericPool.createPool(
  {
    create: async () => {
      console.log(
        "Creating new browser instance for pool using port 9222 instead of default 8000"
      );
      return await puppeteer.launch({
        headless: true,
        ignoreHTTPSErrors: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
          "--remote-debugging-port=9222",
        ],
      });
    },
    destroy: async (browser) => {
      console.log("Destroying browser instance");
      await browser.close();
    },
    validate: async (browser) => {
      // Check if browser is still usable
      try {
        // Simple test to check if browser is still functioning
        const pages = await browser.pages();
        return true; // Browser is valid
      } catch (err) {
        console.log("Browser validation failed:", err.message);
        return false; // Browser is invalid
      }
    },
  },
  {
    min: 2, // Keep at least 2 browsers ready
    max: 5, // Maximum 5 browser instances
    idleTimeoutMillis: 30000, // Close idle browsers after 30 seconds
    acquireTimeoutMillis: 10000, // Wait up to 10 seconds to acquire a browser
    testOnBorrow: true, // Test browser before lending it
    testOnReturn: true, // Test browser when returning to pool
    autostart: true, // Start creating min browsers as soon as pool is created
  }
);

// Make the browser pool available globally
global.browserPool = browserPool;

// Graceful shutdown - close all browser instances
process.on("SIGINT", async () => {
  console.log("Closing all browser instances before exit");
  await browserPool.drain();
  await browserPool.clear();
  process.exit(0);
});

// swagger
// const swaggerUI = require("swagger-ui-express");
// const swaggerJsDoc = require("swagger-jsdoc");
// const options = require("./swaggerDocs/swaggerOptions.js");
// const specs = swaggerJsDoc(options);

// db connection
mongoose
  .connect(process.env.MONGO_URI, {
    // Add MongoDB connection optimization options
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10, // Adjust based on your server capacity
    serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  })
  .then(() => console.log("db connection is successfull !"))
  .catch((err) => console.log("db connection error: " + err));

// Apply performance monitoring middleware
app.use(apiPerformanceMonitor);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/v1/webhook/razorpay", express.raw({ type: "application/json" }));
app.use(cors());

app.use(express.static("public"));
// Ensure the temp directory is accessible for PDF links
app.use("/temp", express.static(path.join(__dirname, "public/temp")));

app.use("/v1/", userRoute);
app.use("/v1/", doctorRoute);
app.use("/v1/", commonDoctorRoute);
app.use("/v1/", patientRiskAssessmentRoute);
app.use("/v1/", instituteRoute);
app.use("/v1/", commonCorporateRoute); // common
app.use("/v1/", commonPatientRoute); // common
app.use("/v1/", labRoute); //  lab
app.use("/v1/", commonSchoolRoute); // common
app.use("/v1/", healthTrackerRoute); // health tracker
app.use("/v1/", labDetailsRoute); //  lab details - public API
app.use("/v1/", labAdminRoute); //  lab admin
app.use("/v1/", labUserFacingRoute); //  lab user-facing routes
app.use("/v1/", labBookingRoute); //  lab booking routes - new
app.use("/v1/", labReportRoute); // lab report
app.use("/v1/", ePrescriptionRoute); // e prescription
app.use("/v1/", emrRoute); //  emr
app.use("/v1/", addressRoute); //  address
app.use("/v1/", globalPlanRoute); //  global plans
app.use("/v1/", corporatePlanRoute); //  corporate plans
app.use("/v1/", employeePlanRoute); //  corporate plans
app.use("/v1/", booleanFeatureRoute);
app.use("/v1/", countFeatureRoute);
app.use("/v1/", corporateFeatureRoute);
app.use("/v1/", corporateDashboardGraphRoute); //  corporate plans
app.use("/v1/", employeeRoute); //  employee
app.use("/v1/", individualUserRoute); //  individual users
app.use("/v1/", appointmentRoute); //  appointment route
app.use("/v1/", healthSummarytRoute); //  health summary route
app.use("/v1/", doctorBankDetailRoute); //  doctor bank details route
app.use("/v1/", doctorCategoriesRoute); //  doctor categories route
app.use("/v1/package-types", packageTypeRoute); // package types and subtypes
app.use("/v1/employee/plans", planAssignmentRoute);
app.use("/v1/", superAdminRoute);
app.use("/v1/", medicineScheduleRoutes); // Medicine schedule routes

// Check for no-shows every 15 minutes
if (process.env.NODE_ENV !== "development") {
  cron.schedule("*/15 * * * *", async () => {
    const result = await updateNoShowAppointments();
    console.log("No-show update job result:", result);
  });

  // Check for expired payment links every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    const result = await paymentLinkExpireAtAppointmentStartDate();
    console.log("Payment expiration job result:", result);
  });
  cron.schedule("0,30 * * * *", async () => {
    const result = await sendAppointmentNotification();
    console.log("Appointment notification job result:", result);
  });
}

// sendMessage("7254903908", process.env.MSG91_EMR_CREATION_TEMPLATE_ID)
// .then((result) => {
//   console.log(result);
// })
// .catch((error) => {
//   console.log(error);
// });

const server = app.listen(port, () => {
  console.log("Backend is running on port " + port);
});

module.exports = server;
