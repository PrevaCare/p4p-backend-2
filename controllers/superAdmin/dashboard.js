const { formatDistanceToNow } = require("date-fns");
const User = require("../../models/common/user.model");
const Corporate = require("../../models/corporates/corporate.model");
const Doctor = require("../../models/doctors/doctor.model");
const DoctorCategory = require("../../models/common/doctor.categories.model");
const School = require("../../models/schools/school.model");
const Institute = require("../../models/institute/institute.model");
const Lab = require("../../models/lab/lab.model");
const City = require("../../models/lab/city.model");
const LabPackage = require("../../models/lab/labPackage.model");
const IndividualLabTest = require("../../models/lab/individualLabTest.model");
const GlobalPlan = require("../../models/plans/GlobalPlan.model");
const CorporatePlan = require("../../models/corporates/corporatePlan.model");
const EMR = require("../../models/common/emr.model");
const Appointment = require("../../models/patient/patientAppointment/patientAppointment.model");


const getDashboardData = async (req, res) => {
    try {
        const activeUsers = await User.countDocuments();
        const corporates = await Corporate.countDocuments();
        const doctors = await Doctor.countDocuments();
        const doctorCategories = await DoctorCategory.countDocuments();
        const activeCorporateUsers = await User.find({ role: "Employee" }).countDocuments();
        const activeIndividualUsers = await User.find({ role: "IndividualUser" }).countDocuments();
        const schools = await School.countDocuments();
        const institutes = await Institute.countDocuments();
        const labCount = await Lab.countDocuments();
        const citiesOperated = await City.countDocuments();
        const labPackageCount = await LabPackage.countDocuments();
        const individualLabTestCount = await IndividualLabTest.countDocuments();
        const availableIndividualPackages = await GlobalPlan.countDocuments();
        const availableCorporatePackages = await CorporatePlan.countDocuments();
        const emrsGenerated = await EMR.countDocuments();


        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentAppointments = await Appointment.find({
            appointmentDate: { $gte: thirtyDaysAgo }
        }).select("appointmentDate consultationType");
        res.status(200).json({
            activeUsers,
            corporates,
            doctors,
            activeCorporateUsers,
            activeIndividualUsers,
            doctorCategories,
            schools,
            institutes,
            labCount,
            citiesOperated,
            labPackageCount,
            individualLabTestCount,
            availableIndividualPackages,
            availableCorporatePackages,
            emrsGenerated,
            recentAppointments
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getRecentAddedUsers = async (req, res) => {
    try {
        const user = await User.find({ role: { $in: ["Employee", "IndividualUser"] } })
            .sort({ createdAt: -1 })
            .limit(4)
            .select("firstName lastName role createdAt");

        const formattedUsers = user.map(user => {
            const timeAgo = formatDistanceToNow(new Date(user.createdAt), { addSuffix: true });
            return {
                name: user.firstName + " " + user.lastName,
                time: timeAgo
            };
        });

        const corporate = await User.find({ role: "Corporate" })
            .sort({ updatedAt: -1 })
            .limit(4)
            .select("companyName role updatedAt ");

        console.log(corporate);

        const formattedCorporate = corporate.map(user => {
            const timeAgo = formatDistanceToNow(new Date(user.updatedAt), { addSuffix: true });
            return {
                name: user.companyName,
                time: timeAgo
            };
        });

        const school = await User.find({ role: "School" })
            .sort({ updatedAt: -1 })
            .limit(4)
            .select("schoolName role updatedAt ");

        console.log(school);

        const formattedSchool = school.map(user => {
            const timeAgo = formatDistanceToNow(new Date(user.updatedAt), { addSuffix: true });
            return {
                name: user.schoolName,
                time: timeAgo
            };
        });

        const institute = await User.find({ role: "Institute" })
            .sort({ updatedAt: -1 })
            .limit(4)
            .select("instituteName role updatedAt ");

        console.log(institute);

        const formattedInstitute = institute.map(user => {
            const timeAgo = formatDistanceToNow(new Date(user.updatedAt), { addSuffix: true });
            return {
                name: user.instituteName,
                time: timeAgo
            };
        });

        const lab = await Lab.find({})
            .sort({ updatedAt: -1 })
            .limit(4)
            .select("labName role updatedAt ");

        console.log(lab);

        const formattedLab = lab.map(user => {
            const timeAgo = formatDistanceToNow(new Date(user.updatedAt), { addSuffix: true });
            return {
                name: user.labName,
                time: timeAgo
            };
        });

        const globalPackages = await GlobalPlan.find({}).sort({ updatedAt: -1 }).limit(4).select("name updatedAt");
        console.log(globalPackages);

        const formattedGlobalPackages = globalPackages.map(user => {
            const timeAgo = formatDistanceToNow(new Date(user.updatedAt), { addSuffix: true });
            return {
                name: user.name,
                time: timeAgo
            };
        });

        res.status(200).json({ users: formattedUsers, corporate: formattedCorporate, schools: formattedSchool, institutes: formattedInstitute, labs: formattedLab, globalPackages: formattedGlobalPackages });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getTeleconsultationData = async (req, res) => {
    try {
        const monthNumber = parseInt(req.query.month); // already 0-based (0 = Jan)
        const year = parseInt(req.query.year);

        if (isNaN(monthNumber) || isNaN(year)) {
            return res.status(400).json({ error: "Invalid month or year" });
        }

        const startDate = new Date(year, monthNumber, 1);
        const endDate = new Date(year, monthNumber + 1, 0, 23, 59, 59, 999); // last moment of the month
        const daysInMonth = new Date(year, monthNumber + 1, 0).getDate();

        const rawData = await Appointment.aggregate([
            {
                $match: {
                    consultationType: "online",
                    appointmentDate: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $group: {
                    _id: { $dayOfMonth: "$appointmentDate" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id": 1 }
            },
            {
                $project: {
                    _id: 0,
                    day: "$_id",
                    count: 1
                }
            }
        ]);

        const teleconsultationData = [];
        for (let day = 1; day <= daysInMonth; day++) {
            const match = rawData.find(entry => entry.day === day);
            teleconsultationData.push({
                day,
                count: match ? match.count : 0
            });
        }

        res.status(200).json({ teleconsultationData });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const getInPersonConsultationData = async (req, res) => {
    try {
        const monthNumber = parseInt(req.query.month); // already 0-based (0 = Jan)
        const year = parseInt(req.query.year);

        if (isNaN(monthNumber) || isNaN(year)) {
            return res.status(400).json({ error: "Invalid month or year" });
        }

        const startDate = new Date(year, monthNumber, 1);
        const endDate = new Date(year, monthNumber + 1, 0, 23, 59, 59, 999); // last moment of the month
        const daysInMonth = new Date(year, monthNumber + 1, 0).getDate();

        const rawData = await Appointment.aggregate([
            {
                $match: {
                    consultationType: "offline",
                    appointmentDate: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $group: {
                    _id: { $dayOfMonth: "$appointmentDate" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id": 1 }
            },
            {
                $project: {
                    _id: 0,
                    day: "$_id",
                    count: 1
                }
            }
        ]);

        const inPersonConsultationData = [];
        for (let day = 1; day <= daysInMonth; day++) {
            const match = rawData.find(entry => entry.day === day);
            inPersonConsultationData.push({
                day,
                count: match ? match.count : 0
            });
        }

        res.status(200).json({ inPersonConsultationData });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const getCorporateSalesData = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();

        const corporateSalesData = await CorporatePlan.aggregate([
            {
                $match: {
                    updatedAt: {
                        $gte: new Date(currentYear, 0, 1),
                        $lte: new Date(currentYear, 11, 31, 23, 59, 59, 999)
                    }
                }
            },
            {
                $group: {
                    _id: { $month: "$updatedAt" },
                    totalSales: { $sum: "$price" }
                }
            },
            {
                $project: {
                    _id: 0,
                    month: "$_id",
                    totalSales: 1
                }
            }
        ]);

        // Initialize array with all months set to 0
        const monthlySales = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            totalSales: 0
        }));

        // Fill in the data from the aggregation result
        corporateSalesData.forEach(item => {
            monthlySales[item.month - 1].totalSales = item.totalSales;
        });

        res.status(200).json({ monthlySales });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getIndividualSalesData = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();

        const individualSalesData = await GlobalPlan.aggregate([
            {
                $match: {
                    updatedAt: {
                        $gte: new Date(currentYear, 0, 1),
                        $lte: new Date(currentYear, 11, 31, 23, 59, 59, 999)
                    }
                }
            },
            {
                $group: {
                    _id: { $month: "$updatedAt" },
                    totalSales: { $sum: "$price" }
                }
            },
            {
                $project: {
                    _id: 0,
                    month: "$_id",
                    totalSales: 1
                }
            }
        ]);

        // Initialize array with all months set to 0
        const monthlySales = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            totalSales: 0
        }));

        // Fill in the data from the aggregation result
        individualSalesData.forEach(item => {
            monthlySales[item.month - 1].totalSales = item.totalSales;
        });

        res.status(200).json({ monthlySales });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


module.exports = {
    getDashboardData,
    getRecentAddedUsers,
    getTeleconsultationData,
    getInPersonConsultationData,
    getCorporateSalesData,
    getIndividualSalesData
};

