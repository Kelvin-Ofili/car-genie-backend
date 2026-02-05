# Dealer Approval Flow Implementation

## ✅ Completed Features

### 1. **Create Firebase User with Custom Claims**
- New service: `dealer.service.ts`
- Functions:
  - `setDealerRole(uid)` - Sets dealer custom claims
  - `generateTemporaryPassword()` - Creates secure random password
  - `createDealerUser(email, displayName)` - Creates Firebase auth user with dealer role
  - Handles existing users by updating their role and sending password reset link

### 2. **Move to Dealers Collection**
- `moveToDealersCollection()` function
- Creates dealer document with:
  - Application ID reference
  - Dealership information
  - Database connection details (encrypted)
  - Status: "active"
  - Timestamps

### 3. **Email Notifications**
- **Application Confirmation** (`sendDealerApplicationConfirmation`)
  - Sent immediately when dealer applies
  - Confirms receipt and sets expectations (2-3 business days)

- **Approval Email** (`sendDealerApprovalEmail`)
  - Sent when admin approves application
  - Includes login credentials (email + temp password OR password reset link)
  - Links to login page
  - Instructions for first-time setup

- **Rejection Email** (`sendDealerRejectionEmail`)
  - Sent when admin rejects application
  - Includes optional rejection reason
  - Guidance on reapplying

### 4. **Updated Approval Flow**
Updated `approveDealerApplication()` controller:
1. Fetch application from Firestore
2. Create Firebase user with dealer role
3. Move application data to `dealers` collection
4. Update application status to "approved"
5. Send approval email with credentials
6. Return success with user ID

### 5. **Updated Rejection Flow**
Updated `rejectDealerApplication()` controller:
1. Update application status to "rejected"
2. Send rejection email with reason
3. Return success

### 6. **Updated Onboarding Flow**
Updated `onboardDealer()` controller:
- Sends confirmation email immediately after application submission
- Non-blocking (won't fail request if email fails)

## 🔧 Configuration

Added to `env.ts`:
```typescript
FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173"
```

## 📁 Files Modified

1. **Backend Services:**
   - ✅ `src/services/dealer.service.ts` (NEW)
   - ✅ `src/services/email.service.ts` (UPDATED)
   - ✅ `src/config/env.ts` (UPDATED)

2. **Backend Controllers:**
   - ✅ `src/controllers/dealer.controller.ts` (UPDATED)

## 🧪 Testing Checklist

### Test Application Submission:
1. Navigate to carrie-marketing onboarding page
2. Complete all 3 phases of dealer application
3. Submit application
4. Verify confirmation email received
5. Check Firestore: Application in `dealerApplications` with status "pending"

### Test Approval Flow:
1. Log in as admin to car-genie
2. Navigate to `/admin` (Dealer Applications)
3. Click "Approve" on a pending application
4. Verify:
   - ✅ Firebase user created (check Firebase Auth)
   - ✅ User has `dealer: true` custom claim
   - ✅ Application moved to `dealers` collection
   - ✅ Application status updated to "approved"
   - ✅ Approval email sent with login credentials
5. Test dealer login:
   - Go to `/login`
   - Use dealer email + temp password
   - Should successfully authenticate
   - Should see dealer dashboard link in user menu

### Test Rejection Flow:
1. Log in as admin
2. Navigate to `/admin`
3. Click "Reject" on a pending application
4. Enter rejection reason
5. Verify:
   - ✅ Application status updated to "rejected"
   - ✅ Rejection email sent with reason

### Test Existing User Edge Case:
1. Create a Firebase user manually (with just user role)
2. Have them apply as dealer
3. Approve their application
4. Verify:
   - ✅ Doesn't create duplicate user
   - ✅ Updates existing user's custom claims to dealer
   - ✅ Sends password reset link instead of temp password

## 🚨 Error Handling

All operations have try-catch blocks:
- User creation failures return 500 with clear error
- Moving to dealers collection failures return 500
- Email failures are logged but don't block the flow
- Existing users are handled gracefully

## 📧 Email Fallback

If `RESEND_API_KEY` is not set:
- Emails are logged to console
- Application continues normally
- Useful for development/testing

## 🔐 Security Features

- Temporary passwords are 16 characters, base64-encoded
- Database passwords remain encrypted in dealers collection
- Custom claims prevent unauthorized access
- Password reset links expire in 1 hour
- Dealers must change password after first login (recommended in email)

## 🎯 Next Steps

After testing this implementation:
1. ✅ Test full dealer onboarding → approval → login flow
2. Clean up debug console.logs (already identified in #3)
3. Consider adding admin notification email when new applications arrive
4. Add dealer dashboard features (leads management, analytics)
