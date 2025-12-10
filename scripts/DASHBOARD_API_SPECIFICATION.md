# Dashboard API Specification

## Overview

Create a comprehensive dashboard API endpoint that provides all statistics, analytics, and activity data for a specific institution. The dashboard is institution-scoped and should return aggregated data for the selected institution only.

---

## API Endpoint

### `GET /dashboard?institutionId=:id`

Get comprehensive dashboard data for a specific institution.

**Auth**: Required (Admin or Super Admin)

**Query Parameters**:

- `institutionId` (required) - The institution ID to get dashboard data for

**Authorization**:

- Super Admin: Can query any institution
- Institution Admin: Can only query institutions where they are listed as admin

---

## Request Example

```bash
GET /dashboard?institutionId=673a5f8b9c1d2e3f4a5b6c7d
Authorization: Bearer YOUR_TOKEN
```

---

## Response Format

```json
{
  "stats": {
    "totalUsers": 45,
    "totalForms": 12,
    "totalSubmissions": 234,
    "completedSubmissions": 198,
    "pendingSubmissions": 36,
    "totalResidents": 32,
    "totalTutors": 8,
    "totalAdmins": 5
  },
  "trends": {
    "submissionsThisMonth": 45,
    "submissionsLastMonth": 38,
    "submissionsChange": 18.4,
    "usersThisMonth": 5,
    "usersLastMonth": 3,
    "usersChange": 66.7,
    "formsThisMonth": 2,
    "formsLastMonth": 1,
    "formsChange": 100.0
  },
  "completionRates": {
    "formsCompleted": 75.5,
    "userEngagement": 62.3,
    "averageSubmissionsPerUser": 5.2,
    "averageSubmissionsPerForm": 19.5
  },
  "monthlySubmissions": [
    {
      "month": "2024-01",
      "monthName": "January",
      "count": 45
    },
    {
      "month": "2024-02",
      "monthName": "February",
      "count": 52
    },
    {
      "month": "2024-03",
      "monthName": "March",
      "count": 38
    },
    {
      "month": "2024-04",
      "monthName": "April",
      "count": 47
    },
    {
      "month": "2024-05",
      "monthName": "May",
      "count": 52
    },
    {
      "month": "2024-06",
      "monthName": "June",
      "count": 45
    }
  ],
  "recentActivities": [
    {
      "id": "activity_1",
      "type": "submission",
      "description": "John Doe submitted 'Clinical Rotation Form'",
      "time": "2 hours ago",
      "timestamp": "2025-01-15T14:30:00.000Z",
      "userId": "user123",
      "username": "John Doe",
      "formId": "form456",
      "formName": "Clinical Rotation Form"
    },
    {
      "id": "activity_2",
      "type": "user",
      "description": "Jane Smith was added as a new resident",
      "time": "5 hours ago",
      "timestamp": "2025-01-15T11:15:00.000Z",
      "userId": "user789",
      "username": "Jane Smith"
    },
    {
      "id": "activity_3",
      "type": "form",
      "description": "New form 'Patient Assessment' was created",
      "time": "1 day ago",
      "timestamp": "2025-01-14T09:00:00.000Z",
      "formId": "form789",
      "formName": "Patient Assessment",
      "userId": "admin123",
      "username": "Dr. Admin"
    },
    {
      "id": "activity_4",
      "type": "submission",
      "description": "Mike Johnson completed 'Surgery Log Form'",
      "time": "1 day ago",
      "timestamp": "2025-01-14T16:45:00.000Z",
      "userId": "user456",
      "username": "Mike Johnson",
      "formId": "form321",
      "formName": "Surgery Log Form"
    },
    {
      "id": "activity_5",
      "type": "user",
      "description": "Sarah Williams' level was updated to R3",
      "time": "2 days ago",
      "timestamp": "2025-01-13T10:20:00.000Z",
      "userId": "user654",
      "username": "Sarah Williams"
    }
  ],
  "pendingItems": {
    "pendingSubmissions": 36,
    "pendingReviews": 12,
    "incompleteForms": 8
  },
  "topForms": [
    {
      "formId": "form123",
      "formName": "Clinical Rotation Form",
      "submissionCount": 45,
      "completionRate": 92.5
    },
    {
      "formId": "form456",
      "formName": "Patient Assessment",
      "submissionCount": 38,
      "completionRate": 88.2
    },
    {
      "formId": "form789",
      "formName": "Surgery Log Form",
      "submissionCount": 32,
      "completionRate": 85.0
    }
  ],
  "userDistribution": {
    "residents": 32,
    "tutors": 8,
    "admins": 5
  },
  "levelDistribution": {
    "R1": 8,
    "R2": 10,
    "R3": 7,
    "R4": 5,
    "R5": 2
  }
}
```

---

## Response Fields

### `stats` Object

| Field                  | Type   | Description                                         |
| ---------------------- | ------ | --------------------------------------------------- |
| `totalUsers`           | Number | Total number of users in this institution           |
| `totalForms`           | Number | Total number of published forms in this institution |
| `totalSubmissions`     | Number | Total number of submissions in this institution     |
| `completedSubmissions` | Number | Number of completed submissions (this month)        |
| `pendingSubmissions`   | Number | Number of pending/incomplete submissions            |
| `totalResidents`       | Number | Total number of residents in this institution       |
| `totalTutors`          | Number | Total number of tutors in this institution          |
| `totalAdmins`          | Number | Total number of admins in this institution          |

### `trends` Object

| Field                  | Type   | Description                                             |
| ---------------------- | ------ | ------------------------------------------------------- |
| `submissionsThisMonth` | Number | Submissions created this month                          |
| `submissionsLastMonth` | Number | Submissions created last month                          |
| `submissionsChange`    | Number | Percentage change in submissions (positive or negative) |
| `usersThisMonth`       | Number | New users added this month                              |
| `usersLastMonth`       | Number | New users added last month                              |
| `usersChange`          | Number | Percentage change in new users                          |
| `formsThisMonth`       | Number | New forms created this month                            |
| `formsLastMonth`       | Number | New forms created last month                            |
| `formsChange`          | Number | Percentage change in new forms                          |

### `completionRates` Object

| Field                       | Type   | Description                                                    |
| --------------------------- | ------ | -------------------------------------------------------------- |
| `formsCompleted`            | Number | Percentage of forms that have been completed (0-100)           |
| `userEngagement`            | Number | Percentage of active users (users who submitted at least once) |
| `averageSubmissionsPerUser` | Number | Average number of submissions per user                         |
| `averageSubmissionsPerForm` | Number | Average number of submissions per form                         |

### `monthlySubmissions` Array

Array of objects representing submission counts for the last 6 months:
| Field | Type | Description |
|-------|------|-------------|
| `month` | String | Month in YYYY-MM format |
| `monthName` | String | Full month name (e.g., "January") |
| `count` | Number | Number of submissions in that month |

### `recentActivities` Array

Array of recent activity objects (max 10, sorted by most recent):
| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Unique activity ID |
| `type` | String | Activity type: "submission", "user", "form", "level" |
| `description` | String | Human-readable activity description |
| `time` | String | Relative time string (e.g., "2 hours ago", "1 day ago") |
| `timestamp` | String | ISO 8601 timestamp |
| `userId` | String | User ID (if applicable) |
| `username` | String | Username (if applicable) |
| `formId` | String | Form ID (if applicable) |
| `formName` | String | Form name (if applicable) |

### `pendingItems` Object

| Field                | Type   | Description                                                 |
| -------------------- | ------ | ----------------------------------------------------------- |
| `pendingSubmissions` | Number | Number of submissions with status "pending" or "incomplete" |
| `pendingReviews`     | Number | Number of submissions awaiting review                       |
| `incompleteForms`    | Number | Number of forms that are incomplete/draft                   |

### `topForms` Array

Array of top 5 forms by submission count:
| Field | Type | Description |
|-------|------|-------------|
| `formId` | String | Form ID |
| `formName` | String | Form name |
| `submissionCount` | Number | Total number of submissions for this form |
| `completionRate` | Number | Percentage of completed submissions (0-100) |

### `userDistribution` Object

| Field       | Type   | Description        |
| ----------- | ------ | ------------------ |
| `residents` | Number | Count of residents |
| `tutors`    | Number | Count of tutors    |
| `admins`    | Number | Count of admins    |

### `levelDistribution` Object

Distribution of resident levels (only for residents):
| Field | Type | Description |
|-------|------|-------------|
| `R1` | Number | Count of R1 residents |
| `R2` | Number | Count of R2 residents |
| `R3` | Number | Count of R3 residents |
| `R4` | Number | Count of R4 residents |
| `R5` | Number | Count of R5 residents |

---

## Error Responses

### Missing institutionId

```json
{
  "message": "institutionId is required"
}
```

**Status**: 400

### Not an admin

```json
{
  "message": "You are not an admin of this institution"
}
```

**Status**: 403

### Institution not found

```json
{
  "message": "Institution not found"
}
```

**Status**: 404

---

## Implementation Notes

### Data Aggregation Requirements

1. **User Counts**: Count users where `institutionRoles` contains an entry for this institution
2. **Form Counts**: Count forms where `institutionId` matches
3. **Submission Counts**: Count submissions where `institutionId` matches
4. **Monthly Trends**: Group submissions by month for the last 6 months
5. **Completion Rates**:
   - Forms completed = (completed submissions / total submissions) \* 100
   - User engagement = (users with at least 1 submission / total users) \* 100

### Activity Types

- **submission**: New submission created or completed
- **user**: New user added, user updated, or user level changed
- **form**: New form created or form updated
- **level**: Resident level updated

### Time Calculations

- Calculate relative time strings ("2 hours ago", "1 day ago") on the backend
- Sort activities by `timestamp` descending (most recent first)
- Limit to last 10 activities

### Performance Considerations

- Use database aggregation queries for counts
- Cache monthly submission data (can be stale for up to 5 minutes)
- Use indexes on `institutionId`, `createdAt`, and `status` fields
- Consider pagination if activities list grows too large

---

## Frontend Integration

The frontend expects this data structure and will use it to populate:

- Statistics cards (Total Users, Total Forms, Completed Submissions, Pending Submissions)
- Trend indicators (percentage changes)
- Monthly submission chart data
- Completion rate progress bars
- Recent activities list
- User and level distribution charts

---

## Example Implementation Query (MongoDB)

```javascript
// Pseudo-code for aggregation
const dashboardData = {
  stats: {
    totalUsers: await User.countDocuments({
      "institutionRoles.institution": institutionId,
    }),
    totalForms: await Form.countDocuments({
      institutionId: institutionId,
      status: "published",
    }),
    totalSubmissions: await Submission.countDocuments({
      institutionId: institutionId,
    }),
    completedSubmissions: await Submission.countDocuments({
      institutionId: institutionId,
      status: "completed",
      createdAt: { $gte: startOfMonth },
    }),
    pendingSubmissions: await Submission.countDocuments({
      institutionId: institutionId,
      status: { $in: ["pending", "incomplete"] },
    }),
    totalResidents: await User.countDocuments({
      institutionRoles: {
        $elemMatch: {
          institution: institutionId,
          role: "resident",
        },
      },
    }),
    totalTutors: await User.countDocuments({
      institutionRoles: {
        $elemMatch: {
          institution: institutionId,
          role: "tutor",
        },
      },
    }),
    totalAdmins: await User.countDocuments({
      institutionRoles: {
        $elemMatch: {
          institution: institutionId,
          role: "admin",
        },
      },
    }),
  },
  // ... other aggregations
};
```

---

## Testing

### Test 1: Get Dashboard as Admin

```bash
curl -X GET "http://localhost:8000/dashboard?institutionId=INST_ID" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected**: Returns complete dashboard data for the institution

### Test 2: Missing institutionId

```bash
curl -X GET "http://localhost:8000/dashboard" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected**: 400 - "institutionId is required"

### Test 3: Not an Admin

```bash
curl -X GET "http://localhost:8000/dashboard?institutionId=OTHER_INST_ID" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected**: 403 - "You are not an admin of this institution"

---

## Summary

This API endpoint provides a single, comprehensive response containing all dashboard data needed for the institution-scoped dashboard page. It aggregates statistics, trends, activities, and distributions specific to the requested institution, ensuring efficient data loading and proper access control.
