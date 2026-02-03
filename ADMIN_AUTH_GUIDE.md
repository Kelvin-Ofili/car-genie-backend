# Admin Authentication System

This system uses Firebase Custom Claims to implement role-based access control with admin privileges.

## How It Works

1. **Custom Claims**: Admin status is stored in Firebase user's custom claims
2. **Token Verification**: Middleware checks for `admin: true` in JWT token
3. **Protected Routes**: Admin-only endpoints reject non-admin requests with 403

## Setup Your First Admin

### Step 1: Create a user account
First, sign up in your app with the email you want to make admin.

### Step 2: Grant admin privileges
Run this command from the `car-genie-backend` directory:

```bash
npm run setup-admin your-email@example.com
```

### Step 3: Sign out and back in
The user must **sign out and sign back in** for the new admin role to take effect (it's in the JWT token).

## Admin API Endpoints

All admin endpoints require authentication header:
```
Authorization: Bearer <firebase-id-token>
```

### Grant Admin Role
```http
POST /api/admin/grant
Content-Type: application/json

{
  "uid": "firebase-user-id"
}
```

### Revoke Admin Role
```http
POST /api/admin/revoke
Content-Type: application/json

{
  "uid": "firebase-user-id"
}
```

### Check Admin Status
```http
GET /api/admin/check?uid=firebase-user-id
```

### Get Current User's Claims
```http
GET /api/admin/me/claims
```

### List All Admins
```http
GET /api/admin/list
```

## Protected Dealer Routes

These routes now require admin authentication:

- `GET /api/dealers/applications` - List dealer applications
- `POST /api/dealers/applications/:id/approve` - Approve application
- `POST /api/dealers/applications/:id/reject` - Reject application

### Example: Approve Dealer Application

```bash
curl -X POST http://localhost:4000/api/dealers/applications/abc123/approve \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json"
```

## Frontend Integration

### 1. Check if current user is admin

```typescript
import { auth } from './firebase';

async function checkAdminStatus() {
  const user = auth.currentUser;
  if (!user) return false;
  
  const token = await user.getIdTokenResult();
  return token.claims.admin === true;
}
```

### 2. Force token refresh (after granting admin)

```typescript
import { auth } from './firebase';

async function refreshToken() {
  const user = auth.currentUser;
  if (user) {
    await user.getIdToken(true); // true = force refresh
  }
}
```

### 3. Conditional rendering for admin UI

```tsx
import { useAuth } from './context/AuthContext';
import { useState, useEffect } from 'react';

function AdminPanel() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      if (user) {
        const token = await user.getIdTokenResult();
        setIsAdmin(token.claims.admin === true);
      }
    }
    checkAdmin();
  }, [user]);

  if (!isAdmin) {
    return <div>Access Denied - Admin Only</div>;
  }

  return <div>Admin Panel Content...</div>;
}
```

## Security Best Practices

1. **Always verify on backend** - Never trust frontend checks alone
2. **Use HTTPS in production** - Tokens should never be sent over HTTP
3. **Rotate admin privileges** - Regularly audit who has admin access
4. **Log admin actions** - Track all admin operations for audit trail
5. **Limit admin creation** - Only super-admins should grant admin role

## Middleware Files

- `src/middleware/adminAuth.ts` - Admin verification middleware
- `src/services/admin.service.ts` - Admin management functions
- `src/routes/admin.routes.ts` - Admin API endpoints
- `src/scripts/setup-admin.ts` - CLI tool for initial admin setup

## Testing Admin Routes

### Using curl:

```bash
# 1. Get your Firebase ID token from browser dev tools (Application > Local Storage)

# 2. Test admin endpoint
curl http://localhost:4000/api/admin/me/claims \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 3. Try accessing protected dealer routes
curl http://localhost:4000/api/dealers/applications \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman:

1. Add header: `Authorization: Bearer <your-firebase-token>`
2. The token expires after 1 hour - get a fresh one if needed

## Troubleshooting

### "Access denied. Admin privileges required"
- Make sure you ran the setup-admin script
- Sign out and sign back in to refresh your token
- Verify claims: `GET /api/admin/me/claims`

### "Invalid or expired token"
- Tokens expire after 1 hour
- Get a new token by calling `getIdToken()` on the frontend

### Can't find user by email
- User must create an account first through your app's signup
- Check the email spelling exactly matches

## Next Steps

After setting up admin authentication:

1. ✅ **Build Admin UI** - Create admin dashboard in car-genie frontend
2. ⬜ **Email Notifications** - Connect email service for dealer applications
3. ⬜ **Dealer Dashboard** - Build interface for approved dealers
4. ⬜ **Audit Logging** - Track admin actions in Firestore
