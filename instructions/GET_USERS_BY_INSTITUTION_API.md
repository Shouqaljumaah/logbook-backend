# Get Users by Institution API - Updated

## Overview

Both `getAllUsers` and `tutorList` endpoints now require an `institutionId` parameter and verify that the requesting user is an admin of that specific institution.

---

## API Endpoints

### 1. GET /users?institutionId=:id

Get all users for a specific institution.

**Auth**: Required (Admin or Super Admin)

**Query Parameters**:

- `institutionId` (required) - The institution ID to get users from

**Authorization**:

- Super Admin: Can query any institution
- Institution Admin: Can only query institutions where they are listed as admin

---

#### Request Example

```bash
GET /users?institutionId=673a5f8b9c1d2e3f4a5b6c7d
Authorization: Bearer YOUR_TOKEN
```

---

#### Response Format

```json
[
  {
    "_id": "user123",
    "username": "john_doe",
    "email": "john@example.com",
    "phoneNumber": "1234567890",
    "supervisor": {
      "_id": "supervisor_id",
      "username": "dr_smith"
    },
    "isSuperAdmin": false,
    "role": "resident",
    "level": "R3",
    "assignedAt": "2025-01-15T10:00:00.000Z",
    "totalSubmissions": 25,
    "createdAt": "2024-12-01T10:00:00.000Z",
    "updatedAt": "2025-01-10T10:00:00.000Z"
  },
  {
    "_id": "user456",
    "username": "jane_smith",
    "email": "jane@example.com",
    "phoneNumber": "9876543210",
    "supervisor": null,
    "isSuperAdmin": false,
    "role": "tutor",
    "level": "",
    "assignedAt": "2024-11-01T10:00:00.000Z",
    "totalSubmissions": 120,
    "createdAt": "2024-10-01T10:00:00.000Z",
    "updatedAt": "2025-01-05T10:00:00.000Z"
  }
]
```

---

#### Response Fields

| Field              | Type        | Description                                                    |
| ------------------ | ----------- | -------------------------------------------------------------- |
| `_id`              | String      | User ID                                                        |
| `username`         | String      | Username                                                       |
| `email`            | String      | Email address                                                  |
| `phoneNumber`      | String      | Phone number                                                   |
| `supervisor`       | Object/null | Supervisor details (for residents)                             |
| `isSuperAdmin`     | Boolean     | Is this user a super admin?                                    |
| `role`             | String      | User's role in THIS institution (`admin`, `tutor`, `resident`) |
| `level`            | String      | User's level in THIS institution (`R1`-`R5` or `""`)           |
| `assignedAt`       | Date        | When the user was assigned to this institution                 |
| `totalSubmissions` | Number      | Total submissions in THIS institution                          |
| `createdAt`        | Date        | Account creation date                                          |
| `updatedAt`        | Date        | Last update date                                               |

---

#### Error Responses

**Missing institutionId**:

```json
{
  "message": "institutionId is required"
}
```

**Status**: 400

**Not an admin**:

```json
{
  "message": "You are not an admin of this institution"
}
```

**Status**: 403

---

### 2. GET /users/tutors?institutionId=:id

Get tutors and admins for a specific institution.

**Auth**: Required (Admin or Super Admin)

**Query Parameters**:

- `institutionId` (required) - The institution ID to get tutors from

**Authorization**:

- Super Admin: Can query any institution
- Institution Admin: Can only query institutions where they are listed as admin

---

#### Request Example

```bash
GET /users/tutors?institutionId=673a5f8b9c1d2e3f4a5b6c7d
Authorization: Bearer YOUR_TOKEN
```

---

#### Response Format

```json
[
  {
    "_id": "tutor123",
    "username": "dr_smith",
    "email": "smith@example.com",
    "phoneNumber": "5551234567",
    "isSuperAdmin": false,
    "role": "tutor",
    "level": "",
    "assignedAt": "2024-09-01T10:00:00.000Z",
    "createdAt": "2024-08-15T10:00:00.000Z"
  },
  {
    "_id": "admin123",
    "username": "dr_jones",
    "email": "jones@example.com",
    "phoneNumber": "5559876543",
    "isSuperAdmin": false,
    "role": "admin",
    "level": "",
    "assignedAt": "2024-07-01T10:00:00.000Z",
    "createdAt": "2024-06-01T10:00:00.000Z"
  }
]
```

---

#### Error Responses

Same as `getAllUsers` endpoint.

---

## Key Changes from Previous Version

### Before ❌

```bash
# Could query without institutionId
GET /users
GET /users/tutors

# Returned users from all institutions the admin belongs to
# Showed institutionRoles array with ALL institutions
```

**Response included all institutions**:

```json
{
  "username": "john",
  "institutionRoles": [
    { "institution": {...}, "role": "resident", "level": "R3" },
    { "institution": {...}, "role": "tutor", "level": "" }
  ]
}
```

---

### After ✅

```bash
# MUST provide institutionId
GET /users?institutionId=INST_ID
GET /users/tutors?institutionId=INST_ID

# Returns users from that specific institution only
# Shows only the role in that institution
```

**Response shows single institution role**:

```json
{
  "username": "john",
  "role": "resident",
  "level": "R3",
  "assignedAt": "2025-01-15T10:00:00.000Z"
}
```

---

## Permission Model

### Flow Diagram

```
Request: GET /users?institutionId=INST_A
           ↓
  Is user Super Admin?
           ↓
      YES → Allow access to any institution
           ↓
       NO → Check if user is in Institution.admins[]
           ↓
      YES → Return users from INST_A
           ↓
       NO → 403 Forbidden
```

---

## Use Cases

### Use Case 1: Admin Dashboard - Select Institution

**Scenario**: Admin dashboard has a dropdown to select institution

**Flow**:

```javascript
1. User logs in
2. Fetch user's admin institutions: GET /institutions (filtered by admin)
3. User selects "Hospital A" from dropdown
4. Fetch users: GET /users?institutionId=hospitalA_id
5. Display users with their roles in Hospital A
```

**UI Display**:

```
Hospital A - Users

| Name        | Email            | Role     | Level | Submissions |
|-------------|------------------|----------|-------|-------------|
| John Doe    | john@example.com | Resident | R3    | 25          |
| Jane Smith  | jane@example.com | Tutor    | -     | 120         |
| Dr. Brown   | brown@example.com| Admin    | -     | 0           |
```

---

### Use Case 2: Filter by Role

**Get only residents**:

```javascript
const response = await fetch(`/users?institutionId=${selectedInstitution}`);
const users = await response.json();

const residents = users.filter((user) => user.role === "resident");
```

**Get only tutors**:

```javascript
const response = await fetch(
  `/users/tutors?institutionId=${selectedInstitution}`
);
const tutors = await response.json();
```

---

### Use Case 3: Check User Permissions

```javascript
async function canManageUsers(institutionId) {
  try {
    const response = await fetch(`/users?institutionId=${institutionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      return true; // User is admin of this institution
    } else if (response.status === 403) {
      return false; // Not admin
    }
  } catch (error) {
    return false;
  }
}
```

---

## Frontend Implementation

### 1. Institution Selector Component

```javascript
const InstitutionUserManager = () => {
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch admin's institutions on mount
  useEffect(() => {
    fetchAdminInstitutions();
  }, []);

  const fetchAdminInstitutions = async () => {
    const response = await fetch("/institutions", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    setInstitutions(data);

    // Auto-select first institution
    if (data.length > 0) {
      setSelectedInstitution(data[0]._id);
    }
  };

  // Fetch users when institution changes
  useEffect(() => {
    if (selectedInstitution) {
      fetchUsers();
    }
  }, [selectedInstitution]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/users?institutionId=${selectedInstitution}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else if (response.status === 403) {
        alert("You are not an admin of this institution");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <select
        value={selectedInstitution}
        onChange={(e) => setSelectedInstitution(e.target.value)}>
        {institutions.map((inst) => (
          <option key={inst._id} value={inst._id}>
            {inst.name}
          </option>
        ))}
      </select>

      {loading ? <p>Loading users...</p> : <UsersTable users={users} />}
    </div>
  );
};
```

---

### 2. Users Table Component

```javascript
const UsersTable = ({ users }) => {
  return (
    <table>
      <thead>
        <tr>
          <th>Username</th>
          <th>Email</th>
          <th>Role</th>
          <th>Level</th>
          <th>Submissions</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user._id}>
            <td>{user.username}</td>
            <td>{user.email}</td>
            <td>
              <RoleBadge role={user.role} />
            </td>
            <td>{user.level ? <LevelBadge level={user.level} /> : "-"}</td>
            <td>{user.totalSubmissions}</td>
            <td>
              <button onClick={() => editUser(user)}>Edit</button>
              <button onClick={() => deleteUser(user)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const RoleBadge = ({ role }) => {
  const colors = {
    admin: "red",
    tutor: "blue",
    resident: "green",
  };

  return <span style={{ color: colors[role] }}>{role.toUpperCase()}</span>;
};

const LevelBadge = ({ level }) => <span className="badge">{level}</span>;
```

---

### 3. Fetch Tutors Only

```javascript
const TutorsList = ({ institutionId }) => {
  const [tutors, setTutors] = useState([]);

  useEffect(() => {
    fetchTutors();
  }, [institutionId]);

  const fetchTutors = async () => {
    const response = await fetch(
      `/users/tutors?institutionId=${institutionId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.ok) {
      const data = await response.json();
      setTutors(data);
    }
  };

  return (
    <select>
      <option value="">Select Tutor...</option>
      {tutors.map((tutor) => (
        <option key={tutor._id} value={tutor._id}>
          {tutor.username} ({tutor.role})
        </option>
      ))}
    </select>
  );
};
```

---

## Testing

### Test 1: Get Users as Admin

```bash
# Get admin's institutions first
curl -X GET http://localhost:8000/institutions \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Pick an institution ID from response
# Then get users for that institution
curl -X GET "http://localhost:8000/users?institutionId=INST_ID" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected**: Returns users from that institution

---

### Test 2: Try to Access Without institutionId

```bash
curl -X GET http://localhost:8000/users \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected**: 400 - "institutionId is required"

---

### Test 3: Try to Access Institution You Don't Admin

```bash
curl -X GET "http://localhost:8000/users?institutionId=OTHER_INST_ID" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected**: 403 - "You are not an admin of this institution"

---

### Test 4: Super Admin Can Access Any Institution

```bash
curl -X GET "http://localhost:8000/users?institutionId=ANY_INST_ID" \
  -H "Authorization: Bearer SUPERADMIN_TOKEN"
```

**Expected**: Returns users from any institution

---

### Test 5: Get Tutors List

```bash
curl -X GET "http://localhost:8000/users/tutors?institutionId=INST_ID" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected**: Returns only tutors and admins from that institution

---

## Summary

### ✅ Benefits

1. **Better Security**: Admins can only access users from institutions they manage
2. **Cleaner Response**: Shows only the relevant role for the selected institution
3. **Accurate Counts**: `totalSubmissions` is specific to the institution
4. **Explicit Intent**: Must specify which institution you're querying
5. **Simpler Frontend**: Single role/level per response, no array filtering needed

### 📋 Migration Checklist

- [ ] Update all API calls to include `institutionId` query parameter
- [ ] Add institution selector dropdown in UI
- [ ] Update response handling (single `role`/`level` instead of array)
- [ ] Handle 403 error when user is not admin
- [ ] Update filters and search to work with single institution
- [ ] Test with multi-institution admins
- [ ] Test with super admin

---

**Now your admin dashboard is properly scoped to individual institutions! 🎯**
