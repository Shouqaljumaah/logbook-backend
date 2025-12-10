# Get Users API - Institution-Specific Roles Update

## Changes Made ✅

Updated the `getAllUsers` and `tutorList` endpoints to show each user's **role and level per institution** instead of the old global roles array.

---

## API Updates

### 1. GET /users - Get All Users

**Endpoint**: `GET /users`

**Auth**: Required (Admin or Super Admin)

#### New Response Format

```json
[
  {
    "_id": "user123",
    "username": "john_doe",
    "email": "john@example.com",
    "phoneNumber": "1234567890",
    "supervisor": {
      "_id": "supervisor_id",
      "username": "supervisor_name"
    },
    "isSuperAdmin": false,
    "institutionRoles": [
      {
        "institution": {
          "_id": "inst_A",
          "name": "Hospital A",
          "code": "HA001"
        },
        "role": "resident",
        "level": "R3",
        "assignedAt": "2025-01-15T10:00:00.000Z",
        "assignedBy": "admin_id"
      },
      {
        "institution": {
          "_id": "inst_B",
          "name": "Hospital B",
          "code": "HB001"
        },
        "role": "tutor",
        "level": "",
        "assignedAt": "2025-02-01T10:00:00.000Z",
        "assignedBy": "admin_id"
      }
    ],
    "totalSubmissions": 45,
    "createdAt": "2024-12-01T10:00:00.000Z",
    "updatedAt": "2025-01-10T10:00:00.000Z"
  }
]
```

#### Key Changes

| Old Structure         | New Structure                                                  |
| --------------------- | -------------------------------------------------------------- |
| `roles: ["resident"]` | `institutionRoles: [{ role: "resident", institution: {...} }]` |
| `institutions: [...]` | Embedded in `institutionRoles`                                 |
| No level information  | `level: "R3"` per institution                                  |
| Single role           | Multiple roles across institutions                             |

---

### 2. GET /users/tutors - Get Tutors List

**Endpoint**: `GET /users/tutors`

**Auth**: Required

#### New Response Format

```json
[
  {
    "_id": "tutor123",
    "username": "dr_smith",
    "email": "smith@example.com",
    "phoneNumber": "9876543210",
    "isSuperAdmin": false,
    "institutionRoles": [
      {
        "institution": {
          "_id": "inst_A",
          "name": "Hospital A",
          "code": "HA001"
        },
        "role": "tutor",
        "level": "",
        "assignedAt": "2025-01-01T10:00:00.000Z"
      },
      {
        "institution": {
          "_id": "inst_B",
          "name": "Clinic B",
          "code": "CB001"
        },
        "role": "admin",
        "level": "",
        "assignedAt": "2024-11-15T10:00:00.000Z"
      }
    ],
    "createdAt": "2024-10-01T10:00:00.000Z"
  }
]
```

---

## Understanding the New Structure

### User Can Have Different Roles in Different Institutions

**Example**: Dr. Sarah

```json
{
  "username": "dr_sarah",
  "institutionRoles": [
    {
      "institution": { "name": "Hospital A" },
      "role": "admin", // She's an admin here
      "level": ""
    },
    {
      "institution": { "name": "Hospital B" },
      "role": "tutor", // But a tutor here
      "level": ""
    },
    {
      "institution": { "name": "Hospital C" },
      "role": "resident", // And a resident here
      "level": "R2"
    }
  ]
}
```

---

### Level is Institution-Specific (Residents Only)

**Example**: John (Resident)

```json
{
  "username": "john",
  "institutionRoles": [
    {
      "institution": { "name": "Hospital A" },
      "role": "resident",
      "level": "R3" // He's R3 in Hospital A
    },
    {
      "institution": { "name": "Hospital B" },
      "role": "resident",
      "level": "R1" // But R1 in Hospital B
    }
  ]
}
```

---

## UI Implementation Guide

### Display User's Roles in Table

```javascript
// React/Vue example
const UserRow = ({ user }) => {
  return (
    <tr>
      <td>{user.username}</td>
      <td>{user.email}</td>
      <td>
        {/* Show all institutions with roles */}
        {user.institutionRoles.map((ir) => (
          <div key={ir.institution._id}>
            <strong>{ir.institution.name}</strong>
            <Badge color={getRoleColor(ir.role)}>{ir.role.toUpperCase()}</Badge>
            {ir.level && <Badge color="info">{ir.level}</Badge>}
          </div>
        ))}
      </td>
      <td>{user.totalSubmissions}</td>
    </tr>
  );
};

function getRoleColor(role) {
  switch (role) {
    case "admin":
      return "red";
    case "tutor":
      return "blue";
    case "resident":
      return "green";
    default:
      return "gray";
  }
}
```

---

### Filter Users by Institution

```javascript
const filterUsersByInstitution = (users, institutionId) => {
  return users
    .map((user) => ({
      ...user,
      // Filter to show only roles in selected institution
      institutionRoles: user.institutionRoles.filter(
        (ir) => ir.institution._id === institutionId
      ),
    }))
    .filter((user) => user.institutionRoles.length > 0);
};
```

---

### Display User Card

```javascript
const UserCard = ({ user }) => {
  return (
    <Card>
      <CardHeader>
        <h3>{user.username}</h3>
        {user.isSuperAdmin && <Badge color="purple">SUPER ADMIN</Badge>}
      </CardHeader>

      <CardBody>
        <p>Email: {user.email}</p>
        <p>Total Submissions: {user.totalSubmissions}</p>

        <h4>Institutions & Roles</h4>
        {user.institutionRoles.map((ir) => (
          <InstitutionRoleCard key={ir.institution._id}>
            <div className="institution-name">
              {ir.institution.name} ({ir.institution.code})
            </div>

            <div className="role-info">
              <Badge>{ir.role}</Badge>
              {ir.level && <Badge variant="outline">{ir.level}</Badge>}
            </div>

            <div className="assigned-date">
              Assigned: {new Date(ir.assignedAt).toLocaleDateString()}
            </div>
          </InstitutionRoleCard>
        ))}
      </CardBody>
    </Card>
  );
};
```

---

### Search/Filter by Role

```javascript
const filterByRole = (users, role) => {
  return users.filter((user) =>
    user.institutionRoles.some((ir) => ir.role === role)
  );
};

// Usage
const residents = filterByRole(users, "resident");
const tutors = filterByRole(users, "tutor");
const admins = filterByRole(users, "admin");
```

---

## Permission Filtering

### What Different Users See

#### Super Admin

- Sees **all users** across all institutions
- Sees all institution roles for each user

#### Institution Admin

- Sees users who belong to **their institutions only**
- Sees all institution roles, but filtered by admin's institutions

#### Regular Users

- May have limited access (depends on your permission setup)

---

## Common Use Cases

### Use Case 1: Show All Residents in an Institution

```javascript
const getResidentsForInstitution = (users, institutionId) => {
  return users
    .filter((user) =>
      user.institutionRoles.some(
        (ir) => ir.institution._id === institutionId && ir.role === "resident"
      )
    )
    .map((user) => ({
      ...user,
      // Show only their role in this institution
      currentRole: user.institutionRoles.find(
        (ir) => ir.institution._id === institutionId
      ),
    }));
};
```

---

### Use Case 2: Show User's Level in Specific Institution

```javascript
const getUserLevelInInstitution = (user, institutionId) => {
  const institutionRole = user.institutionRoles.find(
    (ir) => ir.institution._id === institutionId
  );
  return institutionRole?.level || "Not Set";
};

// Usage
const userLevel = getUserLevelInInstitution(user, "inst_A");
// Returns: "R3" or "Not Set"
```

---

### Use Case 3: Check if User is Admin in Any Institution

```javascript
const isAdminInAnyInstitution = (user) => {
  return user.institutionRoles.some((ir) => ir.role === "admin");
};
```

---

### Use Case 4: Get All Institutions Where User is a Tutor

```javascript
const getTutorInstitutions = (user) => {
  return user.institutionRoles
    .filter((ir) => ir.role === "tutor")
    .map((ir) => ir.institution);
};
```

---

## Migration Impact

### Old API Response (Deprecated)

```json
{
  "username": "john",
  "roles": ["resident"],
  "institutions": ["inst_A", "inst_B"],
  "level": "R2"
}
```

### New API Response

```json
{
  "username": "john",
  "institutionRoles": [
    {
      "institution": { "_id": "inst_A", "name": "Hospital A" },
      "role": "resident",
      "level": "R3"
    },
    {
      "institution": { "_id": "inst_B", "name": "Hospital B" },
      "role": "resident",
      "level": "R1"
    }
  ]
}
```

### What Changed

| Field           | Old                           | New                               |
| --------------- | ----------------------------- | --------------------------------- |
| Roles           | Global `roles` array          | Per-institution `role`            |
| Institutions    | Separate `institutions` array | Embedded in `institutionRoles`    |
| Level           | Global `level`                | Per-institution `level`           |
| Role Assignment | Not tracked                   | `assignedAt`, `assignedBy` fields |

---

## Example API Calls

### Get All Users

```bash
curl -X GET http://localhost:8000/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**:

```json
[
  {
    "_id": "user1",
    "username": "john_doe",
    "institutionRoles": [
      {
        "institution": { "_id": "inst1", "name": "Hospital A" },
        "role": "resident",
        "level": "R3"
      }
    ],
    "totalSubmissions": 25
  }
]
```

---

### Get Tutors List

```bash
curl -X GET http://localhost:8000/users/tutors \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**:

```json
[
  {
    "_id": "tutor1",
    "username": "dr_smith",
    "institutionRoles": [
      {
        "institution": { "_id": "inst1", "name": "Hospital A" },
        "role": "tutor"
      }
    ]
  }
]
```

---

## Testing Checklist

- [ ] Users with multiple institutions show all institution roles
- [ ] Users with different roles in different institutions display correctly
- [ ] Resident levels show per institution
- [ ] Super admin sees all users
- [ ] Institution admin sees only their institution's users
- [ ] Deleted users are excluded from results
- [ ] Total submissions calculate correctly
- [ ] Tutor list filters correctly

---

## Summary

### Key Benefits

✅ **Clear role visibility** - See exactly what role a user has in each institution  
✅ **Level tracking** - Residents have different levels in different institutions  
✅ **Better permissions** - Role-based access per institution  
✅ **Audit trail** - Track when and by whom roles were assigned  
✅ **Flexible structure** - Users can have multiple roles across institutions

### What to Update in Your Frontend

1. Change `user.roles` → `user.institutionRoles[].role`
2. Change `user.institutions` → `user.institutionRoles[].institution`
3. Change `user.level` → `user.institutionRoles[].level`
4. Update UI to display institution-specific roles
5. Add filters for institution-specific role views

---

**Your admin dashboard now has full visibility into each user's roles across all institutions! 🎉**
