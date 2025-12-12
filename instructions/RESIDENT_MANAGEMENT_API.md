# Resident Management API Documentation

## Overview

This document describes the API endpoints for managing residents and viewing their submissions within institutions. These endpoints are designed for tutors to manage their supervised residents and for admins to view residents in their institutions.

---

## Endpoints

### 1. Get Residents by Tutor

Get all residents supervised by a specific tutor within an institution.

**Endpoint:** `GET /users/residents/my-residents`  
**Endpoint:** `GET /users/residents/by-tutor/:tutorId`  
**Auth Required:** Yes (JWT)  
**Permissions:**

- Tutors can view their own residents
- Admins can view residents of tutors in their institutions
- Super Admins can view all

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| institutionId | String | No | Filter residents by institution ID |

**Request Example:**

```bash
# Get my own residents in a specific institution
GET /users/residents/my-residents?institutionId=64a123456789abcdef012345

# Get residents supervised by a specific tutor
GET /users/residents/by-tutor/64a123456789abcdef012346?institutionId=64a123456789abcdef012345
```

**Response Example:**

```json
{
  "tutor": {
    "_id": "64a123456789abcdef012346",
    "username": "dr.smith",
    "email": "dr.smith@hospital.com"
  },
  "institutionId": "64a123456789abcdef012345",
  "residentsCount": 3,
  "residents": [
    {
      "_id": "64a123456789abcdef012347",
      "username": "john_doe",
      "email": "john@example.com",
      "roles": ["resident"],
      "institutions": [
        {
          "_id": "64a123456789abcdef012345",
          "name": "General Hospital",
          "code": "GH001",
          "logo": "/uploads/logo.png"
        }
      ],
      "supervisor": {
        "_id": "64a123456789abcdef012346",
        "username": "dr.smith",
        "email": "dr.smith@hospital.com"
      },
      "stats": {
        "totalSubmissions": 15,
        "reviewedSubmissions": 10,
        "pendingSubmissions": 5
      }
    }
  ]
}
```

**Status Codes:**

- `200 OK` - Successfully retrieved residents
- `404 Not Found` - Tutor not found
- `400 Bad Request` - User is not a tutor
- `500 Internal Server Error` - Server error

**Notes:**

- If no `tutorId` is provided in the URL, the endpoint uses the authenticated user's ID
- The `institutionId` query parameter is optional - if not provided, returns residents from all institutions
- Each resident includes statistics about their submissions with this specific tutor
- Deleted accounts are excluded from the results

---

### 2. Get Resident Details

Get detailed information about a specific resident, including their profile and all submissions.

**Endpoint:** `GET /users/residents/:residentId/details`  
**Auth Required:** Yes (JWT)  
**Permissions:**

- Tutors can only view their own supervised residents
- Admins can view residents in their institutions
- Super Admins can view all residents
- Users can only view their own details

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| residentId | String | Yes | The ID of the resident |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| institutionId | String | No | Filter submissions by institution ID |

**Request Example:**

```bash
# Get resident details with all submissions
GET /users/residents/64a123456789abcdef012347/details

# Get resident details filtered by institution
GET /users/residents/64a123456789abcdef012347/details?institutionId=64a123456789abcdef012345
```

**Response Example:**

```json
{
  "resident": {
    "_id": "64a123456789abcdef012347",
    "username": "john_doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "image": "/uploads/profile.jpg",
    "roles": ["resident"],
    "institutions": [
      {
        "_id": "64a123456789abcdef012345",
        "name": "General Hospital",
        "code": "GH001",
        "logo": "/uploads/logo.png"
      }
    ],
    "supervisor": {
      "_id": "64a123456789abcdef012346",
      "username": "dr.smith",
      "email": "dr.smith@hospital.com",
      "phone": "+1234567891",
      "image": "/uploads/supervisor.jpg"
    }
  },
  "stats": {
    "totalSubmissions": 15,
    "reviewedSubmissions": 10,
    "pendingSubmissions": 5
  },
  "submissions": [
    {
      "_id": "64a123456789abcdef012348",
      "formtemplate": {
        "_id": "64a123456789abcdef012349",
        "formName": "Surgical Case Log",
        "score": 10
      },
      "institution": {
        "_id": "64a123456789abcdef012345",
        "name": "General Hospital",
        "code": "GH001",
        "logo": "/uploads/logo.png"
      },
      "tutor": {
        "_id": "64a123456789abcdef012346",
        "username": "dr.smith",
        "email": "dr.smith@hospital.com"
      },
      "submissionDate": "2025-10-15T10:30:00Z",
      "status": "reviewed",
      "fieldRecords": [
        {
          "_id": "64a123456789abcdef012350",
          "fieldTemplate": {
            "_id": "64a123456789abcdef012351",
            "name": "Patient Age",
            "type": "number"
          },
          "value": "45"
        }
      ]
    }
  ],
  "submissionsByInstitution": [
    {
      "institution": {
        "_id": "64a123456789abcdef012345",
        "name": "General Hospital",
        "code": "GH001",
        "logo": "/uploads/logo.png"
      },
      "count": 15,
      "submissions": [
        /* ... */
      ]
    }
  ]
}
```

**Status Codes:**

- `200 OK` - Successfully retrieved resident details
- `404 Not Found` - Resident not found
- `400 Bad Request` - User is not a resident
- `403 Forbidden` - No permission to view this resident or account is deleted
- `500 Internal Server Error` - Server error

**Notes:**

- Tutors can only view residents they supervise
- Admins can view any resident in institutions they administer
- Super admins can view any resident
- The response includes detailed submission information with populated form templates, institutions, and field records
- Submissions are sorted by date (newest first)
- If `institutionId` is provided, only submissions from that institution are included
- The `submissionsByInstitution` groups all submissions by institution for easy organization

---

## Permission Matrix

| Role        | View Own Residents | View Other Tutor's Residents | View Resident Details      | Filter by Institution |
| ----------- | ------------------ | ---------------------------- | -------------------------- | --------------------- |
| Tutor       | ✅                 | ❌                           | ✅ (Only supervised)       | ✅                    |
| Admin       | ❌                 | ✅ (In their institutions)   | ✅ (In their institutions) | ✅                    |
| Super Admin | ✅                 | ✅                           | ✅                         | ✅                    |
| Resident    | ❌                 | ❌                           | ✅ (Only self)             | ✅                    |

---

## Use Cases

### For Tutors (Mobile App)

1. **View My Residents List**

   ```javascript
   // Get all my residents
   GET /users/residents/my-residents

   // Get my residents in a specific institution
   GET /users/residents/my-residents?institutionId=<institutionId>
   ```

2. **View Resident Details**

   ```javascript
   // Click on a resident to see their details
   GET /users/residents/<residentId>/details

   // Filter to see submissions in current institution only
   GET /users/residents/<residentId>/details?institutionId=<institutionId>
   ```

3. **Track Resident Progress**
   ```javascript
   // The response includes:
   // - Total submissions
   // - Reviewed vs pending submissions
   // - Submissions grouped by institution
   // - Individual submission details
   ```

### For Admins (Admin Dashboard)

1. **View Residents by Tutor**

   ```javascript
   // See all residents supervised by a specific tutor
   GET /users/residents/by-tutor/<tutorId>?institutionId=<myInstitutionId>
   ```

2. **Monitor Resident Activity**
   ```javascript
   // View detailed resident information including all submissions
   GET /users/residents/<residentId>/details?institutionId=<myInstitutionId>
   ```

### For Super Admins

1. **Platform-wide Analytics**

   ```javascript
   // View any tutor's residents across all institutions
   GET /users/residents/by-tutor/<tutorId>

   // View any resident's complete history
   GET /users/residents/<residentId>/details
   ```

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "message": "Error description"
}
```

**Common Errors:**

- `404 Not Found` - Tutor or resident doesn't exist
- `400 Bad Request` - Invalid request (e.g., user is not a tutor/resident)
- `403 Forbidden` - Insufficient permissions or account deleted
- `401 Unauthorized` - Invalid or missing JWT token
- `500 Internal Server Error` - Server-side error

---

## Integration Examples

### React Native (Mobile App)

```javascript
// Tutor viewing their residents
const fetchMyResidents = async (institutionId) => {
  try {
    const response = await fetch(
      `/users/residents/my-residents?institutionId=${institutionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await response.json();
    return data.residents;
  } catch (error) {
    console.error("Error fetching residents:", error);
  }
};

// View resident details
const fetchResidentDetails = async (residentId, institutionId) => {
  try {
    const response = await fetch(
      `/users/residents/${residentId}/details?institutionId=${institutionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching resident details:", error);
  }
};
```

### React (Admin Dashboard)

```javascript
// Admin viewing residents by tutor
const fetchResidentsByTutor = async (tutorId, institutionId) => {
  try {
    const response = await fetch(
      `/users/residents/by-tutor/${tutorId}?institutionId=${institutionId}`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching residents:", error);
  }
};
```

---

## Mobile App Integration Flow

### Screen 1: My Residents List

1. User (Tutor) logs in
2. Selects an institution from their joined institutions
3. App calls `GET /users/residents/my-residents?institutionId=<selectedInstitutionId>`
4. Display list of residents with their stats (total, reviewed, pending submissions)

### Screen 2: Resident Details

1. User taps on a resident from the list
2. App calls `GET /users/residents/<residentId>/details?institutionId=<currentInstitutionId>`
3. Display resident profile information
4. Display resident statistics
5. Display list of all submissions (grouped by institution if needed)
6. User can tap on individual submissions to view details

---

## Testing

### Test Scenario 1: Tutor Views Own Residents

```bash
# Login as tutor
POST /users/login
{
  "username": "tutor1",
  "password": "password123"
}

# Get residents
GET /users/residents/my-residents?institutionId=64a123456789abcdef012345
Authorization: Bearer <tutor_token>
```

**Expected Result:** List of residents supervised by this tutor in the specified institution

### Test Scenario 2: Admin Views Tutor's Residents

```bash
# Login as admin
POST /users/login
{
  "username": "admin1",
  "password": "password123"
}

# Get residents of a specific tutor
GET /users/residents/by-tutor/64a123456789abcdef012346?institutionId=64a123456789abcdef012345
Authorization: Bearer <admin_token>
```

**Expected Result:** List of residents supervised by the specified tutor in admin's institution

### Test Scenario 3: View Resident Details with Permission Check

```bash
# Login as tutor
POST /users/login
{
  "username": "tutor1",
  "password": "password123"
}

# Try to view own resident (should succeed)
GET /users/residents/<own_resident_id>/details
Authorization: Bearer <tutor_token>

# Try to view another tutor's resident (should fail)
GET /users/residents/<other_tutor_resident_id>/details
Authorization: Bearer <tutor_token>
```

**Expected Results:**

- First request: 200 OK with resident details
- Second request: 403 Forbidden

---

## Database Queries

### Get Residents by Tutor

```javascript
// Main query
User.find({
  roles: "resident",
  supervisor: tutorId,
  institutions: institutionId, // Optional filter
  isDeleted: false,
})
  .populate("institutions", "name code logo")
  .populate("supervisor", "username email")
  .select("-password")
  .sort({ username: 1 });

// For each resident, count submissions
FormSubmitions.countDocuments({
  resident: residentId,
  tutor: tutorId,
  institution: institutionId, // Optional filter
});
```

### Get Resident Details

```javascript
// Get resident
User.findById(residentId)
  .populate("institutions", "name code logo")
  .populate("supervisor", "username email phone image")
  .select("-password");

// Get submissions
FormSubmitions.find({
  resident: residentId,
  institution: institutionId, // Optional filter
})
  .populate("formtemplate", "formName score")
  .populate("institution", "name code logo")
  .populate("tutor", "username email")
  .populate({
    path: "fieldRecords",
    populate: {
      path: "fieldTemplate",
      select: "name type",
    },
  })
  .sort({ submissionDate: -1 });
```

---

## Notes for Frontend Developers

1. **State Management**:

   - Store current institution ID in app state/context
   - Filter residents by institution automatically

2. **Caching**:

   - Cache resident list per institution
   - Invalidate cache when submissions are created/updated

3. **Loading States**:

   - Show skeleton/loader while fetching residents
   - Show empty state when no residents found

4. **Error Handling**:

   - Handle network errors gracefully
   - Show appropriate error messages for permission denied

5. **Refresh**:

   - Implement pull-to-refresh on resident list
   - Auto-refresh resident details when returning from submission detail

6. **Performance**:
   - Use pagination if resident list is large
   - Lazy load submission details
   - Cache submission data to reduce API calls

---

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Strict permission checks based on user role
3. **Data Isolation**: Users can only access data they're authorized for
4. **Soft Delete**: Deleted accounts are excluded from all queries
5. **Input Validation**: All IDs are validated before database queries
6. **Error Messages**: Generic error messages to avoid information leakage

---

## Future Enhancements

1. **Pagination**: Add pagination for large resident lists
2. **Search**: Add search functionality by resident name/email
3. **Filtering**: Add more filter options (status, submission count, etc.)
4. **Sorting**: Add sorting options (name, submission count, last activity)
5. **Bulk Actions**: Add ability to perform actions on multiple residents
6. **Notifications**: Notify tutors when residents submit forms
7. **Analytics**: Add more detailed analytics and insights
8. **Export**: Add ability to export resident data and submissions
