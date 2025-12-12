# Form Template Update - Level Restrictions Fix

## Issue Fixed ✅

The `updateForm` API was **not updating level-related fields** when you tried to modify:

- Field-level restrictions (`optionsWithLevels`, `hasLevelRestrictions`)
- Form-level restrictions (`minLevel`, `maxLevel`, `levelRestricted`)

## What Was Changed

### 1. Field Template Updates (Field-Level Restrictions)

**Added to FieldTemplates update**:

```javascript
{
  // ... existing fields ...
  optionsWithLevels: field.optionsWithLevels,      // ✅ NEW
  hasLevelRestrictions: field.hasLevelRestrictions  // ✅ NEW
}
```

### 2. Form Template Updates (Form-Level Restrictions)

**Added to FormTemplates update**:

```javascript
// Update level restriction fields if provided
if (minLevel !== undefined) form.minLevel = minLevel; // ✅ NEW
if (maxLevel !== undefined) form.maxLevel = maxLevel; // ✅ NEW
if (levelRestricted !== undefined) form.levelRestricted = levelRestricted; // ✅ NEW
```

---

## How to Update Form Templates

### Endpoint

```
PUT /formTemplates/:formId
```

### Request Body Structure

```json
{
  "formName": "Advanced Procedures",
  "score": "SCORE",
  "scaleDescription": "1-5 rating scale",

  // ⭐ Form-level restrictions (NEW)
  "levelRestricted": true,
  "minLevel": "R3",
  "maxLevel": "",

  "fieldTemplates": [
    {
      "_id": "existing_field_id",
      "name": "Procedure Type",
      "type": "select",
      "position": "1",
      "section": "1",

      // ⭐ Field-level restrictions (NEW)
      "hasLevelRestrictions": true,
      "optionsWithLevels": [
        {
          "value": "Basic Assessment",
          "minLevel": "",
          "label": "Basic Assessment"
        },
        {
          "value": "Standard Procedure",
          "minLevel": "R2",
          "label": "Standard Procedure"
        },
        {
          "value": "Complex Surgery",
          "minLevel": "R4",
          "label": "Complex Surgery - Advanced"
        }
      ],

      // Legacy fields (still supported)
      "options": [],
      "hasDetails": false,
      "details": ""
    }
  ]
}
```

---

## Common Update Scenarios

### Scenario 1: Update Form to Require R3+

**Request**:

```json
{
  "formName": "Advanced Surgical Procedures",
  "levelRestricted": true,
  "minLevel": "R3",
  "fieldTemplates": [ ... ]
}
```

**Result**: Only R3, R4, R5 residents can access this form

---

### Scenario 2: Update Field Options' Level Requirements

**Request**:

```json
{
  "formName": "Procedures Form",
  "fieldTemplates": [
    {
      "_id": "field123",
      "name": "Procedure Complexity",
      "type": "select",
      "hasLevelRestrictions": true,
      "optionsWithLevels": [
        { "value": "Basic", "minLevel": "" },
        { "value": "Intermediate", "minLevel": "R2" },
        { "value": "Advanced", "minLevel": "R4" }
      ]
    }
  ]
}
```

**Result**:

- R1 sees: Basic
- R2 sees: Basic, Intermediate
- R4 sees: Basic, Intermediate, Advanced

---

### Scenario 3: Remove Restrictions from Form

**Request**:

```json
{
  "formName": "Basic Assessment",
  "levelRestricted": false,
  "minLevel": "",
  "maxLevel": "",
  "fieldTemplates": [ ... ]
}
```

**Result**: Everyone can access the form

---

### Scenario 4: Add New Field with Restrictions

**Request**:

```json
{
  "formName": "Patient Assessment",
  "fieldTemplates": [
    {
      // No _id means it's a new field
      "name": "Diagnosis Category",
      "type": "select",
      "position": "3",
      "section": "2",
      "hasLevelRestrictions": true,
      "optionsWithLevels": [
        { "value": "Common Conditions", "minLevel": "" },
        { "value": "Rare Conditions", "minLevel": "R3" }
      ]
    }
  ]
}
```

**Result**: New field is created with level restrictions

---

## Important Notes

### ✅ DO

1. **Include all field data** when updating
   - The update replaces the entire field, not just specific properties
2. **Use `optionsWithLevels` for new restrictions**

   ```json
   "optionsWithLevels": [
     { "value": "Option 1", "minLevel": "R2" }
   ]
   ```

3. **Keep `_id` for existing fields**

   - Fields with `_id` will be updated
   - Fields without `_id` will be created as new

4. **Set `hasLevelRestrictions: true`** when using `optionsWithLevels`
   ```json
   {
     "hasLevelRestrictions": true,
     "optionsWithLevels": [ ... ]
   }
   ```

### ❌ DON'T

1. **Don't mix `options` and `optionsWithLevels`**

   - Use `optionsWithLevels` for fields with restrictions
   - Use `options` for legacy fields without restrictions

2. **Don't forget to include all fields in the update**

   - Include all existing fields you want to keep
   - Missing fields won't be automatically preserved

3. **Don't set `levelRestricted: true` without `minLevel`**

   ```json
   // BAD
   { "levelRestricted": true, "minLevel": "" }

   // GOOD
   { "levelRestricted": true, "minLevel": "R3" }
   // OR
   { "levelRestricted": false, "minLevel": "" }
   ```

---

## Testing the Fix

### Test 1: Update Field Option Levels

```bash
curl -X PUT http://localhost:8000/formTemplates/FORM_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "formName": "Test Form",
    "fieldTemplates": [{
      "_id": "FIELD_ID",
      "name": "Test Field",
      "type": "select",
      "hasLevelRestrictions": true,
      "optionsWithLevels": [
        { "value": "Option 1", "minLevel": "" },
        { "value": "Option 2", "minLevel": "R3" }
      ]
    }]
  }'
```

**Expected**: Field options are updated with level restrictions

---

### Test 2: Update Form Level Requirement

```bash
curl -X PUT http://localhost:8000/formTemplates/FORM_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "formName": "Advanced Form",
    "levelRestricted": true,
    "minLevel": "R4",
    "fieldTemplates": [ ... ]
  }'
```

**Expected**: Form now requires R4+ to access

---

## Backward Compatibility

### Legacy Fields Still Work

Old fields using `options` array will continue to work:

```json
{
  "_id": "old_field_id",
  "name": "Old Field",
  "type": "select",
  "options": ["Option 1", "Option 2", "Option 3"]
}
```

**Result**: No restrictions, all residents see all options

---

## Error Handling

### Permission Error

```json
{
  "message": "You don't have permission to update this form"
}
```

**Reason**: You're not an admin of the form's institution

### Validation Error

```json
{
  "message": "Validation failed",
  "error": "minLevel: Path `minLevel` (`R6`) is not a valid enum value"
}
```

**Reason**: Invalid level value (must be R1-R5 or empty string)

---

## Migration Path

If you have existing forms that need level restrictions:

1. **Fetch the form**

   ```
   GET /formTemplates/:id
   ```

2. **Update with new restrictions**
   ```json
   {
     "formName": "...",
     "levelRestricted": true,
     "minLevel": "R3",
     "fieldTemplates": [
       // Convert options to optionsWithLevels
       {
         "_id": "field_id",
         "hasLevelRestrictions": true,
         "optionsWithLevels": [
           { "value": "Old Option 1", "minLevel": "" },
           { "value": "Old Option 2", "minLevel": "R3" }
         ]
       }
     ]
   }
   ```

---

## Summary

✅ **Fixed**: Form and field level restrictions now update correctly  
✅ **Supports**: Both form-level and field-level restrictions  
✅ **Backward Compatible**: Old forms without restrictions still work  
✅ **Flexible**: Can update restrictions anytime

Now you can fully control resident access to forms and options! 🎯
