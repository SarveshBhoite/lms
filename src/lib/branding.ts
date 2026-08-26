// Unified Institutional Branding System for JVM LMS (EduPulse Cloud)
// Centralizes naming, theme badges, contact info, and role-specific portal identities

export interface InstituteBranding {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  supportEmail: string;
  supportPhone: string;
  websiteUrl: string;
  establishedYear: number;
  accreditation: string;
  portals: {
    student: {
      title: string;
      subtitle: string;
      badge: string;
      themeColor: string;
    };
    trainer: {
      title: string;
      subtitle: string;
      badge: string;
      themeColor: string;
    };
    admin: {
      title: string;
      subtitle: string;
      badge: string;
      themeColor: string;
    };
  };
}

export const INSTITUTE_CONFIG: InstituteBranding = {
  name: "JVM Institute of Technology & Advanced Studies",
  shortName: "JVM LMS",
  tagline: "Enterprise Academic Intelligence & Next-Gen Learning Cloud",
  description: "State-of-the-art Learning Management System engineered for curriculum mastery, live interactive classes, and verifiable credentials.",
  supportEmail: "support@jvminstitute.edu",
  supportPhone: "+1 (800) 555-0199",
  websiteUrl: "https://lms.jvminstitute.edu",
  establishedYear: 2026,
  accreditation: "ISO 9001:2015 & ABET Accredited Academic Platform",
  portals: {
    student: {
      title: "Student Learning Cloud",
      subtitle: "Mastery & Growth",
      badge: "Student Portal",
      themeColor: "indigo",
    },
    trainer: {
      title: "Faculty & Curriculum Studio",
      subtitle: "Academic Management",
      badge: "Faculty Studio",
      themeColor: "amber",
    },
    admin: {
      title: "Enterprise Governance Center",
      subtitle: "Institutional Control",
      badge: "Super Admin",
      themeColor: "rose",
    },
  },
};
