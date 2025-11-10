# Multi-Role System - Quick API Reference

## 🎯 Core Concept

Users can have **different roles in different institutions**:

- Tutor in Hospital A
- Admin in Hospital B
- Resident in Clinic C

---

## 📍 API Endpoints

### 1. Join Institution (User Self-Join)

```
POST /institutions/:id/join
```

**Request:**

```json
{
  "role": "resident" // Optional: "tutor" or "resident" (default: "resident")
}
```

**Response:**

```json
{
  "message": "Successfully joined Hospital A as resident",
  "institution": {
    "_id": "...",
    "name": "Hospital A",
    "code": "HA001",
    "logo": "..."
  },
  "role": "resident"
}
```

---

### 2. Assign/Update User Role (Admin Only)

```
POST /institutions/:id/assign-user
```

**Permissions:** Institution Admin or Super Admin

**Request:**

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
  "user": { ... },
  "previousRole": "resident",
  "newRole": "tutor"
}
```

---

### 3. Get My Institutions (with my roles)

```
GET /institutions/me
```

**Response:**

```json
{
  "institutions": [
    {
      "_id": "inst1",
      "name": "Hospital A",
      "code": "HA001",
      "userRole": "tutor", // ⭐ Your role here
      "assignedAt": "2025-10-01T10:00:00Z",
      "formTemplatesCount": 15,
      "formSubmissionsCount": 89
    },
    {
      "_id": "inst2",
      "name": "Medical College B",
      "code": "MCB001",
      "userRole": "admin", // ⭐ Your role here
      "assignedAt": "2025-09-15T08:00:00Z",
      "formTemplatesCount": 8,
      "formSubmissionsCount": 34
    }
  ],
  "totals": {
    "institutionsCount": 2,
    "formTemplatesCount": 23,
    "formSubmissionsCount": 123
  }
}
```

---

### 4. Get User's Role in Institution

```
GET /institutions/:institutionId/my-role
GET /institutions/:institutionId/user-role/:userId
```

**Permissions:**

- Users can check their own role
- Admins can check any user's role in their institutions

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

---

## 🔧 Helper Methods (Backend)

Use these in your controllers:

```javascript
// Get user's role in institution
const role = user.getRoleInInstitution(institutionId);
// Returns: "admin" | "tutor" | "resident" | null

// Check if user has specific role
const isTutor = user.hasRoleInInstitution(institutionId, "tutor");
// Returns: boolean

// Check if user is admin
const isAdmin = user.isAdminOfInstitution(institutionId);
// Returns: boolean

// Get all institutions where user is tutor
const tutorInstitutions = user.getInstitutionsByRole("tutor");
// Returns: [institutionId1, institutionId2, ...]

// Get all user's institutions
const allInstitutions = user.getAllInstitutions();
// Returns: [institutionId1, institutionId2, institutionId3, ...]

// Assign role (in controller)
user.assignRoleToInstitution(institutionId, "admin", assignedByUserId);
await user.save();

// Remove from institution
user.removeFromInstitution(institutionId);
await user.save();
```

---

## 📱 Mobile App Integration

### Screen 1: My Institutions

```javascript
const MyInstitutionsScreen = () => {
  const [institutions, setInstitutions] = useState([]);

  useEffect(() => {
    fetchMyInstitutions();
  }, []);

  const fetchMyInstitutions = async () => {
    const response = await fetch("/institutions/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    setInstitutions(data.institutions);
  };

  return (
    <View>
      {institutions.map((inst) => (
        <InstitutionCard
          key={inst._id}
          institution={inst}
          userRole={inst.userRole} // Show user's role badge
        />
      ))}
    </View>
  );
};
```

### Screen 2: Join Institution

```javascript
const joinInstitution = async (institutionId) => {
  try {
    const response = await fetch(`/institutions/${institutionId}/join`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role: "resident" }),
    });

    const data = await response.json();
    Alert.alert("Success", data.message);
    navigation.navigate("MyInstitutions");
  } catch (error) {
    Alert.alert("Error", error.message);
  }
};
```

### Screen 3: Check Role & Show Features

```javascript
const InstitutionHomeScreen = ({ institutionId }) => {
  const [myRole, setMyRole] = useState(null);

  useEffect(() => {
    checkMyRole();
  }, [institutionId]);

  const checkMyRole = async () => {
    const response = await fetch(`/institutions/${institutionId}/my-role`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    setMyRole(data.role);
  };

  return (
    <View>
      {myRole === "admin" && <AdminPanel />}
      {myRole === "tutor" && <TutorPanel />}
      {myRole === "resident" && <ResidentPanel />}
    </View>
  );
};
```

---

## 🎨 Admin Dashboard Integration

### Manage User Roles

```javascript
const UserRoleManager = ({ userId, institutionId }) => {
  const [currentRole, setCurrentRole] = useState(null);

  const changeRole = async (newRole) => {
    const response = await fetch(`/institutions/${institutionId}/assign-user`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userId,
        role: newRole,
      }),
    });

    const data = await response.json();
    setCurrentRole(data.newRole);
    alert(data.message);
  };

  return (
    <div>
      <h3>Change User Role</h3>
      <button onClick={() => changeRole("admin")}>Make Admin</button>
      <button onClick={() => changeRole("tutor")}>Make Tutor</button>
      <button onClick={() => changeRole("resident")}>Make Resident</button>
    </div>
  );
};
```

---

## 🔒 Permission Checks (Backend Examples)

### Example 1: Check if user can manage institution

```javascript
exports.someAdminAction = async (req, res) => {
  const user = await User.findById(req.user._id);
  const { institutionId } = req.params;

  // Check if user is admin of this institution
  if (!user.isSuperAdmin && !user.isAdminOfInstitution(institutionId)) {
    return res.status(403).json({
      message: "Only institution admins can perform this action",
    });
  }

  // Proceed with action...
};
```

### Example 2: Check if tutor can supervise resident

```javascript
exports.assignResident = async (req, res) => {
  const tutor = await User.findById(req.user._id);
  const { institutionId, residentId } = req.body;

  const tutorRole = tutor.getRoleInInstitution(institutionId);

  if (!tutorRole || !["admin", "tutor"].includes(tutorRole)) {
    return res.status(403).json({
      message: "Only tutors or admins can supervise residents",
    });
  }

  // Assign resident...
};
```

### Example 3: Filter submissions by role

```javascript
exports.getSubmissions = async (req, res) => {
  const user = await User.findById(req.user._id);
  const { institutionId } = req.query;

  const role = user.getRoleInInstitution(institutionId);

  let query = { institution: institutionId };

  if (role === "resident") {
    // Residents see only their own submissions
    query.resident = user._id;
  } else if (role === "tutor") {
    // Tutors see their residents' submissions
    query.tutor = user._id;
  } else if (role === "admin") {
    // Admins see all submissions in institution
    // No additional filter needed
  } else {
    return res
      .status(403)
      .json({ message: "Not a member of this institution" });
  }

  const submissions = await FormSubmissions.find(query);
  res.json(submissions);
};
```

---

## 🗄️ Database Structure

### User Document Example

```javascript
{
  "_id": "user123",
  "username": "john_doe",
  "email": "john@example.com",

  // NEW: Institution-specific roles
  "institutionRoles": [
    {
      "institution": "inst1",
      "role": "tutor",
      "assignedAt": "2025-10-01T10:00:00Z",
      "assignedBy": "admin456"
    },
    {
      "institution": "inst2",
      "role": "admin",
      "assignedAt": "2025-09-15T08:00:00Z",
      "assignedBy": "superadmin789"
    },
    {
      "institution": "inst3",
      "role": "resident",
      "assignedAt": "2025-11-01T14:00:00Z",
      "assignedBy": "user123"  // Self-joined
    }
  ],

  // OLD: Kept for backward compatibility
  "roles": ["tutor", "admin", "resident"],
  "institutions": ["inst1", "inst2", "inst3"],

  "isSuperAdmin": false,
  "isDeleted": false
}
```

---

## 🚀 Quick Start

### 1. User Joins Institution

```bash
curl -X POST http://localhost:8000/institutions/inst123/join \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{"role": "resident"}'
```

### 2. Admin Changes User Role

```bash
curl -X POST http://localhost:8000/institutions/inst123/assign-user \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"userId": "user456", "role": "tutor"}'
```

### 3. Get My Institutions

```bash
curl http://localhost:8000/institutions/me \
  -H "Authorization: Bearer <user_token>"
```

### 4. Check My Role

```bash
curl http://localhost:8000/institutions/inst123/my-role \
  -H "Authorization: Bearer <user_token>"
```

---

## ❓ Common Questions

### Q: Can a user have multiple roles in one institution?

**A:** No. One user = one role per institution. But they can have different roles in different institutions.

### Q: What happens when I change a user's role?

**A:** The old role is automatically removed and replaced with the new role.

### Q: Can users join institutions by themselves?

**A:** Yes! They use the `/institutions/:id/join` endpoint and default to "resident" role. Admins can later change their role.

### Q: Who can assign roles?

**A:** Only Super Admins (platform-wide) or Institution Admins (for their specific institution).

### Q: What's the difference between the old `roles` array and new `institutionRoles`?

**A:**

- **Old `roles`**: Global roles for all institutions (not recommended)
- **New `institutionRoles`**: Different role per institution (use this!)

### Q: Do I need to migrate existing data?

**A:** Yes, see the migration script in `MULTI_ROLE_SYSTEM.md`.

---

## 📋 Role Capabilities

| Capability                | Resident | Tutor                | Admin    |
| ------------------------- | -------- | -------------------- | -------- |
| Submit forms              | ✅       | ✅                   | ✅       |
| View own submissions      | ✅       | ✅                   | ✅       |
| View resident submissions | ❌       | ✅ (supervised only) | ✅ (all) |
| Review submissions        | ❌       | ✅                   | ✅       |
| Create form templates     | ❌       | ❌                   | ✅       |
| Manage users              | ❌       | ❌                   | ✅       |
| Assign roles              | ❌       | ❌                   | ✅       |
| Institution settings      | ❌       | ❌                   | ✅       |

---

## 🎯 Summary

**Before:** User has same role everywhere  
**After:** User has different roles in different institutions

**Key Benefits:**

- ✅ More flexible
- ✅ Better permissions
- ✅ Easier to manage
- ✅ Clearer user experience

For complete documentation, see `MULTI_ROLE_SYSTEM.md`
