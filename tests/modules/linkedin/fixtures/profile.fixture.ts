import type { LinkedInProfile } from "../../../../src/types/linkedin/linkedin-profile";

export const fullLinkedInFixture: LinkedInProfile = {
    fullName: "Ada Lovelace",
    headline: "Staff Software Engineer at Acme",
    location: "London, UK",
    connections: 500,
    summary: "Ten-year backend specialist with a focus on distributed systems.",
    profileUrl: "https://linkedin.com/in/ada",

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
    endorsedSkills: [
        { name: "TypeScript", endorsements: 42 },
        { name: "Node.js", endorsements: 30 },
        { name: "PostgreSQL", endorsements: 18 },
    ],

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

    recommendations: [
        {
            recommenderName: "Charles Babbage",
            recommenderTitle: "Engineering Manager at Acme",
            text: "Ada is an exceptional engineer who consistently delivers high-quality work.",
        },
    ],
    volunteerExperience: [],
    courses: [
        { name: "Distributed Systems", associatedWith: "MIT OpenCourseWare" },
    ],
    projects: [],
    publications: [],
};
