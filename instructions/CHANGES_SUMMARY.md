# Changes Summary - Role Structure Correction

## 🔧 What Was Fixed

Based on your feedback, I've corrected the role structure to properly reflect the following:

### ✅ **Corrected Role Structure**

1. **Super Admin** (`superadmin`)

   - Platform administrator
   - Controls ALL institutions and users
   - Created only through script
   - Flag: `isSuperAdmin: true`

2. **Institution Admin** (`admin`)

   - Each institution has its own admin(s)
   - Institution model now has `admins[]` array
   - Manages users within their institution(s)
   - Can be admin of multiple institutions
   - Created by super admin

3. **Tutor** (`tutor`)

   - Can join/belong to multiple institutions
   - Reviews submissions
   - No admin privileges

4. **Resident** (`resident`)
   - Can join/belong to multiple institutions
   - Submits forms
   - Views own submissions only

---

## 📝 Files Modified

### 1. **Models**

#### `models/Institutions.js`

✅ Added `admins` array to track institution administrators

```javascript
admins: [
  {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
];
```

#### `models/Users.js`

✅ Updated comments to clarify role structure

```javascript
// superadmin: platform admin
// admin: institution admin
// tutor/resident: regular users who can join multiple institutions
```

---

### 2. **Controllers**

#### `apis/superadmin/institutions.controllers.js`

**Enhanced `createInstitution`:**

- Accepts optional `adminId` parameter
- Validates admin user exists and has admin role
- Adds admin to institution's `admins[]` array
- Automatically adds institution to admin's `institutions[]` array

**Enhanced `updateInstitution`:**

- Accepts `adminIds` array parameter
- Updates institution's admins
- Syncs users' institutions array
- Removes institution from old admins who are not in new list

**Enhanced `getInstitutionStats`:**

- Now includes breakdown by role:
  - `adminsCount`
  - `tutorsCount`
  - `residentsCount`

**New: `addAdminToInstitution`:**

- Assigns an admin user to an institution
- Validates user has admin role
- Prevents duplicate assignments
- Updates both Institution and User models

**New: `removeAdminFromInstitution`:**

- Removes an admin from institution
- Prevents removing the last admin
- Intelligently handles user's institution membership
- Keeps institution if user is also tutor/resident there

**New: `getInstitutionAdmins`:**

- Returns list of all admins for an institution
- Excludes password field

---

### 3. **Routes**

#### `apis/superadmin/institutions.routes.js`

✅ Added admin management endpoints:

```javascript
GET    /superadmin/institutions/:id/admins          // List admins
POST   /superadmin/institutions/:id/admins          // Add admin
DELETE /superadmin/institutions/:id/admins/:userId  // Remove admin
```

---

### 4. **Documentation**

#### New: `ROLES_AND_PERMISSIONS.md`

Comprehensive 300+ line documentation covering:

- Detailed role descriptions
- Permission matrix
- Data relationships
- Common workflows
- API endpoints for role management
- Best practices
- Troubleshooting guide

#### Updated: `README.md`

- Corrected role descriptions
- Added link to ROLES_AND_PERMISSIONS.md
- Updated API endpoints list

---

## 🔑 Key Relationships

### Institution → Admin

```javascript
Institution: {
  admins: ["userId1", "userId2"]  // Array of admin users
}

User (Admin): {
  roles: ["admin"],
  institutions: ["instId1", "instId2"]  // Institutions they admin
}
```

### User → Multiple Institutions (Tutors/Residents)

```javascript
User (Tutor/Resident): {
  roles: ["tutor"],  // or ["resident"]
  institutions: ["instId1", "instId2", "instId3"]  // Joined institutions
}
```

---

## 🆕 New API Endpoints

### Assign Admin to Institution

```http
POST /superadmin/institutions/{institutionId}/admins
Content-Type: application/json

{
  "userId": "user_id_here"
}
```

**Response:**

```json
{
  "message": "Admin added to institution successfully",
  "institution": {
    "_id": "inst123",
    "name": "Medical College",
    "admins": [
      {
        "_id": "user456",
        "username": "admin.smith",
        "roles": ["admin"]
      }
    ]
  }
}
```

---

### Remove Admin from Institution

```http
DELETE /superadmin/institutions/{institutionId}/admins/{userId}
```

**Response:**

```json
{
  "message": "Admin removed from institution successfully",
  "institution": { ... }
}
```

**Note:** Cannot remove the last admin from an institution.

---

### Get Institution Admins

```http
GET /superadmin/institutions/{institutionId}/admins
```

**Response:**

```json
{
  "admins": [
    {
      "_id": "user456",
      "username": "admin.smith",
      "roles": ["admin"],
      "email": "admin@college.edu"
    }
  ]
}
```

---

### Enhanced Institution Stats

```http
GET /superadmin/institutions/{institutionId}/stats
```

**Response:**

```json
{
  "usersCount": 150,
  "adminsCount": 3, // NEW
  "tutorsCount": 45, // NEW
  "residentsCount": 102, // NEW
  "formTemplatesCount": 25,
  "formSubmitionsCount": 1250
}
```

---

## 📋 Usage Examples

### Example 1: Create Institution with Admin

**Step 1: Create Admin User**

```javascript
POST /superadmin/users
{
  "username": "admin.medical",
  "password": "SecurePass123",
  "role": "admin",
  "email": "admin@medical.edu",
  "institutionIds": []  // Empty initially
}
// Returns: { user: { _id: "user123", ... } }
```

**Step 2: Create Institution and Assign Admin**

```javascript
POST /superadmin/institutions
{
  "name": "Medical College",
  "code": "MC001",
  "adminId": "user123",  // From step 1
  "contactEmail": "contact@medical.edu"
}
// Automatically:
// - Adds user123 to institution.admins[]
// - Adds institution ID to user123.institutions[]
```

---

### Example 2: Add Additional Admin to Existing Institution

```javascript
// 1. Create another admin user
POST /superadmin/users
{
  "username": "admin.deputy",
  "password": "SecurePass123",
  "role": "admin"
}
// Returns: userId

// 2. Add to institution
POST /superadmin/institutions/{institutionId}/admins
{
  "userId": "userId_from_step1"
}
```

---

### Example 3: Tutor Joins Multiple Institutions

```javascript
// Super admin assigns tutor to multiple institutions
PATCH /superadmin/users/{tutorUserId}/institutions
{
  "institutionIds": ["inst1", "inst2", "inst3"]
}

// Now tutor can:
// - See forms from all 3 institutions
// - Review submissions from all 3 institutions
// - Still filtered by their role (only assigned submissions)
```

---

## 🔐 Access Control Logic

### For Institution Admin

```javascript
// When institution admin creates a user:
1. Check if admin has access to target institution
   if (!admin.institutions.includes(targetInstitutionId)) {
     return "Access denied"
   }

2. Create user and add to that institution
   user.institutions = [targetInstitutionId]

3. User now has access to that institution's data
```

### For Multi-Institution Users (Tutors/Residents)

```javascript
// When querying data:
const userInstitutions = user.institutions; // ["inst1", "inst2"]

const data = await Model.find({
  institution: { $in: userInstitutions },
});

// User sees combined data from all their institutions
```

---

## ✅ Validation Rules

1. **Cannot remove last admin from institution**

   - System prevents this to ensure institutions always have management

2. **Admin role required for institution admins**

   - Only users with `roles: ["admin"]` can be institution admins

3. **Institution admin can only manage their institutions**

   - Filtered automatically by system

4. **Tutors and residents can join multiple institutions**
   - No restrictions on number of institutions

---

## 🎯 Benefits of This Structure

1. **Clear Separation**

   - Platform admin (super admin) vs Institution admin (admin)
   - Each institution has dedicated administrators

2. **Flexibility**

   - Tutors and residents can work across institutions
   - Admins can manage multiple institutions

3. **Security**

   - Admins cannot access other institutions
   - Data properly isolated

4. **Scalability**
   - Easy to add new institutions
   - Easy to assign admins
   - Users can grow their institution memberships

---

## 📚 Documentation Files

All documentation has been updated to reflect the correct structure:

1. **ROLES_AND_PERMISSIONS.md** (NEW)

   - Complete guide to roles and permissions
   - Permission matrix
   - Workflows and examples

2. **README.md** (UPDATED)

   - Corrected role descriptions
   - Added new endpoints

3. **API_DOCUMENTATION.md**

   - Full API reference (to be updated with new endpoints)

4. **MIGRATION_GUIDE.md**
   - Migration instructions (existing admins become institution admins)

---

## 🚀 Next Steps

1. **Run Migration** (if not done)

   ```bash
   npm run migrate
   ```

2. **Create Super Admin**

   ```bash
   npm run create-superadmin
   ```

3. **Assign Admins to Institutions**

   - Use the migration script's default institution
   - Or create new institutions and assign admins

4. **Test the Structure**
   - Login as super admin → manage everything
   - Login as institution admin → manage one institution
   - Login as tutor → see multiple institutions
   - Login as resident → see own submissions

---

## 🎉 Summary

The role structure is now properly implemented with:

- ✅ Super admin as platform administrator
- ✅ Institution admins (each institution has its own)
- ✅ Tutors and residents can join multiple institutions
- ✅ Clear separation of responsibilities
- ✅ Proper access control
- ✅ New endpoints for admin management
- ✅ Comprehensive documentation

The system is ready for multi-institution use! 🎊
