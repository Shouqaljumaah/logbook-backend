# Migration Instructions: Old System → New Multi-Role System

## Overview

This migration converts your existing user data from the old structure to the new multi-role institution system.

**Old Structure:**

```javascript
{
  institutions: [inst1, inst2, inst3],  // Just IDs
  roles: ["tutor"]                       // Global role
}
```

**New Structure:**

```javascript
{
  institutionRoles: [
    { institution: inst1, role: "tutor", assignedAt: "..." },
    { institution: inst2, role: "admin", assignedAt: "..." },
    { institution: inst3, role: "resident", assignedAt: "..." },
  ];
}
```

---

## Prerequisites

1. **Backup your database first!**

   For MongoDB Atlas (cloud):

   ```bash
   # Use MongoDB Atlas web interface to create a backup
   # Or use mongodump with your Atlas connection string
   mongodump --uri="mongodb+srv://username:password@cluster.mongodb.net/database" --out ./backup
   ```

   For local MongoDB:

   ```bash
   mongodump --db logbook --out ./backup
   ```

2. **Important:** The script uses the same MongoDB connection as your app (from `database.js`)

---

## Running the Migration

### Step 1: Run the Migration Script

```bash
npm run migrate-roles
```

Or directly:

```bash
node scripts/migrateToInstitutionRoles.js
```

### Step 2: Review the Output

The script will show:

- How many users need migration
- Details for each user being migrated
- Final summary with success/error counts

Example output:

```
============================================================
MIGRATION: Old institutions → institutionRoles
============================================================

Connecting to database...
✓ Connected to database

Found 25 users to migrate

Migrating user: john_doe (64a123...)
  - Institutions: 2
  - Current roles: tutor
  - Added: Hospital A as tutor
  - Added: Medical College B as tutor
  ✓ Successfully migrated john_doe

Migrating user: jane_admin (64b456...)
  - Institutions: 1
  - Current roles: admin
  - Added: Hospital A as admin
  ✓ Successfully migrated jane_admin

...

============================================================
MIGRATION SUMMARY
============================================================
Total users found: 25
Successfully migrated: 25 ✓
Errors: 0 ✗

✓ Migration complete!
✓ Database connection closed
```

---

## How the Migration Works

### Role Assignment Logic

The script determines each user's role per institution using this logic:

1. **Check if user is in Institution.admins[]**
   - If YES → assign "admin" role
2. **Check user's roles array**
   - Use the first non-superadmin role (e.g., "tutor", "resident")
3. **Default fallback**
   - If no role found → assign "resident"

### Example Scenarios

#### Scenario 1: User is Institution Admin

```javascript
// Before
User: {
  institutions: [inst1],
  roles: ["admin"]
}
Institution: {
  _id: inst1,
  admins: [userId]
}

// After
User: {
  institutionRoles: [
    { institution: inst1, role: "admin", assignedAt: "2025-11-08" }
  ]
}
```

#### Scenario 2: User is Tutor in Multiple Institutions

```javascript
// Before
User: {
  institutions: [inst1, inst2, inst3],
  roles: ["tutor"]
}

// After
User: {
  institutionRoles: [
    { institution: inst1, role: "tutor", assignedAt: "2025-11-08" },
    { institution: inst2, role: "tutor", assignedAt: "2025-11-08" },
    { institution: inst3, role: "tutor", assignedAt: "2025-11-08" }
  ]
}
```

#### Scenario 3: User Has No Explicit Role

```javascript
// Before
User: {
  institutions: [inst1],
  roles: []
}

// After
User: {
  institutionRoles: [
    { institution: inst1, role: "resident", assignedAt: "2025-11-08" }
  ]
}
```

---

## After Migration

### Verify the Migration

You can verify the migration worked by checking a few users in MongoDB:

**Option 1: MongoDB Compass (GUI)**

- Connect to your MongoDB Atlas cluster
- Navigate to the users collection
- Check any user document for the `institutionRoles` array

**Option 2: mongosh (CLI)**

```bash
mongosh "mongodb+srv://cluster.mongodb.net/" --username your_username
use your_database_name
db.users.findOne({ username: "some_username" })
```

Look for the `institutionRoles` array in the output.

### Test the API

Test the new endpoints:

```bash
# Get your institutions (should show roles)
curl http://localhost:8000/institutions/me \
  -H "Authorization: Bearer <token>"

# Check your role in a specific institution
curl http://localhost:8000/institutions/<inst_id>/my-role \
  -H "Authorization: Bearer <token>"
```

---

## Troubleshooting

### Issue: "No users need migration"

**Possible causes:**

1. Migration already ran successfully
2. Users don't have the old `institutions` array
3. Users already have `institutionRoles` populated

**Solution:** Check a user manually in MongoDB to verify structure.

### Issue: Migration errors for some users

**Common causes:**

1. Invalid institution IDs in user's `institutions` array
2. Database connection issues
3. Corrupted user data

**Solution:** Review the error log in the output, fix the data manually, and re-run.

### Issue: Wrong roles assigned

If users got incorrect roles, you can fix them using the API:

```bash
# Update user's role in institution
curl -X POST http://localhost:8000/institutions/<inst_id>/assign-user \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<user_id>",
    "role": "tutor"
  }'
```

---

## Rollback (If Needed)

If something goes wrong, you can restore from backup:

```bash
# Restore from backup (MongoDB Atlas)
mongorestore --uri="mongodb+srv://username:password@cluster.mongodb.net/database" ./backup

# Or just clear institutionRoles and re-run
# In MongoDB Compass or mongosh, connect to your database and run:
db.users.updateMany({}, {$set: {institutionRoles: []}})

# Then re-run migration
npm run migrate-roles
```

---

## Important Notes

1. **Backward Compatibility**: The old `institutions` and `roles` arrays are kept and will continue to work
2. **Safe to Re-run**: The script only migrates users with empty `institutionRoles`, so it's safe to run multiple times
3. **No Data Loss**: The script doesn't delete any existing data, only adds new `institutionRoles`
4. **Migration Time**: For 1000 users, expect ~30-60 seconds

---

## What's Next?

After successful migration:

1. ✅ Test the new endpoints in your mobile app
2. ✅ Update your frontend to use the new role system
3. ✅ Gradually phase out the old `roles` array usage
4. ✅ Update any existing code that relies on the old structure

See `MULTI_ROLE_SYSTEM.md` for complete documentation on the new system.

---

## Need Help?

If you encounter issues:

1. Check the error messages in the migration output
2. Verify your database connection
3. Make sure you have a backup
4. Review the `MULTI_ROLE_SYSTEM.md` documentation

For manual fixes, you can always update users directly:

```javascript
// In MongoDB
db.users.updateOne(
  { _id: ObjectId("user_id") },
  {
    $push: {
      institutionRoles: {
        institution: ObjectId("inst_id"),
        role: "tutor",
        assignedAt: new Date(),
        assignedBy: null,
      },
    },
  }
);
```
