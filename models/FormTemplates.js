const { model, Schema } = require("mongoose");

const FormTemplatesSchema = new Schema({
  formName: {
    type: String,
    required: true,
  },
  score: {
    type: String,
    enum: ["SCORE", "OTHER", ""],
    default: "",
  },
  scaleDescription: {
    type: String,
    required: function () {
      return this.score === "SCORE" || this.score === "OTHER";
    },
  },
  fieldTemplates: [
    {
      type: Schema.Types.ObjectId,
      ref: "FieldTemplates",
    },
  ],
  institution: {
    type: Schema.Types.ObjectId,
    ref: "Institution",
    required: true,
  },
  // Level restrictions for residents
  minLevel: {
    type: String,
    enum: ["R1", "R2", "R3", "R4", "R5", ""],
    default: "", // Empty means no minimum level required
  },
  maxLevel: {
    type: String,
    enum: ["R1", "R2", "R3", "R4", "R5", ""],
    default: "", // Empty means no maximum level restriction
  },
  levelRestricted: {
    type: Boolean,
    default: false, // True if form has level restrictions
  },
});

// Compound index to ensure formName is unique within an institution
FormTemplatesSchema.index({ formName: 1, institution: 1 }, { unique: true });

// Check if user can access this form based on level
FormTemplatesSchema.methods.canUserAccess = function (userLevel) {
  if (!this.levelRestricted) return true;
  if (!userLevel) return !this.minLevel; // No level users can only access forms with no restrictions

  const levelMap = { R1: 1, R2: 2, R3: 3, R4: 4, R5: 5 };
  const userLevelNum = levelMap[userLevel] || 0;
  const minLevelNum = levelMap[this.minLevel] || 0;
  const maxLevelNum = levelMap[this.maxLevel] || 999;

  return userLevelNum >= minLevelNum && userLevelNum <= maxLevelNum;
};

module.exports = model("FormTemplates", FormTemplatesSchema);
