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
  level: { type: String },
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
  // NEW: Institution-specific roles
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
  const institutionRole = this.institutionRoles.find(
    (ir) => ir.institution.toString() === institutionId.toString()
  );
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
  this.institutionRoles = this.institutionRoles.filter(
    (ir) => ir.institution.toString() !== institutionId.toString()
  );

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
  this.institutionRoles = this.institutionRoles.filter(
    (ir) => ir.institution.toString() !== institutionId.toString()
  );

  // Also update legacy institutions array
  this.institutions = this.institutions.filter(
    (inst) => inst.toString() !== institutionId.toString()
  );
};

module.exports = model("User", UserSchema);
