  
**TASCORR**

*Assign it. Track it. Own it.*

**PROJECT CONSTITUTION**

**Version 5.0**

Status: Authoritative

*Supersedes v4.0*

**What's New in v5.0**

| ✦  Database migrated from XML flat-file to MySQL (Plesk-hosted SQL server) |
| :---- |
| ✦  Plesk Deployment Package — installation script and deployment guide added (Section 9\) |
| ✦  Technical Philosophy updated — XML storage replaced with MySQL throughout (Section 8\) |
| ✦  Glossary updated — XML Flat DB File entry replaced with MySQL Database |

# **Table of Contents**

# **Section 1 — Product Overview**

| Product Name | Tascorr |
| :---- | :---- |
| **Slogan** | Assign it. Track it. Own it. |
| **Product Type** | Multi-tenant B2B SaaS — Mobile-first web application.
| **Version** | 5.0 |
| **Status** | Authoritative. All future agents, developers, and contributors must treat this document as the primary source of truth for every product, design, and engineering decision. |
| **Design Reference** | All frontend implementation, visual design, component specifications, and UI/UX decisions are governed by design.md. That file must be consulted before any interface is built. |

Tascorr is a structured task delegation and workforce accountability platform that gives organizations complete visibility and control over how work is assigned, tracked, and completed across their hierarchy.

**Mission Statement**

Most organizations lose productivity not because people don't work hard, but because accountability is unclear, delegation is chaotic, and cross-department collaboration is ungoverned. Tascorr exists to make work visible, accountable, and traceable — from the moment a task is created to the moment it is closed — without adding bureaucratic overhead for the people doing the work.

**Core Problem**

In organizations of all sizes, task assignment happens across emails, messaging apps, and verbal instructions — creating no trail, no accountability, and no visibility for leadership. Managers don't know what's stuck. Employees can't prove they were blocked. Executives have no reliable picture of organizational productivity. Existing tools are either too complex for daily employees or too shallow for enterprise governance needs.

**Why Now**

Remote and hybrid work has permanently distributed accountability across teams and departments. Organizations need a structured layer on top of their existing communication tools — one that captures delegation, tracks progress, and surfaces blockers without requiring constant manual follow-up from managers.

**Product Vision (3–5 years)**

Tascorr becomes the operational backbone for mid-to-large organizations — the single source of truth for how work moves through a company. It surfaces productivity patterns, prevents organizational bottlenecks, automates recurring business processes, and gives leadership the real-time visibility to manage at scale. Any organization, regardless of industry or internal structure, can mirror its real-world hierarchy inside the platform on day one.

**Success Definition**

* A company can onboard and configure its full organizational structure without contacting support

* Employees use the platform daily without training because the interface is self-evident

* Managers have real-time visibility into their team's task status at all times

* No task is ever 'lost' — every assignment has a traceable owner, status, and history

* Cross-department collaboration happens through the platform, not around it

# **Section 2 — Product Philosophy**

## **Principle 1: Simplicity for the Many, Power for the Few**

The daily experience for a standard employee must be radically simple — their view shows only what they need to act on. Complexity (reporting, authorization management, org configuration) is progressively revealed only to those whose roles require it. A cluttered dashboard for employees filled with org-wide metrics they don't need is explicitly prohibited. Admin-level controls must never bleed into the standard employee interface.

## **Principle 2: Accountability Without Blame**

The platform exists to create clarity, not to catch people failing. Every feature — from task assignment to blocker flagging — should be designed to fairly document what happened and why, protecting both the employee and the manager. A system that silently marks tasks overdue without surfacing whether the employee was blocked by an unresponsive manager is prohibited. The platform must never be weaponizable against an employee who did everything right.

## **Principle 3: Hierarchy-Driven, Not Title-Driven**

The platform's logic is governed entirely by rank level (numerical authority), not by job title strings. A company can name their roles anything they want — the system's behavior is determined by position in the hierarchy, not the label. Hardcoded logic referencing 'Manager' or 'CEO' by name is prohibited. No feature may depend on a specific title existing.

## **Principle 4: Configuration Over Development**

Administrators must be able to fully configure the organizational structure — ranks, departments, reporting relationships, delegation rules — without requiring code changes, deployments, or vendor intervention. Any feature that requires a developer to modify the codebase to accommodate a new client's org structure is prohibited. If setting up a new company requires a code change, the design has failed.

## **Principle 5: Complete and Immutable Audit Trail**

Every consequential action in the system — task creation, assignment, reassignment, status change, comment, authorization grant — must be permanently recorded and never editable or deletable by any user, including administrators and the Global Superadmin. Soft-delete patterns that erase history and override features that can silently alter past records are prohibited.

## **Principle 6: Transparency Up the Chain, Privacy Across Peers**

Visibility flows upward through the hierarchy. A manager sees their team's tasks. A department head sees their department. An executive sees the organization. Peers at the same level cannot see each other's tasks unless explicitly authorized. Flat visibility models where all employees can browse each other's assignments are prohibited. Lateral visibility is not a feature — it is a trust violation.

## **Principle 7: Blockers Are First-Class Events**

When an employee cannot complete a task due to missing information, files, or approvals — that blocker must be formally raised, recorded, and acted upon through the platform. A blocker is not just a comment; it is a state change that shifts accountability. A comments-only model where blockers are indistinguishable from casual updates is prohibited. Blocker states must be visually and functionally distinct.

## **Principle 8: Mobile-First Responsive Design**

Every screen and interaction must be fully functional on a mobile browser. Layout, touch targets, and information density must be designed for small screens first, then enhanced for desktop. All specifics are governed by design.md. Desktop-only workflows that require a full keyboard or wide viewport to complete are prohibited.

## **Principle 9: Platform Integrity Through Superadmin Governance**

A Global Superadmin layer exists above all company workspaces, operated exclusively by the Tascorr team. This layer enables organizational onboarding, support interventions, and platform-level health — but is subject to the same audit standards as every other actor in the system. Any pathway for the Tascorr team to read, modify, or delete company data without that access being permanently logged is prohibited. Superadmin access is a support tool, not a bypass.

# **Section 3 — Target Users**

## **3.1 Standard Employee**

| Description | An individual contributor within a company. May work in any department. Has no direct reports. |
| :---- | :---- |
| **Primary Goals** | Know exactly what tasks are assigned to them, submit progress updates, flag blockers, and close completed tasks. |
| **Pain Points** | Unclear task requirements, missed deadlines due to waiting on others, no way to formally document being blocked, fear of being blamed for failures outside their control. |
| **Success State** | Opens the app, sees their task list clearly, updates statuses in seconds, raises a blocker with one tap when stuck. |
| **Permissions** | View own assigned tasks, view own created tasks, comment on tasks, flag blockers, view own profile and completion history. |
| **Usage Frequency** | Daily. |

## **3.2 Manager / Line Manager**

| Description | A user with direct reports. Responsible for assigning tasks, monitoring team output, and responding to blockers. |
| :---- | :---- |
| **Primary Goals** | Assign and track tasks across their team, respond to blockers promptly, review team performance over time. |
| **Pain Points** | No single view of what their team is working on, no notification when someone is stuck, inability to prove tasks were assigned clearly. |
| **Success State** | Opens the app, sees live status of all team tasks, receives an in-app notification when a blocker is raised, resolves it and unblocks the employee. |
| **Permissions** | All employee permissions \+ assign tasks to direct reports, view direct reports' task lists, respond to blockers, view team reporting. |
| **Usage Frequency** | Daily. |

## **3.3 Department Head**

| Description | A senior leader responsible for an entire department. May or may not have direct task assignment responsibilities. |
| :---- | :---- |
| **Primary Goals** | Maintain department productivity, approve or deny cross-department authorization requests, monitor department-level metrics. |
| **Pain Points** | Lack of visibility into cross-department dependencies, surprise bottlenecks, inability to see how their department interacts with others. |
| **Success State** | Has a live view of the department, sees incoming/outgoing cross-department requests, can approve or deny authorizations in seconds. |
| **Permissions** | All manager permissions (scoped to department) \+ department-wide task assignment authority \+ cross-department authorization management \+ department-level reporting \+ audit log access (department scope). |
| **Usage Frequency** | Daily to several times per week. |

## **3.4 Executive**

| Description | A C-suite or senior leadership user with organization-wide visibility. Does not typically assign individual tasks. |
| :---- | :---- |
| **Primary Goals** | Understand organizational health, identify bottlenecks, track company-wide productivity trends, monitor approval chains. |
| **Pain Points** | Receiving filtered or manually compiled reports; no real-time picture of how work moves across the company. |
| **Success State** | Opens the executive dashboard and immediately understands where the organization is healthy and where it is stuck. |
| **Permissions** | Read-only view across all departments and tasks \+ executive dashboard \+ delegation analytics \+ full company audit log access. |
| **Usage Frequency** | Several times per week. |

## **3.5 Company Administrator**

| Description | The technical owner of the company's Tascorr workspace. Created when the company is authorized and onboarded by the Global Superadmin. |
| :---- | :---- |
| **Primary Goals** | Configure the organizational structure, create and manage user accounts, define rank hierarchies, configure permissions and delegation rules. |
| **Pain Points** | Most SaaS platforms require vendor support to configure org structure. New employee onboarding is slow and manual. |
| **Success State** | Sets up the entire company structure independently after initial authorization, creates employee accounts, adjusts hierarchy without support tickets. |
| **Permissions** | Full access to the corporate workspace — all configuration, all user management, all reports, full audit log access. |
| **Usage Frequency** | Heavy during onboarding; periodic thereafter. |

## **3.6 Global Superadmin**

| Description | A Tascorr-operated role that exists above all company workspaces. There is no self-service path to this role — it is assigned exclusively to members of the Tascorr team. |
| :---- | :---- |
| **Primary Goals** | Onboard new organizations, authorize and manage company administrator accounts, perform support interventions on individual workspaces when requested by the company, maintain platform health. |
| **Permissions** | Add/remove organizations; authorize/revoke company administrator accounts; access any company workspace for support (logged); edit organization-level configuration on company request; view platform-wide audit logs. Cannot modify audit records under any circumstance. |
| **Usage Frequency** | As needed for onboarding and support. |

## **3.7 Primary vs. Secondary Users**

Primary (drives adoption): Company Administrator — makes the purchase decision and configures the platform.

Secondary (benefits from it): All employees — their daily work experience determines retention.

## **3.8 Anti-Users**

* Individual freelancers or solo workers (no hierarchy to manage)

* Teams that only need a simple to-do list with no delegation or reporting

* Organizations unwilling to define any formal hierarchy

# **Section 4 — Core Features**

## **Capability Area A: Task Management**

All users should be able to add own tasks they are engaged in into their task list for better tracking. This will enable their line managers to checked self-assigned tasked their line staff are working on. This will motivate staff members to pro-actively take tasks and own their work. It will also help them to get recognition for their work. It will also make it easier for them to demonstrate their contributions during performance reviews.

### **A1. Task Creation & Assignment**

Purpose: Allow authorized users to create tasks and assign them to one or more employees.

Key Behaviors:

* A task contains: title, description, assignee(s), due date, priority level (see A — Priority Framework), status, and optional file attachments

* Tasks can be assigned to a direct report (standard) or to an employee in another department (requires cross-department authorization)

* Task status begins at Pending upon creation

* The creator and assignee both receive an in-app notification at assignment

* When assigning a task, the system displays workload indicators for the assignee (see Workload Awareness, Section 4\)

Edge Cases & Constraints:

* A task cannot be assigned to a user with no active account

* A task must have at least one assignee before it can be saved

* Tasks assigned to deactivated users must be flagged for reassignment

### **A2. Task Status & Progress Tracking**

Purpose: Give all stakeholders a live, accurate view of where every task stands.

Key Behaviors:

* Employees update task status manually

* Status changes are timestamped and written to the audit trail

* Overdue tasks are automatically flagged when the due date passes without Completed status

* Tasks in Blocked state display a blocker badge visible to the assignee's manager

* Status progression: Pending → In Progress → Blocked → Under Review → Completed

Edge Cases & Constraints:

* A task in Blocked state with an unresolved manager response must not be marked overdue against the employee

* Completed tasks remain permanently visible in history and cannot be deleted

* Status may skip non-mandatory intermediate states but Completed is terminal — it cannot be reversed

### **A3. Blocker & Accountability System**

Purpose: Provide a formal, structured mechanism for employees to flag that they cannot proceed due to a dependency — and protect them from accountability when blocked through no fault of their own.

Key Behaviors:

* An employee marks a task as Blocked and submits a blocker report describing what is needed

* Upon blocker submission, the task deadline enters Pending state — it does not count against the employee until the manager responds

* The assigning manager receives an immediate in-app notification

* The manager can: (a) provide the requested information via a reply, (b) extend the deadline, or (c) reassign the task

* Once the manager responds, the deadline clock resumes or a new deadline is set

* If the manager does not respond before the original deadline, the missed deadline is attributed to the unresolved blocker — not the employee

* If a blocker remains unresolved past a configurable grace period, an escalation notification is sent to the department head \[ASSUMPTION\]

### **A4. Task Comments & Communication**

Purpose: Keep all task-related communication inside the platform, attached to the task record.

Key Behaviors:

* Any user with visibility to a task can comment on it

* Comments are timestamped, attributed to the author, and permanent

* Comments are visually and functionally distinct from blocker reports

* File attachments are supported within comments

* Mentioning another user in a comment triggers an in-app notification to that user \[ASSUMPTION\]

* Comments cannot be edited or deleted after submission (audit integrity)

### **A5. Task Templates**

Purpose: Allow organizations to define reusable task structures for common, repeating business processes.

Key Behaviors:

* Administrators and authorized managers can create, edit, and publish templates

* A template defines: task titles, descriptions, assignee roles (not specific people), due date offsets, and sequence

* When triggered, tasks are created and auto-assigned based on the template's role mapping

* Templates can be used as one-off process launchers or linked to recurring triggers

### **A6. Recurring Tasks**

Purpose: Allow tasks to be scheduled to repeat automatically on a defined cadence.

Key Behaviors:

* Recurrence options: Daily, Weekly, Monthly, Quarterly, Annually

* A recurring task generates a new independent instance at the defined interval

* Completing one instance does not affect others

* The recurrence schedule is visible on the task and in the assignee's task list

### **A7. Operational Process Packages**

Purpose: Bundle multiple related tasks — potentially across departments — into a single launchable process.

Key Behaviors:

* A process package is a named collection of task templates with defined department/role assignments

* Launching a package creates all constituent tasks at once

* Each task in the package is independent but linked to the parent process for reporting

* Overall package progress is tracked as a percentage of constituent tasks completed

| ▶ A8. Task Reassignment Workflow — NEW in v4 Allow authorized users to transfer ownership of a task while preserving full accountability history. |
| :---- |

### **A8. Task Reassignment  ● NEW**

Purpose: Allow authorized users to transfer ownership of a task while preserving full accountability history.

Key Behaviors:

* Tasks may be reassigned by authorized users (see Section 5 — Access & Permissions)

* Previous assignees remain permanently attached to task history

* Reassignment generates an audit log entry

* Both the previous and new assignee receive notifications upon reassignment

* Task ID remains unchanged across reassignments

* A reassignment reason is required before the action can be completed

* Full reassignment history is visible within the task record

Example History Format:

| Task \#123 — Assignment History |
| :---- |
| • Created By: Department Head |
| • Assignment History: Ahmed → Sara → John |
| • Current Owner: John |

| ▶ A9. Subtasks — NEW in v4 Allow large tasks to be broken into smaller accountable units. |
| :---- |

### **A9. Subtasks  ● NEW**

Purpose: Allow large tasks to be broken into smaller accountable units, reducing unnecessary top-level task sprawl.

Key Behaviors:

* Tasks may contain one or more subtasks

* Each subtask may have its own assignee

* Subtasks have independent statuses

* Parent task progress is automatically calculated based on subtask completion

* A parent task may not be completed until all required subtasks are completed

* Subtasks inherit visibility from the parent task

Example Subtask Structure:

| Prepare Annual Report |
| :---- |
| • ✓ Gather Financial Data |
| • ✓ Compliance Review |
| • □ Executive Summary |
| • □ Final Approval |

| ▶ A10. Task Dependencies — NEW in v4 Allow tasks to depend on completion of other tasks before work can begin. |
| :---- |

### **A10. Task Dependencies  ● NEW**

Purpose: Allow tasks to depend on completion of other tasks before work can begin, preventing premature work initiation.

Key Behaviors:

* Tasks may reference one or more prerequisite tasks

* Dependent tasks display their dependency status visibly

* Dependent tasks cannot move to In Progress until all prerequisites are completed

* Dependency chains are visible within the task record

* Completion of a prerequisite triggers a notification to the dependent task's assignee

Example:

| Dependency Chain |
| :---- |
| • Task A: Approve Budget |
| • Task B: Purchase Equipment — depends on Task A |
| • Task B cannot move to In Progress until Task A is Completed |

| ▶ A11. Task Archive — NEW in v4 Keep active workspaces clean while preserving historical data. |
| :---- |

### **A11. Task Archive  ● NEW**

Purpose: Keep active workspaces clean while preserving historical data indefinitely.

Key Behaviors:

* Completed tasks move to Archive after a configurable period

* Archived tasks remain fully searchable

* Archived tasks remain reportable and exportable

* Archived tasks cannot be modified

Task Views Available:

* Active Tasks

* Completed Tasks

* Archived Tasks

| ▶ A12. Review & Approval Workflow — NEW in v4 Formalize the Under Review status with a structured review process. |
| :---- |

### **A12. Review & Approval Workflow  ● NEW**

Purpose: Formalize what happens when a task enters Under Review, ensuring reviewers have clear actions and outcomes are logged.

Key Behaviors — when a task enters Under Review:

* The designated reviewer receives an in-app notification

* Reviewer may Approve the task → status transitions to Completed

* Reviewer may Request Changes → status returns to In Progress

* Reviewer may Reject the task → status returns to In Progress

Audit Requirements:

* Review outcome (Approved / Changes Requested / Rejected) must be logged

* Reviewer comments must be logged alongside the outcome

**Priority Framework — Formalized in v4**

Priority levels are now standardized across the entire task model:

| Priority Levels & Rules |
| :---- |
| • Critical — Immediate attention required. May trigger enhanced notifications, executive visibility, and escalation rules. |
| • High — Important business impact. |
| • Medium — Standard work. |
| • Low — Non-urgent activity. |

Rules: Priority is set at task creation and may be updated by authorized users. Priority must never be null — all tasks must have a priority level assigned before saving.

**Workload Awareness — Integrated into Task Assignment in v4**

When any authorized user assigns a task, the system displays the following workload indicators for the proposed assignee before the assignment is confirmed:

| Workload Indicators Displayed at Assignment |
| :---- |
| • Active Task Count |
| • Overdue Task Count |
| • Blocked Task Count |
| • Recent Workload Trend |
| • Warning displayed when employee workload exceeds configurable threshold |

Note: Workload indicators are advisory. They do not block assignment — they inform the assigning user's decision.

## **Capability Area B: Cross-Department Authorization**

### **B1. Cross-Department Request & Authorization**

Purpose: Enable controlled collaboration between departments without bypassing departmental authority.

Key Behaviors:

* When a user attempts to assign a task outside their department, a cross-department authorization request is generated

* The request routes to the requesting user's department head for approval

* Upon approval, a temporary authorization is granted, scoped by: specific employee, specific department, specific task, or defined time period (single-use, 7-day, 30-day, or project-based)

* The authorizing department head retains visibility of all tasks assigned under that authorization

* Expired authorizations are automatically revoked; no manual action is required

### **B2. Enterprise Approval Mode**

Purpose: Provide an optional, stricter multi-level approval chain for organizations requiring formal governance of cross-department work.

Key Behaviors:

* When enabled by the administrator, cross-department tasks follow a configurable sequential approval chain determined by the organization's rank hierarchy

* Each approver is notified in-app and must act before the next is notified

* If an approver in the chain is inactive, the request must not silently stall — an escalation path must exist

* This mode is optional and disabled by default

* Enabling or disabling Enterprise Approval Mode is logged in the audit trail

## **Capability Area C: User & Organization Management**

### **C1. Multi-Tenant Company Workspace**

A company workspace is created by the admin of a new organization. All company data is scoped exclusively to that workspace. No cross-tenant data access is possible under any circumstances, including by other company administrators.

### **C2. Authentication & Account Provisioning**

New organizations are onboarded through self-registration after choosing a package. After subscription/purchase is completed, the company is automatically granted the paid package. The user who created the company is assigned as the company administrator. Employee accounts are created exclusively by the company administrator. Login method: email \+ password.

### **C3. Configurable Rank Hierarchy**

Administrators define ranks with: a custom title, a numerical level (lower integer \= higher authority), and a permissions profile. The system uses rank level integers — never title strings — for all authority, visibility, and routing logic.

### **C4. Department Management**

Administrators create departments with a name and a designated department head. Users are assigned to one primary department. Departments can be created, renamed, merged, or deactivated.

### **C5. User Profile**

Each user has a profile page showing: name, rank, department, and task statistics. Task history is filterable by: this week, this month, this year. Profiles are visible to the user and to all users above them in the hierarchy.

### **C6. Global Superadmin Console**

The Global Superadmin console is a distinct interface not accessible to any company-level user. All actions taken by the Global Superadmin are written to an immutable platform-level audit log. The Global Superadmin may not modify, delete, or suppress any audit record in any workspace.

| ▶ C7. Temporary Delegation / Acting Roles — NEW in v4 Allow authority and responsibilities to be temporarily delegated to another user when managers or department heads are unavailable. |
| :---- |

### **C7. Temporary Delegation  ● NEW**

Purpose: Allow authority and responsibilities to be temporarily delegated to another user, ensuring critical workflows do not stop because a manager or department head is unavailable.

Key Behaviors:

* Users with managerial authority may delegate specific permissions to another user

* A delegation must specify: delegate user, start date, end date, and scope of delegated authority

* Delegation automatically expires on the defined end date — no manual revocation is required

* All delegated actions are recorded in the audit log

* The system records both the Acting User and the Original Authority Holder for every action taken under delegation

Example:

| Temporary Delegation Record |
| :---- |
| • Department Head: Ahmed |
| • Temporary Delegate: Sara |
| • Valid: 01 July – 15 July |
| • Scope: Department Head authority over Finance department |

## **Capability Area D: Reporting & Analytics**

### **D1. Enhanced Reporting**

Purpose: Give managers, department heads, and executives accurate, timely data on organizational performance.

Reports cover: employee productivity, department productivity, task completion trends, overdue task analysis, cross-department collaboration metrics, manager workload distribution, department response times, average approval times, and authorization request volume.

### **D2. Executive Dashboard**

Purpose: Provide senior leadership with an organization-wide, real-time view of operational health.

Displays: company productivity trends, department performance comparisons, active processes, approval bottlenecks, escalated tasks, and collaboration patterns. Accessible only to executive-rank users and above, plus company administrators.

### **D3. Department Collaboration Dashboard**

Purpose: Give department heads visibility into how their department interacts with the rest of the organization.

Displays: incoming cross-department requests, outgoing requests, active authorizations, collaboration frequency, and pending approvals.

### **D4. Delegation Analytics**

Purpose: Surface patterns that indicate organizational inefficiency before they become crises.

Identifies: frequently overloaded employees, frequently overloaded departments, bottlenecks, delayed approvals, and excessive cross-department dependencies. Accessible to department heads and above.

| ▶ D5. SLA Analytics — NEW in v4 Measure organizational responsiveness and accountability against service level expectations. |
| :---- |

### **D5. SLA Analytics  ● NEW**

Purpose: Measure organizational responsiveness and accountability, providing leadership with metrics to identify and address process bottlenecks.

Metrics tracked:

* Average blocker response time (per manager, per department)

* Average approval response time

* Average task completion time

* Average reassignment frequency

* Department response times

Example output:

| Finance Department — SLA Summary |
| :---- |
| • Average Blocker Response: 6.2 hours |
| • Average Approval Time: 1.4 days |
| • Average Task Completion: 3.2 days |
| • Reassignment Frequency: 0.3 per task |

Accessibility: Accessible to department heads and above. Department heads see their department scope; executives and administrators see organization-wide SLA data.

## **Capability Area E: Audit & Compliance**

### **E1. Immutable Audit Trail**

Purpose: Maintain a permanent, tamper-proof record of every consequential action in the system.

Visibility: Accessible to company administrators, executive-rank users, and the Global Superadmin.

The following events are logged with timestamp, actor identity, and full context:

* User account creation and modification

* Department creation, modification, and deactivation

* Rank creation, modification, and reordering

* Task creation, assignment, and reassignment (including reassignment reason)

* Task status changes (including blocker submissions and resolutions)

* Subtask creation, assignment, and status changes

* Task dependency creation and resolution

* Comments submitted on tasks

* Task completion and archival

* Review & Approval outcomes (approved / changes requested / rejected) and reviewer comments

* Temporary delegation creation, modification, and expiry

* Cross-department authorization requests, approvals, denials, and expirations

* Enterprise Approval Mode activation and deactivation

* Login events

* Permission changes

* Global Superadmin workspace access events

* Organization creation, suspension, and removal (platform-level log)

* Company administrator authorization and revocation

Audit records are immutable. The audit log must be exportable by company administrators and the Global Superadmin.

## **Capability Area F: Platform Features**

### **F1. In-App Notification System**

Every user has an in-app notification inbox. Notifications are triggered by task assignments, status changes, blocker events, authorization requests and decisions, approaching deadlines, overdue tasks, escalations, reassignments, subtask completions, dependency completions, delegation creation/expiry, and review outcomes.

Email notifications and additional channels are a planned post-launch feature. In-app only at launch.

### **F2. Day/Night Mode**

Toggle available globally in settings or via a persistent UI control. Preference is saved per user account. System default follows OS/browser preference on first visit. Full visual implementation is governed by design.md.

### **F3. Settings (Rank-Contextual)**

Settings panels are shown or hidden based on rank level — never on hardcoded title strings. All users: profile settings, password change, notification preferences, display theme. Managers and above: team visibility preferences, delegation settings. Department heads and above: cross-department authorization settings, delegation management. Administrators: full org configuration.

### **F4. Multi-Language Support**

UI strings are externalized and translatable from the initial build. Language preference is configurable per user. Initial launch is English-only; additional language packs are released post-launch.

| ▶ F5. Global Search — NEW in v4 Provide rapid access to users, tasks, departments, and audit records across the organization. |
| :---- |

### **F5. Global Search  ● NEW**

Purpose: Provide rapid access to users, tasks, departments, and audit records — eliminating the need to navigate manually through organizational structure to find information.

Users may search across:

* Task titles and descriptions

* User names

* Departments

* Comments

* Audit records (where authorized)

Security Rule: Search results must respect all permission boundaries. Search must never expose information that the user would otherwise be unable to access. This is a hard constraint with no exceptions.

## **Capability Area G: Landing Page & Public Space**

### **G1. Single-Page Marketing & Landing Architecture**

Rendered as a highly polished, responsive single-page structure. Contains direct path routing buttons to standalone Sign-In and Log-In interfaces. Showcases a comprehensive features rundown split across employee, managerial, and corporate visibility tools. Hero Section: Value proposition statement anchored around workforce transparency and immutable organizational trace trails.

### **G2. Subscription Hierarchy & Gating Rules**

Tier 1: Companies up to 10 employees. Price: All Features Lifetime Free.

Tier 2: Companies up to 100 employees. Price: 999 MVR per month (also indicate that annual payment will be less 10%)

Tier 3: Companies with more than 100 employees. Price: 4,999 MVR per month (also indicate that annual payment will be less 10%)

Hard Gating: If an active corporate environment attempts to provision a user account that exceeds the 10 employee boundary limit under Tier 1, the system hard-halts the user provisioning request and displays an upgrade modal. Integrated payment processing is deferred to subsequent version milestones. Upgrade support contact: \+960 7451198\ or \+960 7793811\.

# **Section 5 — Business Rules**

## **Access & Permissions**

* A user may only view tasks assigned to them or tasks they created, unless their rank grants broader visibility.

* A manager may view all tasks belonging to their direct reports.

* A department head may view all tasks within their department.

* An executive may view all tasks across the entire organization.

* A company administrator has full access to all data within their company's workspace.

* The Global Superadmin may access any company workspace for support purposes; every such access event is permanently logged.

* A user may not view tasks belonging to a peer at the same rank level unless explicitly authorized.

* Permissions are determined by rank level and administrator configuration — never by hardcoded job title strings.

* A user may only assign tasks to another user if: (a) the assignee is their direct report, or (b) a valid cross-department authorization exists.

* The Global Superadmin may not grant themselves permissions within a company workspace that bypass the audit log.

* Platform-level Global Superadmin actions are logged in a platform-level audit trail separate from, but in addition to, each company's workspace audit log.

Department Head Assignment Authority (v4 — enhanced):

* Department Heads may assign tasks to any user within their department whose rank level is lower than their own.

* Department Heads may reassign tasks between users within their department.

* Department Heads may create, monitor, and manage department-wide tasks regardless of direct reporting relationships.

* Department Heads may view all task activity occurring within their department.

## **Task Reassignment Rules**

* A task may be reassigned by: the original assigning user, the assignee's department head, or a company administrator.

* A reassignment reason is required — it cannot be blank.

* Reassignment generates an audit log entry attributing the action to the reassigning user.

* Both the previous and new assignee are notified upon reassignment.

* Task ID, history, comments, blockers, and subtasks are fully preserved across reassignments.

## **Audit Log Visibility**

* The audit log is accessible to: company administrators, executive-rank users, and the Global Superadmin.

* Managers and department heads do not have access to the audit log.

* Standard employees do not have access to the audit log.

* The Global Superadmin may view platform-wide audit logs including all cross-workspace access events.

* No actor at any level may modify, suppress, or delete an audit log entry.

## **Data Ownership**

* All data created within a company workspace belongs exclusively to that company.

* No data from one company's workspace may be accessed by users of any other company's workspace under any circumstances.

* Global Superadmin access to a company workspace for support is permitted but must be requested by the company and is permanently logged.

* A company administrator may export their company's data.

* Removing an organization from the platform must follow a defined data retention and deletion policy.

## **Workflow Rules**

* A task must pass through statuses in a valid sequence. Completed is a terminal state and cannot be reversed.

* A blocker submission transitions the task to Blocked status and places the deadline in a Pending state.

* The deadline clock resumes only when the assigning manager formally responds to the blocker.

* If a manager does not respond to a blocker before the original deadline, the missed deadline is attributed to the unresolved blocker — not the employee.

* If a blocker remains unresolved past a configurable grace period, an escalation notification is sent to the department head.

* A cross-department authorization request must be approved before any cross-department task assignment may occur.

* Dependent tasks cannot move to In Progress until all prerequisite tasks are completed.

* A parent task may not be marked Completed until all required subtasks are completed.

* When a task enters Under Review, the reviewer must take action (Approve, Request Changes, or Reject) — the status may not remain in Under Review indefinitely without escalation.

* Temporary delegations expire automatically and require no manual revocation.

* Delegated actions are attributed to both the Acting User and Original Authority Holder in the audit trail.

* Archived tasks are immutable — they cannot be modified or have their status changed.

## **Priority Rules**

* All tasks must have a priority level assigned: Critical, High, Medium, or Low.

* Priority may not be null — a task cannot be saved without a priority level.

* Critical tasks may trigger enhanced notifications, executive visibility, and escalation rules.

## **Search Rules**

* Global search results must respect all permission boundaries.

* A user's search results may never include data they would not otherwise be authorized to view.

## **Validation & Tier Enforcement Rules**

* A task must have: a title, at least one assignee, a due date, and a priority level before it can be saved.

* A task reassignment must include a reason before it can be submitted.

* A temporary delegation must specify: delegate user, start date, end date, and scope.

* A rank must have a unique numerical level within the company's hierarchy.

* A company must have at least two rank levels configured before any non-administrator user accounts can be created.

* A user account must have a valid, unique email address within the platform.

* A blocker report must include a description of what is needed before it can be submitted.

* Tier 1 Scaling Deflection: Accounts attempting to create employee records beyond the 10-user volume threshold are hard-gated. System throws an upgrade validation roadblock redirecting operators to offline support at \+960 7451198\.

## **Notification Rules**

* A user is notified in-app immediately when a task is assigned to them.

* A manager is notified in-app immediately when a blocker is raised on a task they assigned.

* A department head is notified in-app when a cross-department authorization request is submitted for their approval.

* A user is notified in-app when a task they own is approaching its deadline (24 hours before due date).

* A user is notified in-app when a task assigned to them becomes overdue.

* Both old and new assignees are notified upon task reassignment.

* A reviewer is notified when a task enters Under Review.

* An assignee is notified when a prerequisite task is completed.

* Users are notified when a temporary delegation is created that includes them, and when it expires.

* Email notifications are a post-launch feature. No email notification infrastructure is required for the initial launch.

## **Billing & Subscription Rules**

* Automated online transactional rails, checkout pipelines, and programmatic billing portals are out of scope for the current build.

* At launch, organization subscription status is modified and managed manually via the Global Superadmin layer or via physical upgrade support triage.

* Feature gating by tiers applies specifically to user account volume limits (10 employees for Tier 1).

## **Audit & Compliance Rules**

* Every action listed in Section 4 (E1) must be written to the audit log at the time of occurrence.

* Audit records are immutable. No user at any level may edit or delete audit entries.

* Audit logs must be retained for the lifetime of the company workspace.

* Audit logs must be accessible to company administrators, executive-rank users, and the Global Superadmin.

* Audit logs must be exportable.

# **Section 6 — Non-Negotiable Requirements**

These requirements may not be compromised for any reason — not timeline pressure, not client request, not scope reduction.

| NNR-1 — Complete Data Isolation Between Tenants |
| :---- |
| **Requirement:** No user, query, or process may access data belonging to a different company workspace — except the Global Superadmin in explicitly logged support contexts. **Rationale:** Core trust guarantee of a multi-tenant SaaS product. **Violation Impact:** Catastrophic. Platform must be taken offline immediately. Legal action and complete loss of customer trust. |

| NNR-2 — Immutable Audit Trail |
| :---- |
| **Requirement:** Audit log records may never be modified or deleted by any actor — including company administrators and the Global Superadmin. **Rationale:** The audit trail is the product's accountability guarantee. If it can be altered, the platform's core value proposition is void. **Violation Impact:** Loss of product credibility. Potential compliance violations for enterprise customers. |

| NNR-3 — Blocker Attribution Integrity |
| :---- |
| **Requirement:** When a task is in Blocked state with an unresolved manager response, a missed deadline must never be attributed to the employee. **Rationale:** This is the accountability promise made to employees. Violating it makes the platform a tool for unfair punishment. **Violation Impact:** Employee trust collapse. Platform becomes adversarial; adoption fails. |

| NNR-4 — Admin-Only Employee Provisioning |
| :---- |
| **Requirement:** Employees may not self-register. All employee accounts must be created by the company administrator. **Rationale:** Self-registration would allow unauthorized access to a private company workspace. **Violation Impact:** Security breach. Unauthorized users inside company workspaces. |

| NNR-5 — Rank-Level Authority (No Hardcoded Titles) |
| :---- |
| **Requirement:** No feature, permission check, or routing logic may reference a specific job title string. All authority logic must use rank level integers. **Rationale:** Organizations use non-standard titles. The product must serve them without requiring title normalization. **Violation Impact:** Platform unusable for a significant customer segment. Re-architecture required. |

| NNR-6 — Task History Preservation |
| :---- |
| **Requirement:** Completed, reassigned, or closed tasks must never be permanently deleted. All historical task data must remain accessible. **Rationale:** Task history is an organizational asset used for performance reviews, audits, and dispute resolution. **Violation Impact:** Loss of organizational records. Trust violation. |

| NNR-7 — Global Superadmin Access Is Always Logged |
| :---- |
| **Requirement:** Every action taken by the Global Superadmin — including workspace access, configuration changes, and account authorization — must be permanently recorded in the audit trail with the individual operator's identity. **Rationale:** Superadmin access is a support capability, not a bypass. Tascorr must not be able to access customer data silently. **Violation Impact:** Breach of customer trust. Potential regulatory liability. |

| NNR-8 — Tier Expansion Hard Gate |
| :---- |
| **Requirement:** The system must enforce a hard constraint matching user limits to specific tiers. Under no condition can an account auto-scale past 10 users on Tier 1 without administrative elevation accompanied by the contact blocking notification sequence. **Rationale:** Crucial for manual monetization control during v4 baseline operations. **Violation Impact:** Direct breakdown of business structural boundaries and loss of subscription control. |

| NNR-9 — Search Permission Boundary Integrity |
| :---- |
| **Requirement:** Global search results must never expose information that the requesting user would not otherwise be authorized to view. No search query may bypass permission rules. **Rationale:** Search is a high-surface-area feature that, if misconfigured, could expose sensitive cross-department or cross-tenant data. **Violation Impact:** Data privacy violation. Tenant trust collapse. |

| NNR-10 — Delegation Audit Integrity |
| :---- |
| **Requirement:** Every action taken under a temporary delegation must record both the acting user and the original authority holder. Delegation must not create any unlogged permission pathway. **Rationale:** Delegation is a trust extension, not a bypass. The audit trail must always reflect real accountability chains. **Violation Impact:** Accountability gaps. Inability to trace consequential decisions to the correct authority. |

# **Section 7 — Design Constitution**

All implementation details — component specifications, color system, typography, spacing, layout patterns, and visual examples — are defined in design.md. This section establishes the philosophical layer that design.md must comply with.

**Desired User Experience**

Employees should feel in control and unhurried. The platform should never make a standard user feel like they've opened the wrong door. Managers should feel informed and responsive. Executives should feel like they have genuine organizational clarity, not a vanity dashboard. The Global Superadmin console should feel powerful and precise — a tool for operators, not a customer-facing product.

**Visual Personality**

Clean, modern, and professional. Understated rather than flashy. Data is the hero; chrome is the supporting cast. The interface should feel equally at home on a phone screen as on a large monitor. Dark mode should feel intentional, not like an afterthought.

**Design Priorities (ranked)**

1. Clarity — the user always knows where they are and what to do next

2. Speed — interactions complete in one or two taps/clicks

3. Mobile usability — all workflows function completely on a phone

4. Visual hierarchy — rank and role context is always legible from the layout

5. Aesthetics — modern and polished, but never at the expense of clarity

**Interaction Principles**

* Immediate visual feedback on every user action (loading states, success confirmations, error messages)

* Actions that cannot be undone must require explicit confirmation

* Destructive actions (deactivation, denial, escalation, organization suspension) must be clearly visually distinguished

* No hidden navigation — a user should always be able to find their way back

* Complexity is hidden by default and revealed progressively by rank level

* Notifications are unobtrusive — available on demand, never interrupting active work

**Accessibility Standard**

WCAG 2.1 AA as the minimum bar.

**Anti-Patterns — Never Do These**

* Do not show employees metrics or controls that belong to admin or executive views

* Do not use modal dialogs for multi-step workflows — use dedicated pages or panels

* Do not rely on color alone to convey status (must also use label text or icon)

* Do not auto-refresh the page without the user's awareness

* Do not build desktop-only data tables with no mobile fallback

* Do not use jargon in UI copy that a new employee would not understand on their first day

# **Section 8 — Technical Philosophy**

## **Stack & Deployment Paradigm (v5 Confirmed)**

* Backend & Database Storage: MySQL database hosted on the Plesk server of the primary company domain. The application layer connects to MySQL directly using standard PDO/MySQLi or equivalent ORM. XML flat-file storage is retired as of v5.

* Hosting Infrastructure: Deployed directly within a defined subdirectory architecture of the primary company domain (e.g., domain.com/tascorr) on a Plesk-managed shared or VPS hosting account. Vercel and similar edge hosting topologies remain out of scope.

* Database Provisioning: The Plesk Deployment Package (see Section 9\) includes a guided installation script that creates the MySQL database, runs the schema migration, seeds bootstrap credentials, and validates the installation — all via the Plesk File Manager or SSH.

* Frontend Architecture: Custom framework tokens and components configured dynamically per browser request, operating on standard structural layers.

## **MySQL Database Design Standards  ● NEW**

| ▶ MySQL Database Design Standards — NEW in v5 Technical Philosophy All database tables must be designed to relational standards native to MySQL, hosted on the Plesk server. XML flat-file storage is fully retired. |
| :---- |

All database tables must follow relational MySQL conventions. Every major table shall possess:

* id — UNSIGNED INT, AUTO\_INCREMENT, PRIMARY KEY

* tenant\_id — UNSIGNED INT NOT NULL (foreign key to tenants table; enforces multi-tenant isolation at query level)

* created\_at — DATETIME NOT NULL DEFAULT CURRENT\_TIMESTAMP

* updated\_at — DATETIME NOT NULL DEFAULT CURRENT\_TIMESTAMP ON UPDATE CURRENT\_TIMESTAMP

* created\_by — UNSIGNED INT NOT NULL (foreign key to users table)

Relationships shall use explicit foreign key constraints (FOREIGN KEY ... REFERENCES) rather than application-only enforcement wherever MySQL InnoDB engine supports it. All tables must use the InnoDB storage engine. All text columns storing user-generated content must use utf8mb4 character set with utf8mb4\_unicode\_ci collation.

Soft-delete columns (deleted\_at DATETIME NULL) may be used for users and departments but must never be applied to tasks, audit\_log, subtasks, task\_dependencies, or blocker\_reports tables — those records are immutable and permanent.

## **Architectural Principles**

* Favor clear module boundaries. Each capability area (tasks, auth, hierarchy, reporting, superadmin) should be separable and independently testable.

* Application-level verification models must serve as the primary enforcement layer for tenant isolation. Every database query must include a tenant\_id WHERE clause — no query may return data from multiple tenants.

* Business rules defined in Section 5 must be tightly integrated within the database access layer, enforced at both the application level and via MySQL constraints.

* The Global Superadmin console must be architecturally isolated from company workspace logic — a separate interface, separate routing, separate permission context.

## **Data Philosophy**

* All data is stored in MySQL. Rank authority is stored as a numerical integer column. All permission logic compares integers — never strings.

* The audit\_log table is append-only. No DELETE or UPDATE statements may be issued against it under any code path, by any user role, including the superadmin.

* Soft-delete patterns (deleted\_at column) may be used for the users and departments tables but must never apply to the tasks, audit\_log, subtasks, task\_dependencies, or blocker\_reports tables.

* All database credentials must be stored in environment configuration files (e.g., .env) outside the webroot and must never be committed to version control.

## **Preferred Tradeoffs**

| Situation | Prefer This | Over This |
| :---- | :---- | :---- |
| Ambiguous requirements | Flag the gap | Guess and implement |
| Two valid implementations | Simpler one | More flexible one |
| New feature vs. data integrity | Data integrity | Feature shipping |
| Speed of delivery vs. correctness | Correctness | Speed |
| Storage infrastructure | Local XML Tree Parsing | Complex Cloud-Database Provisioning |
| Hosting deployment strategy | Domain Subdirectory Asset | Edge-Cloud Automation Layers |

## **Testing Philosophy**

* All permission and business rule logic must have automated tests.

* Audit trail writes must be tested — verified that actions produce the expected log entries.

* Multi-tenant isolation must have explicit test cases that attempt cross-tenant data access and verify it is blocked.

* Global search must have test cases verifying that results never expose unauthorized data.

* Temporary delegation must have test cases verifying that expired delegations correctly revoke permissions.

* Task dependency blocking must be tested — verify that dependent tasks cannot move to In Progress while prerequisites are incomplete.

* UI testing must cover critical paths: task creation, blocker flow, reassignment, subtask management, cross-department authorization, login, review workflow, and superadmin workspace access.

# **Section 9 — Execution, Deployment & Testing Sandbox**

## **9.1 Post-Build Bootstrap Credentials**

Immediately upon completion of the installation process, the system must establish and expose the global root management layer.

* Global Superadmin Account: Instantiated automatically during installation with default admin credentials. The installation script outputs these credentials securely to a credentials.txt file placed above the webroot, and displays them on-screen at the conclusion of the install process.

* Default credentials must be changed by the operator immediately after first login. The platform must enforce a mandatory password change on the first Superadmin login.

## **9.2 Evaluation Workspace**

The codebase must ship with a pre-seeded evaluation dataset matching the Tier 1 boundary limits, loadable via the installation script:

* Sample Organization Structure: An evaluation company containing fewer than 10 employee nodes total.

* Pre-Configured Hierarchy & Records: Automatically seeded with sample employee accounts, realistic rank profiles, and functional cross-department task tracking records.

* Sandbox Blocker Simulation: Includes open tasks, tasks labeled as Blocked with unresolved manager workflows, subtask examples, and complete historic audit trails.

* Sandbox Dependency Examples: Includes at least one dependency chain demonstrating prerequisite blocking behavior.

* Sandbox Delegation Example: Includes at least one active temporary delegation record.

| ▶ 9.3 Plesk Deployment Package — NEW in v5 An installation script and deployment guide must be produced alongside the application, enabling the developer to deploy Tascorr into a Plesk-hosted account without manual database configuration. |
| :---- |

## **9.3 Plesk Deployment Package  ● NEW**

A self-contained deployment package must be produced alongside the application codebase. Its purpose is to allow the developer to upload Tascorr to a Plesk-managed hosting account and complete a full, working installation without manual database manipulation.

### **9.3.1 Package Contents**

The deployment package must include the following files at the root of the distributable archive:

| Deployment Package — Required Files |
| :---- |
| • install.php — Web-based installation wizard (runs in browser via Plesk-hosted domain) |
| • install.sql — Full MySQL schema: all tables, indexes, foreign key constraints, and initial seed data |
| • install-cli.php — Command-line alternative installer for SSH access |
| • DEPLOY.md — Step-by-step plain-language deployment guide |
| • .env.example — Template environment configuration file |
| • tascorr-vN.N.zip — Application source files ready to upload |

### **9.3.2 install.php — Web Installer Wizard**

The web installer is a multi-step browser-based wizard accessible at domain.com/tascorr/install.php after the application files have been uploaded. It must be self-deleting upon successful completion.

The wizard must walk through the following steps in sequence:

* Step 1 — Pre-flight Checks: Verify PHP version (7.4+), required PHP extensions (pdo\_mysql, mbstring, json, fileinfo), webroot write permissions, and that .env does not already exist.

* Step 2 — Database Configuration: Form fields for MySQL host, port, database name, username, and password. Test connection button that validates credentials against the Plesk MySQL server before proceeding.

* Step 3 — Schema Installation: Executes install.sql against the configured database. Creates all tables, applies indexes and foreign key constraints. Displays a confirmation checklist of tables created.

* Step 4 — Environment File Generation: Writes the validated database credentials and a randomly generated APP\_KEY (256-bit) to .env in the application root. The .env file must be placed outside the webroot if the Plesk directory structure permits, otherwise an .htaccess rule blocking direct access to .env must be applied automatically.

* Step 5 — Superadmin Account Creation: Form fields for Global Superadmin email and password. Password must meet minimum complexity (12+ characters, mixed case, number, symbol). Credentials are hashed (bcrypt, cost factor 12\) and written to the database.

* Step 6 — Optional Seed Data: Checkbox option to load the evaluation workspace seed data (Section 9.2). Recommended for first-time installations.

* Step 7 — Completion: Displays the Superadmin login URL, confirms all steps passed, and self-deletes install.php. Writes a credentials summary to /tascorr-install-credentials.txt one directory above the webroot.

### **9.3.3 install.sql — Database Schema**

install.sql must be a standalone, idempotent SQL file executable against any MySQL 5.7+ or MariaDB 10.3+ database. It must:

* Begin with SET FOREIGN\_KEY\_CHECKS \= 0; and end with SET FOREIGN\_KEY\_CHECKS \= 1;

* Use CREATE TABLE IF NOT EXISTS for all table definitions

* Define all tables in dependency order (referenced tables before referencing tables)

* Specify ENGINE=InnoDB, CHARSET=utf8mb4, COLLATE=utf8mb4\_unicode\_ci on every table

* Include all foreign key constraints with explicit ON DELETE and ON UPDATE behaviors

* Include indexes on all foreign key columns, tenant\_id columns, and columns used in common WHERE clauses (status, due\_date, assignee\_id)

* Insert the initial platform configuration row (platform settings, version marker)

* Not insert any user data — user creation is handled by the installer wizard at Step 5

Core tables that must be defined in install.sql:

| Required MySQL Tables |
| :---- |
| • tenants — Organization workspaces |
| • users — All user accounts across all tenants |
| • ranks — Configurable rank levels per tenant |
| • departments — Department definitions per tenant |
| • tasks — Core task records |
| • subtasks — Child tasks belonging to parent tasks |
| • task\_dependencies — Prerequisite relationships between tasks |
| • task\_assignments — Assignment history (supports reassignment trail) |
| • task\_comments — Comments attached to tasks |
| • blockers — Formal blocker submissions and resolutions |
| • cross\_dept\_authorizations — Cross-department authorization records |
| • approval\_chain\_steps — Enterprise Approval Mode chain steps |
| • delegations — Temporary delegation records |
| • notifications — In-app notification queue |
| • audit\_log — Immutable append-only audit trail |
| • task\_templates — Reusable task template definitions |
| • process\_packages — Operational process package definitions |
| • platform\_config — Platform-level configuration (version, settings) |

### **9.3.4 DEPLOY.md — Deployment Guide**

DEPLOY.md must be written in plain language accessible to a developer with basic Plesk familiarity. It must cover the following sections:

* Prerequisites: PHP 7.4+, MySQL 5.7+ or MariaDB 10.3+, a Plesk hosting account with File Manager or FTP access, an existing MySQL database and database user created via Plesk.

* Step 1 — Create a MySQL database and user in Plesk: Navigate to Plesk \> Databases \> Add Database. Note the database name, username, password, and host (typically localhost).

* Step 2 — Upload files: Upload the contents of tascorr-vN.N.zip to the desired subdirectory (e.g., httpdocs/tascorr/) via Plesk File Manager or FTP.

* Step 3 — Run the web installer: Navigate to domain.com/tascorr/install.php in a browser and follow the on-screen wizard.

* Step 4 — Verify installation: Confirm install.php no longer exists. Log in as Global Superadmin. Change default password immediately.

* Step 5 — Configure .htaccess (if not auto-applied): Ensure the provided .htaccess file is active in the application root to block direct access to .env and other sensitive files.

* Troubleshooting: Common errors (wrong MySQL host, insufficient file permissions, missing PHP extensions) with their solutions.

* Security Hardening: Post-installation checklist — confirm .env is inaccessible from browser, confirm install.php is deleted, confirm credentials.txt is stored securely or deleted.

## **9.4 Deployment Constraints  ● NEW**

The following deployment constraints are authoritative and must be considered by all code, especially configuration files (e.g. Vite configuration, base paths, backend settings, etc.):

* **Deployment URL**: The application will be deployed in the location: `https://soft.thinksafe.mv/tascorr/`
* **Backend Stack**: The server is configured with Node.js. (Despite references to PHP in historical documentation, the active server environment uses Node.js).
* **Access Limitations**: The server does not provide SSH access. All deployment scripts and installation processes must account for this.

### **9.3.5 Security Requirements for the Installer**

The following security constraints apply to the installation process and must not be relaxed:

| Installer Security Requirements |
| :---- |
| • install.php must be self-deleting upon successful completion. If self-deletion fails, it must write a prominent warning and refuse to render its UI on subsequent requests. |
| • install.php must refuse to run if a .env file already exists — re-running the installer over an existing installation is prohibited. |
| • All database credentials entered into the wizard form must be transmitted over HTTPS. The installer must detect HTTP and display a warning if SSL is not active. |
| • The APP\_KEY written to .env must be generated using a cryptographically secure random source (random\_bytes or equivalent). |
| • Superadmin passwords must be hashed with bcrypt at cost factor 12 minimum. Plaintext passwords must never be written to disk or logged. |
| • The credentials.txt output file must be written above the webroot. If the directory structure does not permit this, the installer must display the credentials on-screen and explicitly instruct the operator to record and delete them. |

### **9.3.6 Plesk-Specific Configuration Notes**

The following Plesk-specific behaviors must be accounted for in the application and installer:

* MySQL host in Plesk is typically localhost but may vary by hosting provider. The installer must allow the operator to override the host and port.

* Plesk-managed PHP versions are selected per domain via the PHP Settings panel. The application must declare its minimum PHP version requirement in a visible location (README.md and install.php pre-flight check).

* If the Plesk account includes a Let's Encrypt SSL certificate, the installer should detect HTTPS automatically. If not, the DEPLOY.md must include instructions for enabling SSL via Plesk.

* The application subdirectory (e.g., httpdocs/tascorr/) must include an .htaccess file that: (a) routes all requests through the application's front controller (index.php), (b) blocks direct browser access to .env, install-cli.php, install.sql, and any .log files.

* File permissions on the Plesk server must be set to 644 for files and 755 for directories. The installer must verify and report any directories it cannot write to.

# **Section 10 — Decision Framework**

## **Priority Hierarchy**

When two valid concerns conflict, this ranking determines which wins:

6. Data security and tenant isolation — Nothing overrides this

7. Immutable audit trail integrity — Cannot be compromised under any circumstance

8. Stated business rules (Section 5\) — Must not be violated

9. Employee accountability fairness (blocker attribution, NNR-3) — Core trust promise

10. User experience and clarity — Resolve ambiguity in favor of the simpler, clearer path

11. Performance — Optimize after correctness is established

12. Developer experience — Important but never at the expense of the above

13. Feature richness — New features yield to stability until the foundation is solid

## **Tradeoff Preferences**

| Situation | Prefer This | Over This |
| :---- | :---- | :---- |
| Ambiguous requirements | Ask / flag the gap | Guess and implement |
| Two valid implementations | Simpler one | Cleverer one |
| New feature vs. stability | Stability | Feature |
| Speed of delivery vs. correctness | Correctness | Speed |
| DB enforcement vs. app-only check | App-level parsing hooks | Database system execution engines |
| Flexibility vs. specificity | Specific now | Flexible later |
| Novel pattern vs. established | Established | Novel |

## **Gap-Filling Protocol**

* Check whether an analogous situation is addressed elsewhere in this constitution

* Apply the Priority Hierarchy above — choose the option that protects higher-ranked concerns

* Choose the most reversible option available

* Leave a code comment flagging the gap: // CONSTITUTION GAP: \[description\] — needs human review

* Document the gap in the PR description for async human review

## **What Always Wins**

| Inviolable Rules |
| :---- |
| • User data may never be exposed to an unauthorized party — under any circumstance, by any code path. |
| • No feature may bypass a documented business rule in Section 5\. |
| • Reversible over irreversible when the outcome is uncertain. |
| • The employee is never penalized for a blocker that a manager failed to resolve. |
| • Every Global Superadmin action is logged. No exceptions. |
| • Search results never expose data the user is not authorized to see. |
| • Delegated actions are always dual-attributed: acting user and original authority holder. |

# **Section 11 — Glossary**

| Term | Definition |
| :---- | :---- |
| **Tascorr** | The product. A multi-tenant B2B SaaS task delegation and workforce accountability platform. Slogan: Assign it. Track it. Own it. |
| **Company Workspace** | The isolated data environment created for each organization. All users, tasks, departments, configuration, and audit logs for that company live here. |
| **Tenant** | A single subscribing organization. Each tenant has one company workspace. Synonymous with 'company' in this document. |
| **Rank** | A named authority level within a company's hierarchy. Authority is determined by the rank's numerical level integer — not its title. |
| **Rank Level** | An integer assigned to each rank. Lower integers \= higher authority (e.g., 1 \= highest executive, 6 \= entry-level employee). |
| **Department Head** | The user designated as the leader of a department. Any rank may be designated as a department head by the administrator. |
| **Direct Report** | An employee who reports directly to a given manager in the organizational hierarchy. |
| **Cross-Department Authorization** | A formal, time-limited permission granted by a department head that allows a user to assign tasks to employees in a different department. |
| **Enterprise Approval Mode** | An optional platform setting that enforces a multi-level sequential approval chain for all cross-department task assignments. Disabled by default. |
| **Blocker** | A formal status on a task indicating the assignee cannot proceed due to an unresolved dependency. Transitions the task to Blocked status and suspends deadline accountability. |
| **Blocker Report** | The structured submission made by an employee when raising a blocker. Documents what is needed and why the task cannot proceed. |
| **Pending Deadline** | The suspended state of a task's due date when a blocker is active and awaiting manager response. The deadline clock does not run during this state. |
| **Subtask** | A child task belonging to a parent task. Has its own assignee, status, and deadline. Parent task completion requires all required subtasks to be completed first. |
| **Task Dependency** | A prerequisite relationship between two tasks. A dependent task cannot move to In Progress until its prerequisite task is Completed. |
| **Task Reassignment** | The transfer of task ownership from one user to another. Requires a stated reason. Full history is preserved and both parties are notified. |
| **Temporary Delegation** | A time-limited transfer of managerial authority to a designated acting user. Automatically expires. All delegated actions are dual-attributed in the audit trail. |
| **Priority Level** | A mandatory attribute on every task: Critical, High, Medium, or Low. Determines notification behavior and visibility rules. |
| **Workload Awareness** | The display of an assignee's current task load metrics shown to the assigning user at the moment of task assignment. |
| **SLA Analytics** | Service Level Agreement analytics measuring organizational responsiveness: average blocker response time, approval time, task completion time, and reassignment frequency. |
| **Global Search** | A platform-wide search capability across tasks, users, departments, comments, and authorized audit records. Respects all permission boundaries. |
| **Task Archive** | A read-only repository of completed tasks moved automatically after a configurable period. Archived tasks remain searchable and reportable but cannot be modified. |
| **Review & Approval Workflow** | The formalized process governing the Under Review status: reviewer is notified, may Approve (→ Completed), Request Changes (→ In Progress), or Reject (→ In Progress). |
| **Operational Process Package** | A bundled collection of task templates that launches multiple tasks simultaneously across departments, representing a complete business process. |
| **Task Template** | A reusable task definition that pre-fills task fields for a common process. Maps to roles or departments — does not lock to specific individuals. |
| **Recurring Task** | A task configured to automatically generate new independent instances on a defined cadence (daily, weekly, monthly, quarterly, annually). |
| **Audit Trail** | The immutable, append-only log of all consequential actions within the platform. Cannot be edited or deleted by any actor. |
| **Company Administrator** | The highest-authority user within a company workspace. Account is activated by the Global Superadmin. Responsible for all workspace configuration and user management. |
| **Global Superadmin** | A Tascorr-operated role existing above all company workspaces. Responsible for onboarding organizations, authorizing company administrators, and performing support interventions. All actions are permanently logged. |
| **Global Superadmin Console** | The dedicated, separate interface used exclusively by the Global Superadmin. Not accessible to any company-level user. |
| **Multi-Tenancy** | The architectural pattern by which a single Tascorr deployment serves multiple independent organizations with complete data isolation between them. |
| **Platform-Level Audit Log** | A separate, platform-wide audit log capturing all Global Superadmin actions, including cross-workspace access events. Distinct from each company's workspace audit log. |
| **MySQL Database** | The v5 data storage engine. A MySQL relational database hosted on the Plesk server. All application data — users, tasks, audit records, tenants — is stored here. Replaces the XML flat-file used in prior versions. |
| **Plesk Deployment Package** | The set of files produced alongside the application (install.php, install.sql, install-cli.php, DEPLOY.md, .env.example) that enables a developer to deploy Tascorr onto a Plesk-managed hosting account without manual database configuration. |
| **install.php** | The web-based installation wizard included in the Plesk Deployment Package. Runs in a browser after files are uploaded to the Plesk server. Self-deletes upon successful completion. |
| **install.sql** | The MySQL schema file included in the Plesk Deployment Package. Defines all tables, indexes, foreign key constraints, and initial platform configuration. Idempotent and compatible with MySQL 5.7+ and MariaDB 10.3+. |
| **design.md** | The companion document governing all frontend implementation: visual design, component specifications, typography, color system, layout, and responsive behavior. |
| **Pending** | Task status: Created and assigned but not yet started. |
| **In Progress** | Task status: Actively being worked on by the assignee. |
| **Blocked** | Task status: Assignee has raised a blocker. Deadline clock suspended. Manager response required. |
| **Under Review** | Task status: Assignee has submitted work; awaiting manager review or approval. Reviewer must take action. |
| **Completed** | Task status: Task is closed. Terminal state. Cannot be reversed. |
| **Archived** | Task state: Task has been moved to the archive after the configured post-completion period. Immutable and read-only. |

# **Section 12 — Open Questions & Assumptions Log**

## **Open Questions**

**Q: What is the configurable grace period for unanswered blockers before escalation to the department head?**

Why it matters: The escalation rule requires a concrete threshold to implement. Owner: Product

**Q: Can a task have multiple assignees simultaneously, or only one assignee at a time?**

Why it matters: Affects the task data model, notification routing, and accountability attribution for blockers and deadlines. Owner: Product

**Q: Should managers be able to assign tasks to themselves?**

Why it matters: Self-assignment is an edge case that needs an explicit rule to avoid ambiguous permission logic. Owner: Product

**Q: Are there specific data protection regulatory requirements to comply with (GDPR, HIPAA, SOC2)?**

Why it matters: Determines data residency, retention, deletion obligations, and audit requirements. Must be resolved before production launch. Owner: Legal / Product

**Q: What is the configurable archive period — how many days after Completed does a task move to Archive?**

Why it matters: Required to implement the Archive System (A11). Owner: Product

**Q: Can subtasks themselves have subtasks (nested subtasks), or is only one level of nesting permitted?**

Why it matters: Determines the data model depth and UI complexity for subtask management. Owner: Product

**Q: What is the maximum depth of a task dependency chain?**

Why it matters: Circular dependency detection and chain visualization require a defined limit. Owner: Engineering / Product

**Q: Can a user delegate only specific capabilities (e.g., only task assignment authority), or must delegation transfer the full role scope?**

Why it matters: Granular delegation is more powerful but significantly more complex to implement and audit. Owner: Product

**Q: What workload threshold triggers the overload warning during task assignment?**

Why it matters: The Workload Awareness feature requires a configurable threshold value to display warnings. Must be defined before implementation. Owner: Product

## **Assumptions Made**

| ASSUMPTION — Escalation Grace Period |
| :---- |
| • Escalation notification is sent to the department head if a blocker remains unresolved past a configurable grace period. |
| • Based on: The blocker accountability system implies escalation must exist; no specific threshold was stated. |
| • Confidence: Medium |
| • If wrong: Remove or replace the escalation mechanism; adjust notification rules in Section 5\. |

| ASSUMPTION — English-Only Launch |
| :---- |
| • The initial launch is English-only; additional language packs are released post-launch. |
| • Based on: Multi-language support was stated as planned but not in scope for launch. |
| • Confidence: High |
| • If wrong: Localization infrastructure must be built and translated before launch. |

| ASSUMPTION — In-App Notifications Only at Launch |
| :---- |
| • In-app notifications are the only delivery channel at launch. Email and other channels are post-launch. |
| • Based on: Explicitly confirmed by the product owner. |
| • Confidence: High |

| ASSUMPTION — File Attachments Supported |
| :---- |
| • File attachments are supported in task descriptions and comments. |
| • Based on: The blocker use case explicitly describes missing files as a common blocker type. |
| • Confidence: High |

| ASSUMPTION — Status Skipping Permitted |
| :---- |
| • Task status may skip non-mandatory intermediate states; Completed is the only terminal state and cannot be reversed. |
| • Based on: Real-world task completion often skips formal review for simple tasks. |
| • Confidence: Medium |

| ASSUMPTION — Workload Warning is Advisory Only |
| :---- |
| • Workload indicators displayed at task assignment are advisory — they do not block the assignment action. |
| • Based on: Hard-blocking assignment based on workload would create workflow friction and override managerial judgment. |
| • Confidence: Medium |
| • If wrong: A hard assignment block must be implemented when threshold is exceeded. |

| ASSUMPTION — One Level of Subtask Nesting |
| :---- |
| • Subtasks are one level deep — subtasks cannot themselves contain subtasks. |
| • Based on: Single-level nesting is simpler to implement and sufficient for the stated use cases. Deeper nesting is a future enhancement. |
| • Confidence: Medium |
| • If wrong: Data model and UI must support recursive subtask nesting. |

*End of PROJECT\_CONSTITUTION.md — Tascorr v5.0*

*Generated from Tascorr v4.0 with database migration to MySQL and Plesk Deployment Package incorporated.*

*All assumptions are labeled. All gaps are flagged. This document is authoritative until superseded by a versioned update.*

*Companion document: design.md — must be present in the IDE alongside this file.*