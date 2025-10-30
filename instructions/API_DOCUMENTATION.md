# API Documentation - Multi-Institution Logbook Backend

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer {your_jwt_token}
```

## Base URL

```
http://localhost:8000
```

---

## 🏢 Institution Management

These endpoints are accessible to both Super Admins and Institution Admins, with different permission levels.

### Platform Statistics

Get overall platform statistics.

**Endpoint:** `GET /stats`

**Auth Required:** Super Admin

**Response:**

```json
{
  "institutions": {
    "total": 5,
    "active": 4
  },
  "users": {
    "total": 150,
    "admins": 10,
    "tutors": 50,
    "residents": 90
  },
  "formTemplates": 25,
  "formSubmissions": 1250
}
```

---

### Institution CRUD Operations

#### Get All Institutions

**Endpoint:** `GET /institutions`

**Auth Required:** Super Admin OR Institution Admin

**Permissions:**

- **Super Admin**: Returns all institutions
- **Institution Admin**: Returns only institutions they administer

**Response:**

```json
[
  {
    "_id": "institution_id",
    "name": "Medical College",
    "code": "MC001",
    "description": "Main medical college",
    "logo": "uploads/logo.png",
    "contactEmail": "contact@medcollege.com",
    "contactPhone": "+1234567890",
    "address": "123 Medical St",
    "isActive": true,
    "settings": {},
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

#### Get Institution by ID

**Endpoint:** `GET /institutions/:id`

**Auth Required:** Super Admin OR Institution Admin

**Permissions:**

- **Super Admin**: Can view any institution
- **Institution Admin**: Can only view institutions they administer

#### Create Institution

**Endpoint:** `POST /institutions`

**Auth Required:** Institution Admin

**Note:** The requesting user will automatically become the admin of the newly created institution.

**Request Body:**

```json
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

**Optional:** Can include `logo` as multipart/form-data file

#### Update Institution

**Endpoint:** `PUT /institutions/:id`

**Auth Required:** Super Admin OR Institution Admin

**Permissions:**

- **Super Admin**: Can update any institution and change admin assignments
- **Institution Admin**: Can update their own institution's details AND change admin assignments

**Request Body:** Same as create, all fields optional

**Note:** Institution admins can now modify the `adminIds` field for their own institutions

#### Delete Institution

**Endpoint:** `DELETE /institutions/:id`

**Auth Required:** Super Admin Only

**Note:**

- Only super admins can delete institutions
- Cannot delete if institution has users

#### Toggle Institution Status

**Endpoint:** `PATCH /institutions/:id/toggle-status`

**Auth Required:** Super Admin Only

**Note:** Only super admins can activate/deactivate institutions

**Response:**

```json
{
  "message": "Institution activated successfully",
  "institution": { ... }
}
```

#### Get Institution Statistics

**Endpoint:** `GET /institutions/:id/stats`

**Auth Required:** Super Admin OR Institution Admin

**Permissions:**

- **Super Admin**: Can view statistics for any institution
- **Institution Admin**: Can only view statistics for institutions they administer

**Response:**

```json
{
  "usersCount": 45,
  "adminsCount": 3,
  "tutorsCount": 20,
  "residentsCount": 22,
  "formTemplatesCount": 12,
  "formSubmissionsCount": 450
}
```

#### Get Institution Admins

**Endpoint:** `GET /institutions/:id/admins`

**Auth Required:** Super Admin OR Institution Admin

**Permissions:**

- **Super Admin**: Can view admins of any institution
- **Institution Admin**: Can only view admins of institutions they administer

**Response:**

```json
{
  "admins": [
    {
      "_id": "user_id",
      "username": "admin.user",
      "email": "admin@example.com",
      "roles": ["admin"]
    }
  ]
}
```

#### Add Admin to Institution

**Endpoint:** `POST /institutions/:id/admins`

**Auth Required:** Super Admin OR Institution Admin

**Permissions:**

- **Super Admin**: Can add admins to any institution
- **Institution Admin**: Can add admins to their own institution(s)

**Request Body:**

```json
{
  "userId": "user_id_to_add_as_admin"
}
```

**Note:** Any user can be added as an admin (no role validation required)

#### Remove Admin from Institution

**Endpoint:** `DELETE /institutions/:id/admins/:userId`

**Auth Required:** Super Admin OR Institution Admin

**Permissions:**

- **Super Admin**: Can remove admins from any institution
- **Institution Admin**: Can remove admins from their own institution(s)

**Note:** Cannot remove the last admin from an institution

---

## 🔐 Super Admin Only Endpoints

These endpoints are exclusively for Super Admins.

### User Management (Super Admin)

#### Get All Users

**Endpoint:** `GET /superadmin/users`

**Auth Required:** Super Admin

**Query Parameters:**

- `institutionId` (optional): Filter by institution

**Response:**

```json
[
  {
    "_id": "user_id",
    "username": "john.doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "roles": ["admin"],
    "institutions": [
      {
        "_id": "institution_id",
        "name": "Medical College",
        "code": "MC001"
      }
    ],
    "supervisor": null,
    "totalSubmissions": 25,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]
```

#### Get User by ID

**Endpoint:** `GET /superadmin/users/:userId`

**Auth Required:** Super Admin

#### Create User

**Endpoint:** `POST /superadmin/users`

**Auth Required:** Super Admin

**Request Body:**

```json
{
  "username": "john.doe",
  "password": "SecurePassword123",
  "role": "admin",
  "email": "john@example.com",
  "phone": "+1234567890",
  "institutionIds": ["institution_id_1", "institution_id_2"],
  "supervisor": "supervisor_user_id"
}
```

**Roles:** `admin`, `tutor`, `resident`

#### Update User

**Endpoint:** `PUT /superadmin/users/:userId`

**Auth Required:** Super Admin

**Request Body:**

```json
{
  "username": "john.doe",
  "email": "newemail@example.com",
  "phone": "+1234567890",
  "supervisor": "supervisor_user_id",
  "institutionIds": ["institution_id_1"],
  "roles": ["admin", "tutor"]
}
```

**Optional:** Can include `image` as multipart/form-data file

#### Update User Institutions

**Endpoint:** `PATCH /superadmin/users/:userId/institutions`

**Auth Required:** Super Admin

**Request Body:**

```json
{
  "institutionIds": ["institution_id_1", "institution_id_2"]
}
```

#### Delete User

**Endpoint:** `DELETE /superadmin/users/:userId`

**Auth Required:** Super Admin

**Note:** Cannot delete if user has submissions

#### Create Super Admin

**Endpoint:** `POST /superadmin/create-superadmin`

**Auth Required:** Super Admin

**Request Body:**

```json
{
  "username": "superadmin2",
  "password": "SecurePassword123",
  "email": "admin@example.com",
  "phone": "+1234567890"
}
```

---

## 👥 User Endpoints

### Signup User (Institution Admin only)

**Endpoint:** `POST /users/signup`

**Auth Required:** Institution Admin

**Request Body:**

```json
{
  "username": "newuser",
  "password": "password123",
  "role": "tutor",
  "email": "user@example.com",
  "phone": "+1234567890",
  "institutionId": "institution_id"
}
```

**Note:** `institutionId` is optional. If not provided, uses admin's first institution they administer.

### Login

**Endpoint:** `POST /users/login`

**Auth Required:** No

**Request Body:**

```json
{
  "username": "john.doe",
  "password": "password123"
}
```

**Response:**

```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "john.doe",
    "role": ["admin"],
    "image": "uploads/image.png",
    "email": "john@example.com",
    "institutions": [...]
  },
  "requirePasswordChange": false
}
```

### Change Password

**Endpoint:** `POST /users/change-password`

**Auth Required:** No (uses userId from body)

**Request Body:**

```json
{
  "userId": "user_id",
  "oldPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

### Get All Users

**Endpoint:** `GET /users`

**Auth Required:** Institution Admin

**Note:** Returns users from requesting user's institutions only

### Get User by ID

**Endpoint:** `GET /users/:id`

**Auth Required:** Yes

### Get Tutor List

**Endpoint:** `GET /users/tutors/list`

**Auth Required:** Yes

**Note:** Returns tutors from requesting user's institutions only

### Update User

**Endpoint:** `PUT /users/:id`

**Auth Required:** Institution Admin

**Request Body:**

```json
{
  "username": "john.doe",
  "email": "newemail@example.com",
  "phone": "+1234567890",
  "supervisor": "supervisor_user_id"
}
```

**Optional:** Can include `image` as multipart/form-data file

### Delete User

**Endpoint:** `DELETE /users/:id`

**Auth Required:** Institution Admin

---

## 📋 Form Templates

### Get All Form Templates

**Endpoint:** `GET /formTemplates`

**Auth Required:** Yes

**Query Parameters:**

- `institutionId` (optional): Filter by institution

**Permissions:**

- **Super Admin**: Can view all templates or filter by institution
- **Institution Admin/Tutor/Resident**: Can view templates from their institutions only

**Note:** Returns templates from requesting user's institutions only

### Get Form Template by ID

**Endpoint:** `GET /formTemplates/:id`

**Auth Required:** Yes

**Permissions:** User must have access to the form's institution

### Create Form Template

**Endpoint:** `POST /formTemplates`

**Auth Required:** Institution Admin

**Request Body:**

```json
{
  "formName": "Patient Assessment",
  "score": "SCORE",
  "scaleDescription": "1-5 scale",
  "institutionId": "institution_id",
  "fieldTemplates": [
    {
      "name": "Field Name",
      "type": "text",
      "position": "1",
      "section": "1",
      "hasDetails": false,
      "details": "",
      "options": [],
      "scaleOptions": []
    }
  ]
}
```

**Note:** `institutionId` is optional for institution admins. If not provided, uses the first institution they administer. Super admins MUST provide `institutionId`.

**Field Types:** `text`, `textArea`, `select`, `checkbox`, `scale`, `date`

### Update Form Template

**Endpoint:** `PUT /formTemplates/:formId`

**Auth Required:** Institution Admin

**Permissions:** Admin must be an administrator of the form's institution

### Delete Form Template

**Endpoint:** `DELETE /formTemplates/:formId`

**Auth Required:** Institution Admin

**Permissions:** Admin must be an administrator of the form's institution

---

## 📝 Form Submissions

### Get All Form Submissions

**Endpoint:** `GET /formSubmitions`

**Auth Required:** Yes

**Query Parameters:**

- `formPlatform`: `web` or `mobile`
- `institutionId` (optional): Filter by institution

**Permissions:**

- **Super Admin**: Can view all submissions or filter by institution
- **Institution Admin (web platform)**: Can view all submissions from their institutions
- **Tutor/Resident (mobile platform)**: Can view their own submissions from their institutions

**Note:**

- Returns submissions from requesting user's institutions only
- For tutors: returns submissions where they are the tutor
- For residents: returns submissions where they are the resident
- For web platform: returns all submissions from user's institutions

### Get Form Submission by ID

**Endpoint:** `GET /formSubmitions/:id`

**Auth Required:** Yes

### Get Form Submissions by User ID

**Endpoint:** `GET /formSubmitions/user/:id`

**Auth Required:** Yes

**Note:** Returns submissions for the specified user from requesting user's institutions

### Create Form Submission

**Endpoint:** `POST /formSubmitions`

**Auth Required:** Yes

**Request Body:**

```json
{
  "formtemplate": "template_id",
  "resident": "resident_user_id",
  "tutor": "tutor_user_id",
  "submissionDate": "2025-01-15",
  "fieldRecords": [
    {
      "fieldTemplate": "field_template_id",
      "value": "field value"
    }
  ]
}
```

**Note:** Institution is automatically determined from the form template

### Review Form Submission

**Endpoint:** `PUT /formSubmitions/:formSubmitionsId/review`

**Auth Required:** Tutor

**Request Body:**

```json
{
  "fieldRecords": [
    {
      "fieldTemplate": "field_template_id",
      "value": "review comments"
    }
  ]
}
```

### Delete Form Submission

**Endpoint:** `DELETE /formSubmitions/:formSubmitionsId`

**Auth Required:** Tutor (must be the assigned tutor)

---

## 🔔 Role-Based Access Summary

### Super Admin

- ✅ Full access to all institutions
- ✅ Create/update/delete institutions
- ✅ Assign/remove institution admins
- ✅ Create/manage users across all institutions
- ✅ View platform-wide statistics
- ✅ Create other super admins

### Institution Admin

- ✅ Create new institutions (becomes admin automatically)
- ✅ View their own institution(s) details
- ✅ Update their institution's information (including admin assignments)
- ✅ View statistics for their institution(s)
- ✅ View other admins of their institution(s)
- ✅ Add admins to their institution(s)
- ✅ Remove admins from their institution(s)
- ✅ Manage users within their institution(s)
- ✅ Create form templates for their institution(s)
- ✅ View all submissions within their institution(s)
- ❌ Cannot delete institutions
- ❌ Cannot toggle institution status
- ❌ Cannot access other institutions' data

### Tutor

- ✅ Review submissions assigned to them
- ✅ Create submissions for residents
- ✅ View residents within their institution(s)
- ❌ Cannot create form templates
- ❌ Cannot manage users

### Resident

- ✅ View their own submissions
- ✅ Submit forms
- ❌ Cannot review submissions
- ❌ Cannot create templates
- ❌ Cannot manage users

---

## 🔒 Data Isolation

All data is automatically filtered by institution:

- Users only see data from institutions they're assigned to
- Super admins bypass this filtering and see all data
- Form templates are unique per institution (same name allowed in different institutions)
- Submissions are tied to institutions through their form templates

---

## 📊 Response Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (no token or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🔧 Error Response Format

```json
{
  "message": "Error description",
  "error": "Detailed error message (in development)"
}
```
