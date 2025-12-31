import { UIDataTypes, UIMessage, UITools } from "ai";
export interface Source {
    url: string;
    title: string;
    type: string;
    description: string;
}
export interface Video {
    url: string;
    title: string;
    platform: string;
    duration?: string;
    description: string;
}
export interface College {
    name: string;
    location: string;
    ranking?: string;
    programs: string[];
    admissionInfo?: string;
}
export interface Career {
    title: string;
    avgSalary?: string;
    description: string;
    similarity?: string;
}
export interface SalaryInsight {
    experienceLevel: string;
    location: string;
    salaryRange: string;
    topCompanies?: string[];
}
export interface Company {
    name: string;
    industry: string;
    companySize?: string;
    location: string;
    roles: string[];
}
export interface Tools {
    provide_sources?: { sources: Source[] };
    suggest_videos?: { videos: Video[] };
    list_colleges?: { colleges: College[] };
    suggest_related_careers?: { careers: Career[] };
    provide_salary_insights?: { position: string; insights: SalaryInsight[] };
    list_companies?: { companies: Company[] };
}

export type MetaData = {
    tools?: Tools;
};

export type AIMessage = UIMessage<MetaData, UIDataTypes, UITools>;
