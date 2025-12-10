# Technical Guide: Form and Option Restrictions for Mobile Developers

## Overview

The system implements **two levels of access control** based on resident training levels:

1. **Form-Level Restrictions** - Entire forms can be hidden from residents below certain levels
2. **Field-Level Option Restrictions** - Individual dropdown/select options can be locked until residents reach certain levels

---

## Level System Basics

### Available Levels

```
R1 → R2 → R3 → R4 → R5
(Low experience)    (High experience)
```

**Level Hierarchy**:

- R1 (value: 1) - First Year Resident
- R2 (value: 2) - Second Year Resident
- R3 (value: 3) - Third Year Resident
- R4 (value: 4) - Fourth Year Resident
- R5 (value: 5) - Fifth Year Resident
- "" (empty/value: 0) - No level assigned

### Institution-Specific Levels

**Critical**: Each resident has a **different level per institution**.

```javascript
// User in 3 institutions with different levels
{
  institutionRoles: [
    { institution: "inst_A", role: "resident", level: "R3" },
    { institution: "inst_B", role: "resident", level: "R1" },
    { institution: "inst_C", role: "resident", level: "R5" },
  ];
}
```

---

## Part 1: Form-Level Restrictions

### How It Works

Forms have 3 restriction fields:

```javascript
{
  levelRestricted: boolean,  // Is restriction enabled?
  minLevel: string,          // Minimum level required (R1-R5 or "")
  maxLevel: string           // Maximum level allowed (R1-R5 or "")
}
```

### Restriction Logic

```javascript
// Pseudo-code for form access check
function canAccessForm(form, userLevel) {
  // No restrictions? Everyone can access
  if (!form.levelRestricted) {
    return true;
  }

  // Convert levels to numbers for comparison
  const levelMap = { "": 0, R1: 1, R2: 2, R3: 3, R4: 4, R5: 5 };
  const userLevelNum = levelMap[userLevel] || 0;
  const minLevelNum = levelMap[form.minLevel] || 0;
  const maxLevelNum = levelMap[form.maxLevel] || 999;

  // User must be within range
  return userLevelNum >= minLevelNum && userLevelNum <= maxLevelNum;
}
```

### Examples

#### Example 1: Basic Minimum Level

```javascript
{
  formName: "Advanced Surgical Procedures",
  levelRestricted: true,
  minLevel: "R3",
  maxLevel: ""
}
```

**Result**:

- ❌ R1, R2 residents: **Cannot see this form**
- ✅ R3, R4, R5 residents: **Can access**
- ❌ No level ("") residents: **Cannot see**

#### Example 2: Range Restriction

```javascript
{
  formName: "Intermediate Training Module",
  levelRestricted: true,
  minLevel: "R2",
  maxLevel: "R4"
}
```

**Result**:

- ❌ R1: Too low
- ✅ R2, R3, R4: Can access
- ❌ R5: Too high (beyond this form)

#### Example 3: No Restrictions

```javascript
{
  formName: "Basic Patient Assessment",
  levelRestricted: false,
  minLevel: "",
  maxLevel: ""
}
```

**Result**:

- ✅ **Everyone** can access (all levels including no level)

---

## Part 2: Field-Level Option Restrictions

### How It Works

Field options have restriction capabilities:

```javascript
{
  name: "Procedure Type",
  type: "select",
  hasLevelRestrictions: boolean,
  optionsWithLevels: [
    {
      value: "Basic Assessment",
      minLevel: "",      // Empty = available to all
      label: "Basic Assessment"
    },
    {
      value: "Complex Surgery",
      minLevel: "R4",    // Only R4+ can see this
      label: "Complex Surgery - Advanced"
    }
  ]
}
```

### Backend Filtering

**Important**: The backend automatically filters options and returns only what the resident can select.

```javascript
// Backend code (for your understanding)
function getAvailableOptions(field, userLevel) {
  if (!field.hasLevelRestrictions) {
    return field.optionsWithLevels; // Return all
  }

  const levelMap = { "": 0, R1: 1, R2: 2, R3: 3, R4: 4, R5: 5 };
  const userLevelNum = levelMap[userLevel] || 0;

  return field.optionsWithLevels.filter((option) => {
    const optionMinLevel = levelMap[option.minLevel] || 0;
    return userLevelNum >= optionMinLevel;
  });
}
```

### What Mobile App Receives

When you fetch a form, the response includes **`availableOptions`** for each field:

```javascript
// GET /formTemplates/:id response
{
  formName: "Surgical Procedures",
  fieldTemplates: [
    {
      name: "Procedure Type",
      type: "select",
      hasLevelRestrictions: true,

      // ⭐ Use this for rendering!
      availableOptions: [
        { value: "Basic Assessment", label: "Basic Assessment" },
        { value: "Standard Procedure", label: "Standard Procedure" }
        // Note: "Complex Surgery" is NOT included (requires R4)
      ],

      // Original full list (ignore this in mobile app)
      optionsWithLevels: [
        { value: "Basic Assessment", minLevel: "" },
        { value: "Standard Procedure", minLevel: "R2" },
        { value: "Complex Surgery", minLevel: "R4" }
      ]
    }
  ]
}
```

### Examples

#### Example 1: Progressive Unlocking

**Field Configuration**:

```javascript
{
  name: "Procedure Complexity",
  type: "select",
  hasLevelRestrictions: true,
  optionsWithLevels: [
    { value: "Observation", minLevel: "" },
    { value: "Assisted", minLevel: "R2" },
    { value: "Supervised", minLevel: "R3" },
    { value: "Independent", minLevel: "R4" }
  ]
}
```

**What Each Level Sees**:

| User Level | Available Options                                            |
| ---------- | ------------------------------------------------------------ |
| R1         | • Observation                                                |
| R2         | • Observation<br>• Assisted                                  |
| R3         | • Observation<br>• Assisted<br>• Supervised                  |
| R4, R5     | • Observation<br>• Assisted<br>• Supervised<br>• Independent |
| "" (none)  | • Observation                                                |

#### Example 2: Mixed Restrictions

**Field Configuration**:

```javascript
{
  name: "Diagnosis Category",
  type: "checkbox",
  hasLevelRestrictions: true,
  optionsWithLevels: [
    { value: "Common Conditions", minLevel: "" },
    { value: "Rare Conditions", minLevel: "R3" },
    { value: "Experimental Treatment", minLevel: "R5" }
  ]
}
```

**R2 Resident Receives**:

```javascript
availableOptions: [{ value: "Common Conditions", label: "Common Conditions" }];
// "Rare Conditions" and "Experimental Treatment" are filtered out
```

---

## API Integration Guide

### Step 1: Get User's Level in Institution

```javascript
// Call when user selects an institution
async function getUserLevelForInstitution(institutionId) {
  const response = await fetch("/institutions/me", {
    headers: { Authorization: `Bearer ${userToken}` },
  });

  const data = await response.json();
  const institution = data.institutions.find((i) => i._id === institutionId);

  return institution.userLevel; // e.g., "R3"
}
```

### Step 2: Fetch Forms (Auto-Filtered)

```javascript
// Forms are automatically filtered by backend
async function getFormsForInstitution(institutionId) {
  const response = await fetch(
    `/formTemplates?institutionId=${institutionId}`,
    { headers: { Authorization: `Bearer ${userToken}` } }
  );

  const forms = await response.json();

  // You'll ONLY receive forms the user can access
  // No need to filter on client side
  return forms;
}
```

### Step 3: Render Form with Filtered Options

```javascript
// When rendering a specific form
async function loadForm(formId) {
  const response = await fetch(`/formTemplates/${formId}`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });

  if (!response.ok) {
    // Handle restriction error
    const error = await response.json();
    if (error.requiredLevel) {
      showLevelRestrictionError(error);
      return;
    }
  }

  const form = await response.json();

  // Render fields using availableOptions
  renderForm(form);
}

function renderForm(form) {
  form.fieldTemplates.forEach((field) => {
    if (field.type === "select" || field.type === "checkbox") {
      // ⭐ Use availableOptions, not optionsWithLevels
      const options = field.availableOptions || field.options || [];

      renderSelectField(field.name, options);
    }
  });
}
```

---

## Error Handling

### Scenario 1: User Tries to Access Restricted Form

```javascript
// Request
GET /formTemplates/form_xyz

// Response (403 Forbidden)
{
  "message": "This form requires level R3 or above. Your current level in this institution: R1",
  "requiredLevel": "R3",
  "userLevel": "R1",
  "institutionId": "inst_abc"
}
```

**Mobile App Should**:

```javascript
if (error.requiredLevel) {
  Alert.alert(
    "Form Restricted",
    `This form requires ${error.requiredLevel} level. ` +
      `Your current level: ${error.userLevel || "Not Set"}. ` +
      `Contact your supervisor to update your level.`,
    [
      { text: "OK", onPress: goBack },
      { text: "Contact Support", onPress: openContactSupport },
    ]
  );
}
```

### Scenario 2: Field Has No Available Options

```javascript
{
  name: "Advanced Techniques",
  hasLevelRestrictions: true,
  availableOptions: [] // All options require higher level
}
```

**Mobile App Should**:

```javascript
if (field.availableOptions.length === 0) {
  return (
    <View>
      <Text>{field.name}</Text>
      <Text style={styles.warning}>
        No options available for your current level
      </Text>
    </View>
  );
}
```

---

## Complete Implementation Example

```javascript
// FormScreen.js
import React, { useEffect, useState } from "react";
import { View, Text, Picker, Alert } from "react-native";

const FormScreen = ({ formId, institutionId, navigation }) => {
  const [form, setForm] = useState(null);
  const [userLevel, setUserLevel] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFormData();
  }, [formId, institutionId]);

  const loadFormData = async () => {
    try {
      // 1. Get user's level in this institution
      const institutionsRes = await fetch("/institutions/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const institutionsData = await institutionsRes.json();
      const inst = institutionsData.institutions.find(
        (i) => i._id === institutionId
      );
      setUserLevel(inst.userLevel);

      // 2. Fetch form (with auto-filtered options)
      const formRes = await fetch(`/formTemplates/${formId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!formRes.ok) {
        const error = await formRes.json();

        if (error.requiredLevel) {
          // Form is restricted
          Alert.alert(
            "Form Restricted",
            `Required: ${error.requiredLevel} | Your Level: ${
              error.userLevel || "Not Set"
            }`,
            [{ text: "Go Back", onPress: () => navigation.goBack() }]
          );
          return;
        }

        throw new Error(error.message);
      }

      const formData = await formRes.json();
      setForm(formData);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field) => {
    // Use availableOptions for select/checkbox fields
    if (field.type === "select") {
      const options = field.availableOptions || field.options || [];

      if (options.length === 0) {
        return (
          <View key={field._id}>
            <Text>{field.name}</Text>
            <Text style={{ color: "orange" }}>
              ⚠️ No options available for {userLevel} level
            </Text>
          </View>
        );
      }

      return (
        <View key={field._id}>
          <Text>{field.name}</Text>

          {field.hasLevelRestrictions && (
            <Text style={{ fontSize: 12, color: "gray" }}>
              Some options may be hidden based on your level
            </Text>
          )}

          <Picker>
            <Picker.Item label="Select..." value="" />
            {options.map((opt) => (
              <Picker.Item
                key={opt.value}
                label={opt.label || opt.value}
                value={opt.value}
              />
            ))}
          </Picker>
        </View>
      );
    }

    // Handle other field types...
    return null;
  };

  if (loading) return <Text>Loading...</Text>;
  if (!form) return <Text>Form not available</Text>;

  return (
    <View>
      <Text style={styles.title}>{form.formName}</Text>

      {/* Show user's level */}
      <View style={styles.levelBadge}>
        <Text>Your Level: {userLevel || "Not Set"}</Text>
      </View>

      {/* Render fields */}
      {form.fieldTemplates.map((field) => renderField(field))}
    </View>
  );
};

export default FormScreen;
```

---

## Testing Scenarios

### Test Case 1: Different Levels, Different Forms

```
Setup:
- Create R1 form "Basic Skills"
- Create R3 form "Advanced Skills"
- User is R2 in Institution A

Test:
1. Fetch forms for Institution A
2. Should see: "Basic Skills"
3. Should NOT see: "Advanced Skills"
```

### Test Case 2: Option Filtering

```
Setup:
- Field "Procedure Type" with:
  • "Basic" (no restriction)
  • "Advanced" (requires R3)
- User is R2

Test:
1. Open form with this field
2. availableOptions should have: ["Basic"]
3. Should NOT have: ["Advanced"]
```

### Test Case 3: Institution Switch

```
Setup:
- User is R3 in Institution A
- User is R1 in Institution B
- Same form "Intermediate Skills" (requires R2)

Test:
1. In Institution A (R3): Form is visible ✅
2. Switch to Institution B (R1): Form is hidden ❌
```

---

## Common Pitfalls

### ❌ DON'T: Use `optionsWithLevels` Directly

```javascript
// WRONG!
const options = field.optionsWithLevels;
```

### ✅ DO: Use `availableOptions`

```javascript
// CORRECT!
const options = field.availableOptions || field.options || [];
```

---

### ❌ DON'T: Filter Forms Client-Side

```javascript
// WRONG! Backend already filtered
const filteredForms = allForms.filter((form) =>
  canUserAccessForm(form, userLevel)
);
```

### ✅ DO: Trust Backend Filtering

```javascript
// CORRECT! Backend returns only accessible forms
const forms = await fetch(`/formTemplates?institutionId=${id}`);
// These are already filtered
```

---

### ❌ DON'T: Cache Forms Across Institutions

```javascript
// WRONG! Forms differ by institution and level
const cachedForms = await AsyncStorage.getItem("forms");
```

### ✅ DO: Fetch Per Institution

```javascript
// CORRECT! Always fetch for specific institution
const forms = await fetch(`/formTemplates?institutionId=${currentInstitution}`);
```

---

## Quick Reference

### Form Access Rules

| `levelRestricted` | `minLevel` | `maxLevel` | Who Can Access     |
| ----------------- | ---------- | ---------- | ------------------ |
| `false`           | Any        | Any        | **Everyone**       |
| `true`            | `""`       | `""`       | **Everyone**       |
| `true`            | `"R3"`     | `""`       | R3, R4, R5         |
| `true`            | `"R2"`     | `"R4"`     | R2, R3, R4         |
| `true`            | `"R1"`     | `""`       | R1, R2, R3, R4, R5 |

### Option Access Rules

| Option `minLevel` | User Level | Can See Option? |
| ----------------- | ---------- | --------------- |
| `""`              | Any        | ✅ Yes          |
| `"R3"`            | R1         | ❌ No           |
| `"R3"`            | R3         | ✅ Yes          |
| `"R3"`            | R5         | ✅ Yes          |

---

## Summary

### Key Points for Mobile Developers

1. ✅ **Forms are auto-filtered**: You only receive forms the user can access
2. ✅ **Options are auto-filtered**: Use `availableOptions` for rendering
3. ✅ **Level is per institution**: Always pass `institutionId` when fetching
4. ✅ **Handle restriction errors**: Show helpful messages when access denied
5. ✅ **No client-side filtering needed**: Backend handles all logic

### API Checklist

- [ ] Use `GET /institutions/me` to get user's levels
- [ ] Use `GET /formTemplates?institutionId=X` for filtered forms
- [ ] Use `GET /formTemplates/:id` and handle 403 errors
- [ ] Use `field.availableOptions` for rendering select/checkbox fields
- [ ] Show user's level badge in UI
- [ ] Display helpful error when form/options are restricted

---

**The backend does the heavy lifting - your job is to display what you receive! 🎯**
