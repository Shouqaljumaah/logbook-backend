# Multi-Institution Migration Guide

This guide will help you migrate your single-institution logbook backend to support multiple institutions (vendors).

## 🎯 What's Changed

### New Features

1. **Multi-Institution Support**: Users, forms, and submissions can now belong to multiple institutions
2. **Super Admin Role**: New role for managing all institutions and users across the platform
3. **Institution Management**: CRUD operations for institutions
4. **Enhanced Access Control**: Users only see data from their assigned institutions

### Database Schema Changes

- **Users**: Added `institutions` array and `isSuperAdmin` flag
- **FormTemplates**: Added `institution` reference
- **FormSubmissions**: Added `institution` reference
- **FieldTemplates**: Added `institution` reference
- **Announcements**: Added `institution` reference
- **Notifications**: Added `institution` reference
- **New Model**: `Institution` model added

## 📋 Migration Steps

### Step 1: Backup Your Database

```bash
# Create a backup of your MongoDB database
mongodump --uri="mongodb://localhost:27017/logbook" --out=backup-$(date +%Y%m%d)
```

### Step 2: Pull Latest Code

Your code has already been updated with all necessary changes.

### Step 3: Set Environment Variables

Update your `.env` file with these optional variables:

```env
# Default institution details (optional - used during migration)
DEFAULT_INSTITUTION_NAME="Your Institution Name"
DEFAULT_INSTITUTION_CODE="INST001"

# Super admin credentials (optional - defaults will be used if not provided)
SUPER_ADMIN_USERNAME="superadmin"
SUPER_ADMIN_PASSWORD="SuperAdmin@123"
```

### Step 4: Run Migration Script

This script will:

- Create a default institution
- Assign all existing users to this institution
- Update all existing data with institution references

```bash
node scripts/migrateToMultiInstitution.js
```

### Step 5: Create Super Admin

```bash
node scripts/createSuperAdmin.js
```

Save the credentials displayed - you'll need them to manage the platform.

### Step 6: Start Your Server

```bash
npm start
```

### Step 7: Test the Application

1. Login as super admin
2. Verify existing data is accessible
3. Create a new institution
4. Create users for the new institution
5. Test institution isolation (users should only see their institution's data)

## 🔑 New API Endpoints

### Super Admin Endpoints

#### Institution Management

- `GET /superadmin/institutions` - Get all institutions
- `GET /superadmin/institutions/:id` - Get institution by ID
- `POST /superadmin/institutions` - Create institution
- `PUT /superadmin/institutions/:id` - Update institution
- `DELETE /superadmin/institutions/:id` - Delete institution
- `PATCH /superadmin/institutions/:id/toggle-status` - Toggle institution status
- `GET /superadmin/institutions/:id/stats` - Get institution statistics

#### User Management (Super Admin)

- `GET /superadmin/users` - Get all users across all institutions
- `GET /superadmin/users/:userId` - Get user by ID
- `POST /superadmin/users` - Create user with institution assignment
- `PUT /superadmin/users/:userId` - Update user
- `PATCH /superadmin/users/:userId/institutions` - Update user's institutions
- `DELETE /superadmin/users/:userId` - Delete user

#### Platform Management

- `GET /superadmin/stats` - Get platform-wide statistics
- `POST /superadmin/create-superadmin` - Create another super admin

### Creating an Institution

```javascript
POST /superadmin/institutions
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "name": "Medical College",
  "code": "MC001",
  "description": "Main medical college",
  "contactEmail": "contact@medcollege.com",
  "contactPhone": "+1234567890",
  "address": "123 Medical St",
  "settings": {
    "timezone": "UTC",
    "language": "en"
  }
}
```

### Creating a User with Institution

```javascript
POST /superadmin/users
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "username": "john.doe",
  "password": "SecurePassword123",
  "role": "admin",
  "email": "john@example.com",
  "phone": "+1234567890",
  "institutionIds": ["institution_id_here"]
}
```

### Creating Form Template (Updated)

```javascript
POST /formTemplates
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "formName": "Patient Assessment",
  "score": "SCORE",
  "scaleDescription": "1-5 scale",
  "institutionId": "institution_id_here", // Optional - uses user's first institution if not provided
  "fieldTemplates": [...]
}
```

## 👤 User Roles

### Super Admin (`superadmin`)

- Full access to all institutions
- Can create/manage institutions
- Can create/manage users across all institutions
- Can view platform-wide statistics

### Admin (`admin`)

- Can manage users within their assigned institution(s)
- Can create form templates for their institution(s)
- Can view submissions within their institution(s)

### Tutor (`tutor`)

- Can review submissions within their institution(s)
- Can view residents assigned to them

### Resident (`resident`)

- Can submit forms within their institution(s)
- Can view their own submissions

## 🔒 Access Control

All endpoints now filter data based on:

1. User's assigned institutions
2. Super admins bypass institution filtering
3. Form templates and submissions are isolated by institution

## ⚠️ Important Notes

1. **Existing Admins**: After migration, existing admin users will be assigned to the default institution. You may want to update their institution assignments.

2. **Unique Form Names**: Form names are now unique within an institution (not globally). Multiple institutions can have forms with the same name.

3. **User Institution Assignment**: Users can belong to multiple institutions. When creating data, they can choose which institution to use (or it defaults to their first institution).

4. **Data Isolation**: Users will only see data (users, forms, submissions) from institutions they're assigned to, except super admins who see everything.

5. **Backward Compatibility**: The migration maintains all existing functionality while adding multi-institution support.

## 🐛 Troubleshooting

### Issue: "User must be assigned to at least one institution"

**Solution**: Update existing admin users to have institution assignments:

```javascript
// Using MongoDB shell or Compass
db.users.updateMany(
  { roles: "admin", institutions: { $size: 0 } },
  { $set: { institutions: [ObjectId("your_institution_id")] } }
);
```

### Issue: "Cannot create form template - institution required"

**Solution**: Ensure the user has at least one institution assigned, or explicitly provide `institutionId` in the request.

### Issue: "Access denied to this institution"

**Solution**: Verify the user is assigned to the institution they're trying to access.

## 📝 Rollback Plan

If you need to rollback:

1. Restore your database backup:

```bash
mongorestore --uri="mongodb://localhost:27017/logbook" backup-YYYYMMDD/
```

2. Checkout the previous git commit:

```bash
git log --oneline
git checkout <previous-commit-hash>
npm install
npm start
```

## 🎓 Testing Checklist

- [ ] Existing users can login
- [ ] Existing data is visible to users
- [ ] Super admin can create institutions
- [ ] Super admin can create users
- [ ] Admin can create users in their institution
- [ ] Form templates are institution-specific
- [ ] Form submissions are institution-specific
- [ ] Users only see data from their institutions
- [ ] Multi-institution users can access all their institutions' data

## 📞 Support

If you encounter any issues during migration, please check:

1. Database connection settings
2. Environment variables
3. Migration script output for errors
4. Application logs

For additional help, refer to the code comments or reach out to your development team.
