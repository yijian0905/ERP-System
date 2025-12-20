# ERP System Authorization Flow Documentation

This document describes the enterprise authorization mechanism for the ERP system, utilizing an "Organization Account Authorization" model that binds licenses at the enterprise level rather than individual machines, improving user experience and management convenience.

---

## Core Concepts

### Design Principles

- Authorization is based on "Organization" rather than "Machine" or "License Key"
- Separation of "Billing Owner" and "System Administrator" roles
- Client-side requires no license key input; users only need to log in

### Role Definitions

| Role | Identifier | Responsibilities |
|------|------------|------------------|
| Billing Owner | billing_owner | Manage subscriptions, payment methods, invoices, plan upgrades/downgrades, assign/change Admin |
| System Administrator | admin | Manage employee accounts, system settings, full ERP operational access |
| Regular User | user | Use ERP features based on assigned permissions |

---

## Subscription Phase Flow

### Step 1: Fill in Subscription Information

Users fill in the following fields on the subscription page:

| Field | Required | Description |
|-------|----------|-------------|
| Billing Email | Yes | Used to create Billing Owner account |
| Admin Email | Yes | Used to create Admin account |
| Both are the same | No | When checked, Admin Email auto-fills with Billing Email |

### Step 2: Automatic Processing After Payment

```
Payment Successful
    │
    ├─→ Create Organization record
    │
    ├─→ Bind subscription information to the Organization
    │
    ├─→ Create Billing Owner account using "Billing Email"
    │       └─→ Send password setup email
    │
    └─→ Create Admin account using "Admin Email"
            └─→ Send password setup email
```

### Step 3: Account Activation

- Billing Owner receives email → Sets password → Can log in to Billing Portal
- Admin receives email → Sets password → Can log in to ERP System

### Special Case: Both Emails are the Same

When user checks "Both are the same":

- System creates only one account
- This account has both Billing Owner and Admin privileges
- Can access both Billing Portal and ERP System

---

## Billing Portal Scope

After logging into the Billing Portal, Billing Owner can perform:

| Function | Description |
|----------|-------------|
| Manage Payment Methods | Add, update, or remove credit cards or other payment methods |
| View and Download Invoices | Browse billing history, download PDF invoices |
| Manage Subscription Plans | Upgrade, downgrade, or cancel subscription |
| Assign or Change Admin | Change the ERP System Administrator |

---

## ERP System Usage Flow

### Admin First-Time Use

```
Install ERP Software
    │
    └─→ Display login page (no license key input page)
            │
            └─→ Enter Admin email and password
                    │
                    └─→ Backend validates Organization subscription status
                            │
                            ├─→ Valid → Enter system
                            │
                            └─→ Invalid/Expired → Display renewal prompt
```

### Admin Creates Employee Accounts

```
Admin logs into ERP
    │
    └─→ Navigate to Employee Management
            │
            └─→ Add employee account (enter employee email)
                    │
                    └─→ System checks license seat limit
                            │
                            ├─→ Under limit → Creation successful, send invitation email
                            │
                            └─→ Limit reached → Prompt to upgrade plan or remove other accounts
```

### Employee Usage Flow

```
Receive invitation email
    │
    └─→ Click link to set password
            │
            └─→ Install ERP Software
                    │
                    └─→ Enter email and password on login page
                            │
                            └─→ Enter system and start using
```

---

## Login Validation Logic

Backend performs the following validation on each user login:

```
Receive login request
    │
    └─→ Validate credentials
            │
            ├─→ Failed → Return error message
            │
            └─→ Success → Query user's Organization
                        │
                        └─→ Check Organization subscription status
                                │
                                ├─→ Active → Allow login
                                │
                                ├─→ Expired → Return subscription expired prompt
                                │
                                └─→ Cancelled → Return subscription cancelled prompt
```

---

## Subscription Status Definitions

| Status | Description | Can User Log In |
|--------|-------------|-----------------|
| Active | Subscription is valid | Yes |
| Past Due | Payment failed, within grace period | Yes (recommend showing warning) |
| Expired | Subscription has expired | No |
| Cancelled | Subscription has been cancelled | No |

---

## Edge Case Handling

### Case 1: Admin Leaves and Needs Replacement

- Billing Owner logs into Billing Portal
- Uses "Change Admin" function to assign new person
- New Admin receives invitation email and sets password
- Original Admin account can be downgraded to User or deleted

### Case 2: Billing Owner Needs to Change

- Must contact customer support for identity verification before change
- Or current Billing Owner adds successor in Billing Portal then removes themselves

### Case 3: Renewal After Subscription Expires

- Billing Owner logs into Billing Portal to complete renewal
- Subscription status returns to Active
- All user accounts automatically regain login access

### Case 4: Organization Needs Multiple Admins

- Depends on product design whether this is supported
- If supported, Admin can promote other Users to Admin within ERP
- Should set Admin count limit or leave unlimited

---

## Key Design Points

1. **No License Key Input on Client**: All authorization validation happens on backend; users only need to log in
2. **Separation of Duties**: Billing and system administration can be handled by different people
3. **Flexible Consolidation**: Small businesses can have one person serve both roles
4. **Real-Time Authorization Validation**: Each login checks subscription status to ensure valid authorization
5. **Seat Control**: Limit the number of employee accounts based on subscription plan