export interface CorrectionRequest {
    id: string;
    studentId: string;
    studentName: string;
    requestedByUserId: string;
    requestedByUserName: string;
    fieldToCorrect: string;
    oldValue: any;
    newValue: any;
    notes: string;
    status: 'pending' | 'approved' | 'rejected';
    requestDate: string;
    approvedByUserId?: string;
    approvalDate?: string;
}
