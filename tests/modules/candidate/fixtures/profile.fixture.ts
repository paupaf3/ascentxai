import type { CandidateProfile } from "../../../../src/types/candidate/profile";

export const fullCandidateFixture: CandidateProfile = {
    fullName: "Ada Lovelace",
    email: "ada@example.com",
    phone: "+44 20 0000 0000",
    location: "London, UK",
    headline: "Staff Software Engineer",
    summary: "Ten-year backend specialist with a focus on distributed systems.",
    links: {
        github: "https://github.com/ada",
        linkedin: "https://linkedin.com/in/ada",
        website: null,
    },
    totalYearsOfExperience: 10,
    mostRecentJobTitle: "Staff Software Engineer",
    roles: [
        {
            title: "Staff Software Engineer",
            company: "Acme",
            location: "Remote",
            startDate: "2020-03",
            endDate: "present",
            yearsInRole: 4,
            summary: "Owns the platform team.",
            technologies: ["TypeScript", "Node.js", "PostgreSQL"],
        },
        {
            title: "Senior Software Engineer",
            company: "Globex",
            location: "Berlin",
            startDate: "2016-01",
            endDate: "2020-02",
            yearsInRole: 4,
            summary: "Led payments integrations.",
            technologies: ["Python", "PostgreSQL"],
        },
    ],
    skills: {
        languages: ["TypeScript", "Python"],
        frameworks: ["Next.js"],
        databases: ["PostgreSQL"],
        cloudAndInfra: ["AWS", "Docker"],
        tools: ["GitHub Actions"],
        other: [],
    },
    topSkills: ["TypeScript", "PostgreSQL", "Node.js", "AWS", "Python"],
    education: [
        {
            degree: "BSc",
            field: "Computer Science",
            institution: "Cambridge",
            startYear: "2010",
            endYear: "2013",
        },
    ],
    certifications: [],
    spokenLanguages: [{ language: "English", proficiency: "native" }],
};
