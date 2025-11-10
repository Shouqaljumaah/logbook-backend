# Multi-Role Institution System

## Overview

This system allows users to have **different roles in different institutions**. For example:

- User A can be a **tutor** in Hospital A
- The same User A can be an **admin** in Hospital B
- And also a **resident** in Medical College C

## Database Structure

### User Model - New Fields

```javascript
// NEW: Institution-specific roles
institutionRoles: [
  {
    institution: ObjectId, // Reference to Institution
    role: String, // "admin", "tutor", or "resident"
    assignedAt: Date, // When role was assigned
    assignedBy: ObjectId, // Who assigned this role
  },
];

// DEPRECATED (kept for backward compatibility):
roles: [String]; // Old global roles array
institutions: [ObjectId]; // Old institutions array
```

### Helper Methods

The User model now includes helpful methods:

```javascript
// Get user's role in a specific institution
user.getRoleInInstitution(institutionId);
// Returns: "admin" | "tutor" | "resident" | null

// Check if user has specific role in institution
user.hasRoleInInstitution(institutionId, "admin");
// Returns: true | false

// Check if user is admin of institution
user.isAdminOfInstitution(institutionId);
// Returns: true | false

// Get all institutions where user has specific role
user.getInstitutionsByRole("tutor");
// Returns: [institutionId1, institutionId2, ...]

// Get all institutions user belongs to
user.getAllInstitutions();
// Returns: [institutionId1, institutionId2, institutionId3, ...]

// Assign or update role (automatically handles old role removal)
user.assignRoleToInstitution(institutionId, "admin", assignedByUserId);

// Remove user from institution
user.removeFromInstitution(institutionId);
```

---

## API Endpoints

### 1. Join Institution (Mobile App)

Users can join an institution with a default role (usually "resident").

**Endpoint:** `POST /institutions/:id/join`

**Auth:** Required (JWT)

**Request Body:**

```json
{
  "role": "resident" // Optional: "tutor" or "resident" (defaults to "resident")
}
```

**Response:**

```json
{
  "message": "Successfully joined Hospital A as resident",
  "institution": {
    "_id": "inst123",
    "name": "Hospital A",
    "code": "HA001",
    "logo": "uploads/logo.png"
  },
  "role": "resident"
}
```

**Use Case:**

- Mobile app users can join institutions
- They default to "resident" role
- Admins can later change their role if needed

---

### 2. Assign/Update User Role (Admin)

Admins can assign or update a user's role in their institution.

**Endpoint:** `POST /institutions/:id/assign-user`

**Auth:** Required (Institution Admin or Super Admin)

**Request Body:**

```json
{
  "userId": "user123",
  "role": "tutor" // "admin", "tutor", or "resident"
}
```

**Response:**

```json
{
  "message": "User role updated from resident to tutor",
  "user": {
    "_id": "user123",
    "username": "john_doe",
    "email": "john@example.com",
    "institutionRoles": [
      {
        "institution": {
          "_id": "inst123",
          "name": "Hospital A",
          "code": "HA001",
          "logo": "uploads/logo.png"
        },
        "role": "tutor",
        "assignedAt": "2025-11-08T12:00:00Z"
      }
    ]
  },
  "institution": {
    "_id": "inst123",
    "name": "Hospital A"
  },
  "previousRole": "resident",
  "newRole": "tutor"
}
```

**Permissions:**

- Super Admins can assign any role to any user in any institution
- Institution Admins can assign roles to users in their institutions only
- Cannot assign deleted users

**Use Cases:**

- Promote a resident to tutor
- Demote a tutor to resident
- Assign admin rights
- Add new users to institution with specific role

---

### 3. Get User's Institutions

Get all institutions a user belongs to, with their role in each.

**Endpoint:** `GET /institutions/me`

**Auth:** Required (JWT)

**Response:**

```json
{
  "institutions": [
    {
      "_id": "inst1",
      "name": "Hospital A",
      "code": "HA001",
      "logo": "uploads/logo1.png",
      "description": "Main teaching hospital",
      "isActive": true,
      "userRole": "tutor", // User's role here
      "assignedAt": "2025-10-01T10:00:00Z",
      "formTemplatesCount": 15, // Forms in this institution
      "formSubmissionsCount": 89 // Submissions in this institution
    },
    {
      "_id": "inst2",
      "name": "Medical College B",
      "code": "MCB001",
      "logo": "uploads/logo2.png",
      "description": "Medical education center",
      "isActive": true,
      "userRole": "admin", // User is admin here!
      "assignedAt": "2025-09-15T08:00:00Z",
      "formTemplatesCount": 8,
      "formSubmissionsCount": 34
    },
    {
      "_id": "inst3",
      "name": "Clinic C",
      "code": "CC001",
      "logo": "uploads/logo3.png",
      "description": "Community clinic",
      "isActive": true,
      "userRole": "resident", // User is resident here
      "assignedAt": "2025-11-01T14:00:00Z",
      "formTemplatesCount": 5,
      "formSubmissionsCount": 12
    }
  ],
  "totals": {
    "institutionsCount": 3,
    "formTemplatesCount": 28, // Total across all institutions
    "formSubmissionsCount": 135 // Total across all institutions
  }
}
```

**Features:**

- Shows user's specific role in each institution
- Includes form/submission counts per institution
- Shows when user was assigned to each institution
- Useful for mobile app "My Institutions" screen

---

### 4. Get User's Role in Specific Institution

Check a user's role in a specific institution.

**Endpoint:** `GET /institutions/:institutionId/user-role/:userId`  
**Endpoint:** `GET /institutions/:institutionId/my-role` (for checking own role)

**Auth:** Required (JWT)

**Permissions:**

- Users can check their own role
- Admins can check any user's role in their institutions
- Super Admins can check any role

**Response:**

```json
{
  "userId": "user123",
  "username": "john_doe",
  "institutionId": "inst123",
  "role": "tutor",
  "assignedAt": "2025-10-01T10:00:00Z",
  "assignedBy": "admin456"
}
```

**Use Cases:**

- Check if user is admin before allowing certain actions
- Display user's current role in UI
- Verify permissions before API calls

---

## Usage Examples

### Example 1: Mobile App - User Joins Institution

```javascript
// User browses institutions and joins one
const joinInstitution = async (institutionId) => {
  const response = await fetch(`/institutions/${institutionId}/join`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      role: "resident", // Optional, defaults to resident
    }),
  });

  const data = await response.json();
  // User is now a member with "resident" role
};
```

### Example 2: Admin Promotes User to Tutor

```javascript
// Admin changes user's role from resident to tutor
const promoteToTutor = async (institutionId, userId) => {
  const response = await fetch(`/institutions/${institutionId}/assign-user`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: userId,
      role: "tutor",
    }),
  });

  const data = await response.json();
  // data.message: "User role updated from resident to tutor"
};
```

### Example 3: Get User's Institutions with Roles

```javascript
// Mobile app: Show user's institutions
const fetchMyInstitutions = async () => {
  const response = await fetch("/institutions/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  // Display institutions grouped by role
  const adminInstitutions = data.institutions.filter(
    (i) => i.userRole === "admin"
  );
  const tutorInstitutions = data.institutions.filter(
    (i) => i.userRole === "tutor"
  );
  const residentInstitutions = data.institutions.filter(
    (i) => i.userRole === "resident"
  );
};
```

### Example 4: Check User's Role Before Action

```javascript
// Check if user is admin before showing admin features
const checkAdminAccess = async (institutionId) => {
  const response = await fetch(`/institutions/${institutionId}/my-role`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (data.role === "admin") {
    // Show admin features
    showAdminPanel();
  } else if (data.role === "tutor") {
    // Show tutor features
    showTutorPanel();
  } else {
    // Show resident features
    showResidentPanel();
  }
};
```

### Example 5: Backend - Check Permission in Controller

```javascript
// In a controller, check if user has admin role
exports.someProtectedAction = async (req, res) => {
  const user = await User.findById(req.user._id);
  const institutionId = req.params.institutionId;

  // Check if user is admin of this institution
  if (!user.isSuperAdmin && !user.isAdminOfInstitution(institutionId)) {
    return res.status(403).json({
      message: "You must be an admin of this institution",
    });
  }

  // User is admin, proceed with action
  // ...
};
```

---

## Migration from Old System

### Old System (Single Global Roles)

```javascript
{
  "_id": "user123",
  "username": "john",
  "roles": ["tutor"],                    // Global role
  "institutions": ["inst1", "inst2"]     // Just IDs, no role info
}
```

**Problem:** User has same role in ALL institutions

### New System (Institution-Specific Roles)

```javascript
{
  "_id": "user123",
  "username": "john",
  "institutionRoles": [
    {
      "institution": "inst1",
      "role": "tutor",                   // Tutor in inst1
      "assignedAt": "2025-10-01T10:00:00Z"
    },
    {
      "institution": "inst2",
      "role": "admin",                   // Admin in inst2!
      "assignedAt": "2025-09-15T08:00:00Z"
    }
  ],
  // Old fields kept for backward compatibility
  "roles": ["tutor", "admin"],
  "institutions": ["inst1", "inst2"]
}
```

**Solution:** User can have different roles in different institutions

### Migration Script Needed

```javascript
// scripts/migrateToMultiRole.js
const User = require("./models/Users");

async function migrate() {
  const users = await User.find({ institutionRoles: { $size: 0 } });

  for (const user of users) {
    // For each institution, assign the user's first role
    const role = user.roles[0] || "resident";

    user.institutionRoles = user.institutions.map((instId) => ({
      institution: instId,
      role: role,
      assignedAt: new Date(),
      assignedBy: null,
    }));

    await user.save();
    console.log(`Migrated user ${user.username}`);
  }

  console.log("Migration complete!");
}

migrate();
```

---

## Benefits of This System

### ✅ Flexibility

- Users can have different roles in different institutions
- Easy to promote/demote users per institution
- No need to create multiple accounts

### ✅ Clear Permissions

- Easy to check: "Is this user an admin of THIS institution?"
- Role checks are institution-specific
- No ambiguity about permissions

### ✅ Better User Experience

- Mobile app users can join multiple institutions
- See all their institutions with their roles
- Understand their permissions in each place

### ✅ Better Administration

- Admins can manage users in their institutions
- Can promote users from resident → tutor → admin
- Can reassign roles as needed

### ✅ Audit Trail

- Track when role was assigned
- Track who assigned the role
- Historical record of role changes

---

## Important Notes

### Backward Compatibility

The system maintains backward compatibility:

- Old `roles` array is still updated
- Old `institutions` array is still updated
- Existing code using these fields will still work
- Gradually migrate to use `institutionRoles`

### Super Admin Role

- Super Admins (`isSuperAdmin: true`) have access to everything
- They bypass all institution-specific checks
- They can assign any role to any user in any institution
- Super Admin is a platform-wide role, not institution-specific

### Role Hierarchy

Within an institution:

1. **Admin** - Full control of the institution
2. **Tutor** - Can supervise residents, review submissions
3. **Resident** - Can submit forms, view own data

### Role Assignment Rules

- Users can join institutions themselves (as resident)
- Only admins can change roles
- Cannot assign roles to deleted users
- Changing role automatically removes old role
- User can only have ONE role per institution

---

## Testing

### Test Scenario 1: User Joins Multiple Institutions

```bash
# User joins Hospital A as resident
POST /institutions/inst1/join
Authorization: Bearer <user_token>
Body: { "role": "resident" }

# User joins Hospital B as tutor
POST /institutions/inst2/join
Authorization: Bearer <user_token>
Body: { "role": "tutor" }

# Get user's institutions
GET /institutions/me
Authorization: Bearer <user_token>

# Should show:
# - Hospital A with role: "resident"
# - Hospital B with role: "tutor"
```

### Test Scenario 2: Admin Promotes User

```bash
# Admin promotes user from resident to tutor in Hospital A
POST /institutions/inst1/assign-user
Authorization: Bearer <admin_token>
Body: {
  "userId": "user123",
  "role": "tutor"
}

# Response should show role change from "resident" to "tutor"
```

### Test Scenario 3: Check User's Role

```bash
# User checks their own role in Hospital A
GET /institutions/inst1/my-role
Authorization: Bearer <user_token>

# Admin checks another user's role
GET /institutions/inst1/user-role/user123
Authorization: Bearer <admin_token>
```

---

## Common Patterns

### Pattern 1: Show Features Based on Role

```javascript
const user = await User.findById(userId);
const role = user.getRoleInInstitution(institutionId);

switch (role) {
  case "admin":
    return {
      canManageUsers: true,
      canManageForms: true,
      canViewAllSubmissions: true,
    };
  case "tutor":
    return {
      canSuperviseResidents: true,
      canReviewSubmissions: true,
    };
  case "resident":
    return {
      canSubmitForms: true,
      canViewOwnSubmissions: true,
    };
  default:
    return { noAccess: true };
}
```

### Pattern 2: Filter Data by Institution and Role

```javascript
// Get forms user can access
const getAccessibleForms = async (userId, institutionId) => {
  const user = await User.findById(userId);
  const role = user.getRoleInInstitution(institutionId);

  if (!role) {
    throw new Error("User not member of institution");
  }

  // All roles can see forms in their institution
  return FormTemplates.find({ institution: institutionId });
};
```

### Pattern 3: Validate Action Permission

```javascript
const canManageInstitution = (user, institutionId) => {
  return user.isSuperAdmin || user.isAdminOfInstitution(institutionId);
};

const canSuperviseResident = (user, residentId, institutionId) => {
  if (user.isSuperAdmin) return true;

  const role = user.getRoleInInstitution(institutionId);
  return role === "admin" || role === "tutor";
};
```

---

## Summary

The new multi-role system provides:

1. **Institution-specific roles** - Users can have different roles in different institutions
2. **Easy role management** - Admins can assign/update roles through API
3. **Clear permissions** - Easy to check user's role in any institution
4. **Backward compatible** - Old code still works while you migrate
5. **Audit trail** - Track who assigned roles and when
6. **Better UX** - Users see their role in each institution clearly

The system is now much more flexible and powerful! 🎉
