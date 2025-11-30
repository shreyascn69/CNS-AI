
import React, { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import { ChatMessage, Attachment } from '../types';

interface ChatLogProps {
  messages: ChatMessage[];
  isTyping: boolean;
  isDarkMode: boolean; // Added Prop
}

// --- NEW AI LOGO (Neon Saturn Style) ---
export const AILogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      {/* Neon Planet Gradient */}
      <linearGradient id="neon-planet" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#8b5cf6" /> {/* Violet */}
        <stop offset="0.5" stopColor="#6366f1" /> {/* Indigo */}
        <stop offset="1" stopColor="#0ea5e9" /> {/* Sky Blue */}
      </linearGradient>
      
      {/* Ring Gradients */}
      <linearGradient id="neon-ring-1" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#f472b6" stopOpacity="0" />
        <stop offset="0.5" stopColor="#e879f9" stopOpacity="1" />
        <stop offset="1" stopColor="#f472b6" stopOpacity="0" />
      </linearGradient>
      
      <linearGradient id="neon-ring-2" x1="100" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
         <stop offset="0" stopColor="#22d3ee" stopOpacity="0" />
        <stop offset="0.5" stopColor="#06b6d4" stopOpacity="1" />
        <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
      </linearGradient>

      {/* Glow Filter */}
      <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* Center Planet */}
    <circle cx="50" cy="50" r="16" fill="url(#neon-planet)" filter="url(#neon-glow)">
        <animate attributeName="opacity" values="0.9;1;0.9" dur="3s" repeatCount="indefinite" />
    </circle>
    
    {/* Ring 1 (Pink/Purple) - Rotates Clockwise */}
    <g className="animate-spin-slow" style={{ transformOrigin: '50px 50px' }}>
        <ellipse cx="50" cy="50" rx="36" ry="10" stroke="url(#neon-ring-1)" strokeWidth="3" transform="rotate(-20 50 50)" filter="url(#neon-glow)" />
    </g>

    {/* Ring 2 (Cyan/Blue) - Rotates Counter-Clockwise */}
    <g className="animate-spin-reverse-slow" style={{ transformOrigin: '50px 50px' }}>
         <ellipse cx="50" cy="50" rx="32" ry="12" stroke="url(#neon-ring-2)" strokeWidth="3" transform="rotate(30 50 50)" filter="url(#neon-glow)" />
    </g>

    {/* Orbiting Moon 1 (Small White Dot) */}
    <g style={{ transformOrigin: '50px 50px' }}>
        <circle cx="50" cy="50" r="2.5" fill="#ffffff" filter="url(#neon-glow)" className="animate-orbit-small" />
    </g>
    
    {/* Orbiting Moon 2 (Small Cyan Dot) */}
     <g style={{ transformOrigin: '50px 50px' }}>
        <circle cx="50" cy="50" r="2" fill="#22d3ee" filter="url(#neon-glow)" className="animate-orbit-large" />
    </g>

  </svg>
);

const SpeakerIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
);

const StopIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
    </svg>
);

const CopyIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" />
    </svg>
);

const CheckIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
    </svg>
);

const FileIcon = ({ type, className = "w-6 h-6" }: { type: string, className?: string }) => {
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
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M18.97 3.659a2.25 2.25 0 00-3.182 0l-10.94 10.94a3.75 3.75 0 105.304 5.303l7.693-7.693a.75.75 0 011.06 1.06l-7.693 7.693a5.25 5.25 0 11-7.424-7.424l10.939-10.94a3.75 3.75 0 115.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 015.91 15.66l7.81-7.81a.75.75 0 011.061 1.06l-7.81 7.81a.75.75 0 001.054 1.068L18.97 6.84a2.25 2.25 0 000-3.182z" clipRule="evenodd" />
    </svg>
  );
}

const ChatLog: React.FC<ChatLogProps> = ({ messages, isTyping, isDarkMode }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const toggleSpeech = (id: string, text: string) => {
    if (speakingId === id) {
        window.speechSynthesis.cancel();
        setSpeakingId(null);
    } else {
        window.speechSynthesis.cancel();
        // Clean markdown characters for better speech
        const cleanText = text.replace(/[#*`]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.onend = () => setSpeakingId(null);
        utterance.onerror = () => setSpeakingId(null);
        window.speechSynthesis.speak(utterance);
        setSpeakingId(id);
    }
  };

  const handleCopy = (id: string, text: string) => {
      navigator.clipboard.writeText(text).then(() => {
          setCopiedId(id);
          setTimeout(() => setCopiedId(null), 2000); // Reset after 2 seconds
      });
  };

  const handleFileClick = (attachment: Attachment) => {
    try {
        const byteCharacters = atob(attachment.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: attachment.mimeType });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
    } catch (e) {
        console.error("Error opening file:", e);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-slate-500 mt-10 animate-fade-in">
          {/* Logo Removed as requested */}
          <p className={`mb-2 text-xl font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Hello</p>
          <p className="text-sm">How can I help you today?</p>
        </div>
      )}
      
      {messages.map((msg, index) => {
        const isUser = msg.role === 'user';
        
        return (
          <div 
            key={msg.id}
            className={`flex w-full mb-6 animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {!isUser && (
              <div className="mr-3 mt-0.5 flex-shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-slate-800/30' : 'bg-gray-100'}`}>
                    {/* Continuous animation and glow for the AI logo avatar */}
                    <AILogo className="w-7 h-7" />
                </div>
              </div>
            )}

            <div className={`max-w-[85%] md:max-w-3xl ${isUser ? 'items-end flex flex-col' : 'w-full'}`}>
              
              <div 
                className={`
                  ${isUser 
                    ? (isDarkMode ? 'bg-[#2a2b2d] text-white' : 'bg-blue-100 text-gray-900') 
                    : 'w-full'} 
                  ${isUser ? 'rounded-2xl px-5 py-3' : ''}
                `}
              >
                  {/* Attachment Card */}
                  {msg.attachment && (
                      <div 
                        onClick={() => handleFileClick(msg.attachment!)}
                        className={`flex items-center p-4 rounded-xl mb-4 border max-w-sm cursor-pointer transition-all group shadow-md
                           ${isDarkMode 
                                ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 hover:border-blue-500/50' 
                                : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-blue-300'}
                        `}
                        title="Click to open file"
                      >
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 shrink-0 ${
                              msg.attachment.mimeType.includes('pdf') ? 'bg-red-500/20 text-red-400' : 
                              (msg.attachment.mimeType.includes('word') || msg.attachment.mimeType.includes('doc') ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-600 text-gray-300')
                          }`}>
                              <FileIcon type={msg.attachment.mimeType} className="w-7 h-7" />
                          </div>
                          <div className="flex flex-col overflow-hidden">
                              <span className={`text-sm font-semibold truncate transition-colors ${isDarkMode ? 'text-gray-100 group-hover:text-blue-400' : 'text-gray-800 group-hover:text-blue-600'}`}>
                                {msg.attachment.name}
                              </span>
                              <span className="text-[11px] text-gray-400 uppercase tracking-wider mt-0.5">
                                  {msg.attachment.mimeType.split('/')[1]?.replace('x-adobe-', '')?.replace('vnd.adobe.', '')?.split('.').pop() || 'FILE'}
                              </span>
                          </div>
                      </div>
                  )}

                  {isUser ? (
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</div>
                  ) : (
                    <div className="relative group">
                        <div 
                          className={`markdown-content ${isDarkMode ? '[&_strong]:text-white [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white text-slate-300' : '[&_strong]:text-gray-900 [&_h1]:text-gray-900 [&_h2]:text-gray-900 [&_h3]:text-gray-900 text-gray-800'}`}
                          dangerouslySetInnerHTML={{ __html: marked.parse(msg.text) as string }}
                        />
                        
                        {/* Simplified Action Toolbar */}
                        <div className="flex items-center gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => toggleSpeech(msg.id, msg.text)}
                                className={`transition-colors p-1.5 rounded-lg flex items-center gap-2 ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-black hover:bg-black/5'}`}
                                title={speakingId === msg.id ? "Stop reading" : "Read aloud"}
                            >
                                {speakingId === msg.id ? (
                                    <StopIcon className="w-4 h-4 text-blue-400" />
                                ) : (
                                    <SpeakerIcon className="w-4 h-4" />
                                )}
                            </button>
                            <button 
                                onClick={() => handleCopy(msg.id, msg.text)}
                                className={`transition-colors p-1.5 rounded-lg ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-black hover:bg-black/5'} ${copiedId === msg.id ? 'text-green-500' : ''}`}
                                title="Copy text"
                            >
                                {copiedId === msg.id ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        );
      })}

      {isTyping && (
        <div className="flex w-full mb-8 justify-start animate-fade-in">
          <div className="mr-3 mt-0.5 flex-shrink-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-slate-800/30' : 'bg-gray-100'}`}>
                <AILogo className="w-7 h-7" />
            </div>
          </div>
          <div className="w-full max-w-3xl flex items-center">
             <div className="flex space-x-1 h-4 items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
             </div>
          </div>
        </div>
      )}
      
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatLog;
