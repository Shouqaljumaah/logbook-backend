# Frontend Migration Brief: Single → Multi-Institution System

## 🎯 Overview

The backend has been migrated from a **single-institution** system to a **multi-institution** system. The admin frontend needs to be updated to support:

1. **Institution admins** can belong to and manage multiple institutions
2. **Institution creation** by admins (not just super admins)
3. **Admin assignment** to institutions
4. **Institution filtering** for users, forms, and submissions
5. **Institution context** in all operations

---

## 🔑 Key Changes

### Before (Old System)

```
- Single institution system
- All data belonged to one institution
- Admins managed all users/forms/submissions
- No institution selection needed
```

### After (New System)

```
- Multiple institutions per platform
- Each user can belong to multiple institutions
- Admins create and manage their own institutions
- Users/forms/submissions belong to specific institutions
- Institution selection/filtering required in UI
```

---

## 📊 Data Model Changes

### User Object (Updated)

```javascript
{
  _id: "user_id",
  username: "john.doe",
  email: "john@example.com",
  roles: ["admin"],  // Can have multiple: ["admin", "tutor"]
  isSuperAdmin: false,  // NEW: Super admin flag
  institutions: [  // NEW: Array of institutions user belongs to
    {
      _id: "inst1_id",
      name: "Hospital A",
      code: "HA001"
    },
    {
      _id: "inst2_id",
      name: "Hospital B",
      code: "HB001"
    }
  ],
  // ... other fields
}
```

### Institution Object (New)

```javascript
{
  _id: "institution_id",
  name: "Medical College",
  code: "MC001",
  description: "Main medical college",
  logo: "uploads/logo.png",
  contactEmail: "contact@medcollege.com",
  contactPhone: "+1234567890",
  address: "123 Medical St",
  isActive: true,
  admins: ["user1_id", "user2_id"],  // NEW: Users who admin this institution
  settings: {},
  createdAt: "2025-01-01T00:00:00.000Z"
}
```

### Form Template (Updated)

```javascript
{
  _id: "form_id",
  formName: "Patient Assessment",
  institution: {  // NEW: Institution reference
    _id: "inst_id",
    name: "Hospital A"
  },
  fieldTemplates: [...],
  // ... other fields
}
```

### Form Submission (Updated)

```javascript
{
  _id: "submission_id",
  formtemplate: "template_id",
  institution: "inst_id",  // NEW: Institution reference
  resident: "resident_id",
  tutor: "tutor_id",
  // ... other fields
}
```

---

## 🌐 API Endpoint Changes

### Institution Management (NEW Endpoints)

```javascript
// Get all institutions (admin sees only theirs, super admin sees all)
GET /institutions
Response: [{ _id, name, code, admins, ... }]

// Get single institution
GET /institutions/:id

// Create institution (admin becomes admin automatically)
POST /institutions
Body: { name, code, description, contactEmail, contactPhone, address, logo }

// Update institution
PUT /institutions/:id
Body: { name, description, adminIds: [...] }

// Get institution statistics
GET /institutions/:id/stats
Response: { usersCount, adminsCount, tutorsCount, residentsCount, formTemplatesCount, formSubmitionsCount }

// Get institution admins
GET /institutions/:id/admins
Response: { admins: [{ _id, username, email, roles }] }

// Add admin to institution
POST /institutions/:id/admins
Body: { userId: "user_id" }

// Remove admin from institution
DELETE /institutions/:id/admins/:userId
```

### User Management (Updated)

```javascript
// Create user - now requires institutionId (optional, defaults to admin's first)
POST /users/signup
Body: {
  username, password, role,
  institutionId: "inst_id"  // NEW: Specify which institution
}

// Get users - now filtered by institution
GET /users
// Returns only users from admin's institutions

// Get tutors - now filtered by institution
GET /users/tutors/list
// Returns only tutors from admin's institutions
```

### Form Templates (Updated)

```javascript
// Get forms - now supports filtering
GET /formTemplates?institutionId=inst_id  // NEW: Optional filter
// Without filter: returns forms from all admin's institutions
// With filter: returns forms from specific institution

// Create form template
POST /formTemplates
Body: {
  formName, score, scaleDescription,
  institutionId: "inst_id",  // NEW: Optional, defaults to admin's first institution
  fieldTemplates: [...]
}

// Update/Delete - validates admin has access to form's institution
PUT /formTemplates/:formId
DELETE /formTemplates/:formId
```

### Form Submissions (Updated)

```javascript
// Get submissions - now supports filtering
GET /formSubmitions?formPlatform=web&institutionId=inst_id  // NEW: Optional filter
// Without filter: returns submissions from all admin's institutions
// With filter: returns submissions from specific institution

// Create submission - institution derived from form template
POST /formSubmitions
Body: {
  formtemplate: "template_id",  // Institution determined from this
  resident: "resident_id",
  tutor: "tutor_id",
  fieldRecords: [...]
}
```

---

## 🎨 UI/UX Requirements

### 1. **Institution Selector/Dropdown**

**Location:** Global navigation bar or sidebar

**Purpose:** Allow admin to switch between institutions they manage

```javascript
// Example Component Structure
<InstitutionSelector>
  <Dropdown>
    <Option value="">All Institutions</Option>
    <Option value="inst1">Hospital A</Option>
    <Option value="inst2">Hospital B</Option>
  </Dropdown>
</InstitutionSelector>
```

**Behavior:**

- Fetch institutions on login: `GET /institutions`
- Store selected institution in global state (Context/Redux/Zustand)
- Update all data queries when institution changes
- Persist selection in localStorage

---

### 2. **Institution Management Page (NEW)**

**Path:** `/institutions` or `/settings/institutions`

**Features:**

- List all institutions admin manages
- Create new institution button
- Edit institution details
- View institution statistics
- Manage admins for each institution

**Components Needed:**

```javascript
<InstitutionsPage>
  <InstitutionsList>
    <InstitutionCard institution={inst}>
      <Stats />
      <Actions>
        <EditButton />
        <ViewAdminsButton />
        <ViewStatsButton />
      </Actions>
    </InstitutionCard>
  </InstitutionsList>
  <CreateInstitutionButton />
</InstitutionsPage>
```

---

### 3. **Create/Edit Institution Form (NEW)**

```javascript
<InstitutionForm>
  <Input name="name" required />
  <Input name="code" required />
  <TextArea name="description" />
  <Input name="contactEmail" type="email" />
  <Input name="contactPhone" />
  <TextArea name="address" />
  <FileUpload name="logo" accept="image/*" />
  // Edit mode only:
  <AdminsSelector
    currentAdmins={admins}
    onAdd={handleAddAdmin}
    onRemove={handleRemoveAdmin}
  />
  <SubmitButton />
</InstitutionForm>
```

---

### 4. **User Creation/Management (UPDATED)**

**Add Institution Selection:**

```javascript
<UserForm>
  <Input name="username" required />
  <Input name="email" />
  <Select name="role" required>
    <Option value="admin">Admin</Option>
    <Option value="tutor">Tutor</Option>
    <Option value="resident">Resident</Option>
  </Select>
  // NEW: Institution selector
  <Select name="institutionId">
    <Option value="">Default (Your First Institution)</Option>
    {institutions.map((inst) => (
      <Option value={inst._id}>{inst.name}</Option>
    ))}
  </Select>
  <SubmitButton />
</UserForm>
```

---

### 5. **Form Templates Page (UPDATED)**

**Add Filtering:**

```javascript
<FormTemplatesPage>
  {/* NEW: Institution filter */}
  <FilterBar>
    <InstitutionFilter
      value={selectedInstitution}
      onChange={setSelectedInstitution}
    />
    <SearchInput />
  </FilterBar>

  <FormsList>
    {forms.map((form) => (
      <FormCard form={form}>
        {/* NEW: Show institution badge */}
        <InstitutionBadge>{form.institution.name}</InstitutionBadge>
        <FormDetails />
      </FormCard>
    ))}
  </FormsList>

  <CreateFormButton />
</FormTemplatesPage>
```

---

### 6. **Form Submissions Page (UPDATED)**

**Add Filtering:**

```javascript
<SubmissionsPage>
  {/* NEW: Institution filter */}
  <FilterBar>
    <InstitutionFilter
      value={selectedInstitution}
      onChange={setSelectedInstitution}
    />
    <DateFilter />
    <StatusFilter />
  </FilterBar>

  <SubmissionsTable>
    {submissions.map((sub) => (
      <SubmissionRow submission={sub}>
        {/* NEW: Show institution column */}
        <InstitutionCell>{sub.institution.name}</InstitutionCell>
        <ResidentCell />
        <TutorCell />
        <DateCell />
        <ActionsCell />
      </SubmissionRow>
    ))}
  </SubmissionsTable>
</SubmissionsPage>
```

---

## 🔧 Implementation Steps

### Step 1: Update Authentication/Login

```javascript
// After login, fetch user's institutions
const handleLogin = async (credentials) => {
  const { token, user } = await login(credentials);

  // Store token
  localStorage.setItem("token", token);

  // Fetch institutions
  const institutions = await fetchInstitutions();

  // Store in state
  setCurrentUser(user);
  setInstitutions(institutions);

  // Set default institution
  if (institutions.length > 0) {
    setSelectedInstitution(institutions[0]._id);
  }
};
```

---

### Step 2: Create Global State for Institution Context

**Using Context API:**

```javascript
// InstitutionContext.js
export const InstitutionContext = createContext();

export const InstitutionProvider = ({ children }) => {
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState(null);

  useEffect(() => {
    // Fetch institutions on mount
    fetchInstitutions().then(setInstitutions);
  }, []);

  useEffect(() => {
    // Persist selection
    if (selectedInstitution) {
      localStorage.setItem("selectedInstitution", selectedInstitution);
    }
  }, [selectedInstitution]);

  return (
    <InstitutionContext.Provider
      value={{
        institutions,
        selectedInstitution,
        setSelectedInstitution,
      }}>
      {children}
    </InstitutionContext.Provider>
  );
};
```

---

### Step 3: Update API Calls

**Add Institution Filtering:**

```javascript
// Old
const fetchForms = async () => {
  return await api.get("/formTemplates");
};

// New
const fetchForms = async (institutionId = null) => {
  const url = institutionId
    ? `/formTemplates?institutionId=${institutionId}`
    : "/formTemplates";
  return await api.get(url);
};

// Usage with context
const { selectedInstitution } = useContext(InstitutionContext);
const forms = await fetchForms(selectedInstitution);
```

---

### Step 4: Create Institution Management Components

```javascript
// components/InstitutionSelector.jsx
export const InstitutionSelector = () => {
  const { institutions, selectedInstitution, setSelectedInstitution } =
    useInstitution();

  return (
    <select
      value={selectedInstitution || ""}
      onChange={(e) => setSelectedInstitution(e.target.value)}>
      <option value="">All Institutions</option>
      {institutions.map((inst) => (
        <option key={inst._id} value={inst._id}>
          {inst.name}
        </option>
      ))}
    </select>
  );
};
```

```javascript
// pages/InstitutionsPage.jsx
export const InstitutionsPage = () => {
  const [institutions, setInstitutions] = useState([]);

  useEffect(() => {
    fetchInstitutions().then(setInstitutions);
  }, []);

  return (
    <div>
      <h1>My Institutions</h1>
      <button onClick={() => navigate("/institutions/create")}>
        Create New Institution
      </button>

      <div className="institutions-grid">
        {institutions.map((inst) => (
          <InstitutionCard
            key={inst._id}
            institution={inst}
            onEdit={() => navigate(`/institutions/edit/${inst._id}`)}
          />
        ))}
      </div>
    </div>
  );
};
```

---

### Step 5: Update Existing Pages

**Users Page:**

```javascript
// Add institution filter
const UsersPage = () => {
  const { selectedInstitution } = useInstitution();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Refetch when institution changes
    fetchUsers(selectedInstitution).then(setUsers);
  }, [selectedInstitution]);

  return (
    <div>
      <InstitutionSelector />
      <UsersList users={users} />
    </div>
  );
};
```

---

## 📋 Checklist for Frontend Update

### Phase 1: Setup & Context

- [ ] Create `InstitutionContext` for global state
- [ ] Update login flow to fetch institutions
- [ ] Add institution selector to navigation
- [ ] Update API service to support institution filtering

### Phase 2: Institution Management

- [ ] Create Institutions list page (`/institutions`)
- [ ] Create Institution create form
- [ ] Create Institution edit form
- [ ] Create Institution details/stats page
- [ ] Create Admin management interface (add/remove admins)

### Phase 3: Update Existing Pages

- [ ] Update Users page with institution filter
- [ ] Update User create/edit forms with institution selection
- [ ] Update Form Templates page with institution filter
- [ ] Update Form create/edit with institution selection
- [ ] Update Submissions page with institution filter
- [ ] Add institution badges/indicators where appropriate

### Phase 4: UI/UX Enhancements

- [ ] Add institution badges to cards/lists
- [ ] Update breadcrumbs to show institution context
- [ ] Add institution statistics to dashboard
- [ ] Update sidebar/navigation with institution context
- [ ] Add loading states for institution changes

### Phase 5: Testing

- [ ] Test switching between institutions
- [ ] Test creating users in different institutions
- [ ] Test creating forms in different institutions
- [ ] Test filtering submissions by institution
- [ ] Test admin assignment/removal
- [ ] Test permissions (non-admin access)

---

## 🚨 Common Pitfalls to Avoid

### 1. **Forgetting to Filter Data**

❌ **Wrong:**

```javascript
const forms = await api.get("/formTemplates");
// Shows forms from ALL institutions
```

✅ **Correct:**

```javascript
const { selectedInstitution } = useInstitution();
const forms = await api.get(
  selectedInstitution
    ? `/formTemplates?institutionId=${selectedInstitution}`
    : "/formTemplates"
);
```

---

### 2. **Not Updating Data on Institution Change**

❌ **Wrong:**

```javascript
useEffect(() => {
  fetchUsers();
}, []); // Only fetches once
```

✅ **Correct:**

```javascript
useEffect(() => {
  fetchUsers(selectedInstitution);
}, [selectedInstitution]); // Refetches when institution changes
```

---

### 3. **Hard-coding Institution ID**

❌ **Wrong:**

```javascript
const createUser = async (data) => {
  return api.post("/users/signup", {
    ...data,
    institutionId: "hardcoded_id",
  });
};
```

✅ **Correct:**

```javascript
const createUser = async (data) => {
  const { selectedInstitution } = useInstitution();
  return api.post("/users/signup", {
    ...data,
    institutionId: selectedInstitution || undefined,
  });
};
```

---

### 4. **Not Showing Institution Context**

❌ **Wrong:**

```javascript
<FormCard>
  <h3>{form.formName}</h3>
  {/* No indication which institution */}
</FormCard>
```

✅ **Correct:**

```javascript
<FormCard>
  <h3>{form.formName}</h3>
  <Badge>{form.institution.name}</Badge>
</FormCard>
```

---

## 🎯 Key User Workflows

### Workflow 1: Admin Creates New Institution

```
1. Navigate to /institutions
2. Click "Create New Institution"
3. Fill form (name, code, contact info)
4. Submit
5. Admin automatically becomes admin of new institution
6. Redirect to institutions list
```

### Workflow 2: Admin Adds User to Institution

```
1. Navigate to /users
2. Select institution from dropdown
3. Click "Add User"
4. Fill form, select or default to current institution
5. Submit
6. User appears in list with institution badge
```

### Workflow 3: Admin Switches Institution Context

```
1. Click institution selector in nav
2. Select different institution
3. All data refreshes:
   - Users list updates
   - Forms list updates
   - Submissions list updates
   - Dashboard stats update
```

### Workflow 4: Admin Manages Institution Admins

```
1. Navigate to /institutions
2. Click on institution card
3. Go to "Admins" tab
4. See list of current admins
5. Add new admin (search users, click add)
6. Remove admin (click remove, confirm)
```

---

## 📱 Responsive Considerations

### Mobile View

- Institution selector should be accessible (sticky header or drawer menu)
- Institution badges should be visible but not overwhelming
- Filter dropdowns should be touch-friendly
- Forms should stack vertically

### Tablet View

- Institution selector in top bar
- Cards in 2-column grid
- Filters in collapsible sidebar

### Desktop View

- Institution selector in top bar or sidebar
- Full filter panel
- Multi-column grids
- Expanded statistics views

---

## 🔐 Permission Handling

```javascript
// Check if user is super admin
const isSuperAdmin = user.isSuperAdmin;

// Check if user is admin of specific institution
const isAdminOfInstitution = (institutionId) => {
  return institutions.some(
    (inst) => inst._id === institutionId && inst.admins.includes(user._id)
  );
};

// Show/hide UI elements based on permissions
{
  isSuperAdmin && <DeleteInstitutionButton />;
}
{
  isAdminOfInstitution(inst._id) && <ManageAdminsButton />;
}
```

---

## 📚 Example API Service

```javascript
// services/api.js
class ApiService {
  async getInstitutions() {
    return await this.get("/institutions");
  }

  async getInstitution(id) {
    return await this.get(`/institutions/${id}`);
  }

  async createInstitution(data) {
    return await this.post("/institutions", data);
  }

  async updateInstitution(id, data) {
    return await this.put(`/institutions/${id}`, data);
  }

  async getInstitutionStats(id) {
    return await this.get(`/institutions/${id}/stats`);
  }

  async addAdminToInstitution(institutionId, userId) {
    return await this.post(`/institutions/${institutionId}/admins`, { userId });
  }

  async removeAdminFromInstitution(institutionId, userId) {
    return await this.delete(`/institutions/${institutionId}/admins/${userId}`);
  }

  async getForms(institutionId = null) {
    const url = institutionId
      ? `/formTemplates?institutionId=${institutionId}`
      : "/formTemplates";
    return await this.get(url);
  }

  async getSubmissions(formPlatform, institutionId = null) {
    let url = `/formSubmitions?formPlatform=${formPlatform}`;
    if (institutionId) url += `&institutionId=${institutionId}`;
    return await this.get(url);
  }
}
```

---

## 🎨 Design Tokens/Styles

```css
/* Institution badges */
.institution-badge {
  background: var(--primary-light);
  color: var(--primary-dark);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

/* Institution selector */
.institution-selector {
  min-width: 200px;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
}

/* Institution card */
.institution-card {
  padding: 20px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

---

## ✅ Summary

**Main Changes:**

1. Add institution context throughout the app
2. Create institution management pages
3. Add institution filtering to all data views
4. Update forms to include institution selection
5. Add institution indicators (badges, labels)
6. Handle multi-institution user scenarios

**Key Files to Create:**

- `context/InstitutionContext.jsx`
- `components/InstitutionSelector.jsx`
- `pages/InstitutionsPage.jsx`
- `pages/InstitutionForm.jsx`
- `services/institutionApi.js`

**Key Files to Update:**

- Login flow
- Navigation/Header
- Users page
- Forms page
- Submissions page
- Dashboard (add institution stats)

**Testing Priority:**

1. Institution switching works smoothly
2. Data filters correctly by institution
3. New user/form creation respects institution
4. Admin assignment/removal works
5. Permissions are enforced in UI

---

## 📞 Need Help?

Refer to:

- `API_DOCUMENTATION.md` - Complete API reference
- `PERMISSION_STRUCTURE.md` - Permission matrix and workflows
- `INSTITUTION_FILTERING.md` - Filtering patterns and examples

---

**Good luck with the migration! 🚀**
