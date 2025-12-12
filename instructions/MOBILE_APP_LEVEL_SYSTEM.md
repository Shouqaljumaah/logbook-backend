# Mobile App Integration - Level-Based Access Control

## What's New

The system now supports **institution-specific resident levels** with automatic content filtering. Residents will only see forms and options appropriate for their training level in each institution.

---

## Key Changes

### 1. Institution-Specific Levels

**Before**: User had one global level  
**After**: User has a different level in each institution

**Example**:

```javascript
// Old structure
user: {
  level: "R2";
}

// New structure
user: {
  institutionRoles: [
    { institution: "Hospital A", role: "resident", level: "R3" },
    { institution: "Hospital B", role: "resident", level: "R1" },
  ];
}
```

### 2. Automatic Form Filtering

Forms are automatically filtered based on your level in each institution.

**What You'll See**:

- In Hospital A (Level R3): All R1, R2, R3 forms
- In Hospital B (Level R1): Only R1 forms

### 3. Progressive Option Unlocking

Some field options are locked until you reach certain levels.

**Example**: "Procedure Type" field

- All levels: "Basic Assessment"
- R2+: "Standard Procedure"
- R4+: "Complex Surgery"

---

## API Changes

### 1. Get My Institutions (Updated Response)

**Endpoint**: `GET /institutions/me`

**New Response Format**:

```json
{
  "institutions": [
    {
      "_id": "inst1",
      "name": "Hospital A",
      "code": "HA001",
      "logo": "uploads/logo1.png",
      "userRole": "resident",
      "userLevel": "R3",
      "assignedAt": "2025-10-01",
      "formTemplatesCount": 15,
      "formSubmissionsCount": 89
    },
    {
      "_id": "inst2",
      "name": "Hospital B",
      "code": "HB001",
      "logo": "uploads/logo2.png",
      "userRole": "resident",
      "userLevel": "R1",
      "assignedAt": "2025-11-01",
      "formTemplatesCount": 8,
      "formSubmissionsCount": 12
    }
  ],
  "totals": {
    "institutionsCount": 2,
    "formTemplatesCount": 23,
    "formSubmissionsCount": 101
  }
}
```

**New Field**: `userLevel` - Your training level in this specific institution

**Values**:

- `"R1"` - First Year Resident
- `"R2"` - Second Year Resident
- `"R3"` - Third Year Resident
- `"R4"` - Fourth Year Resident
- `"R5"` - Fifth Year Resident
- `""` - No level assigned

---

### 2. Get Form Templates (Automatic Filtering)

**Endpoint**: `GET /formTemplates?institutionId=:id`

**Behavior Changed**:

- Forms are now automatically filtered by your level
- You'll only receive forms you're eligible to access
- No error if you request a restricted form - it just won't appear

**Response**:

```json
[
  {
    "_id": "form1",
    "formName": "Basic Patient Assessment",
    "levelRestricted": false,
    "minLevel": "",
    "institution": { ... },
    "fieldTemplates": [ ... ]
  },
  {
    "_id": "form2",
    "formName": "Intermediate Procedures",
    "levelRestricted": true,
    "minLevel": "R2",
    "institution": { ... },
    "fieldTemplates": [ ... ]
  }
]
```

**Note**: If you're R1, you won't see "Intermediate Procedures" in the list

---

### 3. Get Single Form (Updated Response)

**Endpoint**: `GET /formTemplates/:id`

**New Behavior**:

- If form requires higher level, you get an error with details
- Field options are automatically filtered based on your level

**Success Response**:

```json
{
  "_id": "form1",
  "formName": "Surgical Procedures",
  "fieldTemplates": [
    {
      "_id": "field1",
      "name": "Procedure Type",
      "type": "select",
      "hasLevelRestrictions": true,
      "availableOptions": [
        { "value": "Basic Assessment", "label": "Basic Assessment" },
        { "value": "Standard Procedure", "label": "Standard Procedure" }
      ]
    }
  ]
}
```

**New Field**: `availableOptions` - Options you can select based on your level

**Error Response** (if form requires higher level):

```json
{
  "message": "This form requires level R3 or above. Your current level in this institution: R1",
  "requiredLevel": "R3",
  "userLevel": "R1",
  "institutionId": "inst123"
}
```

---

### 4. Update User Level

**Endpoint**: `PATCH /users/:userId/level`

**Note**: Only admins/tutors can update levels. This is informational for the app.

**Request Body**:

```json
{
  "level": "R3",
  "institutionId": "inst123"
}
```

**Response**:

```json
{
  "message": "User level updated from R2 to R3 in this institution",
  "institutionId": "inst123",
  "oldLevel": "R2",
  "newLevel": "R3"
}
```

---

## UI/UX Implementation Guide

### 1. Display User's Level

**My Institutions Screen**:

```javascript
const InstitutionCard = ({ institution }) => {
  return (
    <Card>
      <Image source={{ uri: institution.logo }} />
      <Text>{institution.name}</Text>
      <Text>{institution.code}</Text>

      {/* Display level badge */}
      {institution.userLevel && (
        <Badge color="blue">Level: {institution.userLevel}</Badge>
      )}

      <Text>{institution.formTemplatesCount} forms available</Text>
      <Text>{institution.formSubmissionsCount} submissions</Text>
    </Card>
  );
};
```

---

### 2. Show Why Forms Are Filtered

**Forms List Screen**:

```javascript
const FormsScreen = ({ institutionId }) => {
  const [forms, setForms] = useState([]);
  const [userLevel, setUserLevel] = useState("");

  useEffect(() => {
    fetchFormsAndLevel();
  }, [institutionId]);

  const fetchFormsAndLevel = async () => {
    // Get user's level in this institution
    const institutions = await fetch("/institutions/me");
    const inst = institutions.institutions.find((i) => i._id === institutionId);
    setUserLevel(inst.userLevel);

    // Forms are automatically filtered by backend
    const formsResponse = await fetch(
      `/formTemplates?institutionId=${institutionId}`
    );
    setForms(formsResponse);
  };

  return (
    <View>
      <View style={styles.header}>
        <Text>Your Level: {userLevel || "Not Set"}</Text>
        <Text>Showing forms for {userLevel} and below</Text>
      </View>

      {forms.map((form) => (
        <FormCard key={form._id} form={form} />
      ))}

      {forms.length === 0 && (
        <Text>No forms available for your current level</Text>
      )}
    </View>
  );
};
```

---

### 3. Handle Restricted Form Access

**Form Detail Screen**:

```javascript
const FormDetailScreen = ({ formId, institutionId }) => {
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchForm();
  }, [formId]);

  const fetchForm = async () => {
    try {
      const response = await fetch(`/formTemplates/${formId}`);
      const data = await response.json();

      if (response.ok) {
        setForm(data);
      } else {
        setError(data);
      }
    } catch (err) {
      setError({ message: "Failed to load form" });
    }
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="lock" size={50} color="gray" />
        <Text style={styles.errorTitle}>Form Restricted</Text>
        <Text>{error.message}</Text>

        {error.requiredLevel && (
          <View>
            <Text>Required Level: {error.requiredLevel}</Text>
            <Text>Your Level: {error.userLevel || "Not Set"}</Text>
            <Text>Contact your supervisor to update your level</Text>
          </View>
        )}

        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  return <FormView form={form} />;
};
```

---

### 4. Render Fields with Available Options

**Form Field Rendering**:

```javascript
const SelectField = ({ field, value, onChange }) => {
  // Use availableOptions if present, fallback to options
  const options = field.availableOptions || field.options || [];

  return (
    <View>
      <Text>{field.name}</Text>

      {field.hasLevelRestrictions && (
        <Text style={styles.hint}>
          Some options may be hidden based on your level
        </Text>
      )}

      <Picker selectedValue={value} onValueChange={onChange}>
        <Picker.Item label="Select..." value="" />
        {options.map((opt) => (
          <Picker.Item
            key={opt.value}
            label={opt.label || opt.value}
            value={opt.value}
          />
        ))}
      </Picker>

      {options.length === 0 && (
        <Text style={styles.warning}>
          No options available for your current level
        </Text>
      )}
    </View>
  );
};
```

---

### 5. Level Progress Indicator

**Profile Screen**:

```javascript
const LevelProgress = ({ institutions }) => {
  return (
    <View>
      <Text style={styles.title}>Your Training Progress</Text>

      {institutions.map((inst) => (
        <View key={inst._id} style={styles.progressCard}>
          <Text>{inst.name}</Text>

          <View style={styles.levelBar}>
            {["R1", "R2", "R3", "R4", "R5"].map((level) => (
              <View
                key={level}
                style={[
                  styles.levelDot,
                  inst.userLevel === level && styles.levelDotActive,
                ]}>
                <Text>{level}</Text>
              </View>
            ))}
          </View>

          <Text>
            {inst.userLevel ? `Current: ${inst.userLevel}` : "Level not set"}
          </Text>
        </View>
      ))}
    </View>
  );
};
```

---

## User Experience Flow

### Scenario 1: R1 Resident Viewing Forms

```
1. User selects "Hospital A"
2. App calls: GET /institutions/me
   → Sees: userLevel = "R1"

3. App calls: GET /formTemplates?institutionId=hospitalA
   → Backend returns: Only R1-accessible forms

4. User sees:
   ✓ "Basic Patient Assessment"
   ✓ "Initial Consultation"
   ✗ "Advanced Procedures" (hidden, requires R3)
   ✗ "Complex Surgery" (hidden, requires R4)

5. User opens "Basic Patient Assessment"
   → All fields show all options (no restrictions at R1)
```

---

### Scenario 2: R3 Resident in Multiple Institutions

```
Institution A (Level R3):
- Can access: R1, R2, R3 forms
- Can select: Basic, Standard, Intermediate options

Institution B (Level R1):
- Can access: Only R1 forms
- Can select: Only Basic options

Same user, different capabilities!
```

---

### Scenario 3: Level Promotion

```
1. User is R2 in Hospital A
2. Supervisor promotes user to R3
3. Next time user fetches forms:
   → More forms appear
   → More options in dropdowns
   → User sees notification: "Congratulations! Level updated to R3"
```

---

## Error Handling

### Handle Level Restriction Error

```javascript
const handleFormAccess = async (formId) => {
  try {
    const response = await fetch(`/formTemplates/${formId}`);
    const data = await response.json();

    if (!response.ok) {
      if (data.requiredLevel) {
        // Level restriction error
        Alert.alert(
          "Form Restricted",
          `This form requires level ${data.requiredLevel}. ` +
            `Your current level: ${data.userLevel || "Not Set"}. ` +
            `Contact your supervisor for level update.`,
          [
            { text: "OK", onPress: () => navigation.goBack() },
            { text: "Contact Supervisor", onPress: () => contactSupervisor() },
          ]
        );
      } else {
        Alert.alert("Error", data.message);
      }
      return;
    }

    // Success - show form
    setForm(data);
  } catch (error) {
    Alert.alert("Error", "Failed to load form");
  }
};
```

---

## Caching Strategy

### Cache User's Level Info

```javascript
// Store level info with institution data
const cacheInstitutions = async (institutions) => {
  await AsyncStorage.setItem("user_institutions", JSON.stringify(institutions));
};

const getCachedLevel = async (institutionId) => {
  const cached = await AsyncStorage.getItem("user_institutions");
  if (cached) {
    const institutions = JSON.parse(cached);
    const inst = institutions.find((i) => i._id === institutionId);
    return inst?.userLevel || "";
  }
  return "";
};

// Refresh when entering institution
const refreshInstitutionData = async () => {
  const response = await fetch("/institutions/me");
  const data = await response.json();
  await cacheInstitutions(data.institutions);
};
```

---

## Testing Checklist

### As Developer, Test:

- [ ] User with no level sees unrestricted forms only
- [ ] User with R1 sees R1 forms, not R2+ forms
- [ ] User with R3 sees R1, R2, R3 forms
- [ ] Form with R4 requirement shows error to R2 user
- [ ] Field options filter correctly by level
- [ ] Same user sees different forms in different institutions
- [ ] Level badge displays correctly on institution cards
- [ ] Error messages are clear and helpful
- [ ] Refresh updates available forms immediately

### As User, Experience:

- [ ] Clear indication of my level in each institution
- [ ] Understand why certain forms are not available
- [ ] See progress as I level up
- [ ] Get helpful error messages
- [ ] Smooth experience (no confusing restrictions)

---

## Migration Impact

**What Changed for Users**:

1. **New Level Badge**: Shows your training level per institution
2. **Filtered Forms**: Some forms may not appear anymore (based on level)
3. **Progressive Options**: Some dropdown options may be hidden
4. **Clear Feedback**: Better error messages explaining restrictions

**What Didn't Change**:

- All existing forms still work
- No data loss
- Same submission process
- Same navigation

---

## FAQ

### Q: Why can't I see a form I used to see?

**A**: The form may now have level restrictions. Check:

1. Your level in that institution (shown on institution card)
2. Contact supervisor if you believe you should have access

---

### Q: Some options are missing from a dropdown. Why?

**A**: Options may be restricted to higher levels. This is normal progression - more options unlock as you advance.

---

### Q: I have different levels in different institutions. Is this correct?

**A**: Yes! This is by design. You may be:

- More experienced in one institution
- Just starting in another
- At different stages of training in each place

---

### Q: How do I know what level I need for a form?

**A**: If you try to access a restricted form, the error message will tell you:

- What level is required
- Your current level
- Who to contact

---

### Q: Will my level automatically update?

**A**: No. Your supervisor/admin must update your level as you progress in training.

---

## Summary

### Key Points for App Development:

1. **Always fetch user's level** from `/institutions/me`
2. **Display level badge** on institution cards
3. **Handle restriction errors** gracefully with helpful messages
4. **Use availableOptions** for field rendering
5. **Cache institution data** including levels
6. **Show progress indicators** to motivate users

### Key Points for Users:

1. You have different levels in different institutions
2. More content unlocks as you level up
3. Restrictions are for training safety
4. Contact supervisor for level updates
5. Clear feedback when content is restricted

The system ensures you only access content appropriate for your training level while providing a clear path for progression! 🎓
