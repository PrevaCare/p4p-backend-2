const PatientBP = require("../../../../models/patient/healthTracker/bp/patientBp.model");
const PatientBMI = require("../../../../models/patient/healthTracker/bmi/patientBmi.model");
const PatientPR = require("../../../../models/patient/healthTracker/pr/patientPr.model");
const PatientWeight = require("../../../../models/patient/healthTracker/weight/patientWeight.model");
const PatientSleep = require("../../../../models/patient/healthTracker/sleep/patientSleep.model.js");
const PatientStress = require("../../../../models/patient/healthTracker/stress/patientStress.model");
const PatientDepression = require("../../../../models/patient/healthTracker/depression/patientDepression.model");
const UserPlansBalance = require("../../../../models/corporates/individualPlan.model");

const PatientBloodGlucose = require("../../../../models/patient/healthTracker/bloodGlucose/bloodGlucose.model");
const PatientWaterIntake = require("../../../../models/patient/healthTracker/waterIntake/patientWaterIntake.model");

const EMR = require("../../../../models/common/emr.model");

const patientspo2Model = require("../../../../models/patient/healthTracker/spo2/patientSpo2.model.js");

const Response = require("../../../../utils/Response");
const AppConstant = require("../../../../utils/AppConstant");
const healthScoreModel = require("../../../../models/patient/healthScore/healthScore.model.js");
const userModel = require("../../../../models/common/user.model.js");
const Corporate = require("../../../../models/corporates/corporate.model.js");
const corporatePlanModel = require("../../../../models/corporates/corporatePlan.model.js");
const Employee = require("../../../../models/patient/employee/employee.model.js");
const LiverRiskCalculator = require("../../../../models/patient/riskAssessments/liverRiskCalculate.model.js");
const HealthScore = require("../../../../models/patient/healthScore/healthScore.model.js")
const IndividualUser = require("../../../../models/individualUser/induvidualUser.model.js")

const healthTrackerController = {
  async getLatestHealthData(req, res) {
    try {
      const { patientId } = req.body;

      // Function to get latest record from individual model
      const getLatestRecord = async (Model) => {
        return await Model.findOne({ patientId }).sort({ date: -1 });
      };

      // Function to get latest EMR record
      const getLatestEMR = async () => {
        return await EMR.findOne(
          { user: patientId },
          {
            generalPhysicalExamination: 1,
            basicInfo: 1,
            history: 1,
            createdAt: 1,
          }
        ).sort({ createdAt: -1 });
      };

      const getUserInfo = async () => {
        return await userModel.findOne(
          {
            _id: patientId,
            $or: [{ role: "Employee" }, { role: "IndividualUser" }],
          },
          {
            email: 1,
            phone: 1,
            role: 1,
            profileImg: 1,
            firstName: 1,
            lastName: 1,
            gender: 1,
            address: 1,
            isMarried: 1,
            age: 1,
            weight: 1,
            jobProfile: 1,
            department: 1,
            corporate: 1,
            // createdAt: 1,
          }
        );
      };

      // Function to get corporate details if user is an employee
      const getCorporateDetails = async (userId) => {
        const employee = await Employee.findById(userId)
          .select("corporate")
          .populate({
            path: "corporate",
            select: "companyName logo",
          });

        if (!employee || !employee.corporate) return null;

        // Check if there's an active plan for this corporate
        const activePlan = await corporatePlanModel
          .findOne({
            corporateId: employee.corporate._id,
            status: "active",
          })
          .select("name category _id usedCount totalCount status");

        return {
          _id: employee.corporate._id,
          companyName: employee.corporate.companyName,
          logo: employee.corporate.logo,
          activePlan: activePlan
            ? {
                _id: activePlan._id,
                name: activePlan.name,
                category: activePlan.category,
              }
            : null,
        };
      };

      // Function to get plan features
      const getPlanFeatures = async (userId) => {
        const userPlan = await UserPlansBalance.findOne({
          userId: userId,
          roleType: "employee",
        });

        if (!userPlan) return null;

        return {
          booleanFeatures: userPlan.activeBooleanFeatures.map((feature) => ({
            featureName: feature.featureName,
            featureType: feature.featureType,
            planType: feature.planType,
            type: feature.type || "others",
            subType: feature.subType || "others",
            assignedAt: feature.assignedAt,
            expiresAt: feature.expiresAt,
            totalAllowed: feature.totalAllowed,
            periodAllowed: feature.periodAllowed,
            periodRemaining: feature.periodRemaining,
            periodUsed: feature.periodUsed,
            usageHistory: feature.history,
          })),
          countFeatures: userPlan.activeCountFeatures.map((feature) => ({
            featureName: feature.featureName,
            featureType: feature.featureType,
            planType: feature.planType,
            type: feature.type || "others",
            subType: feature.subType || "others",
            assignedAt: feature.assignedAt,
            expiresAt: feature.expiresAt,
            totalAllowed: feature.totalAllowed,
            periodAllowed: feature.periodAllowed,
            periodRemaining: feature.periodRemaining,
            periodUsed: feature.periodUsed,
            usageHistory: feature.history,
          })),
        };
      };

      // Get latest records from all individual models
      const [
        latestBP,
        latestBMI,
        latestSPO2,
        latestPR,
        latestWeight,
        latestSleep,
        // latestBloodGlucose,
        // latestWaterIntake,
        latestEMR,
        userInfo,
        planFeatures,
        latestStress,
        latestDepression,
        liverRisk,
        latestScore
      ] = await Promise.all([
        getLatestRecord(PatientBP),
        getLatestRecord(PatientBMI),
        getLatestRecord(patientspo2Model),
        getLatestRecord(PatientPR),
        getLatestRecord(PatientWeight),
        getLatestRecord(PatientSleep),
        // getLatestRecord(PatientBloodGlucose),
        // getLatestRecord(PatientWaterIntake),
        getLatestEMR(),
        getUserInfo(),
        getPlanFeatures(patientId),
        getLatestRecord(PatientStress),
        getLatestRecord(PatientDepression),
        LiverRiskCalculator.findOne({ user: patientId }).sort({ date: -1 }),
        HealthScore.findOne({ user: patientId }).sort({ createdAt: -1 })
      ]);

      const latestHealthScore = {
        heartScore: latestScore?.heartScore?.overAllHeartScore || 0,
        gutScore: latestScore?.gutScore?.overAllGutScore || 0,
        mentalScore: latestScore?.mentalScore?.overAllMentalScore || 0,
        metabolicScore: latestScore?.metabolicScore?.overAllMetabolicScore || 0,
        healthScore: latestScore?.overallHealthScore
      }

      // Get corporate details if user is an employee
      let corporateDetails = null;
      if (userInfo && userInfo.role === "Employee") {
        corporateDetails = await getCorporateDetails(patientId);
      }

      let userAddress = null;
      if (userInfo.role === "Employee") {
        userAddress = (await Employee.findById(patientId).select("address"))
          ?.address;
      } else if (userInfo.role === "IndividualUser") {
        userAddress = (
          await IndividualUser.findById(patientId).select("address")
        )?.address;
      }

      // Compile health data with preference to individual models
      const healthData = {
        bloodPressure: latestBP
          ? {
              sys: latestBP.sys,
              dia: latestBP.dia,
              unit: latestBP.measurementUnit,
              // sysGoal: latestBP.sysGoal,
              // diaGoal: latestBP.diaGoal,
              // date: latestBP.date,
            }
          : latestEMR?.generalPhysicalExamination?.BP
            ? {
                sys: latestEMR.generalPhysicalExamination.BP.sys,
                dia: latestEMR.generalPhysicalExamination.BP.dia,
                unit: "mmHg",
                // date: latestEMR.createdAt,
              }
            : null,

        bmi: latestBMI
          ? {
              value: latestBMI.bmi.toFixed(2),
              unit: latestBMI.measurementUnit,
              // goal: latestBMI.bmiGoal.toFixed(2),
              // date: latestBMI.date,
            }
          : latestEMR?.generalPhysicalExamination?.BMI
            ? {
                value: latestEMR.generalPhysicalExamination.BMI.toFixed(2),
                unit: "Kg/m2",
                // date: latestEMR.createdAt,
              }
            : null,

        spo2: latestSPO2
          ? {
              value: latestSPO2.spo2,
              unit: latestSPO2.measurementUnit,
              // goal: latestSPO2.spo2Goal,
              // date: latestSPO2.date,
            }
          : latestEMR?.generalPhysicalExamination?.SPO2
            ? {
                value: latestEMR.generalPhysicalExamination.SPO2,
                unit: "%",
                // date: latestEMR.createdAt,
              }
            : null,

        pulseRate: latestPR
          ? {
              value: latestPR.pr,
              unit: latestPR.measurementUnit,
              // goal: latestPR.prGoal,
              // date: latestPR.date,
            }
          : latestEMR?.generalPhysicalExamination?.PR
            ? {
                value: latestEMR.generalPhysicalExamination.PR,
                unit: "bpm",
                // date: latestEMR.createdAt,
              }
            : null,

        weight: latestWeight
          ? {
              value: latestWeight.weight.toFixed(2),
              unit: latestWeight.measurementUnit,
              // goal: latestWeight.weightGoal.toFixed(2),
              // date: latestWeight.date,
            }
          : latestEMR?.generalPhysicalExamination?.weight
            ? {
                value: latestEMR.generalPhysicalExamination.weight,
                unit: "Kg",
                // date: latestEMR.createdAt,
              }
            : null,
        sleep: latestSleep
          ? {
              value: latestSleep.sleep,
              unit: latestSleep.measurementUnit,
              // goal: latestWeight.weightGoal.toFixed(2),
              // date: latestWeight.date,
            }
          : latestEMR?.history?.sleep
            ? {
                value: latestEMR.history.sleep,
                unit: "hrs",
                // date: latestEMR.createdAt,
              }
            : null,

        height: latestEMR?.generalPhysicalExamination?.height
          ? {
              value: latestEMR?.generalPhysicalExamination?.height,
              unit: "m",
            }
          : null,

        stress:
          latestStress && latestStress.totalScore !== undefined
            ? {
                value: latestStress.totalScore,
                unit: "score",
                level: latestStress.stressLevel || null,
                // recommendation: latestStress.recommendation || null,
              }
            : null,

        depression:
          latestDepression && latestDepression.totalScore !== undefined
            ? {
                value: latestDepression.totalScore,
                unit: "score",
                level: latestDepression.depressionLevel || null,
                // recommendation: latestDepression.recommendation || null,
                selfHarmRisk: latestDepression.selfHarmRisk || false,
              }
            : null,
        allergies:
          latestEMR?.history?.allergies &&
          latestEMR?.history?.allergies?.length > 0
            ? latestEMR?.history?.allergies.map((item) => item.allergyName)
            : [],
        isSmoke: latestEMR?.history?.habits?.smoking
          ? latestEMR?.history?.habits?.smoking
          : false,
        isDrink: latestEMR?.history?.habits?.alcohol
          ? latestEMR?.history?.habits?.alcohol
          : false,
        isDiabetic:
          ["yes", "true"].includes(liverRisk?.diabetes?.toLowerCase()) ?? false,
        healthScoreData: latestHealthScore,
        email: userInfo?.email ? userInfo?.email : null,
        phone: userInfo?.phone ? userInfo?.phone : null,
        role: userInfo?.role ? userInfo?.role : null,
        profileImg: userInfo?.profileImg ? userInfo?.profileImg : null,
        firstName: userInfo?.firstName ? userInfo?.firstName : null,
        lastName: userInfo?.lastName ? userInfo?.lastName : null,
        gender: userInfo?.gender ? userInfo?.gender : null,
        isMarried: userInfo?.isMarried ? userInfo?.isMarried : false,
        age: userInfo?.age ? userInfo?.age : null,
        jobProfile: userInfo?.jobProfile ? userInfo?.jobProfile : null,
        department: userInfo?.department ? userInfo?.department : null,
        bloodGroup: latestEMR?.basicInfo?.bloodGroup
          ? latestEMR?.basicInfo?.bloodGroup
          : null,
        state: userAddress?.state?.trim() || "",
        city: userAddress?.city?.trim() || "",
        pincode: userAddress?.pincode?.trim() || "",
        addressName: userAddress?.name?.trim() || "",
        street: userAddress?.street?.trim() || "",
        _id: patientId,

        // Add corporate details if available
        corporate: corporateDetails,
        planFeatures: planFeatures,

        //           _id

        // bloodGlucose: latestBloodGlucose
        //   ? {
        //       value: latestBloodGlucose.bloodGlucose,
        //       goal: latestBloodGlucose.bloodGlucoseGoal,
        //       unit: latestBloodGlucose.measurementUnit,
        //       readingType: latestBloodGlucose.readingType,
        //       date: latestBloodGlucose.date,
        //     }
        //   : null, // No blood glucose in EMR model

        // waterIntake: latestWaterIntake
        //   ? {
        //       value: latestWaterIntake.waterIntake,
        //       goal: latestWaterIntake.waterIntakeGoal,
        //       unit: latestWaterIntake.measurementUnit,
        //       date: latestWaterIntake.date,
        //     }
        //   : null, // No water intake in EMR model
      };

      // Check if any data was found
      const hasData = Object.values(healthData).some((value) => value !== null);

      if (!hasData) {
        return Response.success(
          res,
          null,
          200,
          "No health tracking data found for this patient"
        );
      }

      return Response.success(
        res,
        healthData,
        200,
        "Health tracking data retrieved successfully"
      );
    } catch (err) {
      return Response.error(
        res,
        500,
        AppConstant.FAILED,
        err.message || "Internal server error!"
      );
    }
  },

  // health score by patient id
  async getHealthScoreByPatientId(req, res) {
    try {
      const { patientId } = req.body;
      if (!patientId) {
        return Response.error(
          res,
          404,
          AppConstant.FAILED,
          "Patient Id is missing!"
        );
      }
      const existingHealthScore = await healthScoreModel
        .findOne({ user: patientId })
        .sort({ createdAt: -1 })
        .select(
          "heartScore.overAllHeartScore  gutScore.overAllGutScore mentalScore.overAllMentalScore metabolicScore.overAllMetabolicScore overallHealthScore"
        );

      if (!existingHealthScore) {
        return Response.error(
          res,
          404,
          AppConstant.FAILED,
          "health score not found!"
        );
      }
      const responseData = {
        overAllHeartScore:
          existingHealthScore?.heartScore?.overAllHeartScore || null,
        overAllGutScore: existingHealthScore?.gutScore?.overAllGutScore || null,
        overAllMentalScore:
          existingHealthScore?.mentalScore?.overAllMentalScore || null,
        overAllMetabolicScore:
          existingHealthScore?.metabolicScore?.overAllMetabolicScore || null,
        overallHealthScore: existingHealthScore?.overallHealthScore || null,
      };

      return Response.success(res, responseData, 200, "health score fetched!");
    } catch (err) {
      return Response.error(
        res,
        500,
        AppConstant.FAILED,
        err.message || "Internal server error!"
      );
    }
  },
};

module.exports = { healthTrackerController };
