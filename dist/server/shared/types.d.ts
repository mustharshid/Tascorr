export type TaskStatus = 'Pending' | 'In Progress' | 'Blocked' | 'Under Review' | 'Completed';
export type TaskPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type AuthRequestScope = 'single-use' | '7-day' | '30-day' | 'project-based';
export type AuthRequestStatus = 'pending' | 'approved' | 'denied' | 'expired';
export type DelegationScope = 'full' | 'billing' | 'tasks' | 'configuration';
export interface ITenant {
    id: number;
    name: string;
    subscriptionTier: number;
    status: 'active' | 'suspended';
    createdAt: string;
    updatedAt: string;
}
export interface IRank {
    id: number;
    tenantId: number;
    title: string;
    level: number;
    createdAt: string;
    updatedAt: string;
}
export interface IDepartment {
    id: number;
    tenantId: number;
    name: string;
    headUserId: number | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}
export interface IUser {
    id: number;
    tenantId: number;
    email: string;
    firstName: string;
    lastName: string;
    rankId: number;
    departmentId: number | null;
    managerId: number | null;
    status: 'active' | 'deactivated';
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}
export interface IUserPopulated extends IUser {
    rank: IRank;
    department: IDepartment | null;
}
export interface ITask {
    id: number;
    tenantId: number;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string;
    createdById: number;
    departmentId: number | null;
    createdAt: string;
    updatedAt: string;
}
export interface ISubtask {
    id: number;
    tenantId: number;
    taskId: number;
    title: string;
    status: 'Pending' | 'In Progress' | 'Completed';
    createdAt: string;
    updatedAt: string;
}
export interface ITaskDependency {
    id: number;
    taskId: number;
    prerequisiteTaskId: number;
    createdAt: string;
}
export interface ITaskAssignment {
    id: number;
    tenantId: number;
    taskId: number;
    userId: number;
    assignedAt: string;
    reassignedFromUserId: number | null;
    reassignmentReason: string | null;
    reassignedById: number | null;
    reassignedAt: string | null;
    isActive: boolean;
}
export interface ITaskComment {
    id: number;
    tenantId: number;
    taskId: number;
    authorId: number;
    content: string;
    createdAt: string;
}
export interface IBlocker {
    id: number;
    tenantId: number;
    taskId: number;
    reporterId: number;
    description: string;
    createdAt: string;
    resolvedAt: string | null;
    resolutionComment: string | null;
    resolvedById: number | null;
}
export interface ICrossDeptAuthorization {
    id: number;
    tenantId: number;
    requesterId: number;
    targetUserId: number;
    departmentId: number;
    scope: AuthRequestScope;
    status: AuthRequestStatus;
    expiresAt: string | null;
    createdAt: string;
    updatedAt: string;
}
export interface IDelegation {
    id: number;
    tenantId: number;
    delegatorId: number;
    delegateeId: number;
    scope: DelegationScope;
    validFrom: string;
    validTo: string;
    createdAt: string;
}
export interface INotification {
    id: number;
    tenantId: number;
    recipientId: number;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}
export interface IAuditLog {
    id: number;
    tenantId: number;
    actorId: number;
    action: string;
    entityType: string;
    entityId: number;
    metadata: string | null;
    createdAt: string;
}
export interface IPlatformConfig {
    id: number;
    systemVersion: string;
    maintenanceMode: boolean;
    updatedAt: string;
}
export interface IAuthSession {
    userId: number;
    tenantId: number;
    email: string;
    rankLevel: number;
    departmentId: number | null;
}
