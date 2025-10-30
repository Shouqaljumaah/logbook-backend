# Permission Structure - Multi-Institution System

## 🎯 Overview

This document explains the **complete permission structure** for the multi-institution logbook system. Institution admins can now manage their own institutions **without requiring super admin intervention**.

---

## 👤 Role Definitions

### 1. **Super Admin** (Platform Administrator)

The platform owner who has complete control over the entire system.

**Characteristics:**

- `isSuperAdmin: true` flag in User model
- `roles: ["superadmin"]`
- Not tied to any specific institution
- Can perform ALL operations

### 2. **Institution Admin** (Institution Administrator)

Administrator of one or more specific institutions.

**Characteristics:**

- `roles: ["admin"]`
- Listed in `Institution.admins[]` array for their institution(s)
- Also has reference in `User.institutions[]` array
- Can manage their own institution(s) and users

### 3. **Tutor** (Instructor/Supervisor)

Teaches and reviews submissions from residents.

**Characteristics:**

- `roles: ["tutor"]`
- Member of `User.institutions[]` for joined institutions
- Can work across multiple institutions

### 4. **Resident** (Student/End User)

Submits forms and receives feedback.

**Characteristics:**

- `roles: ["resident"]`
- Member of `User.institutions[]` for joined institutions
- Can join multiple institutions

---

## 🔐 Permission Matrix

### Institution Management

| Operation                     | Super Admin | Institution Admin | Tutor | Resident |
| ----------------------------- | ----------- | ----------------- | ----- | -------- |
| View all institutions         | ✅ All      | ✅ Own only       | ❌    | ❌       |
| View institution details      | ✅ Any      | ✅ Own only       | ❌    | ❌       |
| Create institution            | ✅          | ❌                | ❌    | ❌       |
| Update institution details    | ✅ Any      | ✅ Own only\*     | ❌    | ❌       |
| Delete institution            | ✅          | ❌                | ❌    | ❌       |
| Toggle institution status     | ✅          | ❌                | ❌    | ❌       |
| View institution statistics   | ✅ Any      | ✅ Own only       | ❌    | ❌       |
| View institution admins       | ✅ Any      | ✅ Own only       | ❌    | ❌       |
| Add admin to institution      | ✅          | ❌                | ❌    | ❌       |
| Remove admin from institution | ✅          | ❌                | ❌    | ❌       |
| Change admin assignments      | ✅          | ❌                | ❌    | ❌       |

\*Institution admins can update their institution's details (name, contact, settings) but **cannot** change admin assignments

---

### User Management

| Operation                | Super Admin  | Institution Admin | Tutor | Resident |
| ------------------------ | ------------ | ----------------- | ----- | -------- |
| View all users           | ✅ All       | ✅ Own inst. only | ❌    | ❌       |
| View user details        | ✅ Any       | ✅ Own inst. only | ✅ \* | ❌       |
| Create user (signup)     | ✅ Any inst. | ✅ Own inst. only | ❌    | ❌       |
| Update user              | ✅ Any       | ✅ Own inst. only | ❌    | ❌       |
| Delete user              | ✅ Any       | ✅ Own inst. only | ❌    | ❌       |
| Assign to multiple inst. | ✅           | ❌                | ❌    | ❌       |
| View tutor list          | ✅ All       | ✅ Own inst. only | ✅ \* | ✅ \*    |
| Create super admin       | ✅           | ❌                | ❌    | ❌       |

\*Limited to their own institutions

---

### Form Templates

| Operation             | Super Admin  | Institution Admin | Tutor        | Resident     |
| --------------------- | ------------ | ----------------- | ------------ | ------------ |
| View all templates    | ✅ All       | ✅ Own inst. only | ✅ Own inst. | ✅ Own inst. |
| View template details | ✅ Any       | ✅ Own inst. only | ✅ Own inst. | ✅ Own inst. |
| Create template       | ✅ Any inst. | ✅ Own inst. only | ❌           | ❌           |
| Update template       | ✅ Any       | ✅ Own inst. only | ❌           | ❌           |
| Delete template       | ✅ Any       | ✅ Own inst. only | ❌           | ❌           |
| Filter by institution | ✅           | ✅                | ✅           | ✅           |

**Note:** Institution admins can only manage templates for institutions where they are listed in `Institution.admins[]`

---

### Form Submissions

| Operation               | Super Admin  | Institution Admin (Web) | Tutor (Mobile) | Resident (Mobile) |
| ----------------------- | ------------ | ----------------------- | -------------- | ----------------- |
| View all submissions    | ✅ All       | ✅ Own inst. only       | ✅ Own only    | ✅ Own only       |
| View submission details | ✅ Any       | ✅ Own inst. only       | ✅ Own only    | ✅ Own only       |
| Create submission       | ✅ Any inst. | ✅ Own inst. only       | ✅ Own inst.   | ✅ Own inst.      |
| Review submission       | ❌           | ❌                      | ✅ Own only    | ❌                |
| Delete submission       | ❌           | ❌                      | ✅ Own only    | ❌                |
| Filter by institution   | ✅           | ✅                      | ✅             | ✅                |

**Platform Distinction:**

- **Web (`formPlatform=web`)**: Admin view, shows all submissions
- **Mobile (`formPlatform=mobile`)**: Tutor/Resident view, shows only their submissions

---

## 🔑 Key Concepts

### 1. **Admin-Institution Relationship**

There are **TWO ways** a user relates to institutions:

#### A. **Member** (`User.institutions[]`)

- User is a member/participant of the institution
- Applies to ALL roles (admin, tutor, resident)
- Gives access to view institution data

```javascript
user.institutions = [inst1_id, inst2_id];
```

#### B. **Administrator** (`Institution.admins[]`)

- User is designated as an admin OF that institution
- Only applies to users with `admin` role
- Gives permission to manage that institution

```javascript
institution.admins = [admin1_id, admin2_id];
```

**Example:**

```javascript
// User John is an admin of Institution A and B
// But also a member (tutor) of Institution C

User: {
  _id: "john_id",
  roles: ["admin", "tutor"],
  institutions: ["inst_a", "inst_b", "inst_c"]
}

Institution A: {
  _id: "inst_a",
  admins: ["john_id"]  // John is admin here
}

Institution B: {
  _id: "inst_b",
  admins: ["john_id"]  // John is admin here
}

Institution C: {
  _id: "inst_c",
  admins: ["jane_id"]  // John is NOT admin here, just a member
}
```

**Result:**

- John can **manage** Institutions A and B (create users, forms, etc.)
- John can only **view/participate** in Institution C (as a tutor)

---

### 2. **Permission Check Logic**

For any operation requiring institution admin privileges:

```javascript
// 1. Check if super admin (bypass all checks)
if (user.isSuperAdmin) {
  // Allow operation
}

// 2. Check if user is admin role
if (!user.roles.includes("admin")) {
  // Deny operation
}

// 3. Check if user is listed in Institution.admins[]
const institution = await Institution.findById(institutionId);
if (!institution.admins.includes(user._id)) {
  // Deny operation
}

// If all checks pass, allow operation
```

---

### 3. **Data Filtering**

#### Super Admin Filtering

```javascript
// No filter - sees everything
const data = await Model.find({});
```

#### Institution Admin Filtering

For institution management:

```javascript
// Only institutions they administer
const institutions = await Institution.find({ admins: user._id });
```

For users/forms/submissions:

```javascript
// Data from institutions they're members of
const userInstitutions = user.institutions;
const data = await Model.find({ institution: { $in: userInstitutions } });
```

#### Tutor/Resident Filtering

```javascript
// Data from their institutions only
const data = await Model.find({
  institution: { $in: user.institutions },
});
```

---

## 📊 Common Workflows

### Workflow 1: Institution Admin Creates User

```javascript
// 1. Admin logs in
POST /users/login
Body: { username, password }
Response: { token, user }

// 2. Admin creates user in their institution
POST /users/signup
Headers: { Authorization: Bearer <token> }
Body: {
  username: "new.tutor",
  password: "password",
  role: "tutor",
  institutionId: "inst_id"  // Optional, defaults to first admin institution
}

// Backend checks:
// - Is requestingUser an admin? (roles.includes("admin"))
// - Is requestingUser in Institution.admins[]?
// - If yes, create user and add to institution
```

---

### Workflow 2: Institution Admin Creates Form Template

```javascript
// 1. Admin creates form template
POST /formTemplates
Headers: { Authorization: Bearer <token> }
Body: {
  formName: "Patient Assessment",
  institutionId: "inst_id",  // Optional for admins
  fieldTemplates: [...]
}

// Backend checks:
// - Is requestingUser an admin?
// - If institutionId provided, is requestingUser in Institution.admins[]?
// - If not provided, use first institution from Institution.find({ admins: user._id })
```

---

### Workflow 3: Institution Admin Views Statistics

```javascript
// 1. Get list of institutions they administer
GET /superadmin/institutions
Headers: { Authorization: Bearer <token> }
Response: [
  { _id: "inst1", name: "Hospital A", admins: [...] },
  { _id: "inst2", name: "Hospital B", admins: [...] }
]

// 2. View statistics for one institution
GET /superadmin/institutions/inst1/stats
Headers: { Authorization: Bearer <token> }
Response: {
  usersCount: 45,
  adminsCount: 3,
  tutorsCount: 20,
  residentsCount: 22,
  formTemplatesCount: 12,
  formSubmissionsCount: 450
}
```

---

### Workflow 4: Multi-Institution Tutor

```javascript
// Tutor works at Hospital A and Hospital B

// 1. View forms from all institutions
GET /formTemplates
// Returns templates from both hospitals

// 2. View forms from specific hospital
GET /formTemplates?institutionId=hospital_a_id
// Returns only Hospital A templates

// 3. View their submissions from all hospitals
GET /formSubmitions?formPlatform=mobile
// Returns all their submissions

// 4. View submissions from specific hospital
GET /formSubmitions?formPlatform=mobile&institutionId=hospital_a_id
// Returns only Hospital A submissions
```

---

## 🚫 What Institution Admins CANNOT Do

Institution admins have **limited** privileges compared to super admins:

### ❌ Cannot Create Institutions

```javascript
POST / superadmin / institutions;
// 403 Forbidden: Only super admins can create institutions
```

### ❌ Cannot Delete Institutions

```javascript
DELETE /superadmin/institutions/:id
// 403 Forbidden: Only super admins can delete institutions
```

### ❌ Cannot Add/Remove Admins

```javascript
POST /superadmin/institutions/:id/admins
// 403 Forbidden: Only super admins can add admins

DELETE /superadmin/institutions/:id/admins/:userId
// 403 Forbidden: Only super admins can remove admins
```

### ❌ Cannot Toggle Institution Status

```javascript
PATCH /superadmin/institutions/:id/toggle-status
// 403 Forbidden: Only super admins can toggle status
```

### ❌ Cannot Access Other Institutions

```javascript
GET / superadmin / institutions / other_institution_id;
// 403 Forbidden: You don't have access to this institution

PUT / formTemplates / form_from_other_institution;
// 403 Forbidden: You are not an admin of this institution
```

### ❌ Cannot Change Admin Assignments

```javascript
PUT /superadmin/institutions/:id
Body: { adminIds: [...] }
// 403 Forbidden: Only super admins can change institution admin assignments
```

---

## ✅ What's Different Now

### Before (Required Super Admin)

```
❌ Institution admin couldn't view their institution details
❌ Institution admin couldn't view statistics
❌ Institution admin couldn't update institution info
❌ All institution operations required super admin
```

### After (Institution Admin Empowerment)

```
✅ Institution admin can view their institution(s)
✅ Institution admin can view their statistics
✅ Institution admin can update their institution details
✅ Institution admin can view other admins
✅ Institution admin can manage users, forms, submissions
✅ Super admin only needed for platform-level operations
```

---

## 🔍 Testing Permission Scenarios

### Test 1: Institution Admin Views Own Institution ✅

```bash
# 1. Login as institution admin
POST /users/login
{ "username": "admin1", "password": "pass" }

# 2. Get institutions (should see only their own)
GET /superadmin/institutions
# Returns: [{ _id: "inst1", name: "Hospital A" }]

# 3. Get institution details
GET /superadmin/institutions/inst1
# Returns: Full institution details

# 4. Try to access another institution
GET /superadmin/institutions/inst2
# Returns: 403 Forbidden
```

---

### Test 2: Institution Admin Manages Users ✅

```bash
# 1. Create user in their institution
POST /users/signup
{
  "username": "new.tutor",
  "role": "tutor",
  "institutionId": "inst1"
}
# Returns: 201 Created

# 2. Try to create user in another institution
POST /users/signup
{
  "username": "another.tutor",
  "role": "tutor",
  "institutionId": "inst2"
}
# Returns: 403 Forbidden (not admin of inst2)
```

---

### Test 3: Institution Admin Cannot Change Admins ❌

```bash
# Try to add another admin
POST /superadmin/institutions/inst1/admins
{ "userId": "user2_id" }
# Returns: 403 Forbidden (only super admin can do this)
```

---

### Test 4: Super Admin Has Full Access ✅

```bash
# 1. View all institutions
GET /superadmin/institutions
# Returns: ALL institutions

# 2. Create new institution
POST /superadmin/institutions
{ "name": "New Hospital", "code": "NH001" }
# Returns: 201 Created

# 3. Add admin to institution
POST /superadmin/institutions/inst1/admins
{ "userId": "admin2_id" }
# Returns: 200 Success
```

---

## 📝 Summary

### Key Points

1. **Super Admin** = Platform owner, controls everything
2. **Institution Admin** = Institution manager, controls their institution(s)
3. **Tutor/Resident** = Regular users, can join multiple institutions
4. **Admin relationship** is defined by `Institution.admins[]` array
5. **Membership** is defined by `User.institutions[]` array
6. **Institution admins** can manage their own institutions without super admin
7. **Super admin** is only needed for platform-level operations

### What Changed

- ✅ Institution controllers now check permissions at function level
- ✅ Institution admins can view and manage their own institutions
- ✅ Super admin-only operations are clearly defined
- ✅ Documentation updated to reflect dual-access patterns
- ✅ API endpoints support both super admin and institution admin roles

### Files Modified

1. `apis/superadmin/institutions.controllers.js` - Added permission checks
2. `API_DOCUMENTATION.md` - Updated to show dual-access patterns
3. `PERMISSION_STRUCTURE.md` - **NEW** comprehensive permission guide

---

**Institution admins are now empowered to manage their institutions independently!** 🎉
