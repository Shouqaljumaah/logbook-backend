# Mobile Dev Quick Reference - Level Restrictions

## 🎯 TL;DR

**Backend filters everything automatically. Your job: Display what you receive!**

---

## 📋 3-Step Integration

### 1️⃣ Get User's Level

```javascript
GET /institutions/me
→ institution.userLevel = "R3"
```

### 2️⃣ Fetch Forms (Auto-Filtered)

```javascript
GET /formTemplates?institutionId=X
→ Only forms user can access
```

### 3️⃣ Use availableOptions

```javascript
field.availableOptions; // ✅ Use this
field.optionsWithLevels; // ❌ Don't use this
```

---

## 🔑 Key Concepts

```
Levels: R1 → R2 → R3 → R4 → R5
        (low)          (high)

User has DIFFERENT level in each institution!
```

---

## 📊 What You Receive

### Form List Response

```json
[
  {
    "_id": "form1",
    "formName": "Basic Assessment",
    "levelRestricted": false // Available to all
  },
  {
    "_id": "form2",
    "formName": "Advanced Procedures",
    "levelRestricted": true,
    "minLevel": "R3" // Only R3+
  }
]
```

**Note**: You only receive forms user can access!

### Form Detail Response

```json
{
  "formName": "Procedures",
  "fieldTemplates": [
    {
      "name": "Type",
      "type": "select",
      "availableOptions": [
        // ⭐ Already filtered!
        { "value": "Basic", "label": "Basic" },
        { "value": "Standard", "label": "Standard" }
      ]
    }
  ]
}
```

---

## 💻 Code Snippets

### Render Select Field

```javascript
const SelectField = ({ field }) => {
  const options = field.availableOptions || [];

  if (options.length === 0) {
    return <Text>No options for your level</Text>;
  }

  return (
    <Picker>
      {options.map((opt) => (
        <Picker.Item
          key={opt.value}
          label={opt.label || opt.value}
          value={opt.value}
        />
      ))}
    </Picker>
  );
};
```

### Handle Form Access Error

```javascript
const response = await fetch(`/formTemplates/${formId}`);

if (!response.ok) {
  const error = await response.json();

  if (error.requiredLevel) {
    Alert.alert(
      "Restricted",
      `Requires: ${error.requiredLevel}\n` + `Your Level: ${error.userLevel}`
    );
  }
}
```

### Display User Level

```javascript
<Badge>Level: {institution.userLevel || "Not Set"}</Badge>
```

---

## ⚠️ Common Mistakes

| ❌ DON'T                           | ✅ DO                        |
| ---------------------------------- | ---------------------------- |
| Use `field.optionsWithLevels`      | Use `field.availableOptions` |
| Filter forms client-side           | Trust backend filtering      |
| Cache forms globally               | Fetch per institution        |
| Use same level across institutions | Check level per institution  |

---

## 🧪 Testing Checklist

- [ ] R1 user sees R1 forms only
- [ ] R3 user sees R1, R2, R3 forms
- [ ] Options filter correctly by level
- [ ] Error shown when accessing restricted form
- [ ] Different levels in different institutions work
- [ ] "No options available" message shows when needed

---

## 🆘 Error Response Format

```json
{
  "message": "This form requires level R3...",
  "requiredLevel": "R3",
  "userLevel": "R1",
  "institutionId": "inst123"
}
```

**When you get this**: Show helpful error, don't crash!

---

## 📱 UI Elements to Add

1. **Level Badge** on institution cards

   ```
   [Hospital A] [Level: R3]
   ```

2. **Restriction Hint** on fields

   ```
   Procedure Type
   ℹ️ Some options hidden based on your level
   ```

3. **Empty Options Message**

   ```
   ⚠️ No options available for R1 level
   ```

4. **Restricted Form Screen**

   ```
   🔒 Form Restricted

   This form requires R3 level
   Your current level: R1

   [Contact Supervisor] [Go Back]
   ```

---

## 🔗 API Endpoints

| Endpoint                             | What It Returns            | Filtered? |
| ------------------------------------ | -------------------------- | --------- |
| `GET /institutions/me`               | Your institutions + levels | N/A       |
| `GET /formTemplates?institutionId=X` | Form list                  | ✅ Yes    |
| `GET /formTemplates/:id`             | Single form                | ✅ Yes    |

---

## 🎨 Example Flow

```
1. User opens app
   ↓
2. Fetch institutions
   GET /institutions/me
   → Hospital A: Level R2
   ↓
3. User taps Hospital A
   ↓
4. Fetch forms for Hospital A
   GET /formTemplates?institutionId=A
   → Returns: [Basic Form, Intermediate Form]
   → Missing: [Advanced Form] (requires R3)
   ↓
5. User opens "Intermediate Form"
   GET /formTemplates/form123
   → field.availableOptions = ["Option1", "Option2"]
   → Missing: ["Option3"] (requires R3)
   ↓
6. Render form with filtered options
```

---

## 🔄 Level Changes

**What happens when admin updates a resident's level?**

Next time resident fetches:

- ✅ More forms appear (if promoted)
- ✅ More options in fields
- ✅ Better to refetch on app resume

**Suggestion**: Show notification "You've been promoted to R3!"

---

## 📖 Full Documentation

For detailed examples and all scenarios, see:

- `MOBILE_DEV_RESTRICTIONS_GUIDE.md` - Complete technical guide
- `MOBILE_APP_LEVEL_SYSTEM.md` - Full integration guide

---

**Remember**: Trust the backend, display what you receive! 🚀
