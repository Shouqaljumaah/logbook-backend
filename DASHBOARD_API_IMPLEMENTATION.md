# Dashboard API Implementation

## ✅ Implementation Complete

The dashboard API endpoint has been successfully implemented according to the specification in `DASHBOARD_API_SPECIFICATION.md`.

---

## API Endpoint

### `GET /institutions/dashboard?institutionId=:id`

**Note**: The endpoint is available at `/institutions/dashboard` (not `/dashboard`) to align with the existing route structure.

**Auth**: Required (Admin or Super Admin)

**Query Parameters**:

- `institutionId` (required) - The institution ID to get dashboard data for

**Authorization**:

- Super Admin: Can query any institution
- Institution Admin: Can only query institutions where they are listed as admin

---

## Request Example

```bash
GET /institutions/dashboard?institutionId=673a5f8b9c1d2e3f4a5b6c7d
Authorization: Bearer YOUR_TOKEN
```

---

## Response Structure

The API returns comprehensive dashboard data including:

1. **Stats** - Total counts (users, forms, submissions, etc.)
2. **Trends** - Month-over-month comparisons
3. **Completion Rates** - Engagement and completion metrics
4. **Monthly Submissions** - Last 6 months of submission data
5. **Recent Activities** - Latest 10 activities (submissions, users, forms)
6. **Pending Items** - Pending submissions, reviews, incomplete forms
7. **Top Forms** - Top 5 forms by submission count
8. **User Distribution** - Counts by role (residents, tutors, admins)
9. **Level Distribution** - Resident level breakdown (R1-R5)

---

## Implementation Details

### Files Modified

1. **`apis/superadmin/institutions.controllers.js`**

   - Added `getDashboard` controller function
   - Implements all aggregations and calculations
   - Handles authorization checks

2. **`apis/superadmin/institutions.routes.js`**
   - Added dashboard route: `router.get("/dashboard", getDashboard)`
   - Route placed before parameterized routes to avoid conflicts

### Key Features

✅ **Efficient Aggregations**: Uses MongoDB aggregation pipelines for complex queries  
✅ **Parallel Queries**: All database queries run in parallel using `Promise.all()`  
✅ **Authorization**: Properly checks if user is admin of the institution  
✅ **Error Handling**: Comprehensive error handling with appropriate status codes  
✅ **Data Formatting**: Formats dates, percentages, and relative times  
✅ **Activity Tracking**: Combines submissions, users, and forms into activity feed

---

## Data Calculations

### Stats

- **totalUsers**: Count of users with `institutionRoles` for this institution
- **totalForms**: Count of forms for this institution
- **totalSubmissions**: Count of all submissions for this institution
- **completedSubmissions**: Completed submissions this month
- **pendingSubmissions**: Submissions with status "pending" or "rejected"
- **totalResidents/Tutors/Admins**: Counts by role in this institution

### Trends

- Compares current month vs last month for:
  - Submissions
  - New users
  - New forms
- Calculates percentage change

### Completion Rates

- **formsCompleted**: Percentage of completed submissions
- **userEngagement**: Percentage of users who have submitted at least once
- **averageSubmissionsPerUser**: Average submissions per user
- **averageSubmissionsPerForm**: Average submissions per form

### Monthly Submissions

- Aggregates submissions by month for last 6 months
- Returns formatted data with month name and count

### Recent Activities

- Combines:
  - Recent submissions (last 5)
  - Recent user additions (last 3)
  - Recent form creations (last 2)
- Sorts by timestamp and limits to 10 most recent
- Formats relative time strings ("2 hours ago", "1 day ago")

### Top Forms

- Aggregates submissions by form template
- Calculates completion rate per form
- Returns top 5 forms by submission count

### Level Distribution

- Aggregates residents by level (R1-R5)
- Only counts residents in this institution
- Returns count for each level

---

## Error Responses

### Missing institutionId

```json
{
  "message": "institutionId is required"
}
```

**Status**: 400

### Not an Admin

```json
{
  "message": "You are not an admin of this institution"
}
```

**Status**: 403

### Institution Not Found

```json
{
  "message": "Institution not found"
}
```

**Status**: 404

---

## Testing

### Test 1: Get Dashboard as Admin

```bash
curl -X GET "http://localhost:8000/institutions/dashboard?institutionId=INST_ID" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected**: Returns complete dashboard data

---

### Test 2: Missing institutionId

```bash
curl -X GET "http://localhost:8000/institutions/dashboard" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected**: 400 - "institutionId is required"

---

### Test 3: Not an Admin

```bash
curl -X GET "http://localhost:8000/institutions/dashboard?institutionId=OTHER_INST_ID" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected**: 403 - "You are not an admin of this institution"

---

### Test 4: Super Admin Access

```bash
curl -X GET "http://localhost:8000/institutions/dashboard?institutionId=ANY_INST_ID" \
  -H "Authorization: Bearer SUPERADMIN_TOKEN"
```

**Expected**: Returns dashboard data for any institution

---

## Performance Considerations

1. **Parallel Queries**: All database queries run in parallel for optimal performance
2. **Aggregation Pipelines**: Uses MongoDB aggregation for efficient data processing
3. **Limited Results**: Recent activities limited to 10, top forms limited to 5
4. **Indexed Fields**: Queries use indexed fields (`institution`, `createdAt`, `status`)

---

## Frontend Integration

The response structure matches the specification exactly, so the frontend can directly use the data:

```javascript
// Fetch dashboard data
const response = await fetch(
  `/institutions/dashboard?institutionId=${selectedInstitution}`,
  { headers: { Authorization: `Bearer ${token}` } }
);

const dashboardData = await response.json();

// Use the data
const { stats, trends, completionRates, monthlySubmissions, recentActivities } =
  dashboardData;

// Display stats
console.log(`Total Users: ${stats.totalUsers}`);
console.log(`Total Forms: ${stats.totalForms}`);
console.log(`Total Submissions: ${stats.totalSubmissions}`);

// Display trends
console.log(`Submissions Change: ${trends.submissionsChange}%`);

// Display monthly chart
monthlySubmissions.forEach((month) => {
  console.log(`${month.monthName}: ${month.count} submissions`);
});

// Display recent activities
recentActivities.forEach((activity) => {
  console.log(`${activity.description} - ${activity.time}`);
});
```

---

## Notes

1. **Route Path**: The endpoint is at `/institutions/dashboard` (not `/dashboard`) to match the existing route structure. If you need it at `/dashboard`, you can add a separate route in `app.js`.

2. **ObjectId Conversion**: The implementation uses `mongoose.Types.ObjectId` for aggregation queries to ensure proper type matching.

3. **Activity Types**: Activities include:

   - `submission`: Form submissions
   - `user`: User additions
   - `form`: Form creations

4. **Pending Reviews**: Currently uses pending submissions count as pending reviews. You can enhance this if you have a separate review status.

5. **Incomplete Forms**: Forms with no submissions are considered incomplete.

---

## Summary

✅ **Complete Implementation**: All features from the specification are implemented  
✅ **Proper Authorization**: Only admins can access their institution's dashboard  
✅ **Efficient Queries**: Uses parallel queries and aggregation pipelines  
✅ **Comprehensive Data**: Returns all required statistics and analytics  
✅ **Error Handling**: Proper error responses for all edge cases

**The dashboard API is ready to use!** 🎉
