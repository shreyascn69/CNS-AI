
export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

export interface Attachment {
  name: string;
  mimeType: string;
  data: string; // base64
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: Date;
  attachment?: Attachment;
  isResumeData?: boolean; // Flag to indicate this message contains raw JSON for resume generation
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: number;
  mode: string;
}

export interface AudioVisualizerState {
  volume: number;
}

// Structured Data for Resume Generation
export interface ResumeData {
  fullName: string;
  jobTitle: string; // Target role or current title
  contact: {
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    website?: string;
  };
  summary: string;
  experience: {
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate: string;
    highlights: string[];
  }[];
  education: {
    degree: string;
    school: string;
    location?: string;
    year: string;
  }[];
  skills: {
    category: string;
    items: string[];
  }[];
  certifications?: {
    name: string;
    issuer: string;
    year: string;
  }[];
}