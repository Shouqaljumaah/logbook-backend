const express = require("express");
const router = express.Router();
const passport = require("passport");
const upload = require("../../multer");

const {
  checkSuperAdmin,
  getAllInstitutionsForAdminUser,
  getInstitutionById,
  createInstitution,
  updateInstitution,
  deleteInstitution,
  toggleInstitutionStatus,
  getInstitutionStats,
  addAdminToInstitution,
  removeAdminFromInstitution,
  getInstitutionAdmins,
  getAllInstitutions,
  joinInstitution,
  getUserInstitutions,
} = require("./institutions.controllers");

// Apply authentication and super admin check to all routes
router.use(passport.authenticate("jwt", { session: false }));
// router.use(checkSuperAdmin);

// Institution CRUD routes
router.get("/", getAllInstitutionsForAdminUser);
// get user's institutions
router.get(
  "/me",
  passport.authenticate("jwt", { session: false }),
  getUserInstitutions
);

router.get("/all", getAllInstitutions);
router.get("/:id", getInstitutionById);
router.post("/", upload.single("logo"), createInstitution);
router.put("/:id", upload.single("logo"), updateInstitution);
router.delete("/:id", deleteInstitution);
// get all institutions

// Additional routes
router.patch("/:id/toggle-status", toggleInstitutionStatus);
router.get("/:id/stats", getInstitutionStats);

// Admin management routes
router.get("/:id/admins", getInstitutionAdmins);
router.post("/:id/admins", addAdminToInstitution);
router.delete("/:id/admins/:userId", removeAdminFromInstitution);

// User/Mobile routes
router.post(
  "/:id/join",
  passport.authenticate("jwt", { session: false }),
  joinInstitution
);

module.exports = router;
