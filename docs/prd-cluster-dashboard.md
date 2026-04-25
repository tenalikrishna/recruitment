# HUManity Recruitment App: Cluster Dashboard PRD

## Product Requirements Document
**Version:** 1.0
**Date:** April 24, 2026
**App:** HUManity Recruitment (localhost:3001)
**Stack:** Built in VS Code with Claude extension

---

## Table of Contents

1. [Context and Current State](#1-context-and-current-state)
2. [The Complete Volunteer Journey](#2-the-complete-volunteer-journey)
3. [Implementation Sections](#3-implementation-sections)
   - 3.1 [Rename "Core Team" to "Cluster Leader"](#31-rename-core-team-to-cluster-leader)
   - 3.2 [Team Page UI Redesign](#32-team-page-ui-redesign)
   - 3.3 [Sidebar and Navigation Update](#33-sidebar-and-navigation-update)
   - 3.4 [Recruitment Dashboard Update: "Assign to Cluster"](#34-recruitment-dashboard-update-assign-to-cluster)
   - 3.5 [Clusters Overview Page (Leadership View)](#35-clusters-overview-page-leadership-view)
   - 3.6 [Cluster Detail View](#36-cluster-detail-view)
   - 3.7 [Activity Creation and Participation Tracking](#37-activity-creation-and-participation-tracking)
   - 3.8 [Bring Three Campaign Tracking](#38-bring-three-campaign-tracking)
4. [Data Models](#4-data-models)
5. [Permissions and Role Access](#5-permissions-and-role-access)
6. [UI/UX Guidelines](#6-uiux-guidelines)

---

## 1. Context and Current State

### What exists today

The HUManity Recruitment app is a web application at localhost:3001 with the following:

**Sidebar navigation:** Dashboard, Applicants, Team

**Dashboard page:** Shows recruitment pipeline tiles:
- Total (29)
- Unassigned (6)
- Assigned (Pending Interview) (14)
- Interviewed (9)
- Cleared (6)
- Rejected (2)
- Recruitment Day (6)

Each tile is clickable and shows the corresponding applicant list.

**Team page:** Lists team members with their roles. Each member card shows:
- Name, username, email
- Role badges (Screener, Core Team, Leadership)
- Action icons on the right side (edit, email, change password, delete) displayed as small icons inline

Current team members include: Admin (Leadership), ashlesha (Screener), Deekshitha (Screener), usha (Screener), nikitha (Core Team + Screener), saketh (Screener + Core Team), Niketh (Screener).

**Applicants page:** Lists all applicants with their status in the recruitment pipeline.

**"Sync from Website" button:** Pulls new applicant submissions into the system.

### What needs to change

The app currently ends at recruitment. It needs to extend into the volunteer lifecycle by adding cluster management. The "Core Team" role becomes "Cluster Leader" and a whole new section of the app is built for managing clusters, tracking engagement, and monitoring volunteer progress.

### Critical flow change

**Important:** Applicants are assigned to clusters BEFORE their telephonic screening call, not after. The cluster is part of the recruitment journey, not a post-recruitment destination. This means each cluster member has two parallel tracks: their engagement in group activities AND their screening call status.

---

## 2. The Complete Volunteer Journey

This is the full lifecycle of a person in the system, from application to active volunteer:

```
Step 1: Applicant fills form on website
         ↓
Step 2: App syncs the submission → appears as "Unassigned" in recruitment dashboard
         ↓
Step 3: Leadership assigns them to a Cluster
         → They appear in that cluster's member table
         → Their Call Status is "Pending"
         ↓
Step 4: (Parallel Track A) Cluster Leader engages them through group activities
         → #MyIntro, #BuddyIntro, #SpotKindness, etc.
         → Leader marks participation through activity checklists
         ↓
Step 4: (Parallel Track B) A Screener conducts the telephonic screening call
         → Call result: Cleared or Rejected
         → Result is logged in the system
         ↓
Step 5: If Cleared → They continue as a full active volunteer in the cluster
        If Rejected → Marked as rejected (Leadership decides if they stay in group or are removed)
         ↓
Step 6: Active volunteer participates in "Each One Bring Three"
         → Brings new recruits who enter Step 1 as new applicants
         → Referral source is tracked (which cluster, which member)
```

---

## 3. Implementation Sections

Each section below is designed to be implemented independently, in order. When working with Claude in VS Code, reference this document and specify which section you are implementing.

---

### 3.1 Rename "Core Team" to "Cluster Leader"

**Scope:** Find and replace across the entire codebase.

**What to change:**
- Every instance of "Core Team" in the UI text, labels, badges, and role dropdowns should become "Cluster Leader"
- Database/data layer: if roles are stored as strings or enums, update "core_team" (or however it's stored) to "cluster_leader"
- The role badge color should remain the same (currently appears as a purple/blue badge)
- Team page display: nikitha and saketh should now show "Cluster Leader" badge instead of "Core Team"

**What NOT to change:**
- The "Screener" role stays as is
- The "Leadership (Admin)" role stays as is
- A person can still hold multiple roles (e.g., nikitha is both "Cluster Leader" and "Screener")

**Testing:** After this change, navigate to the Team page and verify that nikitha and saketh show "Cluster Leader" badges. Check any dropdowns or role assignment flows to ensure they show the new name.

---

### 3.2 Team Page UI Redesign

**Current problem:** The team page shows action icons (edit, email, change password, delete) as small unlabeled icons inline on each member card. This is not intuitive and gives destructive actions the same visual weight as safe ones.

**New design:**

Each team member should be displayed as a card with the following layout:

```
┌─────────────────────────────────────────────────────────────┐
│  [Avatar/Icon]  Name                            [⋮ Menu]   │
│                 @username · email@domain                    │
│                 [Cluster Leader] [Screener]                 │
│                                                             │
│                 Cluster: Cluster 1  (only if Cluster Leader)│
└─────────────────────────────────────────────────────────────┘
```

**The three-dot menu (⋮)** opens a dropdown with actions grouped by severity:

```
┌──────────────────────┐
│  Edit Profile        │
│  Change Role         │
│  ────────────────    │
│  Reset Password      │
│  ────────────────    │
│  Remove Member  🔴   │
└──────────────────────┘
```

- "Edit Profile" opens a modal/form for changing name, username, email
- "Change Role" opens a modal with checkboxes for available roles: Screener, Cluster Leader, Leadership
- "Reset Password" sends a reset or shows a confirmation dialog first
- "Remove Member" is styled in red and requires a confirmation dialog: "Are you sure you want to remove [Name]? This action cannot be undone."

**Filter tabs at the top of the page:**

```
[All]  [Screeners]  [Cluster Leaders]  [Leadership]
```

These filter the member list by role. "All" is the default.

**"+ Add Member" button** stays in the top right corner as it currently is.

**Additional detail for Cluster Leaders:** Below the role badges, show which cluster they lead. Format: "Cluster: Cluster 1" in a subtle text style. If they are not yet assigned to a cluster, show "Cluster: Unassigned" in a muted/gray style.

---

### 3.3 Sidebar and Navigation Update

**Current sidebar:**
```
Dashboard
Applicants
Team
```

**New sidebar:**
```
Dashboard
Applicants
Clusters        ← NEW
Team
```

"Clusters" is added between "Applicants" and "Team." It should use a group/cluster icon (something like a grid of people or connected nodes).

**Route:** `/#/clusters` for the overview page, `/#/clusters/:id` for individual cluster detail views.

**Visibility:**
- Leadership (Admin) sees all sidebar items
- Cluster Leaders see: Dashboard (read-only recruitment stats), Clusters (all clusters visible, own cluster editable), Team (read-only)
- Screeners see: Dashboard, Applicants (only their assigned ones), Team (read-only)

---

### 3.4 Recruitment Dashboard Update: "Assign to Cluster"

**What changes on the existing recruitment dashboard:**

1. **New tile added:** Between "Unassigned" and "Assigned (Pending Interview)", or replace the logic so that "Assigned" now means "Assigned to a Cluster."

The updated tile flow should be:
```
Total → Unassigned → Assigned to Cluster → Interview Pending → Interviewed → Cleared → Rejected → Recruitment Day
```

Or simplified (since assigning to cluster IS assigning them):
```
Total (29)
Unassigned (6)          → not yet assigned to any cluster
Assigned to Cluster (14) → in a cluster, call may or may not be done
Interviewed (9)          → call completed
Cleared (6)              → passed the call
Rejected (2)             → failed the call
Recruitment Day (6)      → final stage
```

2. **"Assign to Cluster" action on applicants:**

When viewing the list of "Unassigned" applicants, each applicant row should have an "Assign to Cluster" button or action. Clicking it opens a dropdown/modal showing:

```
┌──────────────────────────────────────────┐
│  Assign [Applicant Name] to:             │
│                                          │
│  ○ Cluster 1  (15/20 members)            │
│  ○ Cluster 2  (8/20 members)             │
│  ○ Cluster 3  (12/20 members)            │
│  ○ + Create New Cluster                  │
│                                          │
│  [Cancel]  [Assign]                      │
└──────────────────────────────────────────┘
```

Each option shows the cluster name and current member count out of a suggested max (e.g., 20). The "+ Create New Cluster" option allows Leadership to create a new cluster inline.

3. **After assignment:** The applicant moves from "Unassigned" to "Assigned to Cluster" on the recruitment dashboard, AND they appear in the corresponding cluster's member table with:
   - Call Status: "Pending"
   - Engagement Status: "New"
   - All activity participation: unchecked

---

### 3.5 Clusters Overview Page (Leadership View)

**Route:** `/#/clusters`

**Page title:** "Clusters"
**Subtitle:** "Monitor engagement and progress across all volunteer clusters"

**Top summary tiles (similar style to the recruitment dashboard tiles):**

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ TOTAL        │ │ TOTAL        │ │ UNASSIGNED   │ │ AVG          │
│ CLUSTERS     │ │ VOLUNTEERS   │ │ VOLUNTEERS   │ │ ENGAGEMENT   │
│     4        │ │    62        │ │     6        │ │    68%       │
│ View all →   │ │ View all →   │ │ Assign →     │ │              │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

- **Total Clusters:** Count of all active clusters
- **Total Volunteers:** Count of all people assigned to any cluster
- **Unassigned Volunteers:** Count of cleared applicants not yet in a cluster (links to the assign flow)
- **Avg Engagement:** Average engagement rate across all clusters (calculated as average of all clusters' engagement scores)

**Below the tiles: Cluster grid**

Display each cluster as a card in a responsive grid (2 or 3 columns). Max 10 clusters, so this comfortably fits.

Each cluster card:

```
┌─────────────────────────────────────────┐
│  Cluster 1                              │
│  ───────────────────────────────────    │
│  Leaders: Nikitha, Saketh               │
│  Members: 18                            │
│  Active: 12  |  Inactive: 4  |  New: 2 │
│                                         │
│  Phase: Connect                         │
│  Engagement: 72%  [──────────] ← bar   │
│  Bring Three: 8 recruits                │
│                                         │
│  [View Cluster →]                       │
└─────────────────────────────────────────┘
```

- **Leaders:** Names of assigned Cluster Leaders
- **Members:** Total count
- **Active/Inactive/New breakdown:** Active = participated in last 2 activities. Inactive = did not participate in last 2 activities. New = added in last 3 days.
- **Phase:** Manually set by Cluster Leader from options: Warm Up, Connect, Grow, Ongoing
- **Engagement:** Percentage calculated from activity participation rates, shown as a number and a small progress bar
- **Bring Three:** Total recruits generated by this cluster's members

**Clicking "View Cluster →"** navigates to the cluster detail page at `/#/clusters/:id`

**"+ Create Cluster" button** in the top right (Leadership only). Opens a form:

```
┌──────────────────────────────────────────┐
│  Create New Cluster                      │
│                                          │
│  Cluster Name: [__________________]      │
│                                          │
│  Assign Leader(s):                       │
│  [Dropdown of Cluster Leader users]      │
│  Selected: ✓ Nikitha  ✓ Saketh          │
│                                          │
│  [Cancel]  [Create Cluster]              │
└──────────────────────────────────────────┘
```

---

### 3.6 Cluster Detail View

**Route:** `/#/clusters/:id`

**Page header:**

```
← Back to Clusters

Cluster 1
Created: April 19, 2026  |  Leaders: Nikitha, Saketh
Phase: [Connect ▼]  (dropdown to change phase)
Members: 18  |  Active: 12  |  Engagement: 72%
```

The phase dropdown allows the Cluster Leader to change the current phase (Warm Up / Connect / Grow / Ongoing).

**Three tabs below the header:**

```
[Members]  [Activities]  [Bring Three]
```

---

#### Tab 1: Members

A table showing all cluster members with the following columns:

| Column | Description | Source |
|--------|-------------|--------|
| Name | Member's full name | From applicant data |
| Date Added | When they were assigned to this cluster | System generated |
| Activities | "X/Y" where X = activities participated, Y = total activities | Calculated from activity checklists |
| Last Active | Date of their most recent activity participation | Calculated |
| Call Status | Pending / Scheduled / Completed | Set by Screener |
| Screening Result | Awaiting / Cleared / Rejected | Set by Screener after call |
| Bring Three | Number of recruits they have brought | From Bring Three tracking |
| Status | Active / Inactive / Dropped | Auto-calculated + manual override |

**Status auto-calculation logic:**
- "Active" = participated in at least one of the last 2 activities
- "Inactive" = did not participate in the last 2 activities
- "Dropped" = manually set by Cluster Leader when a member has disengaged completely
- Cluster Leader can manually override the auto-calculated status

**Row coloring (subtle):**
- Cleared members: no special color (default)
- Pending call members: subtle yellow/amber left border or background
- Rejected members: subtle red left border, grayed out text
- Dropped members: grayed out entirely

**Actions on each member row:**
- Click to expand and see full details (all activity participation history, call notes, etc.)
- For Screeners: a "Log Call" button appears on members with Call Status = "Pending" or "Scheduled"

**"Log Call" flow:**

When a Screener clicks "Log Call" on a member, a modal opens:

```
┌──────────────────────────────────────────┐
│  Log Call: [Member Name]                 │
│                                          │
│  Call Status:                            │
│  ○ Scheduled (set a date)                │
│  ○ Completed                             │
│                                          │
│  If Completed:                           │
│  Result:  ○ Cleared   ○ Rejected         │
│                                          │
│  Notes: [________________________]       │
│         [________________________]       │
│                                          │
│  [Cancel]  [Save]                        │
└──────────────────────────────────────────┘
```

**"+ Add Member" button** (Leadership only): Opens the same "Assign to Cluster" modal, pre-filtered to unassigned applicants.

---

#### Tab 2: Activities

This is the engagement tracking hub. It shows all activities that have been created for this cluster.

**Activity list layout:**

```
[+ Create Activity]                    [Filter: All ▼]

┌─────────────────────────────────────────────────────────┐
│  #MyIntro  ·  Photo Introduction Round                  │
│  Apr 22, 2026                                           │
│  Participation: 14/18 (78%)  [───────────────]          │
│  [View Details →]                                       │
├─────────────────────────────────────────────────────────┤
│  #ThisOrThat  ·  Quick Fire Ice-breaker                 │
│  Apr 24, 2026                                           │
│  Participation: 11/18 (61%)  [───────────────]          │
│  [View Details →]                                       │
├─────────────────────────────────────────────────────────┤
│  #BuddyIntro  ·  Buddy Introduction Pairing             │
│  Apr 26, 2026                                           │
│  Participation: 0/18 (0%)  [───────────────]            │
│  [View Details →]  ← upcoming, no data yet              │
└─────────────────────────────────────────────────────────┘
```

**Clicking "View Details →"** expands the activity to show the member checklist:

```
┌─────────────────────────────────────────────────────────┐
│  #MyIntro  ·  Photo Introduction Round                  │
│  Apr 22, 2026                                           │
│                                                         │
│  ☑ Nikitha                                              │
│  ☑ Saketh                                               │
│  ☑ Member 3                                             │
│  ☐ Member 4                                             │
│  ☑ Member 5                                             │
│  ☐ Member 6                                             │
│  ... (all 18 members listed)                            │
│                                                         │
│  Rating: [★★★★☆] (optional, out of 5)                  │
│  Notes: [Optional notes about this activity]            │
│                                                         │
│  [Save]                                                 │
└─────────────────────────────────────────────────────────┘
```

- Checkboxes for each member (pre-populated with all cluster members)
- An optional rating (1 to 5 stars) for the Cluster Leader to rate how well the activity went
- An optional notes field for any observations
- "Save" persists the checklist state

---

### 3.7 Activity Creation and Participation Tracking

**"+ Create Activity" button** on the Activities tab opens a creation form:

```
┌──────────────────────────────────────────────────────┐
│  Create New Activity                                 │
│                                                      │
│  Choose type:                                        │
│  ○ From Template    ○ Custom                         │
│                                                      │
│  ── If "From Template" is selected: ──               │
│  [Dropdown of pre-loaded templates]                  │
│    - #MyIntro · Photo Introduction Round              │
│    - #ThisOrThat · Quick Fire Ice-breaker             │
│    - #BuddyIntro · Buddy Introduction Pairing        │
│    - #SpotKindness · Shared Mini Mission              │
│    - #ClusterVibes · Reflection and Appreciation     │
│    - #BringThree · Each One Bring Three Launch       │
│    - #ClusterFirst · First Cluster Activity           │
│                                                      │
│  ── If "Custom" is selected: ──                      │
│  Activity Name: [__________________________]         │
│  Hashtag: # [_____________________]                  │
│                                                      │
│  ── Common fields: ──                                │
│  Date: [April 24, 2026] (defaults to today)          │
│  Description (optional): [_____________________]     │
│                                                      │
│  [Cancel]  [Create Activity]                         │
└──────────────────────────────────────────────────────┘
```

**After creation:**
- The activity appears in the activity list
- The member checklist is auto-populated with all current cluster members
- All checkboxes default to unchecked
- The Cluster Leader checks off members as they participate in the WhatsApp group

**Pre-loaded activity templates** (from the engagement strategy document):

| Template Hashtag | Template Name | Default Description |
|------------------|---------------|---------------------|
| #MyIntro | Photo Introduction Round | Members share a photo and 3 facts about themselves |
| #ThisOrThat | Quick Fire Ice-breaker | 5 rapid-fire this-or-that questions |
| #BuddyIntro | Buddy Introduction Pairing | Assigned buddy pairs interview each other and post |
| #SpotKindness | Shared Mini Mission | Share a moment of kindness you witnessed or did |
| #ClusterVibes | Reflection and Appreciation | POCs summarize the journey and give shoutouts |
| #BringThree | Each One Bring Three Launch | Campaign to bring 3 new recruits each |
| #ClusterFirst | First Cluster Activity | First real activity the cluster does together |

These templates pre-fill the name, hashtag, and description. The Cluster Leader only needs to set the date and click create.

---

### 3.8 Bring Three Campaign Tracking

**Tab 3 on the Cluster Detail page: "Bring Three"**

This tab tracks the Each One Bring Three recruitment campaign.

**Important context:** Recruits brought through this campaign do NOT join the current cluster. They enter the main recruitment pipeline as new applicants and will be assigned to OTHER clusters. The system should track the referral source so Leadership can see which clusters and members are generating the most recruits.

**Layout:**

```
Campaign Status: Active / Not Started / Completed
Total Recruits: 12
Cluster Builders (brought all 3): 4 members

┌────────────────────────────────────────────────────────┐
│  Member Name    │ Recruits │ Names Shared │ Status      │
├────────────────────────────────────────────────────────┤
│  Nikitha        │ 3        │ Yes          │ ✓ Builder  │
│  Saketh         │ 2        │ Yes          │ In Progress │
│  Member 3       │ 3        │ Yes          │ ✓ Builder  │
│  Member 4       │ 0        │ -            │ Not Started │
│  ... (all members)                                     │
└────────────────────────────────────────────────────────┘
```

**"+ Add Recruit" button** for Cluster Leaders:

```
┌──────────────────────────────────────────┐
│  Add New Recruit                         │
│                                          │
│  Referred by: [Dropdown of members]      │
│                                          │
│  Recruit Name: [________________]        │
│  Recruit Phone: [_______________]        │
│  Recruit Email: [_______________]        │
│                                          │
│  [Cancel]  [Add Recruit]                 │
└──────────────────────────────────────────┘
```

**When a recruit is added:**
- The recruit count for that member increases
- If they hit 3, their status changes to "✓ Cluster Builder"
- The recruit's information is also pushed to the main recruitment pipeline as a new applicant with a referral tag: "Referred by: [Member Name] from [Cluster Name]"
- This referral tag is visible on the applicant's profile in the recruitment section

**Status definitions:**
- "Not Started" = 0 recruits
- "In Progress" = 1 or 2 recruits
- "✓ Cluster Builder" = 3 or more recruits

---

## 4. Data Models

These are the key data structures needed. Adapt to whatever database/storage your app currently uses.

### Cluster

```
{
  id: string,
  name: string,                    // e.g., "Cluster 1"
  created_at: date,
  phase: enum ["warm_up", "connect", "grow", "ongoing"],
  leader_ids: [string],            // references to team member IDs
  member_ids: [string],            // references to applicant IDs
  status: enum ["active", "archived"]
}
```

### Cluster Activity

```
{
  id: string,
  cluster_id: string,              // which cluster this belongs to
  name: string,                    // e.g., "Photo Introduction Round"
  hashtag: string,                 // e.g., "#MyIntro"
  description: string,             // optional
  date: date,
  created_by: string,              // Cluster Leader who created it
  is_template: boolean,            // whether created from template
  rating: number (1-5),            // optional, set by Cluster Leader
  notes: string,                   // optional observations
  participation: [                 // one entry per cluster member
    {
      member_id: string,
      participated: boolean        // checked or unchecked
    }
  ]
}
```

### Applicant (extended fields)

Add these fields to whatever applicant/volunteer model already exists:

```
{
  // ... existing fields ...
  cluster_id: string | null,       // which cluster they are in (null = unassigned)
  cluster_assigned_at: date | null,
  call_status: enum ["pending", "scheduled", "completed"],
  call_scheduled_date: date | null,
  screening_result: enum ["awaiting", "cleared", "rejected"],
  screening_notes: string,
  screened_by: string | null,      // team member who did the call
  cluster_status: enum ["new", "active", "inactive", "dropped"],
  bring_three_count: number,       // how many recruits they have brought
  referred_by: {                   // if this person was referred
    member_id: string | null,
    cluster_id: string | null
  }
}
```

### Team Member (extended fields)

Add to existing team/user model:

```
{
  // ... existing fields ...
  role: [enum],                    // array of: "leadership", "cluster_leader", "screener"
  assigned_cluster_id: string | null  // which cluster they lead (if Cluster Leader)
}
```

---

## 5. Permissions and Role Access

### Leadership (Admin)

- Full access to everything
- Can create/delete clusters
- Can assign applicants to clusters
- Can assign Cluster Leaders to clusters
- Can view and edit all cluster data
- Can create/manage team members
- Can view recruitment dashboard with all tiles

### Cluster Leader

- Can view ALL clusters (read-only for other clusters)
- Full edit access to their OWN cluster:
  - Create activities
  - Mark participation checkboxes
  - Add Bring Three recruits
  - Change cluster phase
  - Add notes
  - Set activity ratings
- Can view recruitment dashboard (read-only, for context)
- Can view Team page (read-only)
- Cannot assign applicants to clusters
- Cannot delete clusters
- Cannot create/edit team members
- Cannot change screening results (unless they are also a Screener)

### Screener

- Can view applicants assigned to them
- Can log calls and set screening results (Cleared/Rejected)
- Can view cluster member tables (read-only) to see who needs a call
- Cannot create activities or mark participation
- Cannot manage clusters

### Combined Roles

A person can hold multiple roles. For example, nikitha is both Cluster Leader and Screener. In that case:
- She gets all permissions of both roles
- She can create activities AND log screening calls for members in her cluster
- The UI adapts to show relevant actions based on all her roles

---

## 6. UI/UX Guidelines

### General Styling

The app currently uses a dark theme with a dark sidebar and card-based layout. Maintain this existing design language for all new pages.

### Tiles

Follow the exact same tile style used on the recruitment dashboard: card with label at top (uppercase, small text), large number below, "View list →" link at bottom. Use color coding for numbers as the current dashboard does (green for positive metrics, yellow for pending, red for issues).

### Tables

Use the same table styling that likely exists in the Applicants page. Consistent row height, hover states, and action buttons.

### Modals

All creation and editing flows should use modals (overlay dialogs) rather than separate pages. This keeps the user in context.

### Responsive Behavior

The cluster card grid should be responsive: 3 columns on wide screens, 2 columns on medium, 1 column on narrow.

### Color Coding for Status Badges

| Status | Color |
|--------|-------|
| Active | Green |
| Inactive | Yellow/Amber |
| New | Blue |
| Dropped | Gray |
| Cleared | Green |
| Pending | Yellow |
| Rejected | Red |
| Cluster Builder | Gold/Yellow with star |

### Empty States

Every page and section should have a meaningful empty state:
- Clusters page with no clusters: "No clusters yet. Create your first cluster to start organizing volunteers."
- Activity tab with no activities: "No activities yet. Create your first activity to start tracking engagement."
- Bring Three tab with no data: "The Bring Three campaign hasn't started yet."

---

## Implementation Order

When building with Claude in VS Code, follow this sequence. After each section, test thoroughly before moving to the next.

```
Step 1 → Section 3.1: Rename "Core Team" to "Cluster Leader"
Step 2 → Section 3.2: Team Page UI Redesign
Step 3 → Section 3.3: Sidebar and Navigation Update
Step 4 → Section 3.5: Clusters Overview Page (even if empty at first)
Step 5 → Section 3.4: Recruitment Dashboard "Assign to Cluster" flow
Step 6 → Section 3.6: Cluster Detail View (Members tab)
Step 7 → Section 3.7: Activity Creation and Participation Tracking
Step 8 → Section 3.8: Bring Three Campaign Tracking
```

Note: Section 3.4 comes after 3.5 because you need the clusters to exist before you can assign people to them.

---

## How to Use This Document with Claude in VS Code

1. Save this file as `docs/prd-cluster-dashboard.md` in your project root.
2. When starting a build session, tell Claude: "Read the PRD at docs/prd-cluster-dashboard.md. I want to implement Section [X.X]."
3. Claude will have full context of the overall architecture while focusing on just the section you're building.
4. After each section is complete and tested, move to the next one.
5. If you need to make changes to the PRD based on what you learn during building, update this document so future sections stay accurate.

---

*End of PRD*
