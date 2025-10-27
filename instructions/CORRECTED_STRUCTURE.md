# ✅ Corrected Multi-Institution Structure

## 🎯 Your Requirements (Now Properly Implemented)

### 1. ✅ Institution Has Admin User

Each institution now has its own admin(s):

```javascript
Institution {
  admins: [userId1, userId2, ...]  // Array of admin user IDs
}
```

- Institution admins manage their specific institution
- Can have multiple admins per institution
- Admins are tracked in `Institution.admins[]` array

### 2. ✅ Super Admin Controls All

Super admin is the platform administrator:

```javascript
User {
  roles: ["superadmin"],
  isSuperAdmin: true,
  institutions: []  // Empty - has access to all
}
```

- Manages all institutions
- Creates and assigns institution admins
- Views platform-wide statistics
- Bypasses all institution filtering

### 3. ✅ Tutors and Residents Join Multiple Institutions

Tutors and residents can belong to multiple institutions:

```javascript
User (Tutor/Resident) {
  roles: ["tutor"],  // or ["resident"]
  institutions: [inst1, inst2, inst3]  // Joined multiple
}
```

- Can work across multiple institutions
- See combined data from all their institutions
- Institution admins can add them to institutions

---

## 📊 Complete Role Structure

```
┌─────────────────────────────────────────┐
│         SUPER ADMIN                      │
│  (Platform Administrator)               │
│  • Creates institutions                 │
│  • Assigns institution admins           │
│  • Manages all users                    │
│  • Views everything                     │
└─────────────────────────────────────────┘
                  │
                  │ creates/manages
                  ▼
    ┌──────────────────────────────────┐
    │       INSTITUTIONS               │
    │  • Medical College A              │
    │  • Medical College B              │
    │  • Hospital Training Center       │
    └──────────────────────────────────┘
                  │
         ┌────────┴────────┐
         │                 │
         ▼                 ▼
┌──────────────┐   ┌──────────────┐
│ INST. ADMIN  │   │ INST. ADMIN  │
│ (College A)  │   │ (College B)  │
│ • Manages    │   │ • Manages    │
│   users      │   │   users      │
│ • Creates    │   │ • Creates    │
│   forms      │   │   forms      │
└──────────────┘   └──────────────┘
         │                 │
         │                 │
         ▼                 ▼
    ┌────────────────────────┐
    │  TUTORS & RESIDENTS    │
    │  • Can join multiple   │
    │    institutions        │
    │  • Work across orgs    │
    └────────────────────────┘
```

---

## 🔧 What Was Changed

### Models Updated

#### 1. `models/Institutions.js`

**Added:**

```javascript
admins: [
  {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
];
```

**Purpose:** Track which users are admins of this institution

#### 2. `models/Users.js`

**Clarified comments:**

```javascript
// superadmin: platform admin
// admin: institution admin
// tutor/resident: users who join institutions
```

### Controllers Enhanced

#### 3. `apis/superadmin/institutions.controllers.js`

**New/Updated Functions:**

1. **`createInstitution`** - Now accepts `adminId`

   - Validates admin user
   - Adds admin to institution
   - Syncs both models

2. **`updateInstitution`** - Now accepts `adminIds[]`

   - Updates multiple admins
   - Handles admin removal properly
   - Syncs users' institutions

3. **`getInstitutionStats`** - Enhanced stats

   - Added `adminsCount`
   - Added `tutorsCount`
   - Added `residentsCount`

4. **`addAdminToInstitution`** - NEW

   - Assign admin to institution
   - Validates and syncs both models

5. **`removeAdminFromInstitution`** - NEW

   - Remove admin from institution
   - Prevents removing last admin
   - Smart institution removal

6. **`getInstitutionAdmins`** - NEW
   - List all admins of institution

### Routes Added

#### 4. `apis/superadmin/institutions.routes.js`

**New Endpoints:**

```javascript
GET    /superadmin/institutions/:id/admins
POST   /superadmin/institutions/:id/admins
DELETE /superadmin/institutions/:id/admins/:userId
```

### Documentation Created

#### 5. `ROLES_AND_PERMISSIONS.md` - NEW ⭐

**300+ lines of comprehensive documentation:**

- Detailed role descriptions
- Complete permission matrix
- Data relationship diagrams
- Common workflows with examples
- API endpoint documentation
- Best practices
- Troubleshooting guide

#### 6. `CHANGES_SUMMARY.md` - NEW

- Summary of all changes
- New endpoints with examples
- Usage patterns

#### 7. `CORRECTED_STRUCTURE.md` - NEW (This file!)

- Quick reference
- Visual diagrams
- Key changes summary

---

## 🚀 How to Use

### Creating an Institution with Admin

**Option 1: Create User First**

```bash
# 1. Create admin user
curl -X POST http://localhost:8000/superadmin/users \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin.medical",
    "password": "SecurePass123",
    "role": "admin",
    "email": "admin@medical.edu"
  }'
# Returns: { user: { _id: "USER_ID" } }

# 2. Create institution with that admin
curl -X POST http://localhost:8000/superadmin/institutions \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Medical College",
    "code": "MC001",
    "adminId": "USER_ID"
  }'
```

**Option 2: Add Admin to Existing Institution**

```bash
curl -X POST http://localhost:8000/superadmin/institutions/INST_ID/admins \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID"
  }'
```

### Institution Admin Creates Users

```bash
# Institution admin creates a tutor
curl -X POST http://localhost:8000/users/signup \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "dr.tutor",
    "password": "Pass123",
    "role": "tutor",
    "institutionId": "THEIR_INSTITUTION_ID"
  }'
```

### Tutor Joins Multiple Institutions

```bash
# Super admin updates tutor's institutions
curl -X PATCH http://localhost:8000/superadmin/users/TUTOR_ID/institutions \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "institutionIds": ["INST1", "INST2", "INST3"]
  }'
```

---

## 🎯 Key Behaviors

### 1. Institution Admin Access

```javascript
// Institution admin can only manage THEIR institution(s)
const admin = await User.findById(adminId);
const allowedInstitutions = admin.institutions; // ["inst1", "inst2"]

// When creating user:
if (!allowedInstitutions.includes(targetInstitutionId)) {
  throw Error("Access denied");
}
```

### 2. Tutor/Resident Multi-Institution

```javascript
// Tutor sees data from ALL their institutions
const tutor = await User.findById(tutorId);
const submissions = await FormSubmissions.find({
  institution: { $in: tutor.institutions },
  tutor: tutorId,
});
// Gets submissions from inst1, inst2, inst3
```

### 3. Super Admin Bypass

```javascript
// Super admin sees EVERYTHING
if (user.isSuperAdmin) {
  const allData = await Model.find({});
  // No institution filtering
}
```

---

## ✅ Validation & Safety

### 1. Cannot Remove Last Admin

```javascript
if (institution.admins.length === 1) {
  throw Error("Cannot remove last admin");
}
```

### 2. Only Admins Can Be Institution Admins

```javascript
if (!user.roles.includes("admin")) {
  throw Error("User must have admin role");
}
```

### 3. Admin Access Validation

```javascript
if (!admin.institutions.includes(institutionId)) {
  throw Error("Admin doesn't have access to this institution");
}
```

---

## 📚 Documentation Files

1. **[ROLES_AND_PERMISSIONS.md](ROLES_AND_PERMISSIONS.md)** ⭐

   - **Start here for complete understanding**
   - 300+ lines of detailed documentation
   - Examples, workflows, troubleshooting

2. **[CHANGES_SUMMARY.md](CHANGES_SUMMARY.md)**

   - Summary of what changed
   - New endpoints with examples

3. **[README.md](README.md)**

   - Updated with corrected roles
   - New endpoints listed

4. **[QUICK_START.md](QUICK_START.md)**

   - Get started in 5 minutes

5. **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)**
   - Migration instructions
   - Existing admins become institution admins

---

## 🎉 Summary

### ✅ Your Requirements Met:

1. **✅ Institution has admin users**

   - Tracked in `Institution.admins[]`
   - Synced with `User.institutions[]`
   - Can have multiple admins per institution

2. **✅ Super admin controls everything**

   - Platform administrator
   - Manages all institutions and users
   - Bypasses filtering

3. **✅ Tutors/residents join multiple institutions**
   - `User.institutions[]` can have multiple IDs
   - See combined data from all institutions
   - Work across organizations

### 🔧 Implementation Complete:

- ✅ Models updated
- ✅ Controllers enhanced with new functions
- ✅ New routes added for admin management
- ✅ Comprehensive documentation created
- ✅ No linter errors
- ✅ Ready to use!

---

## 🚀 Next Steps

1. **Review Documentation**

   - Read [ROLES_AND_PERMISSIONS.md](ROLES_AND_PERMISSIONS.md)

2. **Run Migration**

   ```bash
   npm run migrate
   ```

3. **Create Super Admin**

   ```bash
   npm run create-superadmin
   ```

4. **Create Institutions & Assign Admins**

   - Use new endpoints to set up your structure

5. **Test Each Role**
   - Super admin → full access
   - Institution admin → institution access
   - Tutor → multi-institution access
   - Resident → own submissions only

---

**Your multi-institution structure is now properly implemented! 🎊**
