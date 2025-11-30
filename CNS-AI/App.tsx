

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { ConnectionStatus, ChatMessage, Attachment, ChatSession, ResumeData } from './types';
import { 
  SYSTEM_INSTRUCTION, 
  HR_SYSTEM_INSTRUCTION, 
  INTERVIEW_SYSTEM_INSTRUCTION, 
  RESUME_GENERATOR_SYSTEM_INSTRUCTION, 
  RESUME_SCORER_INSTRUCTION,
  PRODUCT_SYSTEM_INSTRUCTION,
  SOCIAL_PLATFORM_INSTRUCTIONS,
  VOICE_NAME 
} from './constants';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from './utils/audioUtils';
import OrbVisualizer from './components/OrbVisualizer';
import ChatLog, { AILogo } from './components/ChatLog';
import { saveToGoogleSheets } from './services/googleSheets';
import { generateResumeDoc } from './services/resumeGenerator';

// --- Dock Components ---
import { Dock, DockIcon, DockItem, DockLabel } from './components/ui/dock';
// --- Lucide Icons for Dock & Theme ---
import { 
  Home, 
  Share2, 
  ShoppingBag, 
  Users, 
  MessageCircle, 
  X,
  Award,
  PenTool,
  Twitter,
  Instagram,
  Facebook,
  Youtube, 
  Ghost,
  MessageSquare,
  Sun,
  Moon
} from 'lucide-react';

// --- LOCAL ICONS ---
const MenuIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

const TrashIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const MicIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
);

const MicOffIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02 5.01L13 14.06V14c0-.55-.45-1-1-1H9.41l2.43 2.43c.18.1.39.17.61.17.22 0 .43-.07.61-.17l.33.33zM4.27 3L3 4.27 7.73 9H7.5l.08.12.04.04c-.37.91-.58 1.9-.62 2.94H5.06c.04 1.28.32 2.48.81 3.58l.61-.61c-.34-.92-.53-1.92-.53-2.97h1.7c0 1.05.29 2.03.79 2.89l.86-.86c-.23-.62-.36-1.29-.36-1.99v-.66l4.61 4.61V21h1.94v-3.08c1.37-.2 2.64-.72 3.73-1.46l2.12 2.12L21 17.73 4.27 3zM12 4c1.1 0 2 .9 2 2v3.81l2 2V6c0-2.21-1.79-4-4-4-.79 0-1.51.23-2.12.63l1.51 1.51C11.58 4.05 11.78 4 12 4z"/></svg>
);

const CaptionsIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19 4H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm-3 13H8v-1.5h8V17zm2-3H6v-1.5h12V14zm0-3H6V9.5h12V11z"/>
  </svg>
);

const CaptionsOffIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
     <path d="M21.19 21.19L2.81 2.81 1.39 4.22l2.27 2.27C3.21 7.08 3 7.52 3 8v8c0 1.1.9 2 2 2h12c.48 0 .92-.21 1.25-.55l1.52 1.52 1.42-1.42zM5 16V8.45l7.55 7.55H5zM12 4c1.1 0 2 .9 2 2v.45l2 2V8h3v1.5h-1.45l2 2H21V6c0-1.1-.9-2-2-2H12z"/>
  </svg>
);

const PlusIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const SendIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);

const PaperClipIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
    </svg>
);

const PhotosIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" className={className} fill="none">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="12" d="M22 22L170 170" stroke="currentColor"/>
       <path d="M96 22L170 96L96 170L22 96L96 170L22 96L96 170L22 96L96 22Z" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
       <circle cx="96" cy="96" r="30" stroke="currentColor" strokeWidth="12" />
    </svg>
);

const CloseIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const NewChatIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
);

const ResumeAnalysisIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        {/* Document Outline */}
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        
        {/* User Icon on Doc */}
        <circle cx="9" cy="5.5" r="1.5" fill="currentColor" className="opacity-70" stroke="none" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8.5h4" />
        
        {/* Lines */}
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 11.5h6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 14.5h3" />

        {/* Magnifying Glass */}
        <circle cx="16.5" cy="16.5" r="4.5" stroke="currentColor" fill="#1a1a1a" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 19.5L21.75 21.75" />
        
        {/* Pie Chart inside Glass */}
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 16.5V13.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 16.5L18.75 18" />
    </svg>
);

const FileTypeIcon = ({ type, className = "w-6 h-6" }: { type: string, className?: string }) => {
    if (type.includes('pdf')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 013.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 013.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875zM12.75 12a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V18a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V12z" clipRule="evenodd" />
          <path d="M14.25 5.25a5.23 5.23 0 00-1.279-3.434 9.768 9.768 0 016.963 6.963A5.23 5.23 0 0016.5 7.5h-1.875a.375.375 0 01-.375-.375V5.25z" />
        </svg>
      );
    } else if (type.includes('word') || type.includes('doc')) {
      return (
         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 013.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 013.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875zM12.75 12a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V18a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V12z" clipRule="evenodd" />
          <path d="M14.25 5.25a5.23 5.23 0 00-1.279-3.434 9.768 9.768 0 016.963 6.963A5.23 5.23 0 0016.5 7.5h-1.875a.375.375 0 01-.375-.375V5.25z" />
        </svg>
      );
    }
    return <PaperClipIcon className={className} />;
}

const InfoIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  </svg>
);

// --- DATABASE ICONS ---
const FirebaseIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M3.89 15.672L6.255 3.56a.562.562 0 011.082-.09l1.968 9.356.55-3.666a.563.563 0 011.066-.145L13.14 15.1l2.455-12.822a.563.563 0 011.054-.117l4.49 14.282L12.59 22.8a.938.938 0 01-.98 0l-7.72-7.128z" fill="#FFC107"/>
        <path d="M12.1 22.8L21.138 16.443 16.65 2.16a.563.563 0 00-1.055.117L13.14 15.1l-1.04 6.7z" fill="#FFA000"/>
    </svg>
);

const SupabaseIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13.35 2.25c-.56 0-1.05.33-1.25.84L7.02 14.88c-.28.7.24 1.47 1 1.47h4.15l-1.87 6.63c-.15.53.49.95.91.59l8.6-7.39c.56-.48.22-1.38-.51-1.38h-4.6l1.3-4.96.03-.13.3-1.16c.15-.53-.49-.95-.91-.59L13.35 2.25z" fill="#3ECF8E"/>
    </svg>
);

const NotionIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l10.725-.746c.98-.047 1.073-.327.98-.98C18.5 2.152 17.567 1.5 16.307 1.5c-.886 0-3.172.186-6.39.42-3.871.28-5.783.513-5.783.513-.746.046-1.073.326-1.073.886 0 .42.42.56.933.886h.465zm-.606 1.632c-.513 0-.793.187-.793.746v14.137c0 .513.233.933.746 1.306.466.326 2.053 1.352 3.499 1.352.28 0 .653-.047.933-.094L18.686 21c.56 0 .793-.373.793-.933V6.26c0-.56-.28-.793-.84-.793l-14.78.373zm1.68 1.446h2.286l5.738 10.306V7.472h2.006v11.752h-2.1l-6.018-10.773v10.586H5.533V7.286z"/>
    </svg>
);

const GoogleSheetsIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
    <svg viewBox="0 0 87.3 78" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="m57.95 13.9h-36.6c-4.15 0-7.5 3.35-7.5 7.5v55.2c0 4.15 3.35 7.5 7.5 7.5h49.6c4.15 0 7.5-3.35 7.5-7.5v-44.1z" fill="#0f9d58"/>
        <path d="m57.95 13.9 20.5 20.5h-13c-4.15 0-7.5-3.35-7.5-7.5z" fill="#cadcc8"/>
        <path d="m32 60.5h38v-5h-38zm0-11h38v-5h-38zm0-11h38v-5h-38zm0-11h20v-5h-20z" fill="#fff"/>
    </svg>
);

interface UploadOptionProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isDarkMode: boolean;
}

const UploadOption: React.FC<UploadOptionProps> = ({ icon, label, onClick, isDarkMode }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 transition-colors text-left ${isDarkMode ? 'hover:bg-[#2a2b2d]' : 'hover:bg-gray-100'}`}
  >
    <span className="text-gray-300">{icon}</span>
    <span className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{label}</span>
  </button>
);


const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'active'>('home');
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCaptionsEnabled, setIsCaptionsEnabled] = useState(false);
  const [realtimeTranscript, setRealtimeTranscript] = useState('');
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isUploadMenuOpen, setIsUploadMenuOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<Attachment | null>(null);
  const [activeMode, setActiveMode] = useState<string>('default');
  const [activeSocialPlatform, setActiveSocialPlatform] = useState<string | null>(null);

  // Sidebar & History State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false); 
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Database State
  const [isDatabaseMenuOpen, setIsDatabaseMenuOpen] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState<'firebase' | 'supabase' | 'notion' | 'sheets' | null>(null);
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('');
  const [showSheetConfig, setShowSheetConfig] = useState(false);

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // --- DOCK STATE & RESPONSIVENESS ---
  const [isDockVisible, setIsDockVisible] = useState(false);
  
  // Responsive Dock Settings
  const [dockConfig, setDockConfig] = useState({
    magnification: 80,
    distance: 140,
    itemWidth: 64,
    gap: 'gap-4'
  });

  // Check Local Storage for Theme on Mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) { // Mobile breakpoint
        setDockConfig({
          magnification: 60,
          distance: 100, // Reduced distance for interaction
          itemWidth: 40, // Smaller base size for mobile
          gap: 'gap-2' // Tighter gap
        });
      } else {
        setDockConfig({
          magnification: 80,
          distance: 140,
          itemWidth: 64,
          gap: 'gap-4'
        });
      }
    };
    
    // Initial calculation
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update Body Background Color based on Theme
  useEffect(() => {
    document.body.style.backgroundColor = isDarkMode ? '#000000' : '#f8fafc'; // Black vs Slate-50
    document.body.style.color = isDarkMode ? '#e2e8f0' : '#0f172a';
  }, [isDarkMode]);

  // Audio Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Logic Refs
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const currentInputTranscriptionRef = useRef<string>('');
  const currentOutputTranscriptionRef = useRef<string>('');
  const sessionRef = useRef<Promise<any> | null>(null);
  const chatSessionRef = useRef<any>(null); 
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMenuRef = useRef<HTMLDivElement>(null);
  const databaseMenuRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const aboutMenuRef = useRef<HTMLDivElement>(null);

  // Load chat history from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('chatHistory');
    if (saved) {
        try {
            setChatHistory(JSON.parse(saved));
        } catch (e) {
            console.error("Failed to parse chat history", e);
        }
    }
  }, []);

  // Save chat history to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
  }, [chatHistory]);

  // Auto-save current chat session
  useEffect(() => {
    if (messages.length > 0) {
        const title = messages[0].text.slice(0, 30) || "New Chat";
        
        if (currentSessionId) {
            setChatHistory(prev => prev.map(session => 
                session.id === currentSessionId 
                    ? { ...session, messages, timestamp: Date.now() } 
                    : session
            ));
        } else {
            const newId = Date.now().toString();
            const newSession: ChatSession = {
                id: newId,
                title,
                messages,
                timestamp: Date.now(),
                mode: activeMode
            };
            setCurrentSessionId(newId);
            setChatHistory(prev => [newSession, ...prev]);
        }
    }
  }, [messages, activeMode]); 

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (uploadMenuRef.current && !uploadMenuRef.current.contains(event.target as Node)) {
        setIsUploadMenuOpen(false);
      }
      if (databaseMenuRef.current && !databaseMenuRef.current.contains(event.target as Node)) {
        setIsDatabaseMenuOpen(false);
      }
      if (isSidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsSidebarOpen(false);
      }
      if (aboutMenuRef.current && !aboutMenuRef.current.contains(event.target as Node)) {
        setIsAboutOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [uploadMenuRef, databaseMenuRef, isSidebarOpen, aboutMenuRef]);

  // Handle Trigger Commands
  useEffect(() => {
    // Database Trigger
    if (textInput.includes('#database#')) {
        setTextInput(prev => prev.replace('#database#', ''));
        setIsDatabaseMenuOpen(true);
    }
    // Dock Trigger
    if (textInput.includes('#ALL-AI#')) {
        setTextInput(prev => prev.replace('#ALL-AI#', ''));
        setIsDockVisible(true);
    }
  }, [textInput]);

  const toggleTheme = () => {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const connectToGemini = async (mode: string = 'default') => {
    if (!process.env.API_KEY) {
      alert("API Key is missing. Please check your configuration.");
      return;
    }

    try {
      disconnect(); // Ensure any existing session is closed
      
      setView('active');
      setStatus(ConnectionStatus.CONNECTING);
      setActiveMode(mode); 
      setRealtimeTranscript('');
      
      // Initialize Audio Contexts
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      // Ensure contexts are running (important for browsers requiring user gesture)
      if (inputAudioContextRef.current.state === 'suspended') {
        await inputAudioContextRef.current.resume();
      }
      if (outputAudioContextRef.current.state === 'suspended') {
        await outputAudioContextRef.current.resume();
      }

      // Setup Output Analyser
      const outputAnalyser = outputAudioContextRef.current.createAnalyser();
      outputAnalyser.fftSize = 256;
      outputAnalyser.smoothingTimeConstant = 0.8;
      outputAnalyserRef.current = outputAnalyser;
      outputAnalyser.connect(outputAudioContextRef.current.destination);

      // Setup Input Analyser
      const inputAnalyser = inputAudioContextRef.current.createAnalyser();
      inputAnalyser.fftSize = 256;
      inputAnalyser.smoothingTimeConstant = 0.8;
      inputAnalyserRef.current = inputAnalyser;

      // Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Select System Instruction & Voice based on mode
      let activeSystemInstruction = SYSTEM_INSTRUCTION;
      let activeVoiceName = VOICE_NAME; 

      if (mode === 'interview') {
          activeSystemInstruction = INTERVIEW_SYSTEM_INSTRUCTION;
          activeVoiceName = 'Puck'; 
      } else if (mode === 'hr') {
          activeSystemInstruction = HR_SYSTEM_INSTRUCTION;
          activeVoiceName = 'Kore'; 
      }

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO], // Using Modality.AUDIO
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: activeVoiceName } },
          },
          systemInstruction: activeSystemInstruction,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            console.log('Gemini Live API Connected');
            setStatus(ConnectionStatus.CONNECTED);
            
            if (!inputAudioContextRef.current || !streamRef.current || !inputAnalyserRef.current) return;
            
            const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
            inputSourceRef.current = source;
            
            source.connect(inputAnalyserRef.current);

            const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;
            
            processor.onaudioprocess = (e) => {
              if (isMicMuted) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              // Use sessionPromise here safely
              if (sessionRef.current) {
                sessionRef.current.then((session) => {
                    session.sendRealtimeInput({ media: pcmBlob });
                }).catch(err => {
                    console.error("Error sending input", err);
                });
              }
            };
            
            source.connect(processor);
            processor.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
               const text = message.serverContent.outputTranscription.text;
               currentOutputTranscriptionRef.current += text;
               setRealtimeTranscript(currentOutputTranscriptionRef.current);
            } else if (message.serverContent?.inputTranscription) {
               const text = message.serverContent.inputTranscription.text;
               currentInputTranscriptionRef.current += text;
               setRealtimeTranscript(currentInputTranscriptionRef.current);
            }

            if (message.serverContent?.turnComplete) {
               currentInputTranscriptionRef.current = '';
               currentOutputTranscriptionRef.current = '';
               // Optional: clear transcript after turn, or keep it until next turn
               // setRealtimeTranscript(''); 
            }

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              try {
                const audioBuffer = await decodeAudioData(base64ToUint8Array(base64Audio), ctx);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                
                if (outputAnalyserRef.current) {
                    source.connect(outputAnalyserRef.current);
                } else {
                    source.connect(ctx.destination);
                }

                source.addEventListener('ended', () => {
                  audioSourcesRef.current.delete(source);
                });
                
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                audioSourcesRef.current.add(source);
              } catch (err) {
                console.error("Error decoding audio", err);
              }
            }

            if (message.serverContent?.interrupted) {
              audioSourcesRef.current.forEach(src => {
                try { src.stop(); } catch(e) {}
                audioSourcesRef.current.delete(src);
              });
              nextStartTimeRef.current = 0;
              currentOutputTranscriptionRef.current = '';
              setRealtimeTranscript('');
            }
          },
          onclose: () => {
            console.log("Session closed");
            setStatus(ConnectionStatus.DISCONNECTED);
          },
          onerror: (e) => {
            console.error("Session error", e);
            setStatus(ConnectionStatus.ERROR);
            disconnect();
          }
        }
      });
      
      // Store reference and handle initial connection failure
      sessionRef.current = sessionPromise;
      sessionPromise.catch(err => {
          console.error("Failed to connect:", err);
          setStatus(ConnectionStatus.ERROR);
          disconnect();
      });

    } catch (error) {
      console.error("Connection failed", error);
      setStatus(ConnectionStatus.ERROR);
    }
  };

  const disconnect = () => {
    // Stop all media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Disconnect audio nodes
    if (inputSourceRef.current) {
      inputSourceRef.current.disconnect();
      inputSourceRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    // Close Audio Contexts
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    
    // Stop any playing audio sources
    audioSourcesRef.current.forEach(src => {
        try { src.stop(); } catch(e) {}
    });
    audioSourcesRef.current.clear();
    
    // Close the GenAI Session
    if (sessionRef.current) {
        sessionRef.current.then((session) => session.close()).catch(() => {});
        sessionRef.current = null;
    }
    
    setStatus(ConnectionStatus.DISCONNECTED);
    setView('home');
    setRealtimeTranscript('');
  };

  const toggleMute = () => {
    setIsMicMuted(!isMicMuted);
  };
  
  const toggleCaptions = () => {
    setIsCaptionsEnabled(!isCaptionsEnabled);
  };

  const handleFileUploadClick = () => {
      setIsUploadMenuOpen(!isUploadMenuOpen);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
    setIsUploadMenuOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (
        file.type.includes('word') || 
        file.type.includes('document') || 
        file.type.includes('msword') ||
        file.name.endsWith('.doc') || 
        file.name.endsWith('.docx')
      ) {
        alert("Word documents (.doc, .docx) are not currently supported. Please convert to PDF.");
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
         alert("Unsupported file type. Please upload a PDF or Image.");
         if (fileInputRef.current) fileInputRef.current.value = '';
         return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1];
          
          setSelectedFile({
              name: file.name,
              data: base64Data,
              mimeType: file.type
          });
      };
      reader.readAsDataURL(file);
      e.target.value = ''; 
  };

  const clearSelectedFile = () => {
      setSelectedFile(null);
  };

  const handleNewChat = () => {
      setMessages([]);
      chatSessionRef.current = null;
      setTextInput('');
      setSelectedFile(null);
      setActiveMode('default');
      setActiveSocialPlatform(null);
      setCurrentSessionId(null);
      setIsSidebarOpen(false);
      setView('home');
      setIsDockVisible(false);
  };

  const deleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatHistory(prev => prev.filter(c => c.id !== id));
    if (currentSessionId === id) {
        handleNewChat();
    }
  };

  const loadChat = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setActiveMode(session.mode);
    setIsSidebarOpen(false);
    setView('home');
  };

  const switchMode = (mode: string, initialPrompt: string | null = null) => {
    setActiveMode(mode);
    setMessages([]); 
    setCurrentSessionId(null); 
    chatSessionRef.current = null; 
    setActiveSocialPlatform(null);
    
    let modeLabel = 'Default';
    let welcomeMessage = `Switched to **${modeLabel}** mode.`;

    if (mode === 'social') {
        modeLabel = 'Social Media';
        welcomeMessage = ''; // Handled by selectSocialPlatform or empty grid
    } else if (mode === 'product') {
        modeLabel = 'Productly';
        welcomeMessage = `**Hello! I am Productly.** \n\nI am your product recommendation assistant. Tell me what you're looking to buy, your budget, and any must-have features.`;
    } else if (mode === 'resume-analyzer') {
        modeLabel = 'Resume Analyzer';
        welcomeMessage = `Switched to **${modeLabel}** mode.`;
    } else if (mode === 'resume-score') {
        modeLabel = 'Resume Score Checker';
        welcomeMessage = `**Resume Score Checker Activated.** 🎯\n\nPlease upload your resume (PDF/Image) for a detailed section-by-section analysis and score.`;
    } else if (mode === 'resume-generator') {
        modeLabel = 'Resume Generator';
        welcomeMessage = `Switched to **${modeLabel}** mode.`;
    } else if (mode === 'interview') {
        modeLabel = 'Interview';
        welcomeMessage = `Switched to **${modeLabel}** mode.`;
    } else if (mode === 'hr') {
        modeLabel = 'HR Assistant';
        welcomeMessage = `Switched to **${modeLabel}** mode.`;
    }

    // If social, we do NOT want to clear messages immediately or set a welcome message
    // because we want to show the Social Hub Grid first.
    if (mode !== 'social') {
        setMessages([{
            id: Date.now().toString(),
            role: 'assistant',
            text: welcomeMessage,
            timestamp: new Date()
        }]);
    }

    // Initial Trigger for Resume Generator to start the flow
    if (mode === 'resume-generator') {
        setTimeout(() => {
           handleSendMessage(undefined, "Hello! I am ready to build your resume. Please guide me through the process.");
        }, 500);
    } else if (initialPrompt) {
        setTextInput(initialPrompt);
    }

    // Also hide Dock if it was used to switch
    setIsDockVisible(false);
  }

  const selectSocialPlatform = (platform: string) => {
      setActiveSocialPlatform(platform);
      
      // Map friendly names
      const platformNames: Record<string, string> = {
          twitter: "Twitter/X",
          instagram: "Instagram",
          facebook: "Facebook",
          youtube: "YouTube",
          snapchat: "Snapchat",
          reddit: "Reddit"
      };

      const platformName = platformNames[platform] || "Social Media";

      setMessages([{
        id: Date.now().toString(),
        role: 'assistant',
        text: `**${platformName} Agent Activated.**\n\nI can help you with content ideas, hooks, and strategies specifically for ${platformName}.\n\n**What niche or topic should we focus on?**`,
        timestamp: new Date()
      }]);
      chatSessionRef.current = null; // Reset chat session to pick up new system instruction
  };

  const selectDatabase = (db: 'firebase' | 'supabase' | 'notion' | 'sheets') => {
      if (db === 'sheets') {
        setShowSheetConfig(true);
        return; 
      }
      setSelectedDatabase(db);
      setIsDatabaseMenuOpen(false);
      setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          text: `**Database Connected:** All subsequent data will be synced with **${db.charAt(0).toUpperCase() + db.slice(1)}**.`,
          timestamp: new Date()
      }]);
  };

  const confirmSheetConfig = () => {
      if (!googleSheetsUrl) {
          alert("Please enter the Web App URL.");
          return;
      }
      setSelectedDatabase('sheets');
      setShowSheetConfig(false);
      setIsDatabaseMenuOpen(false);
      setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          text: `**Google Sheets Connected!** Data will be saved to your sheet.`,
          timestamp: new Date()
      }]);
  };

  const handleDictation = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
        return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (isListening) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    recognition.start();

    recognition.onresult = (event: any) => {
        const speechResult = event.results[0][0].transcript;
        setTextInput(prev => {
            return prev ? prev + ' ' + speechResult : speechResult;
        });
        setIsListening(false);
    };

    recognition.onspeechend = () => {
        recognition.stop();
        setIsListening(false);
    };

    recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
    };
  };

  const handleSendMessage = async (e?: React.FormEvent, forcedText?: string) => {
    e?.preventDefault();
    if ((!textInput.trim() && !selectedFile && !forcedText) || isTyping) return;
    if (!process.env.API_KEY) return;

    const userText = forcedText || textInput.trim();
    const currentFile = selectedFile;

    setTextInput('');
    setSelectedFile(null);
    setIsTyping(true);

    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: new Date(),
      attachment: currentFile ? currentFile : undefined
    };
    
    setMessages(prev => [...prev, newUserMsg]);

    let currentSystemInstruction = SYSTEM_INSTRUCTION;
    if (activeMode === 'social') {
        if (activeSocialPlatform && SOCIAL_PLATFORM_INSTRUCTIONS[activeSocialPlatform as keyof typeof SOCIAL_PLATFORM_INSTRUCTIONS]) {
            currentSystemInstruction = SOCIAL_PLATFORM_INSTRUCTIONS[activeSocialPlatform as keyof typeof SOCIAL_PLATFORM_INSTRUCTIONS];
        } else {
            currentSystemInstruction = SOCIAL_PLATFORM_INSTRUCTIONS.general;
        }
    } else if (activeMode === 'product') {
        currentSystemInstruction = PRODUCT_SYSTEM_INSTRUCTION;
    } else if (activeMode === 'resume-analyzer') {
        currentSystemInstruction = `You are an expert ATS Resume Analyzer. Critically analyze the uploaded resume. Provide feedback on formatting, keywords, impact, and missing sections. Do not use JSON. Use structured Markdown.`;
    } else if (activeMode === 'resume-score') {
        currentSystemInstruction = RESUME_SCORER_INSTRUCTION;
    } else if (activeMode === 'resume-generator') {
        currentSystemInstruction = RESUME_GENERATOR_SYSTEM_INSTRUCTION;
    } else if (activeMode === 'interview') {
        currentSystemInstruction = "You are an expert Technical Recruiter. Conduct a job interview.";
    } else if (activeMode === 'hr') {
        currentSystemInstruction = "You are Shreyas, an HR Assistant. Answer questions about company policy, leaves, and benefits.";
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      if (!chatSessionRef.current) {
        chatSessionRef.current = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction: currentSystemInstruction
          }
        });
      }

      let messagePayload;
      if (currentFile) {
          messagePayload = [
              { text: userText || "Analyze this file" },
              { inlineData: { mimeType: currentFile.mimeType, data: currentFile.data } }
          ];
      } else {
          messagePayload = userText;
      }

      const result = await chatSessionRef.current.sendMessageStream({ message: messagePayload });
      
      let fullText = '';
      const botMsgId = Date.now().toString() + '_bot';
      
      setMessages(prev => [...prev, {
        id: botMsgId,
        role: 'assistant',
        text: '',
        timestamp: new Date()
      }]);

      for await (const chunk of result) {
        const text = chunk.text;
        fullText += text;
        setMessages(prev => prev.map(msg => 
          msg.id === botMsgId ? { ...msg, text: fullText } : msg
        ));
      }

      // Check for JSON Resume Data in the response
      if (activeMode === 'resume-generator' && fullText.includes('```json')) {
          try {
              const jsonMatch = fullText.match(/```json\n([\s\S]*?)\n```/);
              if (jsonMatch && jsonMatch[1]) {
                  const resumeData = JSON.parse(jsonMatch[1]) as ResumeData;
                  setMessages(prev => [...prev, {
                      id: Date.now().toString() + '_gen',
                      role: 'assistant',
                      text: "✅ Data captured! Generating your professional resume document...",
                      timestamp: new Date()
                  }]);
                  
                  // Trigger Document Generation
                  const { fileName, template } = await generateResumeDoc(resumeData);
                  
                  setMessages(prev => [...prev, {
                      id: Date.now().toString() + '_download',
                      role: 'assistant',
                      text: `🎉 **Resume Generated!**\n\nFile: **${fileName}**\nTemplate: ${template}\n\nThe file should have started downloading automatically.`,
                      timestamp: new Date()
                  }]);
              }
          } catch (e) {
              console.error("Failed to parse resume JSON", e);
          }
      }

      if (selectedDatabase === 'sheets' && googleSheetsUrl) {
         await saveToGoogleSheets(googleSheetsUrl, 'user', userText);
         await saveToGoogleSheets(googleSheetsUrl, 'assistant', fullText);
      }

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        text: "I'm sorry, I'm having trouble processing that request. Please try again with a valid image or PDF.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
  };

  const getActiveAgentLabel = () => {
    switch(activeMode) {
        case 'resume-analyzer': return 'Resume Analysis';
        case 'resume-score': return 'Resume Scorer';
        case 'resume-generator': return 'Resume Builder';
        case 'social': 
            if (activeSocialPlatform) {
                 const names: Record<string, string> = {
                    twitter: "Twitter/X Agent",
                    instagram: "Instagram Agent",
                    facebook: "Facebook Agent",
                    youtube: "YouTube Agent",
                    snapchat: "Snapchat Agent",
                    reddit: "Reddit Agent"
                };
                return names[activeSocialPlatform];
            }
            return 'Social Media Manager';
        case 'product': return 'Productly - Shopping';
        case 'hr': return 'HR Agent';
        case 'interview': return 'Interview Agent';
        default: return '';
    }
  };

  // --- DOCK ITEMS ---
  const dockItems = [
    { 
        title: 'Home', 
        icon: <Home className="w-full h-full text-slate-300" />, 
        action: handleNewChat, 
        glow: 'hover:shadow-[0_0_25px_rgba(203,213,225,0.6)]' 
    },
    { 
        title: 'Social', 
        icon: <Share2 className="w-full h-full text-fuchsia-400" />, 
        action: () => switchMode('social'), 
        glow: 'hover:shadow-[0_0_25px_rgba(232,121,249,0.7)]' 
    },
    { 
        title: 'Product', 
        icon: <ShoppingBag className="w-full h-full text-cyan-400" />, 
        action: () => switchMode('product'), 
        glow: 'hover:shadow-[0_0_25px_rgba(34,211,238,0.7)]' 
    },
    // Removed Resume Check (Icon 2) as requested
    { 
        title: 'HR Assist', 
        icon: <Users className="w-full h-full text-pink-400" />, 
        action: () => { connectToGemini('hr'); setIsDockVisible(false); }, 
        glow: 'hover:shadow-[0_0_25px_rgba(244,114,182,0.7)]' 
    },
    { 
        title: 'Interview', 
        icon: <MessageCircle className="w-full h-full text-lime-400" />, 
        action: () => { connectToGemini('interview'); setIsDockVisible(false); }, 
        glow: 'hover:shadow-[0_0_25px_rgba(163,230,53,0.7)]' 
    },
    { 
        title: 'Close', 
        icon: <X className="w-full h-full text-red-500" />, 
        action: () => setIsDockVisible(false), 
        glow: 'hover:shadow-[0_0_25px_rgba(239,68,68,0.7)]' 
    },
  ];

  // --- RENDER HOME VIEW ---
  if (view === 'home') {
    return (
      <div className={`h-screen w-full flex flex-col font-sans relative overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-[#000000] text-white' : 'bg-slate-50 text-slate-900'}`}>
        
        {/* DOCK OVERLAY - FOCUS MODE */}
        {isDockVisible && (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-end pb-12 bg-black/60 backdrop-blur-md animate-fade-in transition-all duration-300">
                <div className="text-center text-gray-400 font-light pointer-events-none mb-8 animate-fade-in px-4">
                    <h2 className="text-xl md:text-2xl text-white font-medium mb-2">Select an Agent</h2>
                    <p className="text-sm md:text-base opacity-80">Click any icon to switch context</p>
                </div>
                <Dock 
                    magnification={dockConfig.magnification}
                    distance={dockConfig.distance}
                    itemWidth={dockConfig.itemWidth}
                    className={`items-end pb-8 bg-black/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl ${dockConfig.gap}`}
                >
                    {dockItems.map((item, idx) => (
                        <DockItem
                            key={idx}
                            className={`aspect-square rounded-full bg-[#1a1a1a] border border-white/5 overflow-visible ${item.glow}`}
                        >
                            <DockLabel>{item.title}</DockLabel>
                            <DockIcon>
                                <div onClick={item.action} className="w-full h-full p-2 cursor-pointer flex items-center justify-center">
                                    {item.icon}
                                </div>
                            </DockIcon>
                        </DockItem>
                    ))}
                </Dock>
            </div>
        )}

        {/* MAIN CONTENT WRAPPER */}
        <div className={`flex-1 flex flex-col h-full transition-all duration-500 ${isDockVisible ? 'opacity-0 blur-xl scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
            
            {/* Sidebar Drawer */}
            <div 
            className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setIsSidebarOpen(false)}
            />
            <div 
            ref={sidebarRef}
            className={`fixed inset-y-0 left-0 w-72 backdrop-blur-2xl border-r transform transition-transform duration-300 z-50 flex flex-col shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${isDarkMode ? 'bg-black/80 border-white/10' : 'bg-white/90 border-gray-200'}`}
            >
                <div className="p-4">
                    <button 
                        onClick={handleNewChat}
                        className={`w-full flex items-center gap-3 p-3 rounded-full transition-colors mb-4 border shadow-md ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-white border-gray-700' : 'bg-blue-600 hover:bg-blue-700 text-white border-transparent'}`}
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span className="text-sm font-medium">New chat</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-hide">
                    <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recent</h3>
                    {chatHistory.length === 0 ? (
                        <div className="text-center text-gray-500 text-sm py-4 italic">No recent chats</div>
                    ) : (
                        chatHistory.map((session) => (
                            <div 
                                key={session.id}
                                onClick={() => loadChat(session)}
                                className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors relative 
                                    ${currentSessionId === session.id 
                                        ? (isDarkMode ? 'bg-[#2a2b2d] text-white' : 'bg-gray-200 text-gray-900') 
                                        : (isDarkMode ? 'text-gray-400 hover:bg-[#2a2b2d] hover:text-gray-200' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 shrink-0">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                                </svg>
                                <span className="text-sm truncate pr-6">{session.title}</span>
                                
                                <button 
                                    onClick={(e) => deleteChat(session.id, e)}
                                    className="absolute right-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                    title="Delete chat"
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className={`p-4 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                    <button 
                        onClick={() => {
                            setIsSidebarOpen(false);
                            setIsAboutOpen(true);
                        }} 
                        className={`w-full flex items-center gap-3 text-sm p-2 rounded-lg transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-[#2a2b2d]' : 'text-gray-600 hover:text-black hover:bg-gray-100'}`}
                    >
                        <InfoIcon className="w-5 h-5" />
                        About
                    </button>
                </div>
            </div>

            {/* Modal Overlay for About Menu */}
            {isAboutOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in px-4">
                    <div ref={aboutMenuRef} className={`backdrop-blur-xl border rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all scale-100 ${isDarkMode ? 'bg-black/80 border-white/10' : 'bg-white/90 border-gray-200'}`}>
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <AILogo className="w-8 h-8 animate-spin-slow" />
                                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>CNS AI</h2>
                            </div>
                            <button onClick={() => setIsAboutOpen(false)} className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>
                                <CloseIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className={`space-y-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <p>
                                <strong>CNS - The Overall Assistant.</strong>
                            </p>
                            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                A professional AI HR assistant providing real-time voice support for company policies, leaves, and benefits. 
                                Capable of analyzing resumes, conducting interviews, and assisting with social media and product research.
                            </p>
                            <div className={`pt-4 border-t text-xs ${isDarkMode ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
                                Version 1.0.0
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Overlay for Database Menu */}
            {isDatabaseMenuOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div ref={databaseMenuRef} className={`backdrop-blur-xl border rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all scale-100 ${isDarkMode ? 'bg-black/80 border-white/10' : 'bg-white/90 border-gray-200'}`}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Select Database</h2>
                            <button onClick={() => setIsDatabaseMenuOpen(false)} className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>
                                <CloseIcon className="w-6 h-6" />
                            </button>
                        </div>
                        
                        {showSheetConfig ? (
                            <div className="space-y-4">
                                <input 
                                    type="text" 
                                    placeholder="Paste Web App URL here..." 
                                    value={googleSheetsUrl}
                                    onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                                    className={`w-full border rounded-lg p-3 text-sm focus:border-blue-500 outline-none ${isDarkMode ? 'bg-[#2a2b2d] border-gray-600 text-white' : 'bg-white border-gray-300 text-black'}`}
                                />
                                <button 
                                    onClick={confirmSheetConfig}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-medium transition-colors"
                                >
                                    Connect & Save
                                </button>
                                <button 
                                    onClick={() => setShowSheetConfig(false)}
                                    className={`w-full text-sm mt-2 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}
                                >
                                    Back
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => selectDatabase('firebase')} className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all gap-2 opacity-50 cursor-not-allowed ${isDarkMode ? 'bg-[#2a2b2d] hover:bg-[#333436] border-transparent hover:border-yellow-500' : 'bg-gray-100 hover:bg-gray-200 border-gray-200'}`}>
                                    <FirebaseIcon />
                                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Firebase (Pro)</span>
                                </button>
                                <button onClick={() => selectDatabase('supabase')} className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all gap-2 opacity-50 cursor-not-allowed ${isDarkMode ? 'bg-[#2a2b2d] hover:bg-[#333436] border-transparent hover:border-emerald-500' : 'bg-gray-100 hover:bg-gray-200 border-gray-200'}`}>
                                    <SupabaseIcon />
                                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Supabase (Pro)</span>
                                </button>
                                <button onClick={() => selectDatabase('notion')} className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all gap-2 opacity-50 cursor-not-allowed ${isDarkMode ? 'bg-[#2a2b2d] hover:bg-[#333436] border-transparent hover:border-gray-400' : 'bg-gray-100 hover:bg-gray-200 border-gray-200'}`}>
                                    <NotionIcon />
                                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Notion (Pro)</span>
                                </button>
                                <button onClick={() => selectDatabase('sheets')} className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all gap-2 ${isDarkMode ? 'bg-[#2a2b2d] hover:bg-[#333436] border-transparent hover:border-green-500' : 'bg-gray-100 hover:bg-gray-200 border-gray-200'}`}>
                                    <GoogleSheetsIcon />
                                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Sheets</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="w-full max-w-3xl flex justify-between items-center p-4 z-10 shrink-0 mx-auto">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-[#2a2b2d] text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-600 hover:text-black'}`}
                    >
                        <MenuIcon className="w-6 h-6" />
                    </button>
                    
                    {/* Theme Toggle Button */}
                    <button 
                        onClick={toggleTheme}
                        className={`p-2 rounded-full transition-colors group ${isDarkMode ? 'hover:bg-[#2a2b2d] text-gray-400 hover:text-yellow-300' : 'hover:bg-gray-200 text-gray-600 hover:text-blue-500'}`}
                        title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {isDarkMode ? (
                            <Sun className="w-6 h-6 transition-transform duration-500 group-hover:rotate-180" />
                        ) : (
                            <Moon className="w-6 h-6 transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110" />
                        )}
                    </button>

                    {selectedDatabase && (
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                            {selectedDatabase === 'firebase' && <FirebaseIcon className="w-4 h-4"/>}
                            {selectedDatabase === 'supabase' && <SupabaseIcon className="w-4 h-4"/>}
                            {selectedDatabase === 'notion' && <NotionIcon className="w-4 h-4"/>}
                            {selectedDatabase === 'sheets' && <GoogleSheetsIcon className="w-4 h-4"/>}
                            <span className={`text-xs capitalize ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{selectedDatabase}</span>
                        </div>
                    )}
                </div>
                <button 
                    onClick={handleNewChat}
                    className={`p-2 rounded-full transition-colors flex items-center gap-2 text-sm ${isDarkMode ? 'hover:bg-[#2a2b2d] text-gray-400 hover:text-blue-400' : 'hover:bg-gray-200 text-gray-600 hover:text-blue-600'}`}
                    title="Start New Chat"
                >
                    <NewChatIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">New Chat</span>
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 w-full max-w-3xl flex flex-col relative overflow-hidden mx-auto">
            {messages.length === 0 && activeMode !== 'social' ? (
                <div className="flex-1 w-full h-full relative overflow-y-auto scrollbar-hide">
                    
                    {/* Scrollable Content Container */}
                    <div className="min-h-full flex flex-col items-center justify-center px-4 pt-10 pb-4">
                        
                        {/* Logo Section */}
                        <div className="w-24 h-24 md:w-28 md:h-28 mb-3 shrink-0 flex items-center justify-center drop-shadow-[0_0_35px_rgba(14,165,233,0.4)]">
                            <AILogo className="w-full h-full" />
                        </div>

                        <h1 className="text-3xl md:text-5xl font-semibold mb-2 tracking-tight shrink-0 text-center bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                        Hello
                        </h1>
                        <p className={`text-lg md:text-xl font-light mb-8 shrink-0 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        How can I help you today?
                        </p>
                        
                        {/* Quick Prompts - Neon Colors & Hover Glow */}
                        <div className="w-full max-w-2xl shrink-0 pb-10">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                                
                                {/* Resume Analyzer - Deep Red #D10004 - Custom Icon */}
                                <button 
                                    onClick={() => { switchMode('resume-analyzer'); triggerFileInput(); }}
                                    className={`
                                        relative overflow-hidden p-4 rounded-xl transition-all duration-300 group
                                        border flex flex-col items-start text-left gap-3
                                        ${isDarkMode 
                                            ? 'border-white/5 hover:border-[#D10004]/50 bg-[#121212] hover:bg-[#1a1a1a] hover:shadow-[0_0_30px_-5px_rgba(209,0,4,0.5)]' 
                                            : 'border-gray-200 hover:border-[#D10004]/50 bg-white hover:bg-gray-50 hover:shadow-lg'}
                                        ${activeMode === 'resume-analyzer' ? (isDarkMode ? 'border-[#D10004]/50 bg-[#1a1a1a]' : 'border-[#D10004]/50 bg-gray-50') : ''}
                                    `}
                                >
                                    <div className="p-2 rounded-lg bg-[#D10004]/10 group-hover:bg-[#D10004]/20 transition-colors">
                                        <ResumeAnalysisIcon className="w-6 h-6 text-[#D10004]" /> 
                                    </div>
                                    <div>
                                        <p className={`text-sm font-semibold transition-colors ${isDarkMode ? 'text-gray-200 group-hover:text-[#D10004]' : 'text-gray-800 group-hover:text-[#D10004]'}`}>Resume Analyzer</p>
                                        <p className="text-xs text-gray-500 group-hover:text-gray-400 mt-0.5">Check ATS compatibility.</p>
                                    </div>
                                </button>

                                {/* Score Checker - Neon Orange #FC6701 */}
                                <button 
                                    onClick={() => { switchMode('resume-score'); triggerFileInput(); }} 
                                    className={`
                                        relative overflow-hidden p-4 rounded-xl transition-all duration-300 group
                                        border flex flex-col items-start text-left gap-3
                                        ${isDarkMode 
                                            ? 'border-white/5 hover:border-[#FC6701]/50 bg-[#121212] hover:bg-[#1a1a1a] hover:shadow-[0_0_30px_-5px_rgba(252,103,1,0.5)]' 
                                            : 'border-gray-200 hover:border-[#FC6701]/50 bg-white hover:bg-gray-50 hover:shadow-lg'}
                                        ${activeMode === 'resume-score' ? (isDarkMode ? 'border-[#FC6701]/50 bg-[#1a1a1a]' : 'border-[#FC6701]/50 bg-gray-50') : ''}
                                    `}
                                >
                                    <div className="p-2 rounded-lg bg-[#FC6701]/10 group-hover:bg-[#FC6701]/20 transition-colors">
                                        <Award className="w-6 h-6 text-[#FC6701]" />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-semibold transition-colors ${isDarkMode ? 'text-gray-200 group-hover:text-[#FC6701]' : 'text-gray-800 group-hover:text-[#FC6701]'}`}>Score Checker</p>
                                        <p className="text-xs text-gray-500 group-hover:text-gray-400 mt-0.5">Get an impact score.</p>
                                    </div>
                                </button>

                                {/* Resume Builder - Neon Yellow #FEFF36 */}
                                <button 
                                    onClick={() => switchMode('resume-generator')} 
                                    className={`
                                        relative overflow-hidden p-4 rounded-xl transition-all duration-300 group
                                        border flex flex-col items-start text-left gap-3
                                        ${isDarkMode 
                                            ? 'border-white/5 hover:border-[#FEFF36]/50 bg-[#121212] hover:bg-[#1a1a1a] hover:shadow-[0_0_30px_-5px_rgba(254,255,54,0.5)]' 
                                            : 'border-gray-200 hover:border-[#FEFF36]/50 bg-white hover:bg-gray-50 hover:shadow-lg'}
                                        ${activeMode === 'resume-generator' ? (isDarkMode ? 'border-[#FEFF36]/50 bg-[#1a1a1a]' : 'border-[#FEFF36]/50 bg-gray-50') : ''}
                                    `}
                                >
                                    <div className="p-2 rounded-lg bg-[#FEFF36]/10 group-hover:bg-[#FEFF36]/20 transition-colors">
                                        <PenTool className="w-6 h-6 text-[#FEFF36]" />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-semibold transition-colors ${isDarkMode ? 'text-gray-200 group-hover:text-[#FEFF36]' : 'text-gray-800 group-hover:text-[#FEFF36]'}`}>Resume Builder</p>
                                        <p className="text-xs text-gray-500 group-hover:text-gray-400 mt-0.5">Build from scratch.</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            ) : activeMode === 'social' && messages.length === 0 ? (
                // --- SOCIAL MEDIA HUB (The "Sketch" UI) ---
                <div className="flex-1 w-full h-full flex flex-col items-center justify-center animate-fade-in relative overflow-y-auto">
                    <div className="text-center mb-10 z-10">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-[0_0_40px_rgba(192,38,211,0.4)]">
                            <Share2 className="w-10 h-10 text-white" />
                        </div>
                        <h2 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Social Media Hub</h2>
                        <p className="text-gray-400">Select a platform to generate viral content</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 w-full max-w-xl px-4 z-10">
                         {/* Platforms - Always keep dark themed for aesthetic pop or adapt? Let's keep dark card style for contrast even in light mode, or slight adapt */}
                         {[
                            { id: 'twitter', name: 'Twitter / X', icon: <Twitter className="w-6 h-6 text-white" />, color: 'bg-black', border: 'hover:border-white/20' },
                            { id: 'instagram', name: 'Instagram', icon: <Instagram className="w-6 h-6 text-white" />, color: 'bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600', border: 'hover:border-pink-500/30' },
                            { id: 'facebook', name: 'Facebook', icon: <Facebook className="w-6 h-6 text-white" />, color: 'bg-[#1877F2]', border: 'hover:border-blue-600/30' },
                            { id: 'youtube', name: 'YouTube', icon: <Youtube className="w-6 h-6 text-white" />, color: 'bg-[#FF0000]', border: 'hover:border-red-600/30' },
                            { id: 'snapchat', name: 'Snapchat', icon: <Ghost className="w-6 h-6 text-black" />, color: 'bg-[#FFFC00]', border: 'hover:border-yellow-400/30' },
                            { id: 'reddit', name: 'Reddit', icon: <MessageSquare className="w-6 h-6 text-white" />, color: 'bg-[#FF4500]', border: 'hover:border-orange-500/30' }
                         ].map((platform) => (
                             <button key={platform.id} onClick={() => selectSocialPlatform(platform.id)} className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border transition-all group hover:scale-105 ${isDarkMode ? 'bg-[#1a1a1a] border-white/5 hover:bg-[#252525]' : 'bg-white border-gray-200 hover:bg-gray-50 shadow-sm'} ${platform.border}`}>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-shadow shadow-md ${platform.color}`}>
                                    {platform.icon}
                                </div>
                                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-700 group-hover:text-black'}`}>{platform.name}</span>
                             </button>
                         ))}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col overflow-hidden pb-4">
                <ChatLog messages={messages} isTyping={isTyping} isDarkMode={isDarkMode} />
                </div>
            )}
            </div>

            {/* Bottom Bar */}
            <div className="w-full max-w-3xl px-4 md:px-6 pb-8 pt-2 shrink-0 z-10 bg-transparent mx-auto">
            <div className="flex items-end gap-3 w-full">
                
                {/* Input Container */}
                <div className={`backdrop-blur-2xl rounded-2xl flex items-end p-2 w-full border transition-all duration-300 relative focus-within:shadow-[0_0_15px_rgba(6,182,212,0.15)] ${isDarkMode ? 'bg-white/5 border-white/10 focus-within:border-cyan-500/50' : 'bg-white/80 border-gray-300 focus-within:border-cyan-500/50 shadow-md'}`}>
                    
                    {/* File Upload Button */}
                    <div className="relative" ref={uploadMenuRef}>
                        <button 
                            onClick={handleFileUploadClick}
                            className={`p-3 transition-colors rounded-xl ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-[#2a2b2d]' : 'text-gray-500 hover:text-black hover:bg-gray-100'}`}
                            title="Attach file"
                        >
                            <PlusIcon className="w-5 h-5" />
                        </button>

                        {/* Upload Menu */}
                        {isUploadMenuOpen && (
                            <div className={`absolute bottom-14 left-0 w-48 border rounded-xl shadow-xl overflow-hidden py-1 z-20 animate-fade-in ${isDarkMode ? 'bg-[#1e1f20] border-gray-700' : 'bg-white border-gray-200'}`}>
                                <UploadOption isDarkMode={isDarkMode} icon={<PhotosIcon className="w-5 h-5 text-purple-400" />} label="Upload Image" onClick={triggerFileInput} />
                                <UploadOption isDarkMode={isDarkMode} icon={<FileTypeIcon type="pdf" className="w-5 h-5 text-red-400" />} label="Upload PDF" onClick={triggerFileInput} />
                            </div>
                        )}
                    </div>

                    <input 
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                    />

                    {/* Text Input */}
                    <div className="flex-1 min-w-0">
                        {selectedFile && (
                            <div className={`mx-2 mt-2 mb-1 p-2 rounded-lg flex items-center justify-between group ${isDarkMode ? 'bg-[#2a2b2d]' : 'bg-gray-100 border border-gray-200'}`}>
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <FileTypeIcon type={selectedFile.mimeType} className="w-4 h-4 text-blue-400" />
                                    <span className={`text-xs truncate max-w-[150px] ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{selectedFile.name}</span>
                                </div>
                                <button onClick={clearSelectedFile} className="text-gray-500 hover:text-red-500">
                                    <CloseIcon className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                        <textarea
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={isListening ? "Listening..." : "Message CNS AI..."}
                            className={`w-full bg-transparent border-0 focus:ring-0 resize-none py-3 px-3 max-h-32 min-h-[44px] outline-none ${isDarkMode ? 'text-white placeholder-gray-500' : 'text-black placeholder-gray-400'}`}
                            rows={1}
                            style={{ height: 'auto', minHeight: '44px' }}
                        />
                    </div>

                    {/* Right Actions: Mic or Send */}
                    <div className="flex items-center gap-1">
                        {textInput.trim() || selectedFile ? (
                            <button 
                                onClick={() => handleSendMessage()}
                                className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg hover:shadow-blue-500/20"
                            >
                                <SendIcon className="w-5 h-5" />
                            </button>
                        ) : (
                            <button 
                                onClick={handleDictation}
                                className={`p-3 rounded-xl transition-all ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : (isDarkMode ? 'bg-[#2a2b2d] text-gray-400 hover:text-white hover:bg-[#333436]' : 'bg-gray-100 text-gray-500 hover:text-black hover:bg-gray-200')}`}
                            >
                                <MicIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <div className="text-center mt-2">
                <p 
                    className={`text-[10px] cursor-pointer transition-colors ${isDarkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'}`}
                    onClick={() => setIsAboutOpen(true)}
                >
                    CNS AI can make mistakes. <span className={`underline underline-offset-2 ${isDarkMode ? 'decoration-gray-700' : 'decoration-gray-300'}`}>Check important info.</span>
                </p>
            </div>
            </div>
        </div>
      </div>
    );
  }

  // --- RENDER ACTIVE CALL VIEW ---
  return (
    <div className={`min-h-screen flex flex-col items-center justify-between relative overflow-hidden transition-colors duration-1000 ${isDarkMode ? 'bg-[#000000] text-white' : 'bg-slate-50 text-slate-900'}`}>
        
        {/* Background Gradients - Adjusted for Mode */}
        <div className={`absolute top-0 left-0 w-full h-full pointer-events-none ${isDarkMode ? 'bg-gradient-to-b from-[#1e1b4b] to-black opacity-50' : 'bg-gradient-to-b from-blue-100 to-white opacity-40'}`} />

        {/* Header */}
        <div className="w-full max-w-3xl flex justify-between items-center p-6 z-10">
            <button onClick={disconnect} className={`p-2 rounded-full transition-all backdrop-blur-md ${isDarkMode ? 'bg-gray-800/50 hover:bg-gray-700/50 text-white' : 'bg-white/50 hover:bg-white/80 text-gray-800 shadow-sm'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
            </button>
            <div className={`flex items-center gap-3 px-4 py-2 rounded-full backdrop-blur-md border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50 text-gray-200' : 'bg-white/60 border-gray-200 text-gray-800 shadow-sm'}`}>
               <AILogo className="w-5 h-5 animate-spin-slow" />
               <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
               <span className="text-xs font-bold tracking-wide uppercase">CNS AI &bull; {getActiveAgentLabel()}</span>
            </div>
            <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Main Content - Visualizer */}
        <div className="flex-1 flex flex-col items-center justify-center w-full relative z-0">
             <div className="relative flex items-center justify-center">
                 <OrbVisualizer 
                    analyser={outputAnalyserRef.current} 
                    inputAnalyser={inputAnalyserRef.current}
                    isActive={status === ConnectionStatus.CONNECTED} 
                    color={
                        activeMode === 'hr' ? '#ec4899' : // Pink
                        activeMode === 'interview' ? '#f97316' : // Orange
                        (isDarkMode ? '#60a5fa' : '#3b82f6') // Blue default (darker for light mode)
                    }
                 />
                 
                 {/* Icon Overlay inside Orb */}
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <AILogo className="w-64 h-64 animate-pulse" />
                    <span className={`text-2xl font-bold mt-6 tracking-widest opacity-90 drop-shadow-lg ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>CNS AI</span>
                 </div>
             </div>

             <div className="mt-12 text-center space-y-2 px-4 transition-all duration-300">
                <h2 className={`text-2xl font-light ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {status === ConnectionStatus.CONNECTING ? 'Connecting...' : 'Listening...'}
                </h2>
                {isCaptionsEnabled ? (
                    <div className={`max-w-xl mx-auto min-h-[60px] p-4 backdrop-blur-md rounded-xl border animate-fade-in ${isDarkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-white/60 border-gray-200 text-gray-800 shadow-sm'}`}>
                        <p className="text-lg font-medium leading-relaxed">
                            {realtimeTranscript || "Waiting for speech..."}
                        </p>
                    </div>
                ) : (
                    <p className={`text-sm max-w-md mx-auto h-6 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        Go ahead, I'm listening.
                    </p>
                )}
             </div>
        </div>

        {/* Controls */}
        <div className="w-full max-w-md px-8 pb-12 z-10">
            <div className="flex items-center justify-center gap-6">
                
                {/* Captions Toggle */}
                <button 
                    onClick={toggleCaptions}
                    className={`p-4 rounded-full transition-all duration-300 ${isCaptionsEnabled ? (isDarkMode ? 'bg-white text-black' : 'bg-gray-900 text-white') : (isDarkMode ? 'bg-gray-800/50 text-white hover:bg-gray-700/50' : 'bg-white text-gray-600 hover:bg-gray-100 shadow-md')}`}
                    title={isCaptionsEnabled ? "Hide Captions" : "Show Captions"}
                >
                    {isCaptionsEnabled ? <CaptionsIcon className="w-6 h-6" /> : <CaptionsOffIcon className="w-6 h-6" />}
                </button>

                {/* Mic Toggle */}
                <button 
                    onClick={toggleMute}
                    className={`p-4 rounded-full transition-all duration-300 ${isMicMuted ? 'bg-red-500 text-white animate-pulse' : (isDarkMode ? 'bg-gray-800/50 text-white hover:bg-gray-700/50' : 'bg-white text-gray-600 hover:bg-gray-100 shadow-md')}`}
                    title={isMicMuted ? "Unmute" : "Mute"}
                >
                    {isMicMuted ? <MicOffIcon className="w-6 h-6" /> : <MicIcon className="w-6 h-6" />}
                </button>

                {/* Disconnect (Red X) */}
                <button 
                    onClick={disconnect}
                    className="p-6 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 transform hover:scale-105 transition-all"
                    title="End Session"
                >
                    <X className="w-8 h-8" />
                </button>

                 <button 
                    className={`p-4 rounded-full transition-all ${isDarkMode ? 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50' : 'bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-100 shadow-md'}`}
                    onClick={() => setView('home')} // Allow minimizing back to text
                    title="Minimize"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                </button>
            </div>
        </div>
    </div>
  );
};

export default App;
