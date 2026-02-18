import React, { useRef, useState, useEffect } from 'react';
import { ResumeData, Experience, Education, TemplateType } from '../types';
import { Plus, Trash2, ChevronDown, ChevronUp, Image as ImageIcon, Palette, Ban, Sparkles, Check, Save } from 'lucide-react';

interface EditorProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
  selectedTemplate: TemplateType;
  expandedSection: string | null;
  setExpandedSection: (section: string | null) => void;
  onFinish?: () => void;
  submitButtonLabel?: string;
}

const DropdownSelect = ({ 
  label, 
  value, 
  options, 
  onChange, 
  disabled, 
  placeholder = "Select..." 
}: { 
  label: string, 
  value: string, 
  options: string[], 
  onChange: (val: string) => void, 
  disabled?: boolean, 
  placeholder?: string 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between p-3 bg-white border border-slate-300 rounded-lg text-left transition-all duration-200 outline-none ${
          disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'hover:border-indigo-300 focus:ring-2 focus:ring-indigo-100 hover:shadow-sm'
        } ${isOpen ? 'ring-2 ring-indigo-100 border-indigo-400' : ''}`}
      >
        <span className={`block truncate ${!value ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
          {value || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
           <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {options.map((option) => (
                <button
                key={option}
                type="button"
                onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                    value === option 
                    ? 'bg-indigo-50 text-indigo-700 font-semibold' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                }`}
                >
                <span>{option}</span>
                {value === option && <Check className="w-4 h-4" />}
                </button>
            ))}
           </div>
        </div>
      )}
    </div>
  );
};

export const Editor: React.FC<EditorProps> = ({ 
  data, 
  onChange, 
  selectedTemplate, 
  expandedSection,
  setExpandedSection,
  onFinish,
  submitButtonLabel = "Send to Printer"
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExploding, setIsExploding] = useState(false);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // -- Theme Handlers --
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please upload a valid image file');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
           onChange({
            ...data,
            themeConfig: { ...data.themeConfig, photo: reader.result }
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const updateTheme = (field: keyof ResumeData['themeConfig'], value: any) => {
    onChange({
      ...data,
      themeConfig: { ...data.themeConfig, [field]: value }
    });
  };

  // -- Data Handlers --

  const updatePersonalInfo = (field: keyof ResumeData['personalInfo'], value: string) => {
    onChange({
      ...data,
      personalInfo: { ...data.personalInfo, [field]: value }
    });
  };

  const updateSummary = (value: string) => {
    onChange({ ...data, summary: value });
  };

  const addExperience = () => {
    const newExp: Experience = {
      id: crypto.randomUUID(),
      company: '',
      role: '',
      startDate: '',
      endDate: '',
      description: ''
    };
    onChange({ ...data, experience: [newExp, ...data.experience] });
    setExpandedSection('experience'); // Auto expand
  };

  const removeExperience = (id: string) => {
    onChange({ ...data, experience: data.experience.filter(e => e.id !== id) });
  };

  const updateExperience = (id: string, field: keyof Experience, value: string) => {
    onChange({
      ...data,
      experience: data.experience.map(e => e.id === id ? { ...e, [field]: value } : e)
    });
  };

  const addEducation = () => {
    const newEdu: Education = {
      id: crypto.randomUUID(),
      school: '',
      degree: '',
      year: '',
      gpa: '',
      cgpa: '',
      grade: '',
      percentage: ''
    };
    onChange({ ...data, education: [newEdu, ...data.education] });
    setExpandedSection('education'); // Auto expand
  };

  const removeEducation = (id: string) => {
    onChange({ ...data, education: data.education.filter(e => e.id !== id) });
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    onChange({
      ...data,
      education: data.education.map(e => e.id === id ? { ...e, [field]: value } : e)
    });
  };

  // Helper for skills text area
  const [skillsText, setSkillsText] = React.useState(data.skills.join(', '));
  // Update local state when data prop changes (e.g. on clear)
  useEffect(() => {
    setSkillsText(data.skills.join(', '));
  }, [data.skills]);

  const handleSkillsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSkillsText(e.target.value);
    onChange({ ...data, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) });
  };

  // Sparkle Animation Handler
  const handleSparkleFinish = () => {
    if (isExploding) return;
    
    // If it's a Save action (not a Print action), skip the long animation
    if (submitButtonLabel.toLowerCase().includes('save')) {
        if (onFinish) onFinish();
        return;
    }

    setIsExploding(true);
    
    // Wait for animation to play out (1.5s) then trigger the actual finish
    setTimeout(() => {
        if (onFinish) onFinish();
        // Reset state after navigation (though component might unmount)
        setTimeout(() => setIsExploding(false), 500);
    }, 1500);
  };

  // Generate particles for explosion
  const particles = Array.from({ length: 30 }).map((_, i) => {
    const angle = Math.random() * 360;
    const distance = 100 + Math.random() * 100; // Distance from center
    const tx = Math.cos(angle * (Math.PI / 180)) * distance;
    const ty = Math.sin(angle * (Math.PI / 180)) * distance;
    const colors = ['#4f46e5', '#ec4899', '#eab308', '#06b6d4', '#8b5cf6'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = 4 + Math.random() * 6;
    
    return {
        id: i,
        style: {
            '--tx': `${tx}px`,
            '--ty': `${ty}px`,
            '--color': color,
            '--size': `${size}px`,
            left: '50%',
            top: '50%'
        } as React.CSSProperties
    };
  });

  // Styles
  const inputClasses = "w-full p-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-base text-slate-900 placeholder:text-slate-400 disabled:bg-slate-100 disabled:text-slate-400 transition-shadow duration-200 hover:shadow-sm";
  const labelClasses = "block text-sm font-medium text-slate-700 mb-1.5";
  const sectionHeaderClasses = "w-full flex items-center justify-between p-4 md:p-5 bg-white hover:bg-slate-50 transition-colors text-left group";

  const BlockedOverlay = ({ label }: { label: string }) => (
    <div className="absolute inset-0 bg-white/60 z-10 backdrop-blur-[1px] flex items-center justify-center rounded-xl border border-slate-200">
       <div className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg animate-in zoom-in-95">
          <Ban className="w-4 h-4" />
          <span className="text-sm font-medium">{label} hidden</span>
       </div>
    </div>
  );

  const ColorPicker = ({ label, value, onChangeField }: { label: string, value: string, onChangeField: string }) => (
     <div className="mb-4">
        <label className={labelClasses}>{label}</label>
        <div className="flex flex-wrap gap-2">
          {['#0f172a', '#334155', '#4f46e5', '#2563eb', '#0891b2', '#059669', '#dc2626', '#d946ef', '#ea580c', '#ffffff'].map((color) => (
            <button
              key={color}
              onClick={() => updateTheme(onChangeField as any, color)}
              className={`w-8 h-8 rounded-full border transition-transform hover:scale-110 shadow-sm hover:shadow-md ${value === color ? 'border-slate-900 scale-110 ring-2 ring-slate-900 ring-offset-2' : 'border-slate-200'}`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
          <div className="relative group">
            <input 
              type="color" 
              value={value}
              onChange={(e) => updateTheme(onChangeField as any, e.target.value)}
              className="w-8 h-8 opacity-0 absolute inset-0 cursor-pointer"
            />
            <div className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center bg-white text-slate-500 hover:bg-slate-50 shadow-sm group-hover:scale-110 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
  );

  return (
    <div className="space-y-4 md:space-y-6 pb-24 lg:pb-20">

      {/* Modern Theme Settings */}
      {selectedTemplate === 'modern' && (
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden ring-1 ring-indigo-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-4 md:p-5 bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-100 flex items-center gap-2">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <Palette className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-indigo-900">Modern Theme Settings</h3>
          </div>
          <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            
            {/* Color Pickers */}
            <div>
              <ColorPicker label="Sidebar Background" value={data.themeConfig.primaryColor} onChangeField="primaryColor" />
              <ColorPicker label="Accent Color" value={data.themeConfig.accentColor} onChangeField="accentColor" />
            </div>

            {/* Photo Upload */}
            <div>
              <label className={labelClasses}>Profile Photo</label>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 md:w-24 md:h-24 bg-slate-50 rounded-full overflow-hidden border-2 border-slate-200 flex-shrink-0 shadow-sm group">
                      {data.themeConfig.photo ? (
                        <img 
                          src={data.themeConfig.photo} 
                          alt="Profile" 
                          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110" 
                          style={{ imageRendering: 'high-quality' }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                            <ImageIcon className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex gap-2 mb-3">
                        <button onClick={() => fileInputRef.current?.click()} className="text-xs bg-indigo-600 text-white px-3 md:px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-all shadow-sm hover:shadow">
                          Upload Photo
                        </button>
                        {data.themeConfig.photo && (
                          <button onClick={() => updateTheme('photo', null)} className="text-xs text-red-600 hover:text-red-700 px-3 hover:bg-red-50 rounded-lg transition-colors">Remove</button>
                        )}
                      </div>
                      <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                      <p className="text-[10px] text-slate-400">Supported: JPG, PNG. Max 5MB.</p>
                    </div>
                </div>
                
                <div>
                   <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">Photo Shape</label>
                   <div className="flex gap-2 bg-slate-100 p-1.5 rounded-lg w-fit">
                      {(['circle', 'rounded', 'square'] as const).map(shape => (
                        <button
                          key={shape}
                          onClick={() => updateTheme('photoShape', shape)}
                          className={`p-1.5 rounded-md transition-all ${data.themeConfig.photoShape === shape ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                          title={`Shape: ${shape}`}
                        >
                          <div className={`w-5 h-5 bg-current border border-current ${shape === 'circle' ? 'rounded-full' : shape === 'rounded' ? 'rounded-md' : 'rounded-none'}`} />
                        </button>
                      ))}
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Personal Info */}
      <div className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 overflow-hidden ${expandedSection === 'personal' ? 'ring-2 ring-indigo-500/20 border-indigo-200' : 'border-slate-200'}`}>
        <button onClick={() => toggleSection('personal')} className={sectionHeaderClasses}>
          <div className="flex items-center gap-3">
             <div className={`w-2 h-8 rounded-full transition-colors ${expandedSection === 'personal' ? 'bg-indigo-500' : 'bg-slate-200 group-hover:bg-indigo-200'}`}></div>
             <h3 className="text-lg font-bold text-slate-800">Personal Information</h3>
          </div>
          {expandedSection === 'personal' ? <ChevronUp className="w-5 h-5 text-indigo-500" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>
        {expandedSection === 'personal' && (
          <div className="p-4 md:p-6 space-y-5 md:space-y-6 animate-in slide-in-from-top-2 duration-200">
            
            {/* Name & Job */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               <div>
                <label className={labelClasses}>First Name</label>
                <input type="text" placeholder="e.g. John" value={data.personalInfo.firstName} onChange={(e) => updatePersonalInfo('firstName', e.target.value)} className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Last Name</label>
                <input type="text" placeholder="e.g. Doe" value={data.personalInfo.lastName} onChange={(e) => updatePersonalInfo('lastName', e.target.value)} className={inputClasses} />
              </div>
            </div>
            <div>
              <label className={labelClasses}>Job Target (Job Title)</label>
              <input type="text" disabled={!data.themeConfig.fieldVisibility.jobTitle} placeholder="e.g. Senior Software Engineer" value={data.personalInfo.jobTitle} onChange={(e) => updatePersonalInfo('jobTitle', e.target.value)} className={inputClasses} />
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClasses}>Email <span className="text-red-500">*</span></label>
                <input type="email" disabled={!data.themeConfig.fieldVisibility.email} placeholder="e.g. john.doe@example.com" value={data.personalInfo.email} onChange={(e) => updatePersonalInfo('email', e.target.value)} className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Phone</label>
                <input type="text" disabled={!data.themeConfig.fieldVisibility.phone} placeholder="(555) 123-4567" value={data.personalInfo.phone} onChange={(e) => updatePersonalInfo('phone', e.target.value)} className={inputClasses} />
              </div>
            </div>

            {/* Address */}
            <div className="bg-slate-50/50 p-4 md:p-5 rounded-xl border border-slate-100 relative mt-2">
               {!data.themeConfig.sectionVisibility.address && <BlockedOverlay label="Address" />}
               <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-4 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span> Location Details</h4>
               <div className="grid grid-cols-1 gap-5 mb-5">
                 <div>
                    <label className={labelClasses}>Address</label>
                    <input type="text" disabled={!data.themeConfig.sectionVisibility.address || !data.themeConfig.fieldVisibility.address} placeholder="123 Main St, Apt 4B" value={data.personalInfo.address} onChange={(e) => updatePersonalInfo('address', e.target.value)} className={inputClasses} />
                 </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className={labelClasses}>City</label>
                    <input type="text" disabled={!data.themeConfig.sectionVisibility.address || !data.themeConfig.fieldVisibility.city} placeholder="New York" value={data.personalInfo.city} onChange={(e) => updatePersonalInfo('city', e.target.value)} className={inputClasses} />
                  </div>
                  <div>
                    <label className={labelClasses}>State</label>
                    <input type="text" disabled={!data.themeConfig.sectionVisibility.address || !data.themeConfig.fieldVisibility.state} placeholder="NY" value={data.personalInfo.state} onChange={(e) => updatePersonalInfo('state', e.target.value)} className={inputClasses} />
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClasses}>Country</label>
                    <input type="text" disabled={!data.themeConfig.sectionVisibility.address || !data.themeConfig.fieldVisibility.country} placeholder="USA" value={data.personalInfo.country} onChange={(e) => updatePersonalInfo('country', e.target.value)} className={inputClasses} />
                  </div>
                  <div>
                    <label className={labelClasses}>Postal Code</label>
                    <input type="text" disabled={!data.themeConfig.sectionVisibility.address || !data.themeConfig.fieldVisibility.postalCode} placeholder="10001" value={data.personalInfo.postalCode} onChange={(e) => updatePersonalInfo('postalCode', e.target.value)} className={inputClasses} />
                  </div>
               </div>
            </div>

            {/* Personal Details */}
            <div className="bg-slate-50/50 p-4 md:p-5 rounded-xl border border-slate-100 relative">
              {!data.themeConfig.sectionVisibility.personalDetails && <BlockedOverlay label="Personal Details" />}
              <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-4 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span> Extra Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                 <div>
                  <label className={labelClasses}>Date of Birth</label>
                  <input type="date" disabled={!data.themeConfig.sectionVisibility.personalDetails || !data.themeConfig.fieldVisibility.dateOfBirth} value={data.personalInfo.dateOfBirth} onChange={(e) => updatePersonalInfo('dateOfBirth', e.target.value)} className={inputClasses} />
                 </div>
                 <div>
                  <label className={labelClasses}>Place of Birth</label>
                  <input type="text" disabled={!data.themeConfig.sectionVisibility.personalDetails || !data.themeConfig.fieldVisibility.placeOfBirth} placeholder="City, Country" value={data.personalInfo.placeOfBirth} onChange={(e) => updatePersonalInfo('placeOfBirth', e.target.value)} className={inputClasses} />
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                 <div>
                  <label className={labelClasses}>Nationality</label>
                  <input type="text" disabled={!data.themeConfig.sectionVisibility.personalDetails || !data.themeConfig.fieldVisibility.nationality} placeholder="American" value={data.personalInfo.nationality} onChange={(e) => updatePersonalInfo('nationality', e.target.value)} className={inputClasses} />
                 </div>
                 <div>
                  <label className={labelClasses}>Driving License</label>
                  <input type="text" disabled={!data.themeConfig.sectionVisibility.personalDetails || !data.themeConfig.fieldVisibility.drivingLicense} placeholder="e.g. Class C" value={data.personalInfo.drivingLicense} onChange={(e) => updatePersonalInfo('drivingLicense', e.target.value)} className={inputClasses} />
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <DropdownSelect 
                    label="Marital Status"
                    value={data.personalInfo.maritalStatus}
                    options={["Single", "Married", "Divorced", "Widowed"]}
                    onChange={(val: string) => updatePersonalInfo('maritalStatus', val)}
                    disabled={!data.themeConfig.sectionVisibility.personalDetails || !data.themeConfig.fieldVisibility.maritalStatus}
                    placeholder="Select Status"
                 />
                 <DropdownSelect 
                    label="Gender"
                    value={data.personalInfo.gender}
                    options={["Male", "Female", "Other"]}
                    onChange={(val: string) => updatePersonalInfo('gender', val)}
                    disabled={!data.themeConfig.sectionVisibility.personalDetails || !data.themeConfig.fieldVisibility.gender}
                    placeholder="Select Gender"
                 />
              </div>
            </div>

            {/* Social */}
            <div className="bg-slate-50/50 p-4 md:p-5 rounded-xl border border-slate-100 relative">
               {!data.themeConfig.sectionVisibility.links && <BlockedOverlay label="Social Links" />}
               <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-4 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span> Links</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div>
                  <label className={labelClasses}>LinkedIn</label>
                  <input type="text" disabled={!data.themeConfig.sectionVisibility.links || !data.themeConfig.fieldVisibility.linkedin} placeholder="linkedin.com/in/username" value={data.personalInfo.linkedin} onChange={(e) => updatePersonalInfo('linkedin', e.target.value)} className={inputClasses} />
                 </div>
                 <div>
                  <label className={labelClasses}>Website</label>
                  <input type="text" disabled={!data.themeConfig.sectionVisibility.links || !data.themeConfig.fieldVisibility.website} placeholder="yourwebsite.com" value={data.personalInfo.website} onChange={(e) => updatePersonalInfo('website', e.target.value)} className={inputClasses} />
                 </div>
               </div>
            </div>

          </div>
        )}
      </div>

      {/* Summary */}
      <div className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 overflow-hidden relative ${expandedSection === 'summary' ? 'ring-2 ring-indigo-500/20 border-indigo-200' : 'border-slate-200'}`}>
        {!data.themeConfig.sectionVisibility.summary && <BlockedOverlay label="Summary" />}
        <button onClick={() => toggleSection('summary')} className={sectionHeaderClasses} disabled={!data.themeConfig.sectionVisibility.summary}>
          <div className="flex items-center gap-3">
             <div className={`w-2 h-8 rounded-full transition-colors ${expandedSection === 'summary' ? 'bg-indigo-500' : 'bg-slate-200 group-hover:bg-indigo-200'}`}></div>
             <h3 className="text-lg font-bold text-slate-800">Professional Summary</h3>
          </div>
          {expandedSection === 'summary' ? <ChevronUp className="w-5 h-5 text-indigo-500" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>
        {expandedSection === 'summary' && data.themeConfig.sectionVisibility.summary && (
          <div className="p-4 md:p-6 relative animate-in slide-in-from-top-2 duration-200">
             <textarea 
               value={data.summary}
               onChange={(e) => updateSummary(e.target.value)}
               placeholder="Briefly describe your professional background and key achievements..."
               rows={6}
               className={inputClasses}
            />
          </div>
        )}
      </div>

      {/* Experience */}
      <div className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 overflow-hidden relative ${expandedSection === 'experience' ? 'ring-2 ring-indigo-500/20 border-indigo-200' : 'border-slate-200'}`}>
        {!data.themeConfig.sectionVisibility.experience && <BlockedOverlay label="Experience" />}
        <button onClick={() => toggleSection('experience')} className={sectionHeaderClasses} disabled={!data.themeConfig.sectionVisibility.experience}>
          <div className="flex items-center gap-3">
             <div className={`w-2 h-8 rounded-full transition-colors ${expandedSection === 'experience' ? 'bg-indigo-500' : 'bg-slate-200 group-hover:bg-indigo-200'}`}></div>
             <h3 className="text-lg font-bold text-slate-800">Experience</h3>
          </div>
          {expandedSection === 'experience' ? <ChevronUp className="w-5 h-5 text-indigo-500" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>
        {expandedSection === 'experience' && data.themeConfig.sectionVisibility.experience && (
          <div className="p-4 md:p-6 space-y-8 animate-in slide-in-from-top-2 duration-200">
             {data.experience.map((exp, index) => (
               <div key={exp.id} className="p-4 md:p-6 border border-slate-200 rounded-xl bg-white shadow-sm relative group transition-all hover:border-indigo-300 hover:shadow-md">
                 <button 
                   onClick={() => removeExperience(exp.id)}
                   className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors bg-slate-50 p-2 rounded-full border border-slate-100 md:opacity-0 md:group-hover:opacity-100"
                   title="Remove Experience"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
                 <div className="grid grid-cols-1 gap-5 mb-5 mt-4 md:mt-0">
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Company</label>
                     <input type="text" placeholder="Company Name" value={exp.company} onChange={(e) => updateExperience(exp.id, 'company', e.target.value)} className={inputClasses} />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Role</label>
                     <input type="text" placeholder="Job Title" value={exp.role} onChange={(e) => updateExperience(exp.id, 'role', e.target.value)} className={inputClasses} />
                   </div>
                   <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Start Date</label>
                        <input type="text" placeholder="MM/YYYY" value={exp.startDate} onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)} className={inputClasses} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">End Date</label>
                        <input type="text" placeholder="Present or MM/YYYY" value={exp.endDate} onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)} className={inputClasses} />
                      </div>
                   </div>
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Description</label>
                   <textarea
                     value={exp.description}
                     onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                     placeholder="• Achieved X by doing Y&#10;• Led team of Z..."
                     rows={5}
                     className={inputClasses}
                   />
                 </div>
               </div>
             ))}
             <button 
               onClick={addExperience}
               className="w-full py-4 flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-700 transition-all font-semibold hover:scale-[1.01]"
             >
               <Plus className="w-5 h-5" /> Add Experience
             </button>
          </div>
        )}
      </div>

       {/* Education */}
       <div className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 overflow-hidden relative ${expandedSection === 'education' ? 'ring-2 ring-indigo-500/20 border-indigo-200' : 'border-slate-200'}`}>
        {!data.themeConfig.sectionVisibility.education && <BlockedOverlay label="Education" />}
        <button onClick={() => toggleSection('education')} className={sectionHeaderClasses} disabled={!data.themeConfig.sectionVisibility.education}>
          <div className="flex items-center gap-3">
             <div className={`w-2 h-8 rounded-full transition-colors ${expandedSection === 'education' ? 'bg-indigo-500' : 'bg-slate-200 group-hover:bg-indigo-200'}`}></div>
             <h3 className="text-lg font-bold text-slate-800">Education</h3>
          </div>
          {expandedSection === 'education' ? <ChevronUp className="w-5 h-5 text-indigo-500" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>
        {expandedSection === 'education' && data.themeConfig.sectionVisibility.education && (
          <div className="p-4 md:p-6 space-y-6 animate-in slide-in-from-top-2 duration-200">
             {data.education.map((edu) => (
               <div key={edu.id} className="p-4 md:p-6 border border-slate-200 rounded-xl bg-white shadow-sm relative group transition-all hover:border-indigo-300 hover:shadow-md">
                  <button 
                   onClick={() => removeEducation(edu.id)}
                   className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors bg-slate-50 p-2 rounded-full border border-slate-100 md:opacity-0 md:group-hover:opacity-100"
                   title="Remove Education"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
                 <div className="grid grid-cols-1 gap-5 mt-4 md:mt-0">
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">School / University</label>
                     <input type="text" placeholder="University Name" value={edu.school} onChange={(e) => updateEducation(edu.id, 'school', e.target.value)} className={inputClasses} />
                   </div>
                   <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Degree</label>
                      <input type="text" placeholder="Degree / Field of Study" value={edu.degree} onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)} className={inputClasses} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Year</label>
                      <input type="text" placeholder="Graduation Year" value={edu.year} onChange={(e) => updateEducation(edu.id, 'year', e.target.value)} className={inputClasses} />
                    </div>
                   </div>
                   
                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">GPA</label>
                        <input type="text" placeholder="e.g. 3.8" value={edu.gpa} onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)} className={inputClasses} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">CGPA</label>
                        <input type="text" placeholder="e.g. 9.0" value={edu.cgpa} onChange={(e) => updateEducation(edu.id, 'cgpa', e.target.value)} className={inputClasses} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Grade</label>
                        <input type="text" placeholder="e.g. A" value={edu.grade} onChange={(e) => updateEducation(edu.id, 'grade', e.target.value)} className={inputClasses} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">%</label>
                        <input type="text" placeholder="e.g. 85%" value={edu.percentage} onChange={(e) => updateEducation(edu.id, 'percentage', e.target.value)} className={inputClasses} />
                      </div>
                   </div>
                 </div>
               </div>
             ))}
             <button 
               onClick={addEducation}
               className="w-full py-4 flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-700 transition-all font-semibold hover:scale-[1.01]"
             >
               <Plus className="w-5 h-5" /> Add Education
             </button>
          </div>
        )}
      </div>

      {/* Skills */}
      <div className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 overflow-hidden relative ${expandedSection === 'skills' ? 'ring-2 ring-indigo-500/20 border-indigo-200' : 'border-slate-200'}`}>
        {!data.themeConfig.sectionVisibility.skills && <BlockedOverlay label="Skills" />}
        <button onClick={() => toggleSection('skills')} className={sectionHeaderClasses} disabled={!data.themeConfig.sectionVisibility.skills}>
          <div className="flex items-center gap-3">
             <div className={`w-2 h-8 rounded-full transition-colors ${expandedSection === 'skills' ? 'bg-indigo-500' : 'bg-slate-200 group-hover:bg-indigo-200'}`}></div>
             <h3 className="text-lg font-bold text-slate-800">Skills</h3>
          </div>
          {expandedSection === 'skills' ? <ChevronUp className="w-5 h-5 text-indigo-500" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>
        {expandedSection === 'skills' && data.themeConfig.sectionVisibility.skills && (
          <div className="p-4 md:p-6 animate-in slide-in-from-top-2 duration-200">
             <label className={labelClasses}>Technical Skills (comma separated)</label>
             <textarea 
               rows={4} 
               value={skillsText} 
               onChange={handleSkillsChange} 
               className={inputClasses}
               placeholder="React, TypeScript, Java, Project Management..."
             />
          </div>
        )}
      </div>

      {/* Finish & Print Button */}
      {onFinish && (
         <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 z-40 lg:relative lg:border-none lg:bg-transparent lg:p-0">
           <button 
             onClick={handleSparkleFinish}
             disabled={isExploding}
             className={`w-full py-3.5 md:py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-all flex items-center justify-center gap-2 group animate-in slide-in-from-bottom-2 duration-500 relative overflow-visible z-10 ${
                 submitButtonLabel.toLowerCase().includes('save') 
                 ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                 : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
             }`}
           >
              {submitButtonLabel.toLowerCase().includes('save') ? (
                  <Save className="w-5 h-5" />
              ) : (
                  <Sparkles className={`w-5 h-5 ${isExploding ? 'animate-spin' : 'group-hover:animate-spin'}`} />
              )}
              {isExploding && !submitButtonLabel.toLowerCase().includes('save') ? 'Generating Magic...' : submitButtonLabel}
           </button>
           
           {/* Sparkle Particles (Only show if not saving) */}
           {isExploding && !submitButtonLabel.toLowerCase().includes('save') && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 w-0 h-0">
               {particles.map((p) => (
                 <div
                   key={p.id}
                   className="absolute rounded-full animate-particle-bang opacity-0"
                   style={{
                     ...p.style,
                     width: p.style['--size' as any],
                     height: p.style['--size' as any],
                     backgroundColor: p.style['--color' as any],
                     animation: 'particle-bang 1s cubic-bezier(0, .9, .57, 1) forwards'
                   }}
                 />
               ))}
             </div>
           )}
         </div>
      )}

      {/* Global Style for Particle Animation */}
      <style>{`
        @keyframes particle-bang {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          40% {
            opacity: 1;
          }
          100% {
            transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};