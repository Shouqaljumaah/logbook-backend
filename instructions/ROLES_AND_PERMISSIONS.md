# Roles and Permissions Structure

## 📋 Role Overview

### 1. **Super Admin** (`superadmin`)

- **Purpose**: Platform administrator who manages the entire system
- **Access Level**: Full access to all institutions and data
- **Responsibilities**:
  - Create and manage institutions
  - Assign institution admins
  - View platform-wide statistics
  - Manage users across all institutions
  - Override any restrictions

**Key Points:**

- Only created by other super admins
- Bypasses all institution-based filtering
- Cannot be assigned to specific institutions (has access to all)
- Flag: `isSuperAdmin: true` in User model

---

### 2. **Institution Admin** (`admin`)

- **Purpose**: Administrator of a specific institution
- **Access Level**: Full access within their assigned institution(s)
- **Responsibilities**:
  - Manage users within their institution
  - Create form templates for their institution
  - View all submissions within their institution
  - Cannot access other institutions' data

**Key Points:**

- Each institution has one or more admins
- Admins are listed in `Institution.admins[]` array
- Can be admin of multiple institutions
- Created by super admin or other admins (within same institution)

**Relationship:**

```javascript
Institution {
  admins: [userId1, userId2], // Array of admin user IDs
}

User {
  roles: ["admin"],
  institutions: [institutionId1, institutionId2], // Institutions they admin
}
```

---

### 3. **Tutor** (`tutor`)

- **Purpose**: Supervisor/instructor who reviews resident submissions
- **Access Level**: Can view and review submissions within their institution(s)
- **Responsibilities**:
  - Review form submissions
  - Create submissions for residents
  - View residents assigned to them
  - Cannot create form templates
  - Cannot manage users

**Key Points:**

- Can join/belong to multiple institutions
- Sees data only from institutions they've joined
- Cannot access admin functions

---

### 4. **Resident** (`resident`)

- **Purpose**: End user who submits forms
- **Access Level**: Can only view their own submissions
- **Responsibilities**:
  - Submit forms
  - View own submissions
  - Cannot review others' submissions
  - Cannot create templates
  - Cannot manage users

**Key Points:**

- Can join/belong to multiple institutions
- Sees only their own data within joined institutions
- Most restricted access level

---

## 🔐 Permission Matrix

| Action                            | Super Admin | Institution Admin | Tutor         | Resident      |
| --------------------------------- | ----------- | ----------------- | ------------- | ------------- |
| **Institutions**                  |
| Create institution                | ✅          | ❌                | ❌            | ❌            |
| Update institution                | ✅          | ❌                | ❌            | ❌            |
| Delete institution                | ✅          | ❌                | ❌            | ❌            |
| View all institutions             | ✅          | ❌                | ❌            | ❌            |
| View own institutions             | ✅          | ✅                | ✅            | ✅            |
| Assign institution admins         | ✅          | ❌                | ❌            | ❌            |
| **Users**                         |
| Create super admin                | ✅          | ❌                | ❌            | ❌            |
| View all users                    | ✅          | ❌                | ❌            | ❌            |
| View institution users            | ✅          | ✅ (own inst)     | ✅ (own inst) | ❌            |
| Create user (any institution)     | ✅          | ❌                | ❌            | ❌            |
| Create user (own institution)     | ✅          | ✅                | ❌            | ❌            |
| Update user (any institution)     | ✅          | ❌                | ❌            | ❌            |
| Update user (own institution)     | ✅          | ✅                | ❌            | ❌            |
| Delete user                       | ✅          | ✅ (own inst)     | ❌            | ❌            |
| Assign users to institutions      | ✅          | ❌                | ❌            | ❌            |
| **Form Templates**                |
| View templates                    | ✅          | ✅ (own inst)     | ✅ (own inst) | ✅ (own inst) |
| Create template (any institution) | ✅          | ❌                | ❌            | ❌            |
| Create template (own institution) | ✅          | ✅                | ❌            | ❌            |
| Update template                   | ✅          | ✅ (own inst)     | ❌            | ❌            |
| Delete template                   | ✅          | ✅ (own inst)     | ❌            | ❌            |
| **Form Submissions**              |
| View all submissions              | ✅          | ✅ (own inst)     | ❌            | ❌            |
| View assigned submissions         | ✅          | ✅                | ✅ (as tutor) | ❌            |
| View own submissions              | ✅          | ✅                | ✅            | ✅            |
| Create submission                 | ✅          | ✅                | ✅            | ✅            |
| Review submission                 | ✅          | ✅                | ✅ (assigned) | ❌            |
| Delete submission                 | ✅          | ✅ (own inst)     | ✅ (if tutor) | ❌            |
| **Statistics**                    |
| Platform-wide stats               | ✅          | ❌                | ❌            | ❌            |
| Institution stats                 | ✅          | ✅ (own inst)     | ❌            | ❌            |

---

## 🏗️ Data Relationships

### Institution → Admin Relationship

```javascript
// Institution model
{
  _id: "inst123",
  name: "Medical College",
  admins: ["user456", "user789"], // User IDs of institution admins
  // ... other fields
}

// Admin User model
{
  _id: "user456",
  username: "admin.smith",
  roles: ["admin"],
  institutions: ["inst123"], // Institution they admin
  isSuperAdmin: false
}
```

**How it works:**

1. Super admin creates an institution
2. Super admin creates a user with `role: "admin"`
3. Super admin assigns this user as admin of the institution:
   - Adds user ID to `Institution.admins[]`
   - Adds institution ID to `User.institutions[]`
4. Admin can now manage that institution

---

### User → Multiple Institutions (Tutors/Residents)

```javascript
// Tutor who works at multiple institutions
{
  _id: "user123",
  username: "dr.jones",
  roles: ["tutor"],
  institutions: ["inst1", "inst2", "inst3"], // Joined 3 institutions
  isSuperAdmin: false
}
```

**How it works:**

1. Institution admin creates a tutor/resident
2. User is assigned to that institution
3. User can later join additional institutions (by super admin or other institution admins)
4. User sees data from all their joined institutions

---

## 📝 Common Workflows

### Creating a New Institution with Admin

**Super Admin Workflow:**

1. **Create Institution Admin User**

```javascript
POST /superadmin/users
{
  "username": "admin.college",
  "password": "SecurePass123",
  "role": "admin",
  "email": "admin@college.edu",
  "institutionIds": [] // Empty initially
}
// Returns: userId
```

2. **Create Institution and Assign Admin**

```javascript
POST /superadmin/institutions
{
  "name": "Medical College",
  "code": "MC001",
  "adminId": "userId_from_step1",
  "contactEmail": "contact@college.edu"
}
// Automatically adds admin to institution.admins[]
// Automatically adds institution to admin's institutions[]
```

**Alternative: Create Institution First**

```javascript
// 1. Create institution
POST /superadmin/institutions
{ name: "College", code: "COL001" }

// 2. Create admin user
POST /superadmin/users
{
  username: "admin.user",
  role: "admin",
  institutionIds: ["institution_id_from_step1"]
}

// 3. Assign as institution admin
POST /superadmin/institutions/{institution_id}/admins
{ userId: "user_id_from_step2" }
```

---

### Institution Admin Creating Users

**Institution Admin Workflow:**

```javascript
// Admin creates a tutor in their institution
POST /users/signup
{
  "username": "dr.tutor",
  "password": "Pass123",
  "role": "tutor",
  "institutionId": "their_institution_id" // Optional, uses admin's first institution if not provided
}
```

**Behind the scenes:**

- Validates admin has access to the institution
- Creates user with `roles: ["tutor"]`
- Adds institution to user's `institutions[]` array
- User can now access that institution's data

---

### Tutor Joining Multiple Institutions

**Super Admin Workflow:**

```javascript
// Add tutor to another institution
PATCH /superadmin/users/{userId}/institutions
{
  "institutionIds": ["inst1", "inst2", "inst3"]
}
```

**Result:**

- Tutor can now see data from all 3 institutions
- Sees combined list of forms, submissions, etc.
- Still filtered by their assigned institutions

---

## 🔍 How Access Control Works

### For Super Admin

```javascript
// No filtering applied
const data = await Model.find({});
// Sees EVERYTHING
```

### For Institution Admin

```javascript
// Filtered by their institutions
const adminUser = await User.findById(userId).populate("institutions");
const institutionIds = adminUser.institutions.map((i) => i._id);

const data = await Model.find({
  institution: { $in: institutionIds },
});
// Sees only their institutions' data
```

### For Tutor/Resident

```javascript
// Filtered by their institutions + their role
const user = await User.findById(userId).populate("institutions");
const institutionIds = user.institutions.map((i) => i._id);

// Tutor sees submissions where they are the tutor
const submissions = await FormSubmissions.find({
  institution: { $in: institutionIds },
  tutor: userId,
});

// Resident sees only their own submissions
const submissions = await FormSubmissions.find({
  institution: { $in: institutionIds },
  resident: userId,
});
```

---

## ⚙️ API Endpoints for Role Management

### Super Admin Only

**Assign Admin to Institution:**

```
POST /superadmin/institutions/{institutionId}/admins
Body: { userId: "user_id" }
```

**Remove Admin from Institution:**

```
DELETE /superadmin/institutions/{institutionId}/admins/{userId}
```

**Get Institution Admins:**

```
GET /superadmin/institutions/{institutionId}/admins
```

**Update User's Institutions:**

```
PATCH /superadmin/users/{userId}/institutions
Body: { institutionIds: ["inst1", "inst2"] }
```

---

## 🎯 Best Practices

1. **Always have at least one institution admin**

   - System prevents removing the last admin from an institution

2. **Super admins should be limited**

   - Only create super admins for platform management
   - Regular institution management should use institution admins

3. **Use institution admins for day-to-day management**

   - Each institution should have 1-2 admins
   - Admins handle user creation and form management

4. **Tutors and residents can work across institutions**

   - A tutor can supervise at multiple institutions
   - A resident can train at multiple institutions

5. **Data isolation is automatic**
   - Users only see data from their joined institutions
   - No need to manually filter in frontend

---

## 🔄 Migration Notes

After migration, all existing users are assigned to the "Default Institution":

- Existing admins become institution admins of default institution
- They're added to the institution's `admins[]` array
- They keep the same permissions within that institution
- Super admin needs to be created separately using the script

---

## 📞 Role-Related Troubleshooting

**Q: Admin can't see any users**
A: Check if admin has institutions assigned: `User.institutions[]` should not be empty

**Q: User can't create forms**
A: Only admins can create form templates. Tutors/residents can only submit forms.

**Q: Tutor can't see submissions**
A: Check if:

1. Tutor is assigned to the institution
2. Tutor is assigned as tutor on those submissions
3. Institution is active

**Q: Can't remove admin from institution**
A: You cannot remove the last admin. Assign another admin first.

---

This structure ensures proper separation of concerns while allowing flexibility for users to work across multiple institutions.
