# Logbook Backend - Multi-Institution System

A comprehensive logbook management system that supports multiple institutions (vendors) with role-based access control and super admin capabilities.

## 🎯 Overview

This backend application has been transformed from a single-institution system to a **multi-institution (multi-vendor)** platform. Users can now belong to multiple institutions, and data is properly isolated between institutions while maintaining a centralized management interface for super admins.

## ✨ Features

### Multi-Institution Support

- ✅ Users can belong to multiple institutions
- ✅ Data isolation between institutions
- ✅ Institution-specific form templates
- ✅ Cross-institution user management
- ✅ Institution activity management

### Role-Based Access Control

- **Super Admin**: Platform administrator who manages all institutions and users
- **Institution Admin**: Administrator of specific institution(s) - each institution has its own admin(s)
- **Tutor**: Instructor/supervisor who reviews submissions - can join multiple institutions
- **Resident**: End user who submits forms - can join multiple institutions

### Core Functionality

- User authentication and authorization (JWT)
- Form template management
- Form submission and review workflow
- File uploads (images, documents)
- Notifications system
- Announcements management
- User supervision tracking

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd logbook-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run migration (for existing installations)**

   ```bash
   npm run migrate
   ```

5. **Create super admin**

   ```bash
   npm run create-superadmin
   ```

6. **Start the server**
   ```bash
   npm start
   ```

Server will be running at `http://localhost:8000`

## 📖 Documentation

Comprehensive documentation is available:

- **[CORRECTED_STRUCTURE.md](CORRECTED_STRUCTURE.md)** ⭐ - **START HERE** - Corrected role structure overview
- **[PERMISSION_STRUCTURE.md](PERMISSION_STRUCTURE.md)** 🔐 - **UPDATED** - Complete permission system guide
- **[FRONTEND_MIGRATION_BRIEF.md](FRONTEND_MIGRATION_BRIEF.md)** 🎨 - **ADMIN FRONTEND** - Guide for admin web app
- **[MOBILE_APP_INTEGRATION_GUIDE.md](MOBILE_APP_INTEGRATION_GUIDE.md)** 📱 - **MOBILE APP** - Guide for tutor/resident app
- **[PROFILE_API_DOCUMENTATION.md](PROFILE_API_DOCUMENTATION.md)** 👤 - **PROFILE API** - User profile management endpoints
- **[QUICK_START.md](QUICK_START.md)** - Get up and running in 5 minutes
- **[ROLES_AND_PERMISSIONS.md](ROLES_AND_PERMISSIONS.md)** - Complete roles and permissions guide
- **[INSTITUTION_FILTERING.md](INSTITUTION_FILTERING.md)** - Filter forms and submissions by institution
- **[INSTITUTION_CONTROLLERS_REVIEW.md](INSTITUTION_CONTROLLERS_REVIEW.md)** - Institution controllers validation & fixes
- **[INSTITUTION_FIXES.md](INSTITUTION_FIXES.md)** - Institution permission fixes explained
- **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** - Complete migration instructions
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Full API reference
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Technical implementation details

## 🔑 Default Credentials

After running `npm run create-superadmin`:

- **Username**: `superadmin` (or from .env)
- **Password**: `SuperAdmin@123` (or from .env)

⚠️ **Change these credentials immediately after first login!**

## 📁 Project Structure

```
logbook-backend/
├── apis/
│   ├── announcements/       # Announcement management
│   ├── fieldTemplate/       # Field template management
│   ├── formSubmitions/      # Form submissions
│   ├── formTamplates/       # Form templates
│   ├── notifications/       # Notification system
│   ├── users/              # User management
│   └── superadmin/         # Super admin features
│       ├── institutions.controllers.js
│       ├── institutions.routes.js
│       ├── superadmin.controllers.js
│       └── superadmin.routes.js
├── models/
│   ├── Announcements.js
│   ├── FieldRecords.js
│   ├── FieldTemplates.js
│   ├── FormSubmitions.js
│   ├── FormTemplates.js
│   ├── Institutions.js      # New: Institution model
│   ├── Notifications.js
│   └── Users.js
├── scripts/
│   ├── createSuperAdmin.js          # Super admin creation
│   └── migrateToMultiInstitution.js # Migration script
├── app.js                   # Application entry point
├── database.js             # Database configuration
├── passport.js             # Authentication strategies
└── multer.js              # File upload configuration
```

## 🔌 API Endpoints

### Super Admin

- `POST /superadmin/create-superadmin` - Create super admin
- `GET /superadmin/stats` - Platform statistics
- `GET /superadmin/institutions` - List institutions
- `POST /superadmin/institutions` - Create institution
- `POST /superadmin/institutions/:id/admins` - Assign admin to institution
- `DELETE /superadmin/institutions/:id/admins/:userId` - Remove admin from institution
- `GET /superadmin/institutions/:id/admins` - Get institution admins
- `GET /superadmin/users` - List all users
- `POST /superadmin/users` - Create user

### Authentication

- `POST /users/login` - User login
- `POST /users/signup` - Create user (admin only)
- `POST /users/change-password` - Change password

### Form Templates

- `GET /formTemplates` - List templates
- `POST /formTemplates` - Create template
- `PUT /formTemplates/:id` - Update template
- `DELETE /formTemplates/:id` - Delete template

### Form Submissions

- `GET /formSubmitions` - List submissions
- `POST /formSubmitions` - Create submission
- `PUT /formSubmitions/:id/review` - Review submission
- `DELETE /formSubmitions/:id` - Delete submission

For complete API documentation, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

## 🏗️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Passport.js with JWT
- **File Upload**: Multer
- **Password Hashing**: bcrypt
- **Environment**: dotenv

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Institution-based data isolation
- Super admin privilege protection
- Input validation
- Protected routes

## 🧪 Testing

```bash
# Run tests
npm test

# The project currently uses the default test placeholder
# Implement your tests in the test directory
```

## 📊 Database Schema

### Key Models

**Institution**

- Basic info (name, code, description)
- Contact information
- Active status
- Custom settings

**User**

- Username, password (hashed)
- Multiple roles
- Multiple institutions
- Super admin flag
- Profile information

**FormTemplate**

- Template name and structure
- Institution reference
- Field definitions
- Scoring configuration

**FormSubmission**

- Template reference
- Resident and tutor assignment
- Submission status
- Institution reference
- Field records

## 🔄 Migration from Single to Multi-Institution

If you have an existing single-institution installation:

1. **Backup your database**
2. **Run migration script**: `npm run migrate`
3. **Create super admin**: `npm run create-superadmin`
4. **Verify data integrity**
5. **Update your frontend** (if necessary)

See [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) for detailed instructions.

## 🛠️ Available Scripts

```bash
npm start              # Start the server with nodemon
npm run migrate        # Run multi-institution migration
npm run create-superadmin  # Create super admin user
npm test              # Run tests
```

## 📝 Environment Variables

Create a `.env` file in the root directory:

```env
# Database
MONGO_URI=mongodb://localhost:27017/logbook

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION_MS=86400000

# Server
PORT=8000

# Migration (optional)
DEFAULT_INSTITUTION_NAME=Default Institution
DEFAULT_INSTITUTION_CODE=DEFAULT

# Super Admin (optional)
SUPER_ADMIN_USERNAME=superadmin
SUPER_ADMIN_PASSWORD=SuperAdmin@123
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Authors

- Original Repository: [Shouqaljumaah](https://github.com/Shouqaljumaah/logbook-backend)
- Multi-Institution Implementation: October 2025

## 🆘 Support

For issues and questions:

1. Check the documentation files
2. Review the [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
3. Check the [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
4. Open an issue on GitHub

## 🗺️ Roadmap

Future enhancements:

- [ ] Institution-specific themes
- [ ] Cross-institution reporting
- [ ] Advanced analytics dashboard
- [ ] Email notifications
- [ ] Multi-language support
- [ ] Data export functionality
- [ ] Audit logging
- [ ] Institution subscription management

## 📈 Version History

### Version 2.0.0 (October 2025)

- ✅ Multi-institution support
- ✅ Super admin role and management
- ✅ Institution-based data isolation
- ✅ Migration scripts
- ✅ Comprehensive documentation

### Version 1.0.0 (Previous)

- Initial single-institution implementation
- Basic user management
- Form templates and submissions
- Authentication and authorization

---

**Built with ❤️ for educational and medical institutions**

For more detailed information, please refer to the documentation files in this repository.
