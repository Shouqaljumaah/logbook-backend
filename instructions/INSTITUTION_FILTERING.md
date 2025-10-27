# Institution Filtering Guide

## 🎯 Overview

Users can now filter form templates and form submissions by a specific institution using the `institutionId` query parameter.

---

## 📋 **Get Form Templates**

### Endpoint

```
GET /formTemplates?institutionId={institution_id}
```

### Behavior

#### **Super Admin:**

```bash
# Get ALL form templates (no filter)
GET /formTemplates

# Get forms for specific institution
GET /formTemplates?institutionId=INSTITUTION_ID
```

#### **Institution Admin / Tutor / Resident:**

```bash
# Get forms from ALL their institutions
GET /formTemplates

# Get forms from SPECIFIC institution (must belong to it)
GET /formTemplates?institutionId=INSTITUTION_ID
```

### Examples

**Example 1: Get all forms user has access to**

```bash
curl -X GET http://localhost:8000/formTemplates \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**

```json
[
  {
    "_id": "form1",
    "formName": "Assessment Form",
    "institution": {
      "_id": "inst1",
      "name": "Medical College A"
    },
    "fieldTemplates": [...]
  },
  {
    "_id": "form2",
    "formName": "Evaluation Form",
    "institution": {
      "_id": "inst2",
      "name": "Medical College B"
    },
    "fieldTemplates": [...]
  }
]
```

**Example 2: Get forms for specific institution**

```bash
curl -X GET "http://localhost:8000/formTemplates?institutionId=inst1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**

```json
[
  {
    "_id": "form1",
    "formName": "Assessment Form",
    "institution": {
      "_id": "inst1",
      "name": "Medical College A"
    },
    "fieldTemplates": [...]
  }
]
```

**Example 3: Trying to access institution you don't belong to**

```bash
curl -X GET "http://localhost:8000/formTemplates?institutionId=other_inst" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (403):**

```json
{
  "message": "You don't have access to this institution"
}
```

---

## 📝 **Get Form Submissions**

### Endpoint

```
GET /formSubmitions?institutionId={institution_id}&formPlatform={web|mobile}
```

### Behavior

#### **Super Admin:**

```bash
# Get ALL submissions (no filter)
GET /formSubmitions

# Get submissions for specific institution
GET /formSubmitions?institutionId=INSTITUTION_ID
```

#### **Institution Admin:**

```bash
# Get submissions from ALL their institutions (web platform)
GET /formSubmitions?formPlatform=web

# Get submissions from SPECIFIC institution
GET /formSubmitions?formPlatform=web&institutionId=INSTITUTION_ID
```

#### **Tutor:**

```bash
# Get their submissions from ALL institutions
GET /formSubmitions?formPlatform=mobile

# Get their submissions from SPECIFIC institution
GET /formSubmitions?formPlatform=mobile&institutionId=INSTITUTION_ID
```

#### **Resident:**

```bash
# Get their submissions from ALL institutions
GET /formSubmitions?formPlatform=mobile

# Get their submissions from SPECIFIC institution
GET /formSubmitions?formPlatform=mobile&institutionId=INSTITUTION_ID
```

### Examples

**Example 1: Tutor gets all their submissions**

```bash
curl -X GET "http://localhost:8000/formSubmitions?formPlatform=mobile" \
  -H "Authorization: Bearer TUTOR_TOKEN"
```

**Example 2: Tutor gets submissions from specific institution**

```bash
curl -X GET "http://localhost:8000/formSubmitions?formPlatform=mobile&institutionId=inst1" \
  -H "Authorization: Bearer TUTOR_TOKEN"
```

**Example 3: Admin gets all submissions from their institutions**

```bash
curl -X GET "http://localhost:8000/formSubmitions?formPlatform=web" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Example 4: Admin gets submissions from specific institution**

```bash
curl -X GET "http://localhost:8000/formSubmitions?formPlatform=web&institutionId=inst1" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## 🔐 **Access Control**

### Validation Rules

1. **Super Admin:**

   - ✅ Can request any institution
   - ✅ Can request all institutions (no filter)

2. **Regular Users:**
   - ✅ Can request institutions they belong to
   - ❌ Cannot request institutions they don't belong to
   - ✅ Can request all their institutions (no filter)

### Error Responses

**403 Forbidden - No Access:**

```json
{
  "message": "You don't have access to this institution"
}
```

---

## 💡 **Use Cases**

### Use Case 1: Multi-Institution Dropdown

```javascript
// Frontend: User with multiple institutions

// 1. Get user's institutions
const user = getCurrentUser();
const institutions = user.institutions; // ["inst1", "inst2", "inst3"]

// 2. Show dropdown to select institution
<select onChange={(e) => loadForms(e.target.value)}>
  <option value="">All Institutions</option>
  {institutions.map((inst) => (
    <option value={inst._id}>{inst.name}</option>
  ))}
</select>;

// 3. Load forms based on selection
function loadForms(institutionId) {
  const url = institutionId
    ? `/formTemplates?institutionId=${institutionId}`
    : "/formTemplates";

  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then((res) => res.json())
    .then((forms) => setForms(forms));
}
```

### Use Case 2: Admin Dashboard

```javascript
// Admin wants to see submissions for each institution separately

// Get institutions where user is admin
const adminInstitutions = await fetch("/superadmin/institutions", {
  headers: { Authorization: `Bearer ${token}` },
});

// For each institution, get statistics
for (const inst of adminInstitutions) {
  const submissions = await fetch(
    `/formSubmitions?formPlatform=web&institutionId=${inst._id}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  console.log(`${inst.name}: ${submissions.length} submissions`);
}
```

### Use Case 3: Tutor Working at Multiple Institutions

```javascript
// Tutor wants to see submissions from specific hospital

// 1. User selects institution
const selectedInstitution = "hospital_inst_id";

// 2. Load submissions for that institution
const submissions = await fetch(
  `/formSubmitions?formPlatform=mobile&institutionId=${selectedInstitution}`,
  { headers: { Authorization: `Bearer ${tutorToken}` } }
);

// Shows only submissions from that hospital
```

---

## 🎨 **Frontend Implementation Example**

### React Example

```javascript
import { useState, useEffect } from "react";

function FormsList() {
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState("");
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load user's institutions
  useEffect(() => {
    fetch("/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((user) => setInstitutions(user.institutions));
  }, []);

  // Load forms when institution changes
  useEffect(() => {
    loadForms();
  }, [selectedInstitution]);

  const loadForms = async () => {
    setLoading(true);
    try {
      const url = selectedInstitution
        ? `/formTemplates?institutionId=${selectedInstitution}`
        : "/formTemplates";

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setForms(data);
      } else {
        console.error("Failed to load forms");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Form Templates</h2>

      {/* Institution Filter */}
      <select
        value={selectedInstitution}
        onChange={(e) => setSelectedInstitution(e.target.value)}>
        <option value="">All My Institutions</option>
        {institutions.map((inst) => (
          <option key={inst._id} value={inst._id}>
            {inst.name}
          </option>
        ))}
      </select>

      {/* Forms List */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {forms.map((form) => (
            <li key={form._id}>
              <strong>{form.formName}</strong>
              <br />
              <small>Institution: {form.institution.name}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

---

## 📊 **Query Parameter Summary**

| Endpoint          | Parameter       | Type   | Required | Description                       |
| ----------------- | --------------- | ------ | -------- | --------------------------------- |
| `/formTemplates`  | `institutionId` | string | No       | Filter forms by institution       |
| `/formSubmitions` | `institutionId` | string | No       | Filter submissions by institution |
| `/formSubmitions` | `formPlatform`  | string | No       | Filter by platform (web/mobile)   |

---

## ✅ **Benefits**

1. **Better UX**

   - Users can focus on one institution at a time
   - Reduces clutter in multi-institution scenarios

2. **Performance**

   - Fetches only relevant data
   - Reduces payload size

3. **Flexibility**

   - Can get all data (no filter)
   - Can get specific institution data
   - Super admin has full flexibility

4. **Security**
   - Validates user has access to requested institution
   - Clear error messages

---

## 🔍 **Testing**

### Test as Multi-Institution Tutor:

```bash
# 1. Get all forms
curl -X GET http://localhost:8000/formTemplates \
  -H "Authorization: Bearer TUTOR_TOKEN"

# 2. Get forms for institution 1
curl -X GET "http://localhost:8000/formTemplates?institutionId=INST1_ID" \
  -H "Authorization: Bearer TUTOR_TOKEN"

# 3. Get forms for institution 2
curl -X GET "http://localhost:8000/formTemplates?institutionId=INST2_ID" \
  -H "Authorization: Bearer TUTOR_TOKEN"

# 4. Try to get forms for institution you don't belong to (should fail)
curl -X GET "http://localhost:8000/formTemplates?institutionId=OTHER_INST_ID" \
  -H "Authorization: Bearer TUTOR_TOKEN"
```

### Test as Super Admin:

```bash
# 1. Get ALL forms (no filter)
curl -X GET http://localhost:8000/formTemplates \
  -H "Authorization: Bearer SUPERADMIN_TOKEN"

# 2. Get forms for any institution
curl -X GET "http://localhost:8000/formTemplates?institutionId=ANY_INST_ID" \
  -H "Authorization: Bearer SUPERADMIN_TOKEN"
```

---

**Institution filtering is now available for both form templates and submissions! 🎉**
