import { IAuthSession } from '../../shared/types.js';
export declare class PolicyService {
    /**
     * Check if a user is authorized to view a specific task
     */
    static canViewTask(user: IAuthSession, taskId: number): Promise<boolean>;
    /**
     * Check if a user can assign tasks to a target user
     */
    static canAssignTask(user: IAuthSession, assigneeId: number): Promise<boolean>;
    /**
     * Check if a user can reassign a task to another user (Section 5 Reassignment rules)
     */
    static canReassignTask(user: IAuthSession, taskId: number): Promise<boolean>;
}
