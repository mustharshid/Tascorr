# Tascorr - Platform Documentation & Reference Manual

Tascorr is a premium, multi-tenant task delegation and workforce accountability platform designed for modern remote and co-located businesses. It enforces clear authority lines, manages workloads dynamically, and ensures uninterrupted operation via robust offline-first synchronization capabilities.

---

## 1. App Overview
Tascorr solves the operational chaos of task management by centering around **strict rank-based delegation and structural accountability**. Unlike generic, flat task-trackers where any user can assign tasks to anyone else, Tascorr models tasks after an organization's real hierarchy. 

It provides:
- **Tenant Isolation:** Multi-tenancy where each registered organization has its own private data sandbox, customizable rank systems, and department configurations.
- **Hierarchical Governance:** Strict validation rules where task assignments must respect employee authority ranks.
- **Offline Resilience:** Service worker caching and IndexedDB-backed optimistic mutations, allowing remote workforces to manage and synchronize updates seamlessly when offline.

---

## 2. Target Audience & Use Cases
- **Organizations with Structured Hierarchies:** Businesses that require distinct operational layers (executives, department heads, managers, staff) and need to maintain a strict chain of command.
- **Remote Workforces:** Teams that collaborate asynchronously across different locations, often with intermittent internet access.
- **Operations & Accountability Audits:** Companies needing immutable trails of task creation, reassignments, completions, and structural modifications (via append-only audit logs).

---

## 3. Core Features

### 3.1. Hierarchical Task Delegation
* **Concept:** Tasks cannot be assigned "upwards" or to peers without specific permissions. A user can only delegate tasks to those below them in the organizational hierarchy.
* **Rank validation rules:** Each user has a Rank. Ranks have integer-based levels (e.g., Level 0 = Admin, Level 1 = CEO, Level 4 = Employee). An assignment is only valid if `Assigner.RankLevel < Assignee.RankLevel` (meaning the assigner has a lower level number, indicating higher authority).
* **Workload-Aware Assignment:** Before a task is assigned, the platform inspects the active task load of the target employee to prevent burnout and ensure balanced distribution.
* **Reassignment History Trail:** When a task is reassigned, it doesn't just overwrite the assignee. The platform keeps a complete historical list of past assignees, including who initiated the reassignment, when it happened, and the written operational reason.

### 3.2. Structured Departments & Hierarchy Visualization
* **Dynamic Tree Chart:** Generates an interactive visual chart of the company hierarchy in real-time. It maps the CEO/Executive at the top, down to Department Heads, and further down to regular department staff.
* **Department Head Authority:** Department Heads (Level 2 or 4 depending on configuration) govern their department. They can assign tasks to anyone inside their department and must authorize requests if another department tries to assign a task to one of their team members.
* **Cross-Department Peer Assignments:** A toggleable tenant setting determines whether employees in the same rank can assign tasks to peers in different departments.

### 3.3. Blocker & Delay Management
* **Formal Blockers:** If a task cannot proceed (e.g., waiting for client feedback or a budget approval), the assignee can log a "Blocker". This shifts the task status to "Blocked" and freezes the SLA timer.
* **Resolution Auditing:** A blocker cannot just be checked off. It must be formally resolved by submitting a resolution comment documenting how the bottleneck was cleared.
* **Immutable Blocker Logs:** To prevent cover-ups, blockers can never be deleted. Even after resolution, the history of what blocked the task and how long it remained unresolved remains attached to the task record.

### 3.4. SLA & Performance Analytics
* **Access Control:** Tenant administrators can configure the minimum Rank Level required to view company performance reports.
* **Metrics Tracked:**
  - **Task Completion Rate:** The percentage of tasks completed on time vs. overdue.
  - **Average Resolution Time:** How long it takes to clear blockers on average.
  - **Pending Blockers:** The total volume of active, unresolved bottlenecks.

### 3.5. Offline Sync Engine (IndexedDB & Service Workers)
* **Offline Reading:** Static assets (HTML, CSS, JS, icons) are cached first. When the user opens the app offline, it renders instantly. Database queries (GET tasks, users, structures) are cached using a network-first strategy, falling back to cached local data if the server cannot be reached.
* **Offline Writing:** If a user creates a task, marks a subtask as complete, logs a blocker, or adds a comment while offline, the app places the request in an IndexedDB queue (`tascorr-offline`). The UI updates instantly with an optimistic state.
* **Background Replay:** Once the network returns, the app background-syncs the queue, executing the requests in sequential order. A floating badge in the header shows the number of pending unsynced changes.

---

## 4. User Flow
1. **Landing & Features:** User lands on the public landing page (`#landing`).
2. **Registration / Log In:**
   - New companies sign up (`#signup`) to build an isolated database tenant.
   - Existing staff log in (`#login`) with their enterprise credentials.
3. **Workspace Dashboard:** Upon login, users land on their dashboard (`#dashboard`) displaying personal stats, alerts, and workload summaries.
4. **Operations (Tasks):** Users navigate to the Tasks workspace (`#tasks`) to manage work. They filter tasks, tick off subtasks, comment on progress, log blockers, or delegate new tasks using the side drawer.
5. **Directory & Hierarchy:** Admin users navigate to **Employees** (`#employees`) and **Departments** (`#departments`) to register staff, define titles, and construct organization charts.
6. **Platform Auditing:** System superadmins navigate to `#superadmin` to oversee all company accounts and audit log history.

---

## 5. Screen-by-Screen Functional Guide

### 5.1. Landing Page (`#landing`)
* **Purpose:** Public-facing home page explaining product features, remote task delegation, and subscription plans.
* **Key Visuals:** Dark mode glassmorphism panels, floating interactive gradients, and grid highlights.
* **User Actions:**
  - **"Sign In" Button:** Located in the top header and hero section. Takes users to the login portal.
  - **"Register Company" / "Try Tascorr" Buttons:** Directs users to the self-registration signup screen.

### 5.2. Login Page (`#login`)
* **Purpose:** Allows registered tenant members and superadmins to log in.
* **UI Elements:**
  - **Email Address & Password fields:** Includes real-time validation (format checks and error alerts).
  - **"Register Company" link:** Navigates to the signup portal.
* **Behind the Scenes:** Generates a secure JSON Web Token (JWT) stored in HttpOnly cookies and LocalStorage for session persistence.

### 5.3. Signup Page (`#signup`)
* **Purpose:** Allows new organizations to establish a tenant workspace.
* **UI Elements:**
  - **Company/Organization Name field.**
  - **Administrator Email field.**
  - **Administrator Password field:** Evaluates strength criteria as you type:
    - Minimum 12 characters.
    - Mixed case (uppercase and lowercase).
    - At least one number.
    - At least one special symbol.
  - **Confirm Password field.**
* **Behind the Scenes:** Creates the tenant container, default rank hierarchy (levels 0 to 4), and registers the creator as the Company Administrator (Level 0).

### 5.4. Dashboard Workspace (`#dashboard`)
* **Purpose:** Central command display summarizing the user's workload.
* **UI Elements:**
  - **Metrics Cards:** Count of "My Active Tasks", "Delegated Tasks", and "Active Blockers".
  - **Alerts Feed:** Lists recent actions (e.g. reassignments or comments).
  - **Team Workload Widget:** Renders a list of department staff showing how many tasks are active on each member to identify bottlenecked employees.

### 5.5. Tasks Workspace (`#tasks`)
* **Purpose:** High-density workspace where all tasks are reviewed, updated, and completed.
* **UI Layout:**
  - **Left Sidebar Master List:**
    - **"My Tasks" tab:** Tasks assigned to the logged-in user.
    - **"Delegated" tab:** Tasks created by the logged-in user and assigned to others.
    - **"Show Completed" checkbox:** Filters visible tasks.
    - **"Filters" Button:** Toggles the search bar (find tasks by title or description) and status filter dropdown.
    - **"+ Create Task" Button:** Opens the task creation side drawer.
  - **Right Detail Pane (Visible on selecting a task):**
    - **Task Metadata:** Title, description, due date, creator, active assignee, and priority badge.
    - **Delete Task Button:** Visible only to the task creator. Deletes the task permanently.
    - **Status selector:** Move task between *Pending, In Progress, Blocked, Under Review, Completed*.
    - **Subtask Checklist:** Add new subtasks, check/uncheck items (crosses out completed subtasks).
    - **Blockers Section:** Displays logged blockers. Includes a form to report a new blocker or resolve an existing blocker.
    - **Reassign Section:** Dropdown to select a new eligible assignee (validated by rank level) and text input for the reassignment reason.
    - **Comments Log:** Timeline of comments. Includes text input to submit new progress notes.

### 5.6. Employees Directory (`#employees`)
* **Purpose:** Management portal for user accounts, credentials, and authority roles.
* **UI Elements:**
  - **"+ Add Employee" Button:** Toggles a registration form for creating a new user (First Name, Last Name, Email, Temp Password, Rank Role, and Department).
  - **Search & Filters:** Real-time search bar and Status dropdown (*Active* vs *Deactivated*).
  - **Directory Table:** Lists employee names, email addresses, rank levels, department scopes, status badges, and action buttons.
    - **"View Profile" link:** Directs to their individual profile details.
    - **"Edit" Button (Admin only):** Opens a modal to modify firstName, lastName, Rank level, Department assignment, active status, or reset their password.
    - **"Delete" Button (Admin only):** Deactivates the user account.
  - **"Add Corporate Rank Role" Form (Admin only):** Form to create new operational roles with custom names and authority levels (e.g. Level 3 = Team Lead).
  - **Ranks List:** Directory of active ranks. Includes inline edit titles and delete buttons.

### 5.7. Departments Tree (`#departments`)
* **Purpose:** Hierarchy visualization and department scoping.
* **UI Elements:**
  - **"Create Department" Button (Admin only):** Toggles a form to establish a new department node, naming it and selecting its head manager.
  - **Hierarchy Chart Container:** Generates the structured org tree. Boxes indicate Department Names, Department Heads, and list all assigned members with their roles.
    - **Edit & Delete icons (Admin only):** Appears on department cards to adjust names, re-appoint heads, or remove the department structure.

### 5.8. Settings Portal (`#settings`)
* **Purpose:** Configures user profiles and organization policies.
* **Tab Sections:**
  - **User Profile:** Fields to edit first and last names.
  - **Display Settings:** Interactive grid of themes. Clicking a theme changes the design instantly (Light, Dark, Corporate, Ocean, Forest, Sunset, Lavender, Midnight).
  - **Company & Policies (Admin only):**
    - **Logo Upload:** Uploads a company logo file (renders at the top left sidebar).
    - **Cross-department toggle:** Toggles cross-department peer assignment permission.
    - **SLA Access Level selector:** Minimum rank level required to view reports.
    - **SLA Approval Mode switch:** Toggles sequence approvals for cross-department tasks.
    - **Top Level Executive Title:** Rename the top root level title (e.g., CEO, Chairman, President) in the org tree.

### 5.9. Reports Workspace (`#reports`)
* **Purpose:** Analytical charts for managers to track workload compliance.
* **Key Visuals:** Real-time data indicators showing task completion trends, average times taken to resolve blockers, and graphs of pending blockers.

### 5.10. Superadmin Console (`#superadmin`)
* **Purpose:** Global console for platform operators.
* **UI Elements:**
  - **Onboard Organization form:** Onboard new companies, configure names, emails, passwords, and user cap tiers.
  - **Registered Organizations Table:** Lists all registered companies, their tier levels, registration dates, employee counts, and task volumes.
  - **Global Audit & Session Logs:** Lists platform events (onboarding, login, password changes) with:
    - **Search Filters:** Fields to filter by Actor Email, Action Type, Start Date, and End Date.
    - **Search Button:** Executes query logic.
    - **Clear Button:** Resets filters.
    - **Pagination Controls:** Previous/Next buttons and page count indicator.

---

## 6. Business Logic & Validation Rules
- **Authority Validation:** A task can only be assigned to a user holding a higher rank integer value (`Assigner.RankLevel < Assignee.RankLevel`).
- **Prohibited Task Deletes:** Tasks can only be deleted by their creators. There are no soft-deletes for tasks to prevent covering up overdue schedules.
- **Blocker State Lock:** When a blocker is logged, the task status is locked to "Blocked" and cannot be marked as "Completed" until the blocker is resolved.
- **Subscription Caps:** If a Tenant's active user count reaches their tier cap (e.g., Tier 1 has a cap of 10 users), the platform blocks the creation of new user profiles until the tier is upgraded.
