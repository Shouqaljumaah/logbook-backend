# Profile Management API Documentation

## 🎯 Overview

This document describes the profile management endpoints for users (tutors and residents) in the mobile application.

---

## 📱 Profile Endpoints

### 1. Get My Profile

View current user's profile information.

**Endpoint:** `GET /users/profile/me`

**Auth Required:** Yes (JWT token)

**Response:**

```json
{
  "_id": "user_id",
  "username": "john.doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "image": "uploads/profile.jpg",
  "roles": ["tutor"],
  "supervisor": {
    "_id": "supervisor_id",
    "username": "supervisor.name",
    "email": "supervisor@example.com"
  },
  "institutions": [
    {
      "_id": "inst1_id",
      "name": "Hospital A",
      "code": "HA001",
      "logo": "uploads/logo.png"
    }
  ],
  "isFirstLogin": false,
  "isSuperAdmin": false,
  "isDeleted": false
}
```

---

### 2. Update My Profile

Update current user's profile information.

**Endpoint:** `PUT /users/profile/me`

**Auth Required:** Yes (JWT token)

**Content-Type:** `multipart/form-data` (if uploading image)

**Request Body:**

```json
{
  "username": "john.doe.updated",
  "email": "newemail@example.com",
  "phone": "+9876543210"
}
```

**Optional:** Include `image` file in multipart/form-data

**Example with Form Data:**

```javascript
const formData = new FormData();
formData.append("username", "john.doe.updated");
formData.append("email", "newemail@example.com");
formData.append("phone", "+9876543210");
formData.append("image", imageFile); // Optional

await api.put("/users/profile/me", formData, {
  headers: {
    "Content-Type": "multipart/form-data",
    Authorization: `Bearer ${token}`,
  },
});
```

**Response:**

```json
{
  "message": "Profile updated successfully",
  "user": {
    "_id": "user_id",
    "username": "john.doe.updated",
    "email": "newemail@example.com",
    "phone": "+9876543210",
    "image": "uploads/new-profile.jpg",
    "roles": ["tutor"],
    "institutions": [...],
    "supervisor": {...}
  }
}
```

**Error Responses:**

```json
// 400 - Duplicate username/email
{
  "message": "username already exists"
}

// 403 - Account deleted
{
  "message": "Account has been deleted"
}

// 404 - User not found
{
  "message": "User not found"
}
```

---

### 3. Delete My Account (Soft Delete)

Soft delete user account. The account is not permanently removed but marked as deleted.

**Endpoint:** `DELETE /users/profile/me`

**Auth Required:** Yes (JWT token)

**Request Body:**

```json
{
  "password": "user_current_password"
}
```

**Important Notes:**

- Password is **required** for security
- This is a **soft delete** - account can be restored by support within 30 days
- If user is an admin of any institution, deletion is **blocked** until admin rights are transferred

**Success Response:**

```json
{
  "message": "Account deleted successfully. You can contact support to restore your account within 30 days."
}
```

**Error Responses:**

```json
// 400 - No password provided
{
  "message": "Password is required to delete account"
}

// 400 - User is institution admin
{
  "message": "Cannot delete account. You are an admin of one or more institutions. Please transfer admin rights first.",
  "institutions": ["Hospital A", "Medical College B"]
}

// 400 - Already deleted
{
  "message": "Account is already deleted"
}

// 401 - Wrong password
{
  "message": "Incorrect password"
}

// 404 - User not found
{
  "message": "User not found"
}
```

---

## 🔒 Soft Delete Behavior

### What Happens When Account is Deleted:

1. **Account Status:**

   - `isDeleted` flag set to `true`
   - `deletedAt` timestamp recorded
   - User remains in database (soft delete)

2. **Login Prevention:**

   - Deleted accounts **cannot login**
   - Authentication will fail with message about account deletion

3. **Data Preservation:**

   - All user data remains in database
   - Form submissions are preserved
   - Institution memberships are preserved

4. **Admin Protection:**

   - Users who are institution admins **cannot delete** their accounts
   - Must transfer admin rights first
   - Prevents orphaned institutions

5. **Restoration:**
   - Contact support within 30 days to restore
   - Support can set `isDeleted` to `false` and clear `deletedAt`

---

## 📱 Mobile App Implementation

### Profile Screen

```jsx
<ProfileScreen>
  <Header>
    <Title>My Profile</Title>
    <EditButton onPress={() => navigate("/edit-profile")} />
  </Header>

  <ProfileImage source={user.image} />

  <InfoSection>
    <InfoItem>
      <Label>Username</Label>
      <Value>{user.username}</Value>
    </InfoItem>

    <InfoItem>
      <Label>Email</Label>
      <Value>{user.email}</Value>
    </InfoItem>

    <InfoItem>
      <Label>Phone</Label>
      <Value>{user.phone}</Value>
    </InfoItem>

    <InfoItem>
      <Label>Role</Label>
      <Value>{user.roles.join(", ")}</Value>
    </InfoItem>
  </InfoSection>

  <InstitutionsSection>
    <SectionTitle>My Institutions</SectionTitle>
    {user.institutions.map((inst) => (
      <InstitutionCard key={inst._id}>
        <Logo source={inst.logo} />
        <Name>{inst.name}</Name>
        <Code>{inst.code}</Code>
      </InstitutionCard>
    ))}
  </InstitutionsSection>

  <DangerZone>
    <DeleteAccountButton onPress={handleDeleteAccount}>
      Delete Account
    </DeleteAccountButton>
  </DangerZone>
</ProfileScreen>
```

---

### Edit Profile Screen

```jsx
<EditProfileScreen>
  <Form>
    <ImagePicker currentImage={user.image} onImageSelected={setSelectedImage} />

    <Input label="Username" value={username} onChangeText={setUsername} />

    <Input
      label="Email"
      value={email}
      onChangeText={setEmail}
      keyboardType="email-address"
    />

    <Input
      label="Phone"
      value={phone}
      onChangeText={setPhone}
      keyboardType="phone-pad"
    />

    <Button onPress={handleSave}>Save Changes</Button>
  </Form>
</EditProfileScreen>
```

---

### API Service Implementation

```javascript
// services/profileService.js

export const profileService = {
  // Get current user profile
  async getProfile() {
    return await api.get("/users/profile/me");
  },

  // Update profile
  async updateProfile(data) {
    const formData = new FormData();

    if (data.username) formData.append("username", data.username);
    if (data.email) formData.append("email", data.email);
    if (data.phone) formData.append("phone", data.phone);
    if (data.image) {
      formData.append("image", {
        uri: data.image,
        type: "image/jpeg",
        name: "profile.jpg",
      });
    }

    return await api.put("/users/profile/me", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Delete account
  async deleteAccount(password) {
    return await api.delete("/users/profile/me", {
      data: { password },
    });
  },
};
```

---

### Example Usage

#### Get Profile

```javascript
const ProfileScreen = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profile = await profileService.getProfile();
      setUser(profile);
    } catch (error) {
      showError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  // ... render
};
```

---

#### Update Profile

```javascript
const EditProfileScreen = () => {
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleSave = async () => {
    try {
      setLoading(true);

      const updateData = {
        username,
        email,
        phone,
        ...(selectedImage && { image: selectedImage }),
      };

      const response = await profileService.updateProfile(updateData);

      showSuccess("Profile updated successfully");
      updateUserInContext(response.user);
      navigation.goBack();
    } catch (error) {
      if (error.response?.status === 400) {
        showError(error.response.data.message); // "username already exists"
      } else {
        showError("Failed to update profile");
      }
    } finally {
      setLoading(false);
    }
  };

  // ... render
};
```

---

#### Delete Account

```javascript
const DeleteAccountScreen = () => {
  const [password, setPassword] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDeleteRequest = () => {
    if (!password) {
      showError("Please enter your password");
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setLoading(true);

      await profileService.deleteAccount(password);

      showSuccess("Account deleted successfully");

      // Clear auth state and redirect to login
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (error) {
      if (error.response?.status === 400) {
        const { message, institutions } = error.response.data;

        if (institutions) {
          // User is admin of institutions
          showError(`${message}\nInstitutions: ${institutions.join(", ")}`);
        } else {
          showError(message);
        }
      } else if (error.response?.status === 401) {
        showError("Incorrect password");
      } else {
        showError("Failed to delete account");
      }
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  return (
    <View>
      <Warning>
        <WarningIcon name="alert" />
        <WarningText>
          This action cannot be undone easily. Your account will be deleted and
          you'll need to contact support to restore it within 30 days.
        </WarningText>
      </Warning>

      <Input
        label="Enter your password to confirm"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button color="danger" onPress={handleDeleteRequest}>
        Delete My Account
      </Button>

      <ConfirmDialog
        visible={showConfirm}
        title="Are you absolutely sure?"
        message="This will delete your account. You can contact support within 30 days to restore it."
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </View>
  );
};
```

---

## 🔐 Security Considerations

### 1. **Password Verification**

- Always require password for account deletion
- Prevent accidental deletions
- Protects against unauthorized access

### 2. **Admin Protection**

- Block deletion if user is institution admin
- Prevents orphaned institutions
- Forces admin rights transfer first

### 3. **Soft Delete Benefits**

- Preserves data integrity
- Allows account restoration
- Maintains submission history
- No cascading deletions needed

### 4. **Login Prevention**

- Deleted accounts cannot login
- Clear error message to user
- Support contact information provided

---

## 🧪 Testing Checklist

### Profile Management

- [ ] Get profile returns correct data
- [ ] Update username works
- [ ] Update email works
- [ ] Update phone works
- [ ] Update profile image works
- [ ] Duplicate username returns error
- [ ] Duplicate email returns error
- [ ] Deleted account cannot access profile

### Account Deletion

- [ ] Delete requires password
- [ ] Incorrect password fails
- [ ] Institution admin cannot delete
- [ ] Successful deletion prevents login
- [ ] Deleted account marked correctly
- [ ] Submission history preserved
- [ ] Institution memberships preserved

---

## 📊 Database Schema Changes

### User Model Updates

```javascript
// Added fields
{
  isDeleted: { type: Boolean, default: false }, // Soft delete flag
  deletedAt: { type: Date, default: null }      // Deletion timestamp
}
```

---

## 🎯 Summary

**New Endpoints:**

- `GET /users/profile/me` - View profile
- `PUT /users/profile/me` - Update profile
- `DELETE /users/profile/me` - Delete account (soft)

**Features:**

- Profile viewing and editing
- Profile image upload
- Soft delete with password verification
- Admin protection from deletion
- Account restoration support

**Security:**

- Password required for deletion
- Deleted accounts cannot login
- Admin rights must be transferred first
- 30-day restoration window

---

**Great for mobile app user profile management! 🚀**
