# Quick Start Guide - Multi-Institution Logbook

## 🚀 Getting Started in 5 Minutes

### Step 1: Backup Your Database

```bash
# If using MongoDB locally
mongodump --uri="mongodb://localhost:27017/logbook" --out=backup-$(date +%Y%m%d)
```

### Step 2: Run Migration

This will migrate your existing data to the multi-institution structure:

```bash
npm run migrate
```

**What it does:**

- Creates a default institution named "Default Institution"
- Assigns all existing users to this institution
- Updates all existing forms and submissions with institution reference

### Step 3: Create Super Admin

```bash
npm run create-superadmin
```

**Default credentials (if not set in .env):**

- Username: `superadmin`
- Password: `SuperAdmin@123`

**⚠️ Save these credentials!**

### Step 4: Start Your Server

```bash
npm start
```

Server should start on `http://localhost:8000`

### Step 5: Test the Installation

#### 5.1 Login as Super Admin

```bash
curl -X POST http://localhost:8000/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin",
    "password": "SuperAdmin@123"
  }'
```

Save the `token` from the response.

#### 5.2 View Platform Statistics

```bash
curl -X GET http://localhost:8000/superadmin/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 5.3 View All Institutions

```bash
curl -X GET http://localhost:8000/superadmin/institutions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

You should see your "Default Institution" created during migration.

---

## 📋 Common Tasks

### Creating a New Institution

```bash
curl -X POST http://localhost:8000/superadmin/institutions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Medical College",
    "code": "NMC001",
    "description": "New medical college campus",
    "contactEmail": "contact@newmedcollege.com",
    "contactPhone": "+1234567890"
  }'
```

### Creating a User for an Institution

```bash
curl -X POST http://localhost:8000/superadmin/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin.user",
    "password": "SecurePassword123",
    "role": "admin",
    "email": "admin@example.com",
    "institutionIds": ["INSTITUTION_ID_HERE"]
  }'
```

### Assigning User to Multiple Institutions

```bash
curl -X PATCH http://localhost:8000/superadmin/users/USER_ID/institutions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "institutionIds": ["INSTITUTION_ID_1", "INSTITUTION_ID_2"]
  }'
```

---

## 🔧 Environment Variables (Optional)

Create a `.env` file with these variables to customize the setup:

```env
# Database
MONGO_URI=mongodb://localhost:27017/logbook

# JWT Configuration (should already exist)
JWT_SECRET=your-secret-key
JWT_EXPIRATION_MS=86400000

# Default Institution (for migration)
DEFAULT_INSTITUTION_NAME="My Institution Name"
DEFAULT_INSTITUTION_CODE="INST001"

# Super Admin Credentials (for script)
SUPER_ADMIN_USERNAME=superadmin
SUPER_ADMIN_PASSWORD=YourSecurePassword123
```

---

## 📱 Testing with Your Frontend

### Update Login Response Handling

The login response now includes institutions:

```javascript
{
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "username": "john.doe",
    "role": ["admin"],
    "institutions": [
      {
        "_id": "institution_id",
        "name": "Medical College",
        "code": "MC001"
      }
    ]
  }
}
```

### Update Form Creation

When creating forms, you can now specify institution (optional):

```javascript
POST /formTemplates
{
  "formName": "Assessment Form",
  "institutionId": "institution_id", // Optional
  "fieldTemplates": [...]
}
```

If not provided, it uses the user's first institution.

---

## 🎯 Role Overview

### Super Admin

- **Can:** Manage everything across all institutions
- **Cannot:** Nothing - full access
- **Login:** Use credentials from Step 3

### Admin

- **Can:** Manage users and forms within their institution(s)
- **Cannot:** Access other institutions or create institutions
- **Note:** Existing admins already have access to default institution

### Tutor

- **Can:** Review submissions, create submissions
- **Cannot:** Create forms, manage users
- **No changes** to existing functionality

### Resident

- **Can:** Submit forms, view own submissions
- **Cannot:** Review submissions
- **No changes** to existing functionality

---

## ✅ Verification Checklist

After migration, verify:

- [ ] Can login as super admin
- [ ] Can see platform statistics
- [ ] Can see default institution
- [ ] Existing users can login
- [ ] Existing forms are visible
- [ ] Existing submissions are accessible
- [ ] Can create new institution
- [ ] Can create user for new institution
- [ ] New institution's data is isolated from default institution

---

## 🐛 Troubleshooting

### Issue: Migration script fails

**Solution:** Check MongoDB connection string in `.env` file

### Issue: Cannot login as super admin

**Solution:**

```bash
# Check if super admin was created
mongo logbook --eval "db.users.find({isSuperAdmin: true})"

# If not found, run create script again
npm run create-superadmin
```

### Issue: Existing users cannot access data

**Solution:**

```bash
# Check if users have institution assigned
mongo logbook --eval "db.users.find({institutions: {$size: 0}})"

# If found, run migration again or manually assign:
# mongo logbook --eval "db.users.updateMany(
#   {institutions: {$size: 0}},
#   {$set: {institutions: [ObjectId('your_institution_id')]}}
# )"
```

### Issue: Forms not showing

**Solution:**

```bash
# Check if forms have institution reference
mongo logbook --eval "db.formtemplates.find({institution: {$exists: false}})"

# Run migration again if found
```

---

## 📚 Next Steps

1. **Read Full Documentation**

   - `MIGRATION_GUIDE.md` - Complete migration instructions
   - `API_DOCUMENTATION.md` - All API endpoints
   - `IMPLEMENTATION_SUMMARY.md` - Technical details

2. **Update Frontend**

   - Handle institution data in user object
   - Add institution selector if user has multiple institutions
   - Update form creation to include institution

3. **Train Your Team**

   - Show super admin how to manage institutions
   - Show admins the new multi-institution features
   - Inform tutors and residents (no changes for them)

4. **Monitor**
   - Check application logs
   - Verify data isolation
   - Test with multiple institutions

---

## 🆘 Need Help?

1. Check the error message
2. Review the appropriate documentation
3. Check application logs
4. Verify database state
5. Contact your development team

---

**Happy Multi-Institution Management! 🎉**
