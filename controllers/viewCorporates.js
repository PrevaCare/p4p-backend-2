// const Corporate = require("../models/corporates/corporate.model");
// const Employee = require("../models/patient/employee/employee.model.js");
// const Response = require("../utils/Response.js");
// const AppConstant = require("../utils/AppConstant.js");

// // get all corporates
// const getAllCorporates = async (req, res) => {
//   try {
//     const corporates = await Corporate.find({}).populate("addresses");

//     if (!corporates) {
//       return Response.error(
//         res,
//         404,
//         AppConstant.FAILED,
//         "Corporates not found !"
//       );
//     }

//     // const corporateWithEmployeesCount = corporates.map(async(corporate)=>{
//     //   const employeesCount = await Employee.countDocuments({corporate: corporate._id})
//     //   return {...corporate, employeesCount}
//     // })

//     const corporateWithEmployeesCount = await Promise.all(
//       corporates.map(async (corporate) => {
//         const employeesCount = await Employee.countDocuments({
//           corporate: corporate._id,
//         });
//         return { ...corporate.toObject(), employeesCount };
//       })
//     );
//     console.log(corporateWithEmployeesCount);

//     return Response.success(
//       res,
//       corporateWithEmployeesCount,
//       200,
//       AppConstant.SUCCESS
//     );
//   } catch (err) {
//     return Response.error(
//       res,
//       500,
//       AppConstant.FAILED,
//       err.message || "Internal server error !"
//     );
//   }
// };

// module.exports = {
//   getAllCorporates,
// };
