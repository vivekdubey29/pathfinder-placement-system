import { isoDateFromToday } from '../utils/formatters.js'

// Seed data for the Application Tracker. These records exist only in the
// browser. Nothing here was ever submitted to any company.
//
// Shape of an ApplicationRecord:
// {
//   id, studentId, internshipId,
//   status: 'SAVED' | 'APPLIED' | 'INTERVIEW' | 'OFFERED' | 'REJECTED',
//   trackedAt: 'YYYY-MM-DD',        // when the record was first created
//   appliedAt: 'YYYY-MM-DD' | null, // null while status is SAVED
//   updatedAt: 'YYYY-MM-DD',
//   notes: string
// }

const d = isoDateFromToday

export const mockApplications = [
    {
        id: 'app-0001',
        studentId: 'stu-001',
        internshipId: 'int-001',
        status: 'APPLIED',
        trackedAt: d(-2),
        appliedAt: d(-2),
        updatedAt: d(-2),
        notes: 'Applied through the company careers page.',
    },
    {
        id: 'app-0002',
        studentId: 'stu-001',
        internshipId: 'int-002',
        status: 'REJECTED',
        trackedAt: d(-19),
        appliedAt: d(-19),
        updatedAt: d(-5),
        notes: 'Rejected after the screening round.',
    },
    {
        id: 'app-0003',
        studentId: 'stu-001',
        internshipId: 'int-008',
        status: 'OFFERED',
        trackedAt: d(-22),
        appliedAt: d(-22),
        updatedAt: d(-8),
        notes: 'Offer received. Reply needed within a week.',
    },
    {
        id: 'app-0004',
        studentId: 'stu-001',
        internshipId: 'int-013',
        status: 'INTERVIEW',
        trackedAt: d(-26),
        appliedAt: d(-26),
        updatedAt: d(-9),
        notes: 'Technical interview scheduled. Revise React and Node.js basics.',
    },
    {
        id: 'app-0005',
        studentId: 'stu-001',
        internshipId: 'int-019',
        status: 'APPLIED',
        trackedAt: d(-4),
        appliedAt: d(-4),
        updatedAt: d(-4),
        notes: '',
    },
    {
        id: 'app-0006',
        studentId: 'stu-001',
        internshipId: 'int-011',
        status: 'SAVED',
        trackedAt: d(-1),
        appliedAt: null,
        updatedAt: d(-1),
        notes: 'Strong match. Prepare system design basics before applying.',
    },
    {
        id: 'app-0007',
        studentId: 'stu-001',
        internshipId: 'int-023',
        status: 'SAVED',
        trackedAt: d(-3),
        appliedAt: null,
        updatedAt: d(-3),
        notes: '',
    },
    {
        id: 'app-0008',
        studentId: 'stu-001',
        internshipId: 'int-006',
        status: 'SAVED',
        trackedAt: d(0),
        appliedAt: null,
        updatedAt: d(0),
        notes: '',
    },
]