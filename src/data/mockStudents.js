// Demo student data. This is a demonstration identity, not a login.
// Shape of a Student (the future GET /api/students/{id} response):
// {
//   id, fullName, email, college, degree, graduationYear, cgpa,
//   skills: string[], preferredRoles: string[], preferredLocations: string[],
//   workModePreference: 'ANY' | 'REMOTE' | 'HYBRID' | 'ONSITE',
//   resumeFileName: string,   // file NAME only; no file is ever uploaded
//   updatedAt: 'YYYY-MM-DD'
// }

export const DEMO_STUDENT_ID = 'stu-001'

export const mockStudents = [
    {
        id: 'stu-001',
        fullName: 'Aarav Mehta',
        email: 'aarav.mehta@example.com',
        college: 'Northfield Institute of Technology',
        degree: 'B.Tech',
        graduationYear: 2027,
        cgpa: 8.2,
        skills: [
            'Java',
            'Data Structures',
            'Algorithms',
            'SQL',
            'Python',
            'JavaScript',
            'React',
            'HTML',
            'CSS',
            'Git',
            'Object-Oriented Programming',
        ],
        preferredRoles: ['Backend Development', 'Full Stack Development', 'Frontend Development'],
        preferredLocations: ['Bengaluru', 'Hyderabad', 'Pune'],
        workModePreference: 'HYBRID',
        resumeFileName: '',
        updatedAt: '2026-10-01',
    },
]