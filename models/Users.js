const { model, Schema } = require("mongoose");
const type = require("mongoose/lib/schema/operators/type");

const UserSchema = new Schema({
  name: { type: String },
  username: {
    type: String,
    unique: true,
  },
  password: { type: String },
  image: { type: String },
  email: { type: String },
  phone: { type: String },
  level: { type: String }, // DEPRECATED: Use institutionRoles.level instead
  roles: [
    {
      type: String,
      enum: ["superadmin", "admin", "tutor", "resident"],
      default: "resident",
    },
  ], // DEPRECATED: Use institutionRoles instead. Kept for backward compatibility
  isFirstLogin: { type: Boolean, default: true },
  supervisor: { type: Schema.Types.ObjectId, ref: "User" },
  institutions: [
    {
      type: Schema.Types.ObjectId,
      ref: "Institution",
    },
  ], // DEPRECATED: Use institutionRoles instead. Kept for backward compatibility
  // NEW: Institution-specific roles with levels
  institutionRoles: [
    {
      institution: {
        type: Schema.Types.ObjectId,
        ref: "Institution",
        required: true,
      },
      role: {
        type: String,
        enum: ["admin", "tutor", "resident"],
        required: true,
      },
      level: {
        type: String,
        enum: ["R1", "R2", "R3", "R4", "R5", ""],
        default: "",
      }, // Resident level/year specific to this institution
      assignedAt: {
        type: Date,
        default: Date.now,
      },
      assignedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    },
  ],
  isSuperAdmin: { type: Boolean, default: false }, // Flag for super admin (platform admin) access
  isDeleted: { type: Boolean, default: false }, // Soft delete flag
  deletedAt: { type: Date, default: null }, // When the account was deleted
});

// Helper methods for institution roles
UserSchema.methods.getRoleInInstitution = function (institutionId) {
  const institutionRole = this.institutionRoles.find((ir) => {
    // Handle both populated and unpopulated institution references
    const instId = ir.institution._id || ir.institution;
    return instId.toString() === institutionId.toString();
  });
  return institutionRole ? institutionRole.role : null;
};

UserSchema.methods.hasRoleInInstitution = function (institutionId, role) {
  const userRole = this.getRoleInInstitution(institutionId);
  return userRole === role;
};

UserSchema.methods.isAdminOfInstitution = function (institutionId) {
  return this.hasRoleInInstitution(institutionId, "admin");
};

UserSchema.methods.getInstitutionsByRole = function (role) {
  return this.institutionRoles
    .filter((ir) => ir.role === role)
    .map((ir) => ir.institution);
};

UserSchema.methods.getAllInstitutions = function () {
  return this.institutionRoles.map((ir) => ir.institution);
};

UserSchema.methods.assignRoleToInstitution = function (
  institutionId,
  role,
  assignedBy
) {
  // Remove existing role for this institution if any
  this.institutionRoles = this.institutionRoles.filter((ir) => {
    // Handle both populated and unpopulated institution references
    const instId = ir.institution._id || ir.institution;
    return instId.toString() !== institutionId.toString();
  });

  // Add new role
  this.institutionRoles.push({
    institution: institutionId,
    role: role,
    assignedAt: new Date(),
    assignedBy: assignedBy,
  });

  // Also update legacy institutions array for backward compatibility
  if (
    !this.institutions.some(
      (inst) => inst.toString() === institutionId.toString()
    )
  ) {
    this.institutions.push(institutionId);
  }

  // Update legacy roles array for backward compatibility
  if (!this.roles.includes(role)) {
    this.roles.push(role);
  }
};

UserSchema.methods.removeFromInstitution = function (institutionId) {
  // Remove from institutionRoles
  this.institutionRoles = this.institutionRoles.filter((ir) => {
    // Handle both populated and unpopulated institution references
    const instId = ir.institution._id || ir.institution;
    return instId.toString() !== institutionId.toString();
  });

  // Also update legacy institutions array
  this.institutions = this.institutions.filter(
    (inst) => inst.toString() !== institutionId.toString()
  );
};

// Get user's level in a specific institution
UserSchema.methods.getLevelInInstitution = function (institutionId) {
  const institutionRole = this.institutionRoles.find((ir) => {
    // Handle both populated and unpopulated institution references
    const instId = ir.institution._id || ir.institution;
    return instId.toString() === institutionId.toString();
  });
  return institutionRole ? institutionRole.level : "";
};

// Get level number for comparison
UserSchema.methods.getLevelNumber = function (institutionId) {
  const level = this.getLevelInInstitution(institutionId);
  const levelMap = { R1: 1, R2: 2, R3: 3, R4: 4, R5: 5 };
  return levelMap[level] || 0;
};

// Update level for a specific institution
UserSchema.methods.setLevelInInstitution = function (institutionId, level) {
  const institutionRole = this.institutionRoles.find((ir) => {
    // Handle both populated and unpopulated institution references
    const instId = ir.institution._id || ir.institution;
    return instId.toString() === institutionId.toString();
  });
  if (institutionRole) {
    institutionRole.level = level;
    // Also update legacy level field for backward compatibility
    this.level = level;
  }
};

UserSchema.statics.compareLevels = function (level1, level2) {
  const levelMap = { R1: 1, R2: 2, R3: 3, R4: 4, R5: 5 };
  return (levelMap[level1] || 0) - (levelMap[level2] || 0);
};

module.exports = model("User", UserSchema);
