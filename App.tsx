import React, { useState, useRef, useEffect } from 'react';
import { ResumeData, INITIAL_DATA, TemplateType } from './types';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { Sidebar } from './components/Sidebar';
import { Printer, Shield, Eye, ArrowLeft, Users, FileText, TrendingUp, LogOut, X, Globe, Gauge, Search, Filter, ChevronDown, CheckCircle2, Clock, AlertCircle, Trash2, Edit, Download, ZoomIn, ZoomOut, RotateCcw, Lock, Settings, Database, AlertTriangle, ToggleLeft, ToggleRight, Save, Loader2, Info } from 'lucide-react';
import { saveResumeToDb, updateResumeInDb, fetchAllResumes, deleteResumeById, deleteAllResumes, performAutoCleanup, DbResume } from './services/resumeService';
// @ts-ignore
import html2pdf from 'html2pdf.js';

type FilterStatus = 'all' | 'completed' | 'draft' | 'review';
type SettingsTab = 'data' | 'security';

interface SecurityStageConfig {
    attempts: number;
    lockoutMinutes: number;
}

const App: React.FC = () => {
  const [resumeData, setResumeData] = useState<ResumeData>(INITIAL_DATA);
  const [view, setView] = useState<'editor' | 'preview' | 'admin' | 'success'>('editor');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('minimalist');
  const [expandedSection, setExpandedSection] = useState<string | null>('personal');
  const [shouldPrint, setShouldPrint] = useState(false);
  
  // Toast Notification State
  const [toast, setToast] = useState<{message: string, type: 'error' | 'success' | 'info'} | null>(null);

  // Zoom & Paging State
  const [zoom, setZoom] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [contentHeight, setContentHeight] = useState(0); 
  const previewContentRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // PDF Generation State
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Admin State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [records, setRecords] = useState<any[]>([]); // Using any[] temporarily for Supabase mapping
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [editingResumeId, setEditingResumeId] = useState<string | null>(null);
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsRotation, setSettingsRotation] = useState(0);
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab>('data');
  const [autoDeleteEnabled, setAutoDeleteEnabled] = useState(false);
  const [autoDeleteLimit, setAutoDeleteLimit] = useState(50);

  // Security Config State (Configurable Stages)
  const [securityConfig, setSecurityConfig] = useState<SecurityStageConfig[]>([
    { attempts: 3, lockoutMinutes: 1 },  // Stage 0
    { attempts: 2, lockoutMinutes: 10 }, // Stage 1
    { attempts: 1, lockoutMinutes: 20 }, // Stage 2
  ]);

  // Security Runtime State
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [securityStage, setSecurityStage] = useState(0); // 0, 1, or 2 (indexes of securityConfig)
  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // Admin Search & Filter State
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminFilter, setAdminFilter] = useState<FilterStatus>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  
  // PIN State
  const [pin, setPin] = useState(['', '', '', '']);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Close filter dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch Data when entering Admin View
  useEffect(() => {
    if (view === 'admin' && isAdmin) {
      loadRecords();
    }
  }, [view, isAdmin]);

  const loadRecords = async () => {
    setIsLoadingRecords(true);
    try {
      // If Auto-Delete is enabled, run cleanup BEFORE loading to show accurate state
      if (autoDeleteEnabled) {
         await performAutoCleanup(autoDeleteLimit);
      }
      
      const data = await fetchAllResumes();
      // Map DB fields to UI fields
      const mappedRecords = data.map(r => ({
        id: r.id,
        user: r.full_name,
        email: r.email,
        template: r.template,
        status: r.status,
        date: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        fullData: r.data // Store full json for loading
      }));
      setRecords(mappedRecords);
    } catch (err) {
      console.error("Failed to load records", err);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  // Handle auto-printing when view changes to preview and shouldPrint is true
  useEffect(() => {
    if (view === 'preview' && shouldPrint) {
      const timer = setTimeout(() => {
        window.print();
        setShouldPrint(false);
      }, 1500); 
      return () => clearTimeout(timer);
    }
  }, [view, shouldPrint]);

  // Reset zoom and calculate pages when entering preview
  useEffect(() => {
    if (view === 'preview') {
      setZoom(1);
      setCurrentPage(1);
      
      const updateDimensions = () => {
        if (previewContentRef.current) {
            // Get exact height
            const currentHeight = previewContentRef.current.offsetHeight;
            setContentHeight(currentHeight);
            
            // A4 height in pixels approx 1122px (at 96 DPI)
            // We use a small buffer (10px) so if content is 1123px it doesn't instantly show page 2
            const A4_HEIGHT = 1122;
            const pages = Math.ceil((currentHeight - 20) / A4_HEIGHT); 
            setTotalPages(Math.max(1, pages));
        }
      };

      setTimeout(updateDimensions, 100);

      const resizeObserver = new ResizeObserver(() => {
         updateDimensions();
      });

      if (previewContentRef.current) {
         resizeObserver.observe(previewContentRef.current);
      }

      return () => resizeObserver.disconnect();
    }
  }, [view, resumeData, selectedTemplate]);

  // Track scrolling to determine current page
  const handlePreviewScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollTop = container.scrollTop;
    
    // Calculate page based on scroll position relative to scaled A4 height
    // A4 height is ~1122px. We adjust for zoom.
    const scaledA4Height = 1122 * zoom;
    
    // Add half a page to determine "mostly visible" page
    const pageIndex = Math.floor((scrollTop + (scaledA4Height * 0.3)) / scaledA4Height);
    
    const newCurrentPage = Math.min(Math.max(1, pageIndex + 1), totalPages);
    setCurrentPage(newCurrentPage);
  };

  // --- Login Logic & Security Timer ---
  
  useEffect(() => {
    if (!lockoutEndTime) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const diff = Math.ceil((lockoutEndTime - now) / 1000);

      if (diff <= 0) {
        setLockoutEndTime(null);
        setTimeLeft(0);
        setPin(['', '', '', '']); 
        if (isLoginModalOpen) {
             setTimeout(() => pinRefs.current[0]?.focus(), 100);
        }
      } else {
        setTimeLeft(diff);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutEndTime, isLoginModalOpen]);

  useEffect(() => {
    if (isLoginModalOpen && !lockoutEndTime) {
      setPin(['', '', '', '']);
      setLoginError(false);
      setTimeout(() => pinRefs.current[0]?.focus(), 100);
    }
  }, [isLoginModalOpen, lockoutEndTime]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (isGeneratingPdf || !previewContentRef.current) return;
    setIsGeneratingPdf(true);

    const element = previewContentRef.current;
    
    // Use the name from personal info or fallback
    const fileName = `${resumeData.personalInfo.firstName || 'My'}_${resumeData.personalInfo.lastName || 'Resume'}.pdf`;

    const opt = {
      margin: 0,
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF Generation failed", error);
      setToast({ message: "Failed to download PDF. Please try printing instead.", type: 'error' });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const hasUserEnteredData = () => {
    const { firstName, lastName, email, jobTitle } = resumeData.personalInfo;
    return (
        firstName.trim().length > 0 || 
        lastName.trim().length > 0 || 
        email.trim().length > 0 ||
        jobTitle.trim().length > 0 ||
        resumeData.summary.trim().length > 0 ||
        resumeData.experience.length > 0 ||
        resumeData.education.length > 0 ||
        resumeData.skills.length > 0 ||
        !!resumeData.themeConfig.photo
    );
  };

  const handlePinChange = (index: number, value: string) => {
    if (lockoutEndTime) return; 

    if (value.length > 1) value = value.slice(-1); 
    if (!/^\d*$/.test(value)) return; 

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    if (newPin.every(digit => digit !== '')) {
      const enteredPin = newPin.join('');
      if (enteredPin === '1984') {
        // Success
        setIsAdmin(true);
        setIsLoginModalOpen(false);
        setView('admin');
        setLoginError(false);
        setFailedAttempts(0);
        setSecurityStage(0); 
      } else {
        // Failure
        setLoginError(true);
        const newFailures = failedAttempts + 1;
        setFailedAttempts(newFailures);

        // Get limits from dynamic config
        const currentStageConfig = securityConfig[securityStage];
        // Fallback safety if config is somehow messed up
        const maxAttempts = currentStageConfig?.attempts || 3;
        const lockoutMins = currentStageConfig?.lockoutMinutes || 1;

        if (newFailures >= maxAttempts) {
             // Lockout
             const duration = lockoutMins * 60 * 1000;
             setLockoutEndTime(Date.now() + duration);
             setPin(['', '', '', '']); 

             // Advance Stage
             let nextStage = securityStage + 1;
             if (nextStage >= securityConfig.length) nextStage = 0; // Reset cycle
             setSecurityStage(nextStage);
             
             setFailedAttempts(0); 
        } else {
             setTimeout(() => {
                setPin(['', '', '', '']);
                pinRefs.current[0]?.focus();
             }, 300);
        }
      }
    } else if (value && index < 3) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (lockoutEndTime) return;
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setView('editor');
    setAdminSearchQuery('');
    setAdminFilter('all');
    setEditingResumeId(null);
    setResumeData(INITIAL_DATA);
  };

  const handleSettingsIconHover = () => {
      setSettingsRotation(r => r + 180);
  };

  const handleOpenSettings = () => {
    setSettingsRotation(r => r + 180); // Complete the full spin
    setTimeout(() => {
        setIsSettingsOpen(true);
    }, 200); // Small delay for visual effect
  };

  const handleUpdateSecurityConfig = (index: number, field: keyof SecurityStageConfig, value: number) => {
     const newConfig = [...securityConfig];
     newConfig[index] = { ...newConfig[index], [field]: value };
     setSecurityConfig(newConfig);
  };

  const handleClearAllData = async () => {
      if(window.confirm("CRITICAL WARNING: This will permanently delete ALL resume data from the database. This action cannot be undone. Are you absolutely sure?")) {
          try {
            await deleteAllResumes();
            loadRecords(); // Refresh UI
            setIsSettingsOpen(false);
          } catch(e) {
            setToast({ message: "Failed to delete records.", type: 'error' });
          }
      }
  };

  // Dashboard Actions
  const deleteRecord = async (id: string) => {
    if(window.confirm('Are you sure you want to delete this resume?')) {
        try {
          await deleteResumeById(id);
          setRecords(records.filter(r => r.id !== id));
        } catch(e) {
          setToast({ message: "Error deleting record.", type: 'error' });
        }
    }
  };

  const editRecord = (record: any) => {
      setSelectedTemplate(record.template as TemplateType);
      // Use stored json if available, else use fallback
      if (record.fullData) {
        setResumeData(record.fullData);
      }
      setEditingResumeId(record.id); // Track that we are editing an existing record
      setView('editor');
  };

  const downloadRecord = (record: any) => {
      if (record.fullData) {
        setResumeData(record.fullData);
      } else {
        // Fallback simulation if data missing
        const simulatedData: ResumeData = {
            ...INITIAL_DATA,
            personalInfo: {
                ...INITIAL_DATA.personalInfo,
                firstName: record.user.split(' ')[0],
                lastName: record.user.split(' ')[1] || '',
                email: record.email,
            },
        };
        setResumeData(simulatedData);
      }

      setSelectedTemplate(record.template as TemplateType);
      setShouldPrint(true);
      setView('preview');
  };

  const handleFinish = async () => {
      if (!hasUserEnteredData()) {
          setToast({ message: "Please fill in some information to generate your resume.", type: 'error' });
          return;
      }
      try {
        if (isAdmin && editingResumeId) {
            // ADMIN EDIT FLOW: Update existing record
            await updateResumeInDb(editingResumeId, resumeData, selectedTemplate, 'completed');
            setToast({ message: "Resume updated successfully!", type: 'success' });
            setTimeout(() => {
                setView('admin');
                setEditingResumeId(null);
                setResumeData(INITIAL_DATA);
            }, 1000);
        } else {
            // NORMAL USER / NEW CREATE FLOW: Create new record
            await saveResumeToDb(resumeData, selectedTemplate, 'completed');
            // Automatically switch to preview and print
            setShouldPrint(true);
            setView('preview');
        }
      } catch (err) {
        console.error("Save failed", err);
        // Even if save fails, let them print if it wasn't an admin update
        if (!editingResumeId) {
             setToast({ message: "Could not save to database, but proceeding to print.", type: 'info' });
             setShouldPrint(true);
             setView('preview');
        } else {
             setToast({ message: "Failed to update resume.", type: 'error' });
        }
      }
  };

  const handleBackFromPreview = () => {
      if (isAdmin) {
          setView('admin');
          setEditingResumeId(null);
      } else {
          setView('editor');
      }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Filter Logic for Dashboard
  const filteredRecords = records.filter(record => {
    const matchesSearch = 
      record.user.toLowerCase().includes(adminSearchQuery.toLowerCase()) || 
      record.email.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
      record.id.includes(adminSearchQuery);
    
    const matchesFilter = adminFilter === 'all' || record.status === adminFilter;

    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'draft': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'review': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed': return <CheckCircle2 className="w-3 h-3 mr-1" />;
      case 'draft': return <Clock className="w-3 h-3 mr-1" />;
      case 'review': return <AlertCircle className="w-3 h-3 mr-1" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 overflow-x-hidden print:overflow-visible print:h-auto print:bg-white print:block">
      {/* Navbar */}
      <nav className="bg-slate-900 text-white shadow-xl print:hidden sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer group select-none" onClick={() => { setView('editor'); setEditingResumeId(null); setResumeData(INITIAL_DATA); }}>
            <div className="bg-yellow-400 p-1.5 rounded-lg group-hover:rotate-12 transition-transform duration-500 ease-out shadow-[0_0_15px_rgba(250,204,21,0.5)]">
               <Globe className="w-5 h-5 text-slate-900" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white group-hover:tracking-wide transition-all duration-500">
              Web<span className="text-yellow-400">hub</span> <span className="font-light text-slate-400 text-base ml-1 hidden sm:inline-block">Resume Builder</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
             {/* Admin / Dashboard Controls */}
             <div className="flex items-center gap-3">
                {isAdmin && (
                  <>
                    {view !== 'admin' && (
                        <button 
                          onClick={() => { setView('admin'); setEditingResumeId(null); }} 
                          className="text-slate-300 hover:text-white transition-all hover:scale-105 flex items-center gap-2 text-sm font-medium bg-gradient-to-r from-slate-800 to-slate-700 hover:from-indigo-600 hover:to-indigo-500 px-3 py-1.5 rounded-lg border border-slate-600 hover:border-indigo-400 shadow-md"
                        >
                          <Gauge className="w-4 h-4" /> <span className="hidden md:inline">Dashboard</span>
                        </button>
                    )}

                    {/* Settings Button */}
                    <button 
                      onClick={handleOpenSettings}
                      onMouseEnter={handleSettingsIconHover}
                      className="text-slate-400 hover:text-white transition-all hover:bg-slate-800 p-2 rounded-full transform duration-500 ease-in-out"
                      style={{ transform: `rotate(${settingsRotation}deg)` }}
                      title="Admin Settings"
                    >
                      <Settings className="w-5 h-5" />
                    </button>

                    <button 
                      onClick={handleLogout} 
                      className="text-slate-400 hover:text-red-400 transition-all hover:bg-red-500/10 p-2 rounded-full"
                      title="Logout"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </>
                )}
                
                {!isAdmin && (
                  <button 
                    type="button"
                    onClick={(e) => { e.preventDefault(); setIsLoginModalOpen(true); }} 
                    className="relative z-50 cursor-pointer text-slate-400 hover:text-white transition-all hover:bg-slate-800 p-2 rounded-full hover:rotate-12 duration-300"
                    title="Admin Login"
                  >
                    <Shield className="w-5 h-5" />
                  </button>
                )}
             </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area - with transitions */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto relative flex flex-col print:w-full print:h-auto print:block print:max-w-none">
        
        {/* VIEW: EDITOR */}
        {view === 'editor' && (
          <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out print:hidden">
             {/* Left Sidebar */}
             <div className="flex-shrink-0 z-10 sticky top-0 lg:h-full lg:overflow-hidden">
               <Sidebar 
                 data={resumeData} 
                 onChange={setResumeData} 
                 selectedTemplate={selectedTemplate}
                 onTemplateChange={setSelectedTemplate}
               />
             </div>

             {/* Center Editor */}
             <div className="flex-1 lg:h-full lg:overflow-y-auto custom-scrollbar px-4 py-6 lg:p-8 bg-slate-50">
               <div className="max-w-3xl mx-auto pb-20 lg:pb-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
                    <div>
                      <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">Builder</h1>
                      <p className="text-slate-500 text-sm mt-1">Craft your professional story.</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          if (hasUserEnteredData()) {
                              setView('preview');
                          } else {
                              setToast({ message: "Please enter some information to generate a preview.", type: 'error' });
                          }
                        }}
                        className="group flex items-center justify-center gap-2 bg-white text-slate-700 hover:text-indigo-600 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm border border-slate-200 hover:border-indigo-200 hover:shadow-md w-full md:w-auto"
                      >
                        <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Preview Resume
                      </button>
                    </div>
                  </div>
                  
                  <Editor 
                    data={resumeData} 
                    onChange={setResumeData} 
                    selectedTemplate={selectedTemplate} 
                    expandedSection={expandedSection}
                    setExpandedSection={setExpandedSection}
                    onFinish={handleFinish}
                    submitButtonLabel={editingResumeId && isAdmin ? "Save Changes" : "Send to Printer"}
                  />
               </div>
             </div>
          </div>
        )}

        {/* VIEW: PREVIEW */}
        {view === 'preview' && (
          <div className="min-h-[calc(100vh-4rem)] bg-slate-100 flex flex-col animate-in zoom-in-95 duration-500 ease-out overflow-hidden print:h-auto print:overflow-visible print:block print:bg-white print:animate-none print:static">
             <div className="print:hidden w-full bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 py-3 flex items-center justify-between z-20 shadow-sm sticky top-0">
               {/* Back Button */}
               <button 
                 onClick={handleBackFromPreview}
                 className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium transition-colors bg-white px-3 md:px-4 py-2 rounded-lg shadow-sm border border-slate-200 hover:border-indigo-300 group text-sm"
               >
                 <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                 <span className="hidden md:inline">{isAdmin ? 'Back' : 'Editor'}</span>
               </button>

               <div className="flex items-center gap-2 md:gap-4">
                  {/* Page Count Display */}
                  <div className="hidden md:flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-sm font-medium text-slate-600">
                    <span className="text-slate-400 text-xs uppercase tracking-wide">Pages</span>
                    <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded text-xs">
                        {currentPage} / {totalPages}
                    </span>
                  </div>

                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                      <button 
                        onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} 
                        className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-slate-600 transition-all"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-semibold text-slate-600 min-w-[2.5rem] md:min-w-[3rem] text-center select-none">{Math.round(zoom * 100)}%</span>
                      <button 
                        onClick={() => setZoom(z => Math.min(2.0, z + 0.1))} 
                        className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-slate-600 transition-all"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <div className="w-px h-4 bg-slate-300 mx-1"></div>
                      <button 
                        onClick={() => setZoom(1)} 
                        className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-slate-600 transition-all" 
                        title="Reset Zoom"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                  </div>

                  {/* Print / Download Controls */}
                   <div className="flex items-center gap-2 ml-2">
                        {/* Print Button */}
                        <button 
                            onClick={handlePrint}
                            className="flex items-center gap-2 bg-white text-slate-700 hover:text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium shadow-sm border border-slate-200 hover:border-indigo-300 transition-all"
                        >
                            <Printer className="w-4 h-4" />
                            <span className="hidden md:inline">Print</span>
                        </button>
                        
                        {/* Download PDF Button */}
                        <button 
                            onClick={handleDownloadPDF}
                            disabled={isGeneratingPdf}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all hover:scale-105 border border-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            <span className="hidden md:inline">{isGeneratingPdf ? 'Generating...' : 'Download PDF'}</span>
                        </button>
                   </div>
               </div>
             </div>

             <div 
                ref={scrollContainerRef}
                onScroll={handlePreviewScroll}
                className="flex-1 overflow-auto custom-scrollbar flex justify-center p-4 md:p-8 pb-32 print:p-0 print:overflow-visible print:h-auto print:block print:static"
             >
                {/* Scaled Wrapper for Zoom */}
                {/* STRICT PRINT STYLES: print:!w-full print:!h-auto print:!transform-none to override inline style */}
                <div 
                   className="shadow-2xl rounded-sm transition-transform duration-200 ease-out print:shadow-none print:!transform-none print:!scale-100 origin-top print:m-0 print:!w-full print:!h-auto print:!static print:!block print:!overflow-visible bg-white"
                   style={{ 
                       width: `210mm`, // Fixed Width for A4
                       minHeight: `297mm`,
                       transform: `scale(${zoom})`, 
                       marginTop: `${(zoom - 1) * 20}px`, // Slight offset adjustment
                       marginBottom: `${(zoom - 1) * 100}px` 
                   }}
                >
                    <div 
                      ref={previewContentRef}
                      className="w-full h-full"
                    >
                      <Preview data={resumeData} template={selectedTemplate} />
                    </div>
                </div>
             </div>
          </div>
        )}

        {/* VIEW: ADMIN DASHBOARD */}
        {view === 'admin' && (
          <div className="p-4 md:p-8 h-full overflow-y-auto animate-in slide-in-from-right-8 duration-500 ease-out print:hidden">
            {/* ... Existing Dashboard Content ... */}
             <div className="mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 flex items-center gap-3">
                    <Gauge className="w-8 h-8 md:w-10 md:h-10 text-indigo-600" />
                    Admin Dashboard
                </h1>
                <p className="text-slate-500 mt-2 text-base md:text-lg">System overview and metrics.</p>
              </div>
              <button 
                onClick={() => setView('editor')} 
                className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors w-full md:w-auto justify-center"
              >
                Go to Builder <ArrowLeft className="w-4 h-4 rotate-180" />
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-8 md:mb-12">
              {[
                { label: 'Total Users', val: records.length.toString(), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: 'Resumes Created', val: records.filter(r => r.status === 'completed').length.toString(), icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Drafts', val: records.filter(r => r.status === 'draft').length.toString(), icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' }
              ].map((stat, idx) => (
                <div key={idx} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-default group">
                    <div className="flex items-center gap-5">
                    <div className={`p-4 ${stat.bg} ${stat.color} rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
                        <stat.icon className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium mb-1">{stat.label}</p>
                        <p className="text-3xl font-extrabold text-slate-900">{stat.val}</p>
                    </div>
                    </div>
                </div>
              ))}
            </div>

            {/* Controls Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-end md:items-center">
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search users, emails, or IDs..." 
                        value={adminSearchQuery}
                        onChange={(e) => setAdminSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-sm transition-all"
                    />
                </div>
                
                <div className="relative w-full md:w-auto" ref={filterRef}>
                    <button 
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="w-full md:w-auto flex items-center justify-between gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm"
                    >
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4" />
                            <span className="capitalize">{adminFilter === 'all' ? 'All Status' : adminFilter}</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isFilterOpen && (
                        <div className="absolute right-0 top-full mt-2 w-full md:w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-20 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                            {(['all', 'completed', 'draft', 'review'] as FilterStatus[]).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => { setAdminFilter(status); setIsFilterOpen(false); }}
                                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center justify-between ${adminFilter === status ? 'text-indigo-600 font-semibold bg-indigo-50/50' : 'text-slate-600'}`}
                                >
                                    <span className="capitalize">{status}</span>
                                    {adminFilter === status && <CheckCircle2 className="w-3.5 h-3.5" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Activity Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
              <div className="px-6 md:px-8 py-6 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <h3 className="font-bold text-lg text-slate-800">Recent Resumes (Supabase)</h3>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{filteredRecords.length} Records found</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-400 tracking-wider">
                    <tr>
                        <th className="px-6 md:px-8 py-4">User</th>
                        <th className="px-6 md:px-8 py-4 hidden md:table-cell">Template</th>
                        <th className="px-6 md:px-8 py-4">Status</th>
                        <th className="px-6 md:px-8 py-4 hidden md:table-cell">Date</th>
                        <th className="px-6 md:px-8 py-4 text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {isLoadingRecords ? (
                         <tr>
                            <td colSpan={5} className="px-8 py-12 text-center text-slate-400">
                                <div className="flex flex-col items-center gap-3">
                                    <Clock className="w-8 h-8 animate-spin text-indigo-500" />
                                    <p>Loading database...</p>
                                </div>
                            </td>
                        </tr>
                    ) : filteredRecords.length > 0 ? (
                        filteredRecords.map((record, i) => (
                            <tr key={record.id} className="hover:bg-slate-50 transition-colors group animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                            <td className="px-6 md:px-8 py-5">
                                <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{record.user}</div>
                                <div className="text-xs text-slate-400 font-normal">{record.email}</div>
                                <div className="md:hidden text-xs text-slate-400 mt-1">{record.date}</div>
                            </td>
                            <td className="px-6 md:px-8 py-5 capitalize hidden md:table-cell">
                                <div className="flex items-center gap-2 h-full">
                                    <div className={`w-2 h-2 rounded-full ${['modern', 'classic', 'minimalist'].indexOf(record.template) % 2 === 0 ? 'bg-indigo-500' : 'bg-pink-500'}`}></div>
                                    {record.template}
                                </div>
                            </td>
                            <td className="px-6 md:px-8 py-5">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm border flex items-center w-fit ${getStatusColor(record.status)}`}>
                                    {getStatusIcon(record.status)}
                                    <span className="capitalize">{record.status}</span>
                                </span>
                            </td>
                            <td className="px-6 md:px-8 py-5 text-slate-400 hidden md:table-cell">{record.date}</td>
                            <td className="px-6 md:px-8 py-5 text-right">
                                <div className="flex justify-end gap-2">
                                    <button 
                                      onClick={() => downloadRecord(record)} 
                                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors" 
                                      title="Download PDF"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => editRecord(record)} 
                                      className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-colors" 
                                      title="Edit Resume"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => deleteRecord(record.id)} 
                                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" 
                                      title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={5} className="px-8 py-12 text-center text-slate-400">
                                <div className="flex flex-col items-center gap-2">
                                    <Search className="w-8 h-8 opacity-20" />
                                    <p>No records found matching your filters.</p>
                                </div>
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
            <div className={`fixed bottom-8 right-8 z-[200] px-6 py-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300 ${
                toast.type === 'error' ? 'bg-white border-red-100 text-red-600' :
                toast.type === 'success' ? 'bg-white border-emerald-100 text-emerald-600' :
                'bg-white border-slate-100 text-slate-600'
            }`}>
                {toast.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> :
                 toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> :
                 <Info className="w-5 h-5 shrink-0" />}
                <p className="font-medium text-sm text-slate-800">{toast.message}</p>
                <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                </button>
            </div>
        )}
      </main>

      {/* Settings Modal - (Hidden in Print) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 print:hidden">
            {/* ... Modal content ... */}
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                 <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                   <Settings className="w-6 h-6" />
                 </div>
                 <div>
                    <h2 className="text-xl font-bold text-slate-900">System Settings</h2>
                    <p className="text-xs text-slate-500">Manage application data and security.</p>
                 </div>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                 <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-1 overflow-hidden">
               {/* Sidebar Tabs */}
               <div className="w-48 bg-slate-50 border-r border-slate-100 p-4 space-y-2 hidden md:block">
                  <button 
                    onClick={() => setActiveSettingsTab('data')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      activeSettingsTab === 'data' 
                        ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' 
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                     <Database className="w-4 h-4" /> Data Settings
                  </button>
                  <button 
                    onClick={() => setActiveSettingsTab('security')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      activeSettingsTab === 'security' 
                        ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' 
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                     <Lock className="w-4 h-4" /> Security
                  </button>
               </div>
               
               {/* Content */}
               <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                  {/* Mobile Tabs */}
                  <div className="flex md:hidden gap-2 mb-6">
                    <button 
                        onClick={() => setActiveSettingsTab('data')}
                        className={`flex-1 py-2 text-center rounded-lg text-sm font-medium border ${activeSettingsTab === 'data' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-slate-200 text-slate-600'}`}
                    >
                        Data
                    </button>
                    <button 
                        onClick={() => setActiveSettingsTab('security')}
                        className={`flex-1 py-2 text-center rounded-lg text-sm font-medium border ${activeSettingsTab === 'security' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-slate-200 text-slate-600'}`}
                    >
                        Security
                    </button>
                  </div>

                  {/* DATA TAB */}
                  {activeSettingsTab === 'data' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                       <section>
                         <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                           <Trash2 className="w-4 h-4 text-red-500" /> Data Cleanup
                         </h3>
                         <div className="bg-red-50 border border-red-100 rounded-xl p-5">
                            <p className="text-sm text-red-800 font-medium mb-1">Danger Zone</p>
                            <p className="text-xs text-red-600 mb-4 leading-relaxed">
                              Permanently delete all resume records from the database. This action cannot be undone and will reset the dashboard to an empty state.
                            </p>
                            <button 
                              onClick={handleClearAllData}
                              className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-600 hover:text-white transition-all shadow-sm hover:shadow-md flex items-center gap-2 w-full md:w-auto justify-center"
                            >
                               <Trash2 className="w-4 h-4" /> Clear All Data
                            </button>
                         </div>
                       </section>

                       <section>
                         <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                           <RotateCcw className="w-4 h-4 text-indigo-500" /> Auto-Deletion System
                         </h3>
                         <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-6">
                            <div className="flex items-center justify-between">
                               <div>
                                 <p className="text-sm font-bold text-slate-800">Enable Auto-Remove</p>
                                 <p className="text-xs text-slate-500 mt-1">Automatically cleanup old records when limit is reached.</p>
                               </div>
                               <button 
                                 onClick={() => setAutoDeleteEnabled(!autoDeleteEnabled)}
                                 className={`relative inline-flex items-center transition-colors duration-300 ${autoDeleteEnabled ? 'text-indigo-600' : 'text-slate-300'}`}
                               >
                                 {autoDeleteEnabled ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
                               </button>
                            </div>
                            
                            <div className={`transition-all duration-300 ${autoDeleteEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                               <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Retention Limit</label>
                               <div className="flex items-center gap-3">
                                  <input 
                                    type="number" 
                                    min="2"
                                    value={autoDeleteLimit}
                                    onChange={(e) => setAutoDeleteLimit(Math.max(2, parseInt(e.target.value) || 0))}
                                    className="w-24 px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-400"
                                    placeholder="50"
                                  />
                                  <span className="text-sm text-slate-600">records</span>
                               </div>
                               
                               <div className="mt-4 flex items-start gap-2 text-amber-700 bg-amber-50 p-3 rounded-lg text-xs leading-relaxed border border-amber-100">
                                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                  <div>
                                     <span className="font-bold block mb-1">System Logic Note:</span>
                                     If records reach <strong>{autoDeleteLimit}</strong>, the system will automatically remove the oldest <strong>{autoDeleteLimit - 1}</strong> record(s), leaving only the single most recent entry.
                                  </div>
                               </div>
                            </div>
                         </div>
                       </section>
                    </div>
                  )}

                  {/* SECURITY TAB */}
                  {activeSettingsTab === 'security' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                      <section>
                         <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                           <Shield className="w-4 h-4 text-indigo-500" /> Brute Force Protection
                         </h3>
                         <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                            <p className="text-xs text-slate-500 mb-2">
                               Configure the multi-stage lockout protection system. When a user fails attempts at a stage, they are locked out for the specified duration before moving to the next stage.
                            </p>

                            <div className="grid grid-cols-1 gap-4">
                                {securityConfig.map((stage, idx) => (
                                    <div key={idx} className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <div className="w-8 h-8 flex items-center justify-center bg-white rounded-full border border-slate-200 text-xs font-bold text-slate-500 shadow-sm shrink-0">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Max Attempts</label>
                                                <input 
                                                    type="number" 
                                                    min="1"
                                                    value={stage.attempts}
                                                    onChange={(e) => handleUpdateSecurityConfig(idx, 'attempts', parseInt(e.target.value) || 1)}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Lockout (Mins)</label>
                                                <input 
                                                    type="number" 
                                                    min="1"
                                                    value={stage.lockoutMinutes}
                                                    onChange={(e) => handleUpdateSecurityConfig(idx, 'lockoutMinutes', parseInt(e.target.value) || 1)}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-2 flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Cycle repeats after Stage 3 lockout completes.</span>
                            </div>
                         </div>
                       </section>
                    </div>
                  )}

               </div>
            </div>
            
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-shadow shadow-md hover:shadow-lg flex items-center gap-2 w-full md:w-auto justify-center"
              >
                 <Save className="w-4 h-4" /> Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal - (Hidden in Print) */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 print:hidden">
            {/* ... Modal content ... */}
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 ring-1 ring-white/20">
            {lockoutEndTime ? (
              // LOCKED OUT STATE
              <div className="px-8 py-12 text-center">
                 <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <Lock className="w-10 h-10" />
                 </div>
                 <h2 className="text-2xl font-bold text-slate-900 mb-2">Account Locked</h2>
                 <p className="text-sm text-slate-500 mb-6">Too many incorrect attempts.</p>
                 
                 <div className="text-4xl font-mono font-bold text-red-600 mb-2">
                    {formatTime(timeLeft)}
                 </div>
                 <p className="text-xs text-slate-400 uppercase tracking-wide">Please wait</p>
              </div>
            ) : (
              // NORMAL LOGIN STATE
              <div className="px-8 py-10">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-lg shadow-slate-900/30">
                      <Shield className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Admin</h2>
                      <p className="text-xs text-slate-500 font-medium tracking-wide uppercase mt-0.5">Secure Login</p>
                    </div>
                  </div>
                  <button onClick={() => setIsLoginModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 p-2 rounded-full hover:bg-slate-100">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="mb-8">
                  <p className="text-sm text-slate-600 mb-4 text-center">Enter your 4-digit security PIN</p>
                  <div className="flex justify-between gap-3 mb-2 px-2">
                    {pin.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { pinRefs.current[index] = el }}
                        type="password"
                        inputMode="numeric"
                        value={digit}
                        onChange={(e) => handlePinChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className={`w-14 h-16 text-center text-3xl font-bold rounded-2xl border-2 transition-all outline-none shadow-sm p-0 leading-[4rem] placeholder:text-slate-300 ${
                          loginError 
                            ? 'border-red-300 text-red-600 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                            : 'border-slate-200 text-slate-800 bg-slate-50 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 hover:border-slate-300'
                        }`}
                        placeholder="•"
                        disabled={!!lockoutEndTime}
                      />
                    ))}
                  </div>
                  {loginError && (
                    <div className="mt-4">
                      <p className="text-center text-xs text-red-500 font-bold bg-red-50 py-2 rounded-lg">
                        Incorrect PIN. 
                        {failedAttempts > 0 && (
                          <span className="block mt-0.5 font-normal">
                             Attempts left before block: {
                               (securityConfig[securityStage]?.attempts || 3) - failedAttempts
                             }
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                <button 
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={pin.some(d => d === '')}
                >
                  {pin.some(d => d === '') ? 'Enter PIN' : 'Verifying...'}
                </button>
              </div>
            )}
            
            <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-100 text-center backdrop-blur-sm">
              <p className="text-[10px] text-slate-400 font-medium">Secured by Webhub Security v1.0</p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default App;