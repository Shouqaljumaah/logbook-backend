# User Helper Methods Fix - Handle Populated References

## Issue Found ✅

The User model helper methods (`getRoleInInstitution`, `getLevelInInstitution`, etc.) were **not working correctly** when `institutionRoles.institution` was **populated**.

---

## The Problem

### Original Implementation

```javascript
UserSchema.methods.getRoleInInstitution = function (institutionId) {
  const institutionRole = this.institutionRoles.find(
    (ir) => ir.institution.toString() === institutionId.toString()
  );
  return institutionRole ? institutionRole.role : null;
};
```

### Why It Failed

When you populate `institutionRoles.institution`:

```javascript
await User.findById(userId).populate("institutionRoles.institution");
```

The `ir.institution` becomes an **object**, not an ObjectId:

```javascript
// Unpopulated (works ✅)
ir.institution = ObjectId("673a5f8b9c1d2e3f4a5b6c7d")
ir.institution.toString() = "673a5f8b9c1d2e3f4a5b6c7d"

// Populated (broken ❌)
ir.institution = { _id: ObjectId(...), name: "Hospital A", code: "HA001", ... }
ir.institution.toString() = "[object Object]"  // ❌ Wrong!
```

**Comparison fails** because:

- `"[object Object]" !== "673a5f8b9c1d2e3f4a5b6c7d"`

---

## The Fix

Updated all helper methods to handle **both** populated and unpopulated references:

```javascript
UserSchema.methods.getRoleInInstitution = function (institutionId) {
  const institutionRole = this.institutionRoles.find((ir) => {
    // Handle both populated and unpopulated institution references
    const instId = ir.institution._id || ir.institution;
    return instId.toString() === institutionId.toString();
  });
  return institutionRole ? institutionRole.role : null;
};
```

### How It Works

```javascript
const instId = ir.institution._id || ir.institution;
```

- If **populated**: `ir.institution._id` exists → use it ✅
- If **unpopulated**: `ir.institution._id` is undefined → use `ir.institution` (the ObjectId) ✅

---

## Methods Fixed

All these helper methods were updated:

1. ✅ `getRoleInInstitution(institutionId)`
2. ✅ `getLevelInInstitution(institutionId)`
3. ✅ `setLevelInInstitution(institutionId, level)`
4. ✅ `assignRoleToInstitution(institutionId, role, assignedBy)`
5. ✅ `removeFromInstitution(institutionId)`

---

## When to Use Helper Methods

### ✅ Use on Mongoose Documents

Helper methods work on **Mongoose documents** (before `.toObject()`):

```javascript
const user = await User.findById(userId);

// ✅ Use helper methods on Mongoose document
const role = user.getRoleInInstitution(institutionId);
const level = user.getLevelInInstitution(institutionId);

// Works with or without populate!
await user.populate("institutionRoles.institution");
const role2 = user.getRoleInInstitution(institutionId); // Still works!
```

---

### ❌ Cannot Use on Plain Objects

After `.toObject()`, you have a plain JavaScript object (no methods):

```javascript
const user = await User.findById(userId);
const userObj = user.toObject();

// ❌ This won't work (no methods on plain objects)
const role = userObj.getRoleInInstitution(institutionId);

// ✅ Use manual lookup instead
const institutionRole = userObj.institutionRoles.find((ir) => {
  const instId = ir.institution._id || ir.institution;
  return instId.toString() === institutionId.toString();
});
const role = institutionRole?.role;
```

---

## Usage Examples

### Example 1: Check User's Role (Unpopulated)

```javascript
const user = await User.findById(userId);
// institutionRoles.institution is ObjectId

const role = user.getRoleInInstitution(institutionId);
// ✅ Works! Compares ObjectId with institutionId
```

---

### Example 2: Check User's Role (Populated)

```javascript
const user = await User.findById(userId).populate(
  "institutionRoles.institution"
);
// institutionRoles.institution is full object

const role = user.getRoleInInstitution(institutionId);
// ✅ Still works! Uses ir.institution._id
```

---

### Example 3: Check If User Is Admin

```javascript
const user = await User.findById(userId);

if (user.isAdminOfInstitution(institutionId)) {
  // User is admin of this institution
}

// Or manually:
const role = user.getRoleInInstitution(institutionId);
if (role === "admin") {
  // User is admin
}
```

---

### Example 4: Get User's Level

```javascript
const user = await User.findById(userId);

const level = user.getLevelInInstitution(institutionId);
// Returns: "R3" or ""

const levelNum = user.getLevelNumber(institutionId);
// Returns: 3 or 0
```

---

### Example 5: Update User's Level

```javascript
const user = await User.findById(userId);

user.setLevelInInstitution(institutionId, "R4");
await user.save();
```

---

### Example 6: Assign Role to User

```javascript
const user = await User.findById(userId);
const adminUser = await User.findById(req.user._id);

user.assignRoleToInstitution(institutionId, "tutor", adminUser._id);
await user.save();
```

---

## Testing the Fix

### Test 1: Unpopulated Reference

```javascript
const user = await User.findById(userId);
// institutionRoles.institution is ObjectId

const role = user.getRoleInInstitution(institutionId);
console.log(role); // "resident", "tutor", "admin", or null
```

**Expected**: ✅ Works correctly

---

### Test 2: Populated Reference

```javascript
const user = await User.findById(userId).populate(
  "institutionRoles.institution"
);
// institutionRoles.institution is object

const role = user.getRoleInInstitution(institutionId);
console.log(role); // "resident", "tutor", "admin", or null
```

**Expected**: ✅ Works correctly (previously failed ❌)

---

### Test 3: Mixed - Some Populated, Some Not

```javascript
const user = await User.findById(userId).populate({
  path: "institutionRoles.institution",
  match: { _id: specificInstId }, // Populate only specific one
});

// Some institutionRoles have populated institution, others don't
const role1 = user.getRoleInInstitution(populatedInstId);
const role2 = user.getRoleInInstitution(unpopulatedInstId);
```

**Expected**: ✅ Both work correctly

---

## Common Patterns

### Pattern 1: Check Permission Before Action

```javascript
exports.someController = async (req, res) => {
  const { institutionId } = req.body;
  const user = await User.findById(req.user._id);

  // Check if user is admin of this institution
  if (!user.isSuperAdmin && !user.isAdminOfInstitution(institutionId)) {
    return res.status(403).json({
      message: "You are not an admin of this institution",
    });
  }

  // Proceed with action...
};
```

---

### Pattern 2: Get User's Role for Response

```javascript
exports.getMyRole = async (req, res) => {
  const { institutionId } = req.query;
  const user = await User.findById(req.user._id);

  const role = user.getRoleInInstitution(institutionId);
  const level = user.getLevelInInstitution(institutionId);

  res.json({
    role: role || "none",
    level: level || "",
  });
};
```

---

### Pattern 3: Filter Forms by User Level

```javascript
const user = await User.findById(req.user._id);
const userLevel = user.getLevelInInstitution(institutionId);
const userLevelNum = user.getLevelNumber(institutionId);

const forms = await FormTemplates.find({ institution: institutionId });

// Filter forms user can access
const accessibleForms = forms.filter((form) => form.canUserAccess(userLevel));
```

---

### Pattern 4: Working with Plain Objects

When you need to work with plain objects (after `.toObject()` or in aggregations):

```javascript
const users = await User.find({})
  .populate("institutionRoles.institution")
  .lean(); // Returns plain objects

// ❌ Can't use helper methods
// ✅ Use manual lookup
const usersWithRoles = users.map((user) => {
  const institutionRole = user.institutionRoles.find((ir) => {
    const instId = ir.institution._id || ir.institution;
    return instId.toString() === institutionId.toString();
  });

  return {
    ...user,
    role: institutionRole?.role,
    level: institutionRole?.level || "",
  };
});
```

---

## Migration Impact

### Before the Fix ❌

```javascript
// With populated references
const user = await User.findById(userId).populate(
  "institutionRoles.institution"
);

const role = user.getRoleInInstitution(institutionId);
// Returns: null (even if user has role) ❌
```

### After the Fix ✅

```javascript
// With populated references
const user = await User.findById(userId).populate(
  "institutionRoles.institution"
);

const role = user.getRoleInInstitution(institutionId);
// Returns: "resident", "tutor", "admin", or null ✅
```

**All existing code using helper methods now works correctly!**

---

## Best Practices

### 1. Prefer Helper Methods on Documents

```javascript
// ✅ Good - Use helper methods
const user = await User.findById(userId);
if (user.isAdminOfInstitution(institutionId)) {
  // ...
}

// ❌ Avoid - Manual lookup when you have a document
const user = await User.findById(userId);
const role = user.institutionRoles.find(...)?.role;
```

---

### 2. Use Manual Lookup for Plain Objects

```javascript
// ✅ Good - Manual lookup for plain objects
const userObj = user.toObject();
const institutionRole = userObj.institutionRoles.find(
  (ir) =>
    (ir.institution._id || ir.institution).toString() === instId.toString()
);

// ❌ Can't use helper methods on plain objects
const userObj = user.toObject();
const role = userObj.getRoleInInstitution(instId); // TypeError!
```

---

### 3. Handle Both Cases in Utilities

If writing utility functions that work with both:

```javascript
function getUserRole(user, institutionId) {
  // If it's a Mongoose document, use helper method
  if (typeof user.getRoleInInstitution === "function") {
    return user.getRoleInInstitution(institutionId);
  }

  // If it's a plain object, use manual lookup
  const institutionRole = user.institutionRoles.find((ir) => {
    const instId = ir.institution._id || ir.institution;
    return instId.toString() === institutionId.toString();
  });
  return institutionRole?.role || null;
}
```

---

## Summary

### ✅ What Was Fixed

All helper methods now work correctly whether `institutionRoles.institution` is:

- Unpopulated (ObjectId)
- Populated (full object)
- Mixed (some populated, some not)

### 🎯 Key Takeaway

**Use the pattern**: `const instId = ir.institution._id || ir.institution;`

This handles both cases automatically:

- If populated: Uses `_id` property
- If unpopulated: Uses the ObjectId directly

### 📝 Remember

- ✅ Helper methods work on **Mongoose documents**
- ❌ Helper methods don't work on **plain objects** (after `.toObject()` or `.lean()`)
- ✅ Manual lookup needed for plain objects

---

**All helper methods now work reliably regardless of population state! 🎉**
