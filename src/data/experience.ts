export interface ExperienceRole {
    title: string;
    startYear: number;
    startMonth: number; // 1-12
    endYear: number | null; // null = present/ongoing
    endMonth: number | null;
    details: string[];
    technologies: string[];
}

export interface ExperienceCompany {
    company: string;
    location: string;
    roles: ExperienceRole[];
}

export const experience: ExperienceCompany[] = [
    {
        company: "Healthcare Company",
        location: "Remote",
        roles: [
            {
                title: "Software Engineer III",
                startYear: 2024,
                startMonth: 9,
                endYear: null,
                endMonth: null,
                details: [
                    "Developing and enhancing scalable web applications using Angular and .NET Core.",
                    "Collaborating with cross-functional teams to deliver high-quality features.",
                ],
                technologies: ["Angular", ".NET Core", "Azure", "Kubernetes"],
            },
            {
                title: "Software Engineer II",
                startYear: 2023,
                startMonth: 3,
                endYear: 2024,
                endMonth: 9,
                details: [],
                technologies: [],
            },
        ],
    },
    {
        company: "Software Company B",
        location: "Remote",
        roles: [
            {
                title: "Software Engineer",
                startYear: 2022,
                startMonth: 7,
                endYear: 2023,
                endMonth: 1,
                details: [
                    "Designed and developed responsive, client-centric web applications.",
                    "Modernized legacy systems to improve performance and compatibility.",
                ],
                technologies: ["C#", "Java", "Vue.js", "Flutter", "AWS"],
            },
            {
                title: "Junior Software Developer",
                startYear: 2021,
                startMonth: 4,
                endYear: 2022,
                endMonth: 7,
                details: [],
                technologies: [],
            },
        ],
    },
    {
        company: "Software Company A",
        location: "Hybrid NJ",
        roles: [
            {
                title: "Software Developer",
                startYear: 2018,
                startMonth: 7,
                endYear: 2021,
                endMonth: 1,
                details: [
                    "Delivered cross-platform data analytics tools across Web, iOS, Android, and Windows platforms.",
                    "Specialized in front-end cross-platform development.",
                ],
                technologies: ["iOS", "Android", "WPF", "Javascript"],
            },
        ],
    },
];

const MONTH_NAMES = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sept",
    "Oct",
    "Nov",
    "Dec",
];

export function formatDate(year: number, month: number): string {
    return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function duration(
    start: { year: number; month: number },
    end: { year: number; month: number } | null,
): string {
    let endYear: number;
    let endMonth: number;

    if (end) {
        endYear = end.year;
        endMonth = end.month;
    } else {
        const now = new Date();
        endYear = now.getFullYear();
        endMonth = now.getMonth() + 1;
    }

    const totalMonths =
        (endYear - start.year) * 12 + (endMonth - start.month);

    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    const parts: string[] = [];
    if (years > 0) {
        parts.push(`${years} yr${years === 1 ? "" : "s"}`);
    }
    if (months > 0 || years === 0) {
        parts.push(`${months} mo${months === 1 ? "" : "s"}`);
    }

    return `(${parts.join(" ")})`;
}
