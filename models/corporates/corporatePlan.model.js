const mongoose = require("mongoose");

const CorporatePlanSchema = new mongoose.Schema(
  {
    corporateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Corporate",
      required: [true, "corporate Id is required !"],
    },
    assignedEmployee: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        timestamps: true,
      },
    ],
    name: {
      type: String,
      trim: true,
      // unique: true,
      required: [true, "name is required !"],
    },
    category: {
      type: String,
      trim: true,
      required: [true, "category is required !"],
    },
    booleanFeatureList: [
      {
        name: {
          type: String,
          trim: true,
        },
        status: {
          type: Boolean,
          default: false,
        },
        featureId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "BooleanFeature",
        },
      },
    ],
    countFeatureList: [
      {
        name: {
          type: String,
          trim: true,
        },
        count: {
          type: Number,
          default: 0,
        },
        planType: {
          type: String,
          default: "yearly",
          enum: [
            "yearly", // 12 months
            "weekly", // 7 days
            "semi-monthly", // 2 times in a month
            "semi-annually", // 2 times in a year
            "monthly", // 1 month
            "daily", // 1 day
            "quarterly", // 3 months
            "bimonthly", // 2 months
            "bi-weekly", // 2 weeks
            "bi-monthly", // 2 months
          ],
          required: true,
        },
        featureId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "CountFeature",
        },
      },
    ],
    assignedDoctor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
      },
    ],
    assignedLabs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lab",
      },
    ],
    price: {
      type: Number,
      required: true,
    },
    remarks: {
      type: String,
    },
    discountPercentage: {
      type: Number,
      default: 0,
    },
    duration: {
      type: String,
      enum: ["monthly", "yearly"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "expired", "suspended", "cancelled"],
      default: "active",
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      // required: [true, "end date is required !"],
    },
    employeeCount: {
      type: Number,
      default: 0,
    },
    totalEmployeeCount: {
      type: Number,
      required: [true, "total employee count is required !"],
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      required: [true, "billing cycle is required"],
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    lastBillingDate: {
      type: Date,
    },
    nextBillingDate: {
      type: Date,
    },
  },
  { timestamps: true }
);
// Pre-save middleware to calculate endDate based on startDate and duration
CorporatePlanSchema.pre("save", function (next) {
  if (
    this.isNew ||
    this.isModified("startDate") ||
    this.isModified("duration")
  ) {
    const months = this.duration === "monthly" ? 1 : 12;
    this.endDate = new Date(this.startDate);
    this.endDate.setMonth(this.endDate.getMonth() + months);
    // Set billingCycle based on duration
    this.billingCycle = months;
    // Set nextBillingDate
    this.nextBillingDate = new Date(this.startDate);
    this.nextBillingDate.setMonth(this.nextBillingDate.getMonth() + months);
  }
  next();
});
// Virtual property to get remaining days
CorporatePlanSchema.virtual("remainingDays").get(function () {
  return Math.ceil((this.endDate - new Date()) / (1000 * 60 * 60 * 24));
});
// Virtual property to get usage percentage
CorporatePlanSchema.virtual("usagePercentage").get(function () {
  return (this.usedCount / this.totalCount) * 100;
});

// auto renew node cron handle
// Utility to check if a date is within the renewal window (e.g., 24 hours before expiry)
// const isWithinRenewalWindow = (endDate) => {
//   const now = new Date();
//   const renewalWindow = new Date(endDate);
//   renewalWindow.setHours(renewalWindow.getHours() - 24); // 24 hour window
//   return now >= renewalWindow && now <= endDate;
// };

// // Add a method to the schema to handle renewal
// CorporatePlanSchema.methods.renew = async function() {
//   try {
//     const originalEndDate = new Date(this.endDate);
//     const months = this.duration === "monthly" ? 1 : 12;

//     // Set new dates
//     this.startDate = new Date(originalEndDate); // Start from previous end date
//     this.endDate = new Date(originalEndDate);
//     this.endDate.setMonth(this.endDate.getMonth() + months);

//     // Reset billing dates
//     this.lastBillingDate = new Date(originalEndDate);
//     this.nextBillingDate = new Date(this.endDate);

//     // Reset usage counts but maintain the total allowed count
//     this.usedCount = 0;

//     // Maintain active status
//     this.status = "active";

//     // Set payment status to pending for the new cycle
//     this.paymentStatus = "pending";

//     await this.save();
//     return true;
//   } catch (error) {
//     console.error('Error in plan renewal:', error);
//     return false;
//   }
// };

// // Static method to process all auto-renewals
// CorporatePlanSchema.statics.processAutoRenewals = async function() {
//   try {
//     // Find all active plans with autoRenew enabled that are within the renewal window
//     const plansToRenew = await this.find({
//       status: "active",
//       autoRenew: true,
//       endDate: {
//         $gte: new Date(), // Not yet expired
//         $lte: new Date(Date.now() + 24 * 60 * 60 * 1000) // Within next 24 hours
//       }
//     });

//     const renewalResults = await Promise.all(
//       plansToRenew.map(async (plan) => {
//         try {
//           // Attempt to process payment first (implement based on your payment system)
//           const paymentSuccessful = await processPayment(plan);

//           if (paymentSuccessful) {
//             await plan.renew();
//             return {
//               planId: plan._id,
//               corporateId: plan.corporateId,
//               status: 'renewed',
//               message: 'Plan renewed successfully'
//             };
//           } else {
//             // Handle failed payment
//             plan.status = "suspended";
//             await plan.save();
//             return {
//               planId: plan._id,
//               corporateId: plan.corporateId,
//               status: 'failed',
//               message: 'Payment failed'
//             };
//           }
//         } catch (error) {
//           return {
//             planId: plan._id,
//             corporateId: plan.corporateId,
//             status: 'error',
//             message: error.message
//           };
//         }
//       })
//     );

//     return renewalResults;
//   } catch (error) {
//     console.error('Error processing auto-renewals:', error);
//     throw error;
//   }
// };

// // Example payment processing function (implement based on your payment system)
// async function processPayment(plan) {
//   try {
//     // Implement your payment processing logic here
//     // This is just a placeholder
//     const amount = plan.price - (plan.price * plan.discountPercentage / 100);

//     // You would integrate with your payment gateway here
//     // const paymentResult = await paymentGateway.charge({
//     //   corporateId: plan.corporateId,
//     //   amount: amount,
//     //   description: `Auto-renewal for ${plan.name}`
//     // });

//     // For demonstration, returning true
//     return true;
//   } catch (error) {
//     console.error('Payment processing error:', error);
//     return false;
//   }
// }

// // Set up cron job to check for renewals (runs every hour)
// if (process.env.NODE_ENV !== 'test') {
//   cron.schedule('0 * * * *', async () => {
//     try {
//       const CorporatePlan = mongoose.model('CorporatePlan');
//       const results = await CorporatePlan.processAutoRenewals();
//       console.log('Auto-renewal processing completed:', results);
//     } catch (error) {
//       console.error('Error in auto-renewal cron job:', error);
//     }
//   });
// }

module.exports = mongoose.model("CorporatePlan", CorporatePlanSchema);
