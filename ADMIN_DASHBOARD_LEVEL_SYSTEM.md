# Admin Dashboard - Level-Based Access Control System

## Overview

The system now supports **institution-specific resident levels** with **level-based form and field restrictions**. This allows:

- Residents to have different training levels in different institutions
- Forms to be restricted to specific resident levels
- Individual field options to be locked until residents reach certain levels

---

## Core Concepts

### 1. Resident Levels

Each resident can have a different level in each institution:

| Level       | Description          | Typical Experience |
| ----------- | -------------------- | ------------------ |
| **R1**      | First Year Resident  | 0-1 year           |
| **R2**      | Second Year Resident | 1-2 years          |
| **R3**      | Third Year Resident  | 2-3 years          |
| **R4**      | Fourth Year Resident | 3-4 years          |
| **R5**      | Fifth Year Resident  | 4-5 years          |
| **(Empty)** | No level assigned    | No restrictions    |

**Key Feature**: A resident can be:

- R3 in Hospital A (experienced)
- R1 in Hospital B (just started)
- R5 in Clinic C (senior)

### 2. Form-Level Restrictions

Forms can be restricted to certain levels:

- **Minimum Level**: Residents below this level won't see the form
- **Maximum Level**: Optional upper limit
- **Level Restricted**: Toggle to enable/disable restrictions

**Example**: "Advanced Surgical Procedures" form

- Minimum Level: R3
- Result: Only R3, R4, R5 residents can access it

### 3. Field-Level Restrictions

Individual options within select/checkbox fields can be restricted:

- Each option has its own minimum level requirement
- Options are automatically hidden from residents below the required level

**Example**: "Procedure Complexity" field

- "Basic Assessment" → No restriction (all levels)
- "Standard Procedure" → Requires R2+
- "Complex Surgery" → Requires R4+

---

## API Reference for Admin Dashboard

### 1. Get User's Institutions with Levels

**Endpoint**: `GET /institutions/me`

**Response**:

```json
{
  "institutions": [
    {
      "_id": "inst1",
      "name": "Hospital A",
      "code": "HA001",
      "userRole": "resident",
      "userLevel": "R3",
      "assignedAt": "2025-10-01",
      "formTemplatesCount": 15,
      "formSubmissionsCount": 89
    }
  ]
}
```

**Usage**: Display user's level badge next to each institution

---

### 2. Update Resident Level

**Endpoint**: `PATCH /users/:userId/level`

**Auth**: Required (Admin or Tutor)

**Request Body**:

```json
{
  "level": "R3",
  "institutionId": "inst123"
}
```

**Valid Levels**: `"R1"`, `"R2"`, `"R3"`, `"R4"`, `"R5"`, `""`

**Response**:

```json
{
  "message": "User level updated from R2 to R3 in this institution",
  "user": {
    "_id": "user123",
    "username": "john_doe"
  },
  "institutionId": "inst123",
  "oldLevel": "R2",
  "newLevel": "R3"
}
```

**Permissions**:

- Super Admins: Can update any user's level
- Institution Admins: Can update levels in their institutions
- Tutors: Can update levels in their institutions

---

### 3. Get Form Templates (with Level Info)

**Endpoint**: `GET /formTemplates?institutionId=:id`

**Response**:

```json
[
  {
    "_id": "form1",
    "formName": "Basic Assessment",
    "levelRestricted": false,
    "minLevel": "",
    "maxLevel": "",
    "institution": { ... }
  },
  {
    "_id": "form2",
    "formName": "Advanced Procedures",
    "levelRestricted": true,
    "minLevel": "R3",
    "maxLevel": "",
    "institution": { ... }
  }
]
```

---

### 4. Create/Update Form Template with Level Restrictions

**Endpoint**: `POST /formTemplates` or `PUT /formTemplates/:id`

**Request Body**:

```json
{
  "formName": "Advanced Surgical Procedures",
  "institution": "inst123",
  "levelRestricted": true,
  "minLevel": "R3",
  "maxLevel": "",
  "fieldTemplates": [...]
}
```

**Fields**:

- `levelRestricted`: `true` to enable, `false` to disable
- `minLevel`: Minimum level required (empty string = no minimum)
- `maxLevel`: Maximum level allowed (empty string = no maximum)

---

### 5. Create/Update Field Template with Level-Restricted Options

**Endpoint**: `POST /fieldTemplates` or `PUT /fieldTemplates/:id`

**For Regular Options (select/checkbox)**:

```json
{
  "name": "Procedure Type",
  "type": "select",
  "hasLevelRestrictions": true,
  "optionsWithLevels": [
    {
      "value": "Basic Assessment",
      "minLevel": "",
      "label": "Basic Assessment"
    },
    {
      "value": "Standard Procedure",
      "minLevel": "R2",
      "label": "Standard Procedure"
    },
    {
      "value": "Complex Surgery",
      "minLevel": "R4",
      "label": "Complex Surgery"
    }
  ]
}
```

**Fields**:

- `hasLevelRestrictions`: `true` to enable level-based filtering
- `optionsWithLevels`: Array of options with their restrictions
  - `value`: The actual option value
  - `minLevel`: Minimum level to see this option (empty = no restriction)
  - `label`: Display label (optional, defaults to value)

**Backward Compatibility**:

- Old `options` array still works but won't have level restrictions
- Use `optionsWithLevels` for new fields

---

## UI Implementation Guide

### User Management Screen

#### Display User's Levels

```javascript
// In user details/edit page
const UserLevelDisplay = ({ user }) => {
  return (
    <div>
      <h3>Resident Levels</h3>
      {user.institutionRoles.map((ir) => (
        <div key={ir.institution._id}>
          <span>{ir.institution.name}</span>
          <Badge>{ir.level || "Not Set"}</Badge>
          <Button onClick={() => updateLevel(user._id, ir.institution._id)}>
            Update Level
          </Button>
        </div>
      ))}
    </div>
  );
};
```

#### Update Level Form

```javascript
const UpdateLevelForm = ({ userId, institutionId, currentLevel }) => {
  const [level, setLevel] = useState(currentLevel);

  const handleSubmit = async () => {
    await fetch(`/users/${userId}/level`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        level: level,
        institutionId: institutionId,
      }),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>Level:</label>
      <select value={level} onChange={(e) => setLevel(e.target.value)}>
        <option value="">Not Set</option>
        <option value="R1">R1 - First Year</option>
        <option value="R2">R2 - Second Year</option>
        <option value="R3">R3 - Third Year</option>
        <option value="R4">R4 - Fourth Year</option>
        <option value="R5">R5 - Fifth Year</option>
      </select>
      <button type="submit">Update</button>
    </form>
  );
};
```

---

### Form Template Management Screen

#### Form Level Restrictions

```javascript
const FormLevelRestrictions = ({ form, onChange }) => {
  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={form.levelRestricted}
          onChange={(e) => onChange({ levelRestricted: e.target.checked })}
        />
        Enable Level Restrictions
      </label>

      {form.levelRestricted && (
        <div>
          <label>Minimum Level:</label>
          <select
            value={form.minLevel}
            onChange={(e) => onChange({ minLevel: e.target.value })}>
            <option value="">None</option>
            <option value="R1">R1</option>
            <option value="R2">R2</option>
            <option value="R3">R3</option>
            <option value="R4">R4</option>
            <option value="R5">R5</option>
          </select>

          <label>Maximum Level (optional):</label>
          <select
            value={form.maxLevel}
            onChange={(e) => onChange({ maxLevel: e.target.value })}>
            <option value="">None</option>
            <option value="R1">R1</option>
            <option value="R2">R2</option>
            <option value="R3">R3</option>
            <option value="R4">R4</option>
            <option value="R5">R5</option>
          </select>

          <p>
            This form will be visible to:
            {form.minLevel && !form.maxLevel && ` ${form.minLevel} and above`}
            {form.minLevel &&
              form.maxLevel &&
              ` ${form.minLevel} to ${form.maxLevel}`}
            {!form.minLevel && !form.maxLevel && " All levels"}
          </p>
        </div>
      )}
    </div>
  );
};
```

---

### Field Template Management Screen

#### Option-Level Restrictions

```javascript
const FieldOptionsWithLevels = ({ field, onChange }) => {
  const addOption = () => {
    const newOption = { value: "", minLevel: "", label: "" };
    onChange({
      optionsWithLevels: [...field.optionsWithLevels, newOption],
    });
  };

  const updateOption = (index, updates) => {
    const newOptions = [...field.optionsWithLevels];
    newOptions[index] = { ...newOptions[index], ...updates };
    onChange({ optionsWithLevels: newOptions });
  };

  const removeOption = (index) => {
    const newOptions = field.optionsWithLevels.filter((_, i) => i !== index);
    onChange({ optionsWithLevels: newOptions });
  };

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={field.hasLevelRestrictions}
          onChange={(e) => onChange({ hasLevelRestrictions: e.target.checked })}
        />
        Enable Level-Based Option Filtering
      </label>

      <button onClick={addOption}>Add Option</button>

      {field.optionsWithLevels?.map((option, index) => (
        <div key={index} className="option-row">
          <input
            type="text"
            placeholder="Option Value"
            value={option.value}
            onChange={(e) => updateOption(index, { value: e.target.value })}
          />

          <input
            type="text"
            placeholder="Label (optional)"
            value={option.label}
            onChange={(e) => updateOption(index, { label: e.target.value })}
          />

          {field.hasLevelRestrictions && (
            <select
              value={option.minLevel}
              onChange={(e) =>
                updateOption(index, { minLevel: e.target.value })
              }>
              <option value="">All Levels</option>
              <option value="R1">R1+</option>
              <option value="R2">R2+</option>
              <option value="R3">R3+</option>
              <option value="R4">R4+</option>
              <option value="R5">R5+</option>
            </select>
          )}

          <button onClick={() => removeOption(index)}>Remove</button>
        </div>
      ))}
    </div>
  );
};
```

---

## Common Use Cases

### Use Case 1: Promote Resident to Next Level

**Scenario**: John Doe completes year 2 in Hospital A

**Steps**:

1. Navigate to Users → John Doe
2. Find Hospital A in his institutions list
3. Click "Update Level"
4. Change from R2 to R3
5. Save

**API Call**:

```javascript
PATCH /users/john_id/level
Body: { "level": "R3", "institutionId": "hospitalA_id" }
```

---

### Use Case 2: Create Advanced Form for Senior Residents

**Scenario**: Create "Complex Surgical Procedures" form for R4+ only

**Steps**:

1. Navigate to Form Templates → Create New
2. Fill in form details
3. Enable "Level Restrictions"
4. Set Minimum Level: R4
5. Add field templates as normal
6. Save

**Result**: Only R4 and R5 residents will see this form

---

### Use Case 3: Lock Specific Procedure Options

**Scenario**: Only allow R3+ residents to select "Laparoscopic Surgery"

**Steps**:

1. Navigate to Field Templates → "Procedure Type"
2. Enable "Level-Based Option Filtering"
3. For option "Laparoscopic Surgery":
   - Set Minimum Level: R3
4. Save

**Result**:

- R1-R2 residents: Won't see this option
- R3-R5 residents: Can select it

---

### Use Case 4: Graduate Resident Across All Institutions

**Scenario**: Promote resident to next level in all their institutions

**Implementation**:

```javascript
const promoteResidentGlobally = async (userId) => {
  const user = await fetchUser(userId);

  for (const ir of user.institutionRoles) {
    if (ir.role === "resident" && ir.level) {
      const newLevel = getNextLevel(ir.level); // R1→R2, R2→R3, etc.

      await fetch(`/users/${userId}/level`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          level: newLevel,
          institutionId: ir.institution._id,
        }),
      });
    }
  }
};

const getNextLevel = (currentLevel) => {
  const levels = { R1: "R2", R2: "R3", R3: "R4", R4: "R5", R5: "R5" };
  return levels[currentLevel] || "R1";
};
```

---

## Reporting & Analytics

### Analytics to Display

1. **Level Distribution per Institution**

```javascript
GET /institutions/:id/stats
→ Returns counts: { R1: 10, R2: 8, R3: 5, R4: 3, R5: 2 }
```

2. **Form Access by Level**

- Show how many residents can access each form
- Identify forms with no eligible residents

3. **Resident Progress Tracking**

- Track level changes over time
- Show average time in each level

---

## Best Practices

### 1. Clear Communication

- Always inform residents when their level changes
- Explain what new forms/options become available

### 2. Gradual Restrictions

- Start with minimal restrictions
- Add restrictions as training program matures

### 3. Regular Review

- Review level assignments quarterly
- Ensure restrictions match actual training requirements

### 4. Backup Plans

- Keep some forms unrestricted for emergencies
- Allow admins to override restrictions if needed

---

## Troubleshooting

### Issue: Resident Can't See Expected Form

**Check**:

1. What's the resident's level in this institution?

   ```javascript
   GET /institutions/me → Check userLevel
   ```

2. What's the form's minimum level?

   ```javascript
   GET /formTemplates/:id → Check minLevel
   ```

3. Is levelRestricted enabled?
   ```javascript
   Check form.levelRestricted === true
   ```

**Solution**: Either promote resident or adjust form restrictions

---

### Issue: Options Not Appearing for Resident

**Check**:

1. Field's `hasLevelRestrictions` is `true`
2. Option's `minLevel` is higher than resident's level
3. Resident's level in that specific institution

**Solution**: Update option's minLevel or promote resident

---

## Migration Notes

After running `npm run migrate-levels`:

- ✅ All existing users have level fields (default: empty)
- ✅ All form templates have restriction fields (default: disabled)
- ✅ All field options converted to `optionsWithLevels` (default: no restrictions)
- ✅ Backward compatible with old structure

**Action Required**:

1. Update admin UI to show level controls
2. Train admins on level system
3. Set initial resident levels
4. Configure form restrictions as needed

---

## Summary

The level-based system provides:

✅ **Institution-specific levels** - Different progress in each institution  
✅ **Form restrictions** - Hide complex forms from junior residents  
✅ **Option restrictions** - Progressively unlock field options  
✅ **Flexible control** - Admins manage levels per institution  
✅ **Automatic filtering** - System handles access control

This ensures residents only access appropriate content for their training level in each institution.
