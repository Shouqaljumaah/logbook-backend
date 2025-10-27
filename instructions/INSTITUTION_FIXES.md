# Institution Permission Fixes

## 🔧 Issues Fixed

The institution determination logic has been corrected to properly enforce admin permissions. Previously, admins could create/manage resources for any institution they **belonged to**, but now they can only manage institutions where they are **listed as admin** in `Institution.admins[]`.

---

## ✅ What Was Fixed

### 1. **Form Template Creation** (`createFormTemplate`)

#### Previous Issue:

```javascript
// ❌ OLD: Checked if admin belongs to institution
if (
  !adminUser.institutions.some((inst) => inst._id.toString() === institutionId)
) {
  // Allowed if user was member, even if not admin
}
```

#### Fixed Logic:

```javascript
// ✅ NEW: Checks if user is in Institution.admins[] array
const institution = await Institution.findOne({
  _id: institutionId,
  admins: requestingUser._id, // Must be in admins array
});

if (!institution) {
  return "You are not an admin of this institution";
}
```

**Key Changes:**

- ✅ Only admins and super admins can create templates
- ✅ Institution admin must be in `Institution.admins[]` array
- ✅ If no institutionId provided, finds first institution where user is admin
- ✅ Super admin must explicitly specify institutionId

---

### 2. **Form Template Update** (`updateForm`)

#### Added:

```javascript
// Verify user has permission to update this form
if (!requestingUser.isSuperAdmin) {
  const institution = await Institution.findOne({
    _id: form.institution._id,
    admins: requestingUser._id, // Must be admin of form's institution
  });

  if (!institution) {
    return "You don't have permission to update this form";
  }
}
```

**Key Changes:**

- ✅ Checks if user is admin of the form's institution before allowing update
- ✅ Super admins bypass this check

---

### 3. **Form Template Delete** (`deleteForm`)

#### Added:

```javascript
// Verify user has permission to delete this form
if (!requestingUser.isSuperAdmin) {
  const institution = await Institution.findOne({
    _id: form.institution,
    admins: requestingUser._id, // Must be admin of form's institution
  });

  if (!institution) {
    return "You don't have permission to delete this form";
  }
}
```

**Key Changes:**

- ✅ Checks permissions before deletion
- ✅ Must be admin of form's institution

---

### 4. **Form Submission Creation** (`createFormSubmition`)

#### Previous Issue:

```javascript
// ❌ OLD: Only checked if user belongs to institution
const hasAccess = requestingUser.institutions.some(
  (inst) => inst._id.toString() === institutionId.toString()
);
```

#### Fixed Logic:

```javascript
// ✅ NEW: Institution comes from form template (always)
const institutionId =
  formTemplateDoc.institution._id || formTemplateDoc.institution;

// Verify user belongs to institution
const userBelongsToInstitution = requestingUser.institutions.some(
  (inst) => inst._id.toString() === institutionId.toString()
);

// Verify resident belongs to institution
const residentBelongsToInstitution = resident.institutions.some(
  (inst) => inst.toString() === institutionId.toString()
);

// Verify tutor belongs to institution
const tutorBelongsToInstitution = tutor.institutions.some(
  (inst) => inst.toString() === institutionId.toString()
);
```

**Key Changes:**

- ✅ Institution is **ALWAYS** determined by the form template (can't be overridden)
- ✅ Validates that requesting user belongs to institution
- ✅ Validates that both resident AND tutor belong to institution
- ✅ Better error messages

---

### 5. **User Creation by Admin** (`signupUser`)

#### Previous Issue:

```javascript
// ❌ OLD: Only checked if admin belongs to institution
if (
  !adminUser.institutions.some((inst) => inst._id.toString() === institutionId)
) {
  // Allowed if admin was member
}
```

#### Fixed Logic:

```javascript
// ✅ NEW: Checks if user is in Institution.admins[] array
const institution = await Institution.findOne({
  _id: institutionId,
  admins: adminUser._id, // Must be in admins array
});

if (!institution) {
  return "You are not an admin of this institution";
}
```

**Key Changes:**

- ✅ Admin must be in `Institution.admins[]` array
- ✅ If no institutionId provided, finds first institution where user is admin
- ✅ Better validation and error messages

---

## 🔑 Key Principle

### Institution Admin vs Institution Member

**Before (Incorrect):**

```javascript
// User could be admin role + member of institution
User {
  roles: ["admin"],
  institutions: [inst1, inst2]  // Just member
}
// ❌ Could manage inst1 and inst2 even if not designated admin
```

**After (Correct):**

```javascript
// User must be in Institution.admins[] array
Institution {
  admins: [userId]  // Explicitly listed as admin
}

User {
  roles: ["admin"],
  institutions: [inst1]  // Also member
}
// ✅ Can only manage inst1 if in Institution.admins[]
```

---

## 🎯 Permission Flow

### Creating Form Template

```
1. Check if user has admin role
   ├─ If not admin and not superadmin → DENY
   └─ Continue

2. Determine institution
   ├─ Super admin: must specify institutionId
   └─ Institution admin: check Institution.admins[]
       ├─ If institutionId provided:
       │   └─ Query: Institution.findOne({ _id, admins: userId })
       └─ If not provided:
           └─ Query: Institution.find({ admins: userId })
               └─ Use first result

3. Create template with validated institutionId
```

### Creating Form Submission

```
1. Get form template
   └─ Institution is determined by form template (CANNOT be changed)

2. Validate requesting user belongs to institution
   └─ Check: user.institutions.includes(formTemplate.institution)

3. Validate resident belongs to institution
   └─ Check: resident.institutions.includes(formTemplate.institution)

4. Validate tutor belongs to institution
   └─ Check: tutor.institutions.includes(formTemplate.institution)

5. Create submission with institution from form template
```

### Creating User (by Admin)

```
1. Check if requesting user has admin role
   └─ If not admin → DENY

2. Validate admin has permission for institution
   ├─ If institutionId provided:
   │   └─ Query: Institution.findOne({ _id, admins: adminId })
   └─ If not provided:
       └─ Query: Institution.find({ admins: adminId })
           └─ Use first result

3. Create user with validated institutionId
```

---

## 📋 Updated Validation Rules

### For Institution Admins:

1. **Can ONLY create form templates** for institutions where they are in `Institution.admins[]`
2. **Can ONLY update/delete form templates** for institutions where they are in `Institution.admins[]`
3. **Can ONLY create users** for institutions where they are in `Institution.admins[]`
4. **Can submit forms** for any institution they belong to (in `User.institutions[]`)

### For Tutors/Residents:

1. **CANNOT create form templates** (requires admin role)
2. **Can submit forms** for any institution they belong to
3. **Can view forms** from institutions they belong to
4. **Form submission institution** is always determined by the form template

### For Super Admins:

1. **Can do anything** across all institutions
2. **Must specify institutionId** when creating resources
3. **Bypasses all institution checks**

---

## 🔍 How to Verify Admin Permissions

### Check if User is Admin of Institution:

```javascript
const Institution = require("../../models/Institutions");

// Query to check if user is admin
const institution = await Institution.findOne({
  _id: institutionId,
  admins: userId, // User must be in admins array
});

if (!institution) {
  // User is NOT admin of this institution
}
```

### Get All Institutions Where User is Admin:

```javascript
const adminInstitutions = await Institution.find({
  admins: userId,
});

// Returns array of institutions where user is admin
```

---

## ✅ Testing Checklist

### Test as Institution Admin:

- [ ] Can create form template for institution they admin
- [ ] Cannot create form template for institution they don't admin
- [ ] Can update/delete their institution's templates
- [ ] Cannot update/delete other institution's templates
- [ ] Can create users for institution they admin
- [ ] Cannot create users for institution they don't admin

### Test as Tutor/Resident:

- [ ] Cannot create form templates (not admin role)
- [ ] Can submit forms for institutions they belong to
- [ ] Cannot submit forms for institutions they don't belong to
- [ ] Form submission uses institution from template

### Test as Super Admin:

- [ ] Can create templates for any institution
- [ ] Must specify institutionId
- [ ] Can manage all resources across all institutions

---

## 🎯 Benefits of These Fixes

1. **Proper Access Control**

   - Institution admins can only manage their designated institutions
   - Clear separation between admin and member

2. **Data Integrity**

   - Form submissions always use correct institution from template
   - Cannot create cross-institution violations

3. **Security**

   - Prevents privilege escalation
   - Admins can't modify other institutions' resources

4. **Clarity**
   - Clear distinction: `Institution.admins[]` vs `User.institutions[]`
   - Better error messages

---

## 📝 Summary of Changes

### Files Modified:

1. **`apis/formTamplates/formTemplates.controllers.js`**

   - ✅ `createFormTemplate` - Checks `Institution.admins[]`
   - ✅ `updateForm` - Validates admin permission
   - ✅ `deleteForm` - Validates admin permission

2. **`apis/formSubmitions/formSubmitions.controllers.js`**

   - ✅ `createFormSubmition` - Institution from template + validates all users

3. **`apis/users/users.controllers.js`**
   - ✅ `signupUser` - Checks `Institution.admins[]`

### No Breaking Changes:

- ✅ Existing functionality maintained
- ✅ Only adds more strict validation
- ✅ Super admin behavior unchanged
- ✅ All existing valid operations still work

---

## 🚀 Next Steps

1. **Test the changes:**

   ```bash
   # Test as institution admin
   # Test as tutor/resident
   # Test as super admin
   ```

2. **Update frontend (if needed):**

   - Handle new error messages
   - Update institution selection logic

3. **Migration:**
   - No database migration needed
   - Existing data remains valid
   - New operations use corrected logic

---

**All institution-related operations now properly enforce admin permissions! ✅**
