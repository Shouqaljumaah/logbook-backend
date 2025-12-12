# hasLevelRestrictions Auto-Update Fix ✅

## Issue Identified

When updating a form with `optionsWithLevels`, the `hasLevelRestrictions` flag was **not being automatically set**, causing the filtering logic in `getForm` to fail.

### The Problem

The `getForm` controller checks three conditions:

```javascript
if (
  field.hasLevelRestrictions &&              // ❌ This was always false
  field.optionsWithLevels &&
  field.optionsWithLevels.length > 0
)
```

Even though you provided `optionsWithLevels` with level restrictions, `hasLevelRestrictions` remained `false`, so the options were never filtered.

---

## Solution Implemented

### Automatic Detection Logic

The system now **automatically determines** `hasLevelRestrictions` based on whether any option has a `minLevel` set:

```javascript
// Automatically set hasLevelRestrictions based on optionsWithLevels
let hasLevelRestrictions = false;
if (
  field.optionsWithLevels &&
  Array.isArray(field.optionsWithLevels) &&
  field.optionsWithLevels.length > 0
) {
  // Check if any option has a minLevel set
  hasLevelRestrictions = field.optionsWithLevels.some(
    (opt) => opt.minLevel && opt.minLevel !== ""
  );
}
```

### Logic Explanation

| Scenario                                 | hasLevelRestrictions |
| ---------------------------------------- | -------------------- |
| No `optionsWithLevels` provided          | `false`              |
| `optionsWithLevels` is empty array       | `false`              |
| All options have `minLevel: ""`          | `false`              |
| At least one option has `minLevel: "R2"` | `true` ✅            |

---

## What Was Fixed

### 1. ✅ updateForm Function

**Before**:

```javascript
await FieldTemplates.findByIdAndUpdate(field._id, {
  optionsWithLevels: field.optionsWithLevels,
  hasLevelRestrictions: field.hasLevelRestrictions, // Not automatically set
});
```

**After**:

```javascript
// Auto-detect hasLevelRestrictions
let hasLevelRestrictions =
  field.optionsWithLevels?.some((opt) => opt.minLevel && opt.minLevel !== "") ||
  false;

await FieldTemplates.findByIdAndUpdate(field._id, {
  optionsWithLevels: field.optionsWithLevels,
  hasLevelRestrictions: hasLevelRestrictions, // ✅ Automatically set!
});
```

---

### 2. ✅ createFormTemplate Function

**Before**:

```javascript
const newFieldTemplate = await FieldTemplates.create({
  ...fieldTemplate, // hasLevelRestrictions from request (might not be set)
});
```

**After**:

```javascript
// Auto-detect hasLevelRestrictions
let hasLevelRestrictions =
  fieldTemplate.optionsWithLevels?.some(
    (opt) => opt.minLevel && opt.minLevel !== ""
  ) || false;

const newFieldTemplate = await FieldTemplates.create({
  ...fieldTemplate,
  hasLevelRestrictions: hasLevelRestrictions, // ✅ Automatically set!
});
```

---

### 3. ✅ Form-Level Restrictions Support

Also added support for form-level restrictions when creating forms:

```javascript
const newFormsTemplate = await FormTemplatesSchema.create({
  formName: req.body.formName,
  institution: institutionId,
  minLevel: req.body.minLevel || "",
  maxLevel: req.body.maxLevel || "",
  levelRestricted: req.body.levelRestricted || false,
});
```

---

## How It Works Now

### Example 1: Create Field with Level Restrictions

**Request**:

```json
{
  "formName": "Procedures",
  "fieldTemplates": [
    {
      "name": "Procedure Type",
      "type": "select",
      "optionsWithLevels": [
        { "value": "Basic", "minLevel": "" },
        { "value": "Advanced", "minLevel": "R3" }
      ]
    }
  ]
}
```

**What Happens**:

1. System detects "Advanced" has `minLevel: "R3"`
2. Automatically sets `hasLevelRestrictions: true` ✅
3. Field is saved correctly

**Result in Database**:

```javascript
{
  name: "Procedure Type",
  hasLevelRestrictions: true,  // ✅ Automatically set!
  optionsWithLevels: [
    { value: "Basic", minLevel: "" },
    { value: "Advanced", minLevel: "R3" }
  ]
}
```

---

### Example 2: Update Field with Level Restrictions

**Request**:

```json
PUT /formTemplates/:id

{
  "fieldTemplates": [
    {
      "_id": "existing_field_id",
      "name": "Procedure Type",
      "type": "select",
      "optionsWithLevels": [
        { "value": "Basic", "minLevel": "" },
        { "value": "Intermediate", "minLevel": "R2" },
        { "value": "Advanced", "minLevel": "R4" }
      ]
    }
  ]
}
```

**What Happens**:

1. System checks if any option has `minLevel` set
2. Finds "Intermediate" (R2) and "Advanced" (R4)
3. Automatically sets `hasLevelRestrictions: true` ✅
4. Updates field correctly

---

### Example 3: Remove Level Restrictions

**Request**:

```json
{
  "fieldTemplates": [
    {
      "_id": "field_id",
      "name": "Procedure Type",
      "optionsWithLevels": [
        { "value": "Option 1", "minLevel": "" },
        { "value": "Option 2", "minLevel": "" }
      ]
    }
  ]
}
```

**What Happens**:

1. System checks all options
2. All have `minLevel: ""` (empty)
3. Automatically sets `hasLevelRestrictions: false` ✅
4. Options visible to all users

---

### Example 4: No optionsWithLevels Provided

**Request**:

```json
{
  "fieldTemplates": [
    {
      "_id": "field_id",
      "name": "Text Field",
      "type": "text"
    }
  ]
}
```

**What Happens**:

1. No `optionsWithLevels` provided
2. Automatically sets `hasLevelRestrictions: false` ✅
3. Field works normally

---

## Testing the Fix

### Test 1: Create Form with Level-Restricted Options

```bash
curl -X POST http://localhost:8000/formTemplates \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "formName": "Test Form",
    "institutionId": "INST_ID",
    "fieldTemplates": [{
      "name": "Procedure",
      "type": "select",
      "position": "1",
      "section": "1",
      "optionsWithLevels": [
        { "value": "Basic", "minLevel": "" },
        { "value": "Advanced", "minLevel": "R3" }
      ]
    }]
  }'
```

**Expected Result**:

```json
{
  "fieldTemplates": [{
    "name": "Procedure",
    "hasLevelRestrictions": true,  // ✅ Automatically set!
    "optionsWithLevels": [...]
  }]
}
```

---

### Test 2: Update Field to Add Restrictions

```bash
curl -X PUT http://localhost:8000/formTemplates/FORM_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "formName": "Test Form",
    "fieldTemplates": [{
      "_id": "FIELD_ID",
      "name": "Procedure",
      "type": "select",
      "optionsWithLevels": [
        { "value": "Basic", "minLevel": "" },
        { "value": "Advanced", "minLevel": "R4" }
      ]
    }]
  }'
```

**Check Database**:

```javascript
// hasLevelRestrictions should now be true
db.fieldtemplates.findOne({ _id: "FIELD_ID" })
// Result:
{
  hasLevelRestrictions: true,  // ✅ Updated automatically!
  optionsWithLevels: [...]
}
```

---

### Test 3: Verify Filtering Works

**As R2 Resident**:

```bash
GET /formTemplates/FORM_ID
```

**Expected Response**:

```json
{
  "fieldTemplates": [
    {
      "name": "Procedure",
      "hasLevelRestrictions": true,
      "availableOptions": [
        { "value": "Basic", "label": "Basic" }
        // "Advanced" is filtered out (requires R4)
      ]
    }
  ]
}
```

**As R4 Resident**:

```bash
GET /formTemplates/FORM_ID
```

**Expected Response**:

```json
{
  "fieldTemplates": [
    {
      "name": "Procedure",
      "hasLevelRestrictions": true,
      "availableOptions": [
        { "value": "Basic", "label": "Basic" },
        { "value": "Advanced", "label": "Advanced" } // ✅ Now visible
      ]
    }
  ]
}
```

---

## Benefits

### ✅ No Manual Flag Management

**Before**: You had to manually set `hasLevelRestrictions: true`

```json
{
  "hasLevelRestrictions": true,  // Had to remember this!
  "optionsWithLevels": [...]
}
```

**After**: System automatically detects it

```json
{
  "optionsWithLevels": [...]  // That's all you need!
}
```

---

### ✅ Consistent Behavior

- Create form → `hasLevelRestrictions` auto-set
- Update form → `hasLevelRestrictions` auto-set
- Always accurate, no manual errors

---

### ✅ Filtering Works Correctly

The three-condition check now works:

```javascript
if (
  field.hasLevelRestrictions &&        // ✅ Now correctly set!
  field.optionsWithLevels &&
  field.optionsWithLevels.length > 0
)
```

---

## Summary

| Action                                | Old Behavior                          | New Behavior           |
| ------------------------------------- | ------------------------------------- | ---------------------- |
| Create field with `optionsWithLevels` | `hasLevelRestrictions` stayed `false` | Auto-set to `true` ✅  |
| Update field with level restrictions  | Manual flag required                  | Auto-detected ✅       |
| Remove all level restrictions         | Manual update needed                  | Auto-set to `false` ✅ |
| Filtering in `getForm`                | Didn't work                           | Works correctly ✅     |

---

## What You Need to Do

### ✅ Nothing!

The system now handles everything automatically. Just provide `optionsWithLevels` and the system will:

1. Detect if any option has a level requirement
2. Set `hasLevelRestrictions` accordingly
3. Filter options correctly when residents fetch forms

---

## Migration for Existing Fields

If you have existing fields that already have `optionsWithLevels` but `hasLevelRestrictions` is still `false`:

**Option 1**: Re-save the form (triggers auto-detection)
**Option 2**: Run this migration script:

```javascript
// Run once to fix existing fields
const FieldTemplates = require("./models/FieldTemplates");

async function fixExistingFields() {
  const fields = await FieldTemplates.find({
    optionsWithLevels: { $exists: true, $ne: [] },
  });

  for (const field of fields) {
    const hasRestrictions = field.optionsWithLevels.some(
      (opt) => opt.minLevel && opt.minLevel !== ""
    );

    if (field.hasLevelRestrictions !== hasRestrictions) {
      field.hasLevelRestrictions = hasRestrictions;
      await field.save();
      console.log(`Updated field: ${field.name}`);
    }
  }

  console.log("Migration complete!");
}

fixExistingFields();
```

---

**Everything is now working automatically! 🎉**
