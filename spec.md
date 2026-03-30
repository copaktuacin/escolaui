# EscolaUI — Role-Based Access Control & Hierarchy

## Current State
- Auth context has only 3 roles: admin, teacher, staff
- AdminPage has user management but no role hierarchy or creation rules
- All users see the same sidebar and all pages
- No principal role exists; no concept of teacher appointment/revocation
- No admission officer role tied to student creation

## Requested Changes (Diff)

### Add
- New roles: `principal`, `account_officer`, `admission_officer`, `clerk` (in addition to existing `admin`, `teacher`)
- Role hierarchy with creation rules:
  - Admin can create: principal, account_officer, admission_officer, clerk, accountant (NOT teacher directly, NOT student)
  - Principal can create: teacher (via appointment), account_officer, admission_officer, clerk (NOT admin)
  - Admission officer can add students
  - Teachers get access auto-granted on appointment by principal; auto-revoked when relieved/resigned
- New `/principal` page with:
  - Appoint Teacher tab: form to add a teacher (auto-assigns teacher role + access)
  - Relieve/Resign Teacher tab: mark a teacher as resigned or relieved (auto-revokes teacher access, marks status)
  - Manage Staff tab: add account_officer, admission_officer, clerk (cannot add admin)
- Demo credentials for each role (principal, teacher, admission_officer, account_officer)
- Role-based sidebar filtering: each role only sees relevant nav items
- Role-based access guards on protected pages
- School Profile tab remains Admin-only in AdminPage
- Users table in AdminPage now filtered to show only roles Admin can manage

### Modify
- `AuthContext.tsx`: expand User type roles to include all 6 roles; add mock multi-user login support with demo credentials per role
- `AdminPage.tsx`: 
  - "Add User" dialog only shows roles Admin can create (principal, account_officer, admission_officer, clerk, accountant)
  - Add a "Principal" section showing who the principal is and allowing creation of principal
  - Role Access Matrix updated to reflect all new roles and modules
- `Layout.tsx`: filter sidebar nav groups based on logged-in user's role
- `App.tsx`: add `/principal` route, add route-level role guards
- `ProtectedRoute.tsx`: extend to support role-based access with a redirect if unauthorized

### Remove
- Nothing removed — existing pages/routes preserved

## Implementation Plan
1. Update `AuthContext.tsx`:
   - Add all roles to the union type
   - Add multi-user demo credentials: admin@escola.com/password123, principal@escola.com/password123, teacher@escola.com/password123, admissions@escola.com/password123, accounts@escola.com/password123
   - Each demo user has appropriate role
2. Create `src/frontend/src/lib/rolePermissions.ts`:
   - Define which nav items each role can access
   - Define which roles each role can create
   - Define which pages each role can visit
3. Update `Layout.tsx` to filter navGroups by user role
4. Update `ProtectedRoute.tsx` to accept optional `allowedRoles` prop
5. Update `AdminPage.tsx`:
   - Filter role options in Add User dialog to only roles Admin can create
   - Update Role Access Matrix for all 6 roles
   - Add school profile tab guard (admin only)
6. Create `PrincipalPage.tsx`:
   - Tab 1: Appoint Teacher (name, email, subject, class) — on submit, creates user with role=teacher and status=active
   - Tab 2: Teacher Relief/Resignation (list of active teachers, mark as resigned or relieved — auto changes status to inactive and shows access revoked badge)
   - Tab 3: Manage Staff (add account_officer, admission_officer, clerk — not admin)
7. Update `App.tsx`: add `/principal` route with role guard for principal
8. Update sidebar in Layout to show Principal link for principal role
