# Mobile App Integration Guide - Multi-Institution System

## 🎯 Overview

This guide is for integrating the multi-institution system into the **mobile application** used by **tutors and residents**.

### Key Features to Add:

1. **Browse Institutions** - View available institutions to join
2. **Join Institution** - Request/join an institution
3. **My Institutions** - View joined institutions
4. **Institution Forms** - View forms specific to a selected institution
5. **Submit with Institution** - Include institution context in submissions

---

## 📱 User Flows

### Flow 1: First Time User (No Institutions)

```
1. User logs in
2. App detects user has no institutions
3. Show "Browse Institutions" screen
4. User selects institution(s) to join
5. User joins institution(s)
6. Redirect to "My Institutions"
```

### Flow 2: Regular User (Has Institutions)

```
1. User logs in
2. Show "My Institutions" screen
3. User selects institution
4. Show forms for that institution
5. User selects form
6. Submit with institution context
```

### Flow 3: Join More Institutions

```
1. From "My Institutions" screen
2. Tap "Join More Institutions" button
3. Show "Browse Institutions" screen
4. User joins new institution
5. Return to "My Institutions"
```

---

## 🌐 API Endpoints Needed

### 1. Get All Institutions (Public/Browse)

**Endpoint:** `GET /institutions/public` or `GET /institutions`

**Purpose:** List all active institutions that users can join

**Auth:** Required (JWT token)

**Response:**

```json
[
  {
    "_id": "inst1_id",
    "name": "Hospital A",
    "code": "HA001",
    "description": "Main teaching hospital",
    "logo": "uploads/logo.png",
    "contactEmail": "contact@hospitala.com",
    "isActive": true
  },
  {
    "_id": "inst2_id",
    "name": "Medical College B",
    "code": "MCB001",
    "description": "Medical education center",
    "logo": "uploads/logo2.png",
    "isActive": true
  }
]
```

**Note:** This endpoint should return all active institutions for users to browse.

---

### 2. Join Institution

**Endpoint:** `POST /institutions/:id/join`

**Purpose:** User joins/requests to join an institution

**Auth:** Required

**Request Body:** (Optional - if you want to add a message)

```json
{
  "message": "I'm a 3rd year resident" // Optional
}
```

**Response:**

```json
{
  "message": "Successfully joined Hospital A",
  "institution": {
    "_id": "inst1_id",
    "name": "Hospital A",
    "code": "HA001"
  }
}
```

**Backend Logic:**

```javascript
// Add institution to user's institutions array
// Add user to institution's users (if tracking)
await User.findByIdAndUpdate(userId, {
  $addToSet: { institutions: institutionId },
});
```

---

### 3. Get My Institutions

**Endpoint:** `GET /users/me/institutions`

**Purpose:** Get institutions the current user belongs to

**Auth:** Required

**Response:**

```json
{
  "institutions": [
    {
      "_id": "inst1_id",
      "name": "Hospital A",
      "code": "HA001",
      "logo": "uploads/logo.png",
      "formsCount": 12, // Number of forms available
      "submissionsCount": 45 // User's submissions in this institution
    },
    {
      "_id": "inst2_id",
      "name": "Medical College B",
      "code": "MCB001",
      "logo": "uploads/logo2.png",
      "formsCount": 8,
      "submissionsCount": 23
    }
  ]
}
```

---

### 4. Get Institution Forms

**Endpoint:** `GET /formTemplates?institutionId=:id`

**Purpose:** Get forms for a specific institution

**Auth:** Required

**Query Parameters:**

- `institutionId` (required) - The institution ID

**Response:**

```json
[
  {
    "_id": "form1_id",
    "formName": "Patient Assessment",
    "institution": {
      "_id": "inst1_id",
      "name": "Hospital A"
    },
    "fieldTemplates": [...],
    "score": "SCORE",
    "scaleDescription": "1-5 scale"
  }
]
```

---

### 5. Create Submission with Institution

**Endpoint:** `POST /formSubmitions`

**Purpose:** Submit form with institution context

**Auth:** Required

**Request Body:**

```json
{
  "formtemplate": "form_id",
  "resident": "resident_id",
  "tutor": "tutor_id",
  "submissionDate": "2025-01-15",
  "institutionId": "inst_id", // NEW: Explicitly pass institution
  "fieldRecords": [
    {
      "fieldTemplate": "field_id",
      "value": "field value"
    }
  ]
}
```

**Response:**

```json
{
  "_id": "submission_id",
  "formtemplate": "form_id",
  "institution": {
    "_id": "inst_id",
    "name": "Hospital A"
  },
  "resident": "resident_id",
  "tutor": "tutor_id",
  "submissionDate": "2025-01-15",
  "status": "pending"
}
```

**Note:** Institution can be derived from form template OR explicitly passed.

---

### 6. Get My Submissions (Filtered by Institution)

**Endpoint:** `GET /formSubmitions?formPlatform=mobile&institutionId=:id`

**Purpose:** Get submissions for specific institution

**Auth:** Required

**Query Parameters:**

- `formPlatform=mobile` (required)
- `institutionId` (optional) - Filter by specific institution

**Response:**

```json
[
  {
    "_id": "sub1_id",
    "formtemplate": {
      "formName": "Patient Assessment"
    },
    "institution": {
      "_id": "inst1_id",
      "name": "Hospital A"
    },
    "resident": {...},
    "tutor": {...},
    "submissionDate": "2025-01-15",
    "status": "reviewed"
  }
]
```

---

## 📱 Mobile App Screens

### Screen 1: Browse Institutions (New)

**Route:** `/browse-institutions` or `/institutions/browse`

**Purpose:** Show all available institutions

**UI Components:**

```jsx
<BrowseInstitutionsScreen>
  <Header>
    <Title>Join an Institution</Title>
    <SearchBar placeholder="Search institutions..." />
  </Header>

  <InstitutionsList>
    {institutions.map((inst) => (
      <InstitutionCard key={inst._id}>
        <Image source={inst.logo} />
        <Content>
          <Title>{inst.name}</Title>
          <Code>{inst.code}</Code>
          <Description>{inst.description}</Description>
          <Contact>
            <Icon name="email" />
            <Text>{inst.contactEmail}</Text>
          </Contact>
        </Content>
        <Actions>
          {userInstitutions.includes(inst._id) ? (
            <Badge color="success">Joined</Badge>
          ) : (
            <Button onPress={() => joinInstitution(inst._id)}>Join</Button>
          )}
        </Actions>
      </InstitutionCard>
    ))}
  </InstitutionsList>
</BrowseInstitutionsScreen>
```

**State Management:**

```javascript
const [institutions, setInstitutions] = useState([]);
const [userInstitutions, setUserInstitutions] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  fetchInstitutions();
  fetchUserInstitutions();
}, []);

const joinInstitution = async (institutionId) => {
  try {
    setLoading(true);
    await api.post(`/institutions/${institutionId}/join`);
    // Refresh user institutions
    await fetchUserInstitutions();
    showSuccess("Successfully joined institution!");
  } catch (error) {
    showError(error.message);
  } finally {
    setLoading(false);
  }
};
```

---

### Screen 2: My Institutions (New)

**Route:** `/my-institutions` or `/institutions`

**Purpose:** Show institutions the user has joined

**UI Components:**

```jsx
<MyInstitutionsScreen>
  <Header>
    <Title>My Institutions</Title>
    <JoinButton onPress={() => navigate("/browse-institutions")}>
      <Icon name="add" />
      <Text>Join More</Text>
    </JoinButton>
  </Header>

  {institutions.length === 0 ? (
    <EmptyState>
      <Icon name="institution" size={64} />
      <Title>No Institutions Yet</Title>
      <Description>Join an institution to start submitting forms</Description>
      <Button onPress={() => navigate("/browse-institutions")}>
        Browse Institutions
      </Button>
    </EmptyState>
  ) : (
    <InstitutionsList>
      {institutions.map((inst) => (
        <InstitutionCard
          key={inst._id}
          onPress={() =>
            navigate("/institution-forms", { institutionId: inst._id })
          }>
          <Image source={inst.logo} />
          <Content>
            <Title>{inst.name}</Title>
            <Code>{inst.code}</Code>
            <Stats>
              <Stat>
                <Icon name="document" />
                <Text>{inst.formsCount} Forms</Text>
              </Stat>
              <Stat>
                <Icon name="checkmark" />
                <Text>{inst.submissionsCount} Submissions</Text>
              </Stat>
            </Stats>
          </Content>
          <Icon name="chevron-right" />
        </InstitutionCard>
      ))}
    </InstitutionsList>
  )}
</MyInstitutionsScreen>
```

**State Management:**

```javascript
const [institutions, setInstitutions] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchMyInstitutions();
}, []);

const fetchMyInstitutions = async () => {
  try {
    setLoading(true);
    const response = await api.get("/users/me/institutions");
    setInstitutions(response.institutions);
  } catch (error) {
    showError("Failed to load institutions");
  } finally {
    setLoading(false);
  }
};
```

---

### Screen 3: Institution Forms (Updated)

**Route:** `/institution-forms/:institutionId`

**Purpose:** Show forms for selected institution

**UI Components:**

```jsx
<InstitutionFormsScreen>
  <Header>
    <BackButton />
    <InstitutionInfo>
      <Image source={institution.logo} />
      <Title>{institution.name}</Title>
    </InstitutionInfo>
  </Header>

  <Tabs>
    <Tab active>Available Forms</Tab>
    <Tab>My Submissions</Tab>
  </Tabs>

  <FormsList>
    {forms.map((form) => (
      <FormCard
        key={form._id}
        onPress={() =>
          navigate("/submit-form", {
            formId: form._id,
            institutionId: institution._id,
          })
        }>
        <Title>{form.formName}</Title>
        <Description>{form.scaleDescription}</Description>
        <FieldCount>
          <Icon name="list" />
          <Text>{form.fieldTemplates.length} fields</Text>
        </FieldCount>
        <Icon name="chevron-right" />
      </FormCard>
    ))}
  </FormsList>
</InstitutionFormsScreen>
```

**State Management:**

```javascript
const { institutionId } = useParams();
const [institution, setInstitution] = useState(null);
const [forms, setForms] = useState([]);
const [activeTab, setActiveTab] = useState("forms"); // 'forms' or 'submissions'

useEffect(() => {
  fetchInstitution();
  fetchForms();
}, [institutionId]);

const fetchInstitution = async () => {
  const response = await api.get(`/institutions/${institutionId}`);
  setInstitution(response);
};

const fetchForms = async () => {
  const response = await api.get(
    `/formTemplates?institutionId=${institutionId}`
  );
  setForms(response);
};
```

---

### Screen 4: Submit Form (Updated)

**Route:** `/submit-form`

**Purpose:** Submit form with institution context

**Changes:**

- Add institution context to submission
- Pass institution ID from navigation params

**State Management:**

```javascript
const { formId, institutionId } = useRoute().params;
const [formTemplate, setFormTemplate] = useState(null);
const [fieldValues, setFieldValues] = useState({});

const handleSubmit = async () => {
  try {
    setLoading(true);

    const submission = {
      formtemplate: formId,
      institutionId: institutionId, // NEW: Include institution
      resident: user._id,
      tutor: selectedTutor._id,
      submissionDate: new Date().toISOString(),
      fieldRecords: Object.entries(fieldValues).map(([fieldId, value]) => ({
        fieldTemplate: fieldId,
        value: value,
      })),
    };

    await api.post("/formSubmitions", submission);
    showSuccess("Form submitted successfully!");
    navigate("/my-institutions");
  } catch (error) {
    showError("Failed to submit form");
  } finally {
    setLoading(false);
  }
};
```

---

### Screen 5: My Submissions (Updated)

**Route:** `/my-submissions`

**Purpose:** View submissions, optionally filtered by institution

**UI Components:**

```jsx
<MySubmissionsScreen>
  <Header>
    <Title>My Submissions</Title>
    <InstitutionFilter
      value={selectedInstitution}
      onChange={setSelectedInstitution}
      institutions={userInstitutions}
    />
  </Header>

  <SubmissionsList>
    {submissions.map((sub) => (
      <SubmissionCard key={sub._id}>
        <Header>
          <FormName>{sub.formtemplate.formName}</FormName>
          <InstitutionBadge>{sub.institution.name}</InstitutionBadge>
        </Header>
        <Meta>
          <Date>{formatDate(sub.submissionDate)}</Date>
          <Status status={sub.status}>
            {sub.status === "reviewed" ? "Reviewed" : "Pending"}
          </Status>
        </Meta>
        {sub.tutor && (
          <Tutor>
            <Icon name="person" />
            <Text>Tutor: {sub.tutor.username}</Text>
          </Tutor>
        )}
      </SubmissionCard>
    ))}
  </SubmissionsList>
</MySubmissionsScreen>
```

---

## 🔄 Updated Navigation Flow

### Before (Single Institution):

```
Login → Forms List → Select Form → Submit
       ↓
       My Submissions
```

### After (Multi-Institution):

```
Login → My Institutions → Select Institution → Institution Forms → Select Form → Submit
       ↓                                        ↓
       Browse Institutions                      My Submissions (filtered)
```

---

## 🗂️ Data Storage (Local State)

### Store in App Context/Redux:

```javascript
{
  user: {
    _id: "user_id",
    username: "john.doe",
    roles: ["tutor"],
    institutions: [
      {
        _id: "inst1_id",
        name: "Hospital A",
        code: "HA001"
      }
    ]
  },
  currentInstitution: "inst1_id", // Currently selected institution
  institutions: [...], // All user's institutions
}
```

---

## 🔧 Implementation Steps

### Step 1: Update User Data Structure

```javascript
// After login, ensure user object includes institutions
const handleLogin = async (credentials) => {
  const { token, user } = await login(credentials);

  // Store token
  await AsyncStorage.setItem("token", token);

  // Store user with institutions
  setUser(user);

  // Check if user has institutions
  if (user.institutions && user.institutions.length > 0) {
    // Has institutions - go to My Institutions
    navigate("MyInstitutions");
  } else {
    // No institutions - go to Browse
    navigate("BrowseInstitutions");
  }
};
```

---

### Step 2: Create Institution Services

```javascript
// services/institutionService.js

export const institutionService = {
  // Get all institutions (for browsing)
  async getAll() {
    return await api.get("/institutions");
  },

  // Get my institutions
  async getMyInstitutions() {
    return await api.get("/users/me/institutions");
  },

  // Join institution
  async join(institutionId) {
    return await api.post(`/institutions/${institutionId}/join`);
  },

  // Get institution details
  async getById(institutionId) {
    return await api.get(`/institutions/${institutionId}`);
  },

  // Get institution forms
  async getForms(institutionId) {
    return await api.get(`/formTemplates?institutionId=${institutionId}`);
  },

  // Get institution submissions
  async getSubmissions(institutionId) {
    return await api.get(
      `/formSubmitions?formPlatform=mobile&institutionId=${institutionId}`
    );
  },
};
```

---

### Step 3: Create App Context

```javascript
// context/AppContext.js

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [currentInstitution, setCurrentInstitution] = useState(null);

  // Load user institutions after login
  useEffect(() => {
    if (user) {
      loadInstitutions();
    }
  }, [user]);

  const loadInstitutions = async () => {
    try {
      const response = await institutionService.getMyInstitutions();
      setInstitutions(response.institutions);

      // Set first institution as current if none selected
      if (!currentInstitution && response.institutions.length > 0) {
        setCurrentInstitution(response.institutions[0]._id);
      }
    } catch (error) {
      console.error("Failed to load institutions:", error);
    }
  };

  const joinInstitution = async (institutionId) => {
    await institutionService.join(institutionId);
    await loadInstitutions(); // Refresh list
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        institutions,
        currentInstitution,
        setCurrentInstitution,
        joinInstitution,
        refreshInstitutions: loadInstitutions,
      }}>
      {children}
    </AppContext.Provider>
  );
};
```

---

### Step 4: Update Forms Fetching

```javascript
// Before (no institution context)
const fetchForms = async () => {
  const forms = await api.get("/formTemplates");
  setForms(forms);
};

// After (with institution context)
const fetchForms = async (institutionId) => {
  const forms = await api.get(`/formTemplates?institutionId=${institutionId}`);
  setForms(forms);
};

// Usage
const { currentInstitution } = useContext(AppContext);
useEffect(() => {
  if (currentInstitution) {
    fetchForms(currentInstitution);
  }
}, [currentInstitution]);
```

---

### Step 5: Update Submission Creation

```javascript
// Before
const submitForm = async (formData) => {
  await api.post("/formSubmitions", {
    formtemplate: formId,
    resident: user._id,
    tutor: tutor._id,
    fieldRecords: formData,
  });
};

// After (with institution)
const submitForm = async (formData) => {
  const { currentInstitution } = useContext(AppContext);

  await api.post("/formSubmitions", {
    formtemplate: formId,
    institutionId: currentInstitution, // NEW
    resident: user._id,
    tutor: tutor._id,
    fieldRecords: formData,
  });
};
```

---

## 🎨 UI/UX Considerations

### Institution Badge

```jsx
<InstitutionBadge>
  <Logo source={institution.logo} />
  <Name>{institution.name}</Name>
</InstitutionBadge>
```

### Institution Selector (If showing multiple)

```jsx
<InstitutionPicker
  selectedValue={currentInstitution}
  onValueChange={setCurrentInstitution}>
  {institutions.map((inst) => (
    <Picker.Item key={inst._id} label={inst.name} value={inst._id} />
  ))}
</InstitutionPicker>
```

### Empty States

```jsx
// No institutions
<EmptyState
  icon="institution"
  title="No Institutions Yet"
  description="Join an institution to start"
  action="Browse Institutions"
  onPress={() => navigate('/browse-institutions')}
/>

// No forms
<EmptyState
  icon="document"
  title="No Forms Available"
  description="This institution has no forms yet"
/>
```

---

## 🔐 Permissions & Validation

### Check if user belongs to institution before actions:

```javascript
const canAccessInstitution = (institutionId) => {
  return user.institutions.some((inst) => inst._id === institutionId);
};

const canSubmitForm = (formInstitutionId) => {
  return canAccessInstitution(formInstitutionId);
};

// Before submission
if (!canSubmitForm(form.institution._id)) {
  showError("You are not a member of this institution");
  return;
}
```

---

## 🚨 Error Handling

### Common Errors:

1. **User not member of institution**

```javascript
try {
  await submitForm();
} catch (error) {
  if (error.status === 403) {
    showError("You must join this institution first");
    navigate("/browse-institutions");
  }
}
```

2. **Institution inactive**

```javascript
if (!institution.isActive) {
  showWarning("This institution is currently inactive");
  disableJoinButton();
}
```

3. **No internet connection**

```javascript
try {
  await fetchInstitutions();
} catch (error) {
  if (error.message === "Network Error") {
    showError("No internet connection");
    showCachedData(); // If available
  }
}
```

---

## 📝 Backend Endpoints to Add

You need to add these endpoints to the backend:

### 1. Join Institution Endpoint

```javascript
// routes
router.post(
  "/institutions/:id/join",
  passport.authenticate("jwt", { session: false }),
  joinInstitution
);

// controller
exports.joinInstitution = async (req, res) => {
  try {
    const userId = req.user._id;
    const institutionId = req.params.id;

    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    if (!institution.isActive) {
      return res.status(400).json({ message: "Institution is not active" });
    }

    const user = await User.findById(userId);

    // Check if already joined
    if (user.institutions.includes(institutionId)) {
      return res
        .status(400)
        .json({ message: "Already joined this institution" });
    }

    // Add institution to user
    user.institutions.push(institutionId);
    await user.save();

    res.json({
      message: `Successfully joined ${institution.name}`,
      institution: {
        _id: institution._id,
        name: institution.name,
        code: institution.code,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

---

### 2. Get My Institutions Endpoint

```javascript
// routes
router.get(
  "/users/me/institutions",
  passport.authenticate("jwt", { session: false }),
  getMyInstitutions
);

// controller
exports.getMyInstitutions = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate("institutions");

    const FormTemplates = require("../models/FormTemplates");
    const FormSubmitions = require("../models/FormSubmitions");

    // Add stats for each institution
    const institutionsWithStats = await Promise.all(
      user.institutions.map(async (inst) => {
        const formsCount = await FormTemplates.countDocuments({
          institution: inst._id,
        });

        const submissionsCount = await FormSubmitions.countDocuments({
          institution: inst._id,
          [user.roles.includes("tutor") ? "tutor" : "resident"]: userId,
        });

        return {
          _id: inst._id,
          name: inst.name,
          code: inst.code,
          logo: inst.logo,
          description: inst.description,
          formsCount,
          submissionsCount,
        };
      })
    );

    res.json({ institutions: institutionsWithStats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

---

## ✅ Implementation Checklist

### Phase 1: Backend Updates

- [ ] Add `POST /institutions/:id/join` endpoint
- [ ] Add `GET /users/me/institutions` endpoint
- [ ] Ensure `GET /institutions` returns all active institutions
- [ ] Update submission creation to accept `institutionId`
- [ ] Update form templates query to filter by `institutionId`

### Phase 2: Mobile App - New Screens

- [ ] Create "Browse Institutions" screen
- [ ] Create "My Institutions" screen
- [ ] Create "Institution Forms" screen
- [ ] Add institution selector/filter component

### Phase 3: Mobile App - Update Existing

- [ ] Update login flow to check for institutions
- [ ] Update form submission to include institution
- [ ] Update submissions list to show institution badge
- [ ] Add institution filter to submissions

### Phase 4: State Management

- [ ] Create/update App Context with institution state
- [ ] Add institution services (API calls)
- [ ] Update navigation flow

### Phase 5: UI/UX

- [ ] Design institution cards
- [ ] Add institution badges
- [ ] Create empty states
- [ ] Add loading indicators

### Phase 6: Testing

- [ ] Test joining institution
- [ ] Test viewing institution forms
- [ ] Test submitting with institution context
- [ ] Test filtering submissions by institution
- [ ] Test with multiple institutions

---

## 🎯 Summary

**Main Changes:**

1. Add institution browsing and joining
2. Show user's institutions
3. Filter forms by institution
4. Include institution in submissions
5. Update navigation flow

**New Screens:**

- Browse Institutions
- My Institutions
- Institution Forms (updated)

**Updated Screens:**

- Submit Form (add institution context)
- My Submissions (add institution filter)

**Key API Calls:**

- `GET /institutions` - Browse all
- `POST /institutions/:id/join` - Join
- `GET /users/me/institutions` - My institutions
- `GET /formTemplates?institutionId=xxx` - Filtered forms
- `POST /formSubmitions` (with institutionId)

---

## 📞 Need Help?

Refer to:

- Backend: `API_DOCUMENTATION.md` - Complete API reference
- Backend: `PERMISSION_STRUCTURE.md` - Permission rules

---

**Good luck with the mobile app integration! 🚀**
