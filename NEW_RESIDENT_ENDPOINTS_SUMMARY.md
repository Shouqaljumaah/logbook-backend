# New Resident Management Endpoints - Quick Summary

## What's New?

Added two new endpoints for managing residents and viewing their submissions:

---

## 1. Get Residents by Tutor (My Residents)

**Purpose:** Show all residents supervised by a tutor in a specific institution

**Endpoints:**

```
GET /users/residents/my-residents?institutionId=<id>
GET /users/residents/by-tutor/:tutorId?institutionId=<id>
```

**Who Can Use:**

- ✅ Tutors (view their own residents)
- ✅ Admins (view any tutor's residents in their institutions)
- ✅ Super Admins (view any tutor's residents)

**Response Includes:**

- List of residents with profile info
- For each resident:
  - Total submissions count
  - Reviewed submissions count
  - Pending submissions count

**Example Response:**

```json
{
  "tutor": { "_id": "...", "username": "dr.smith", "email": "..." },
  "institutionId": "64a123...",
  "residentsCount": 3,
  "residents": [
    {
      "_id": "...",
      "username": "john_doe",
      "email": "john@example.com",
      "institutions": [
        /* ... */
      ],
      "supervisor": {
        /* ... */
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

---

## 2. Get Resident Details

**Purpose:** View complete information about a resident including all their submissions

**Endpoint:**

```
GET /users/residents/:residentId/details?institutionId=<id>
```

**Who Can Use:**

- ✅ Tutors (only their supervised residents)
- ✅ Admins (residents in their institutions)
- ✅ Super Admins (any resident)
- ✅ Residents (only their own details)

**Response Includes:**

- Complete resident profile
- Supervisor information
- Overall statistics
- All submissions with full details
- Submissions grouped by institution

**Example Response:**

```json
{
  "resident": {
    "_id": "...",
    "username": "john_doe",
    "email": "john@example.com",
    "phone": "...",
    "image": "...",
    "institutions": [
      /* ... */
    ],
    "supervisor": {
      /* ... */
    }
  },
  "stats": {
    "totalSubmissions": 15,
    "reviewedSubmissions": 10,
    "pendingSubmissions": 5
  },
  "submissions": [
    {
      "_id": "...",
      "formtemplate": { "formName": "Surgical Case Log", "score": 10 },
      "institution": {
        /* ... */
      },
      "tutor": {
        /* ... */
      },
      "submissionDate": "2025-10-15T10:30:00Z",
      "status": "reviewed",
      "fieldRecords": [
        /* ... */
      ]
    }
  ],
  "submissionsByInstitution": [
    {
      "institution": {
        /* ... */
      },
      "count": 15,
      "submissions": [
        /* ... */
      ]
    }
  ]
}
```

---

## Use Cases for Mobile App (Tutors)

### Screen Flow:

1. **My Residents Screen**

   ```
   GET /users/residents/my-residents?institutionId=<currentInstitution>
   ```

   - Shows list of residents the tutor supervises
   - Shows quick stats for each resident
   - Filtered by current institution

2. **Resident Detail Screen** (tap on a resident)
   ```
   GET /users/residents/<residentId>/details?institutionId=<currentInstitution>
   ```
   - Shows complete resident profile
   - Shows supervisor info
   - Lists all submissions with details
   - Groups submissions by institution
   - Can tap on submission to view more details

---

## Key Features

✅ **Institution Filtering**: Both endpoints support optional `institutionId` query parameter  
✅ **Permission Control**: Strict role-based access control  
✅ **Detailed Statistics**: Submission counts and status tracking  
✅ **Soft Delete Safe**: Excludes deleted accounts  
✅ **Complete Submission Data**: Includes form templates, field records, and institutions  
✅ **Grouped Data**: Submissions organized by institution

---

## Security

- ✅ JWT authentication required
- ✅ Tutors can only see their supervised residents
- ✅ Admins restricted to their institutions
- ✅ Deleted accounts excluded
- ✅ Full permission validation

---

## Quick Integration Example (React Native)

```javascript
// In Tutor's My Residents Screen
const ResidentsScreen = ({ institutionId }) => {
  const [residents, setResidents] = useState([]);

  useEffect(() => {
    fetchMyResidents();
  }, [institutionId]);

  const fetchMyResidents = async () => {
    const response = await fetch(
      `/users/residents/my-residents?institutionId=${institutionId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await response.json();
    setResidents(data.residents);
  };

  return (
    <View>
      {residents.map((resident) => (
        <ResidentCard
          key={resident._id}
          resident={resident}
          onPress={() => navigateToDetails(resident._id)}
        />
      ))}
    </View>
  );
};

// In Resident Detail Screen
const ResidentDetailScreen = ({ residentId, institutionId }) => {
  const [details, setDetails] = useState(null);

  useEffect(() => {
    fetchResidentDetails();
  }, [residentId, institutionId]);

  const fetchResidentDetails = async () => {
    const response = await fetch(
      `/users/residents/${residentId}/details?institutionId=${institutionId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await response.json();
    setDetails(data);
  };

  return (
    <ScrollView>
      <ResidentProfile resident={details?.resident} />
      <Statistics stats={details?.stats} />
      <SubmissionsList submissions={details?.submissions} />
    </ScrollView>
  );
};
```

---

## Testing

```bash
# Test 1: Get my residents
curl -X GET \
  'http://localhost:5000/users/residents/my-residents?institutionId=64a123...' \
  -H 'Authorization: Bearer <tutor_token>'

# Test 2: Get resident details
curl -X GET \
  'http://localhost:5000/users/residents/64a123.../details?institutionId=64a123...' \
  -H 'Authorization: Bearer <tutor_token>'
```

---

## Documentation

For complete documentation, see:

- **Full API Documentation**: `RESIDENT_MANAGEMENT_API.md`
- **Use cases, examples, and error handling**: See full documentation

---

## Notes

1. The `institutionId` query parameter is **optional**

   - If provided: filters results to that institution only
   - If omitted: returns data from all institutions

2. Permission checks are **strict**

   - Tutors can only view their supervised residents
   - Admins can only view residents in their institutions
   - Super admins have full access

3. Statistics are **real-time**

   - Calculated on-the-fly for each request
   - Includes total, reviewed, and pending counts
   - Filtered by institution if specified

4. Submissions include **full details**
   - Form template information
   - Institution information
   - Field records with values
   - Tutor information
   - Sorted by date (newest first)
