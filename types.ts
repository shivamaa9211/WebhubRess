export type TemplateType = 'modern' | 'classic' | 'minimalist' | 'bold' | 'tech';

export interface FieldVisibility {
  // Personal Info
  jobTitle: boolean;
  phone: boolean;
  email: boolean;
  
  // Address
  address: boolean; // street address
  city: boolean;
  state: boolean;
  country: boolean;
  postalCode: boolean;

  // Personal Details
  dateOfBirth: boolean;
  placeOfBirth: boolean;
  nationality: boolean;
  maritalStatus: boolean;
  gender: boolean;
  drivingLicense: boolean;

  // Links
  linkedin: boolean;
  website: boolean;
}

export interface ThemeConfig {
  primaryColor: string; // Used for Sidebar background in Modern
  accentColor: string; // Used for text highlights
  photo: string | null;
  photoShape: 'circle' | 'square' | 'rounded';
  
  // High level section toggles
  sectionVisibility: {
    personalDetails: boolean; 
    links: boolean;
    address: boolean;
    summary: boolean;
    experience: boolean;
    education: boolean;
    skills: boolean;
  };

  // Granular field toggles
  fieldVisibility: FieldVisibility;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  year: string;
  percentage: string;
  grade: string;
  cgpa: string;
  gpa: string;
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  jobTitle: string; // Job Target
  email: string;
  phone: string;
  
  // Address
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;

  // Personal Details
  drivingLicense: string;
  dateOfBirth: string;
  placeOfBirth: string;
  nationality: string;
  maritalStatus: string;
  gender: string;
  
  // Social
  linkedin: string;
  website: string;
}

export interface ResumeData {
  themeConfig: ThemeConfig;
  personalInfo: PersonalInfo;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
}

export const INITIAL_DATA: ResumeData = {
  themeConfig: {
    primaryColor: '#0f172a', // Slate 900
    accentColor: '#4f46e5', // Indigo 600
    photo: null,
    photoShape: 'circle',
    sectionVisibility: {
      personalDetails: true,
      links: true,
      address: true,
      summary: true,
      experience: true,
      education: true,
      skills: true
    },
    fieldVisibility: {
      jobTitle: true,
      phone: true,
      email: true,
      address: true,
      city: true,
      state: true,
      country: true,
      postalCode: true,
      dateOfBirth: true,
      placeOfBirth: true,
      nationality: true,
      maritalStatus: true,
      gender: true,
      drivingLicense: true,
      linkedin: true,
      website: true
    }
  },
  personalInfo: {
    firstName: "",
    lastName: "",
    jobTitle: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    drivingLicense: "",
    dateOfBirth: "",
    placeOfBirth: "",
    nationality: "",
    maritalStatus: "",
    gender: "",
    linkedin: "",
    website: ""
  },
  summary: "",
  experience: [],
  education: [],
  skills: []
};