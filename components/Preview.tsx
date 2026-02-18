import React from 'react';
import { ResumeData, TemplateType } from '../types';
import { Mail, Phone, MapPin, Linkedin, Globe, Check, Star, Terminal, Code2 } from 'lucide-react';

interface PreviewProps {
  data: ResumeData;
  template: TemplateType;
}

// Visual indicator for page breaks in Preview mode (Hidden in Print)
const PageGuides = () => (
  <div className="absolute inset-0 pointer-events-none z-50 print:hidden overflow-hidden font-mono text-[10px] font-medium text-slate-300 select-none">
    {/* Page 1 Break */}
    <div className="absolute w-full border-b border-dashed border-red-300 opacity-50 flex items-end justify-end" style={{ top: '297mm' }}>
       <span className="text-[9px] text-red-300 bg-white/80 px-1 mb-0.5 mr-1">End of Page 1 (A4)</span>
    </div>
    
    {/* Page 2 Break */}
    <div className="absolute w-full border-b border-dashed border-red-300 opacity-50 flex items-end justify-end" style={{ top: '594mm' }}>
       <span className="text-[9px] text-red-300 bg-white/80 px-1 mb-0.5 mr-1">End of Page 2 (A4)</span>
    </div>

    {/* Page 3 Break */}
    <div className="absolute w-full border-b border-dashed border-red-300 opacity-50 flex items-end justify-end" style={{ top: '891mm' }}>
       <span className="text-[9px] text-red-300 bg-white/80 px-1 mb-0.5 mr-1">End of Page 3 (A4)</span>
    </div>
  </div>
);

// Helper to render text with smart bullet points and icons
const RichText: React.FC<{ 
  text: string; 
  accentColor?: string; 
  className?: string;
  bulletStyle?: 'dot' | 'arrow' | 'check' | 'star';
}> = ({ text, accentColor = '#64748b', className = '', bulletStyle = 'dot' }) => {
  if (!text) return null;
  
  const lines = text.split('\n');
  // Check if the text looks like a list (starts with •, -, *)
  const isList = lines.some(line => /^[•\-\*]/.test(line.trim()));

  if (!isList) {
    return <p className={`whitespace-pre-wrap ${className}`}>{text}</p>;
  }

  return (
    <ul className={`space-y-2 ${className}`}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        const isBullet = /^[•\-\*]/.test(trimmed);
        const content = trimmed.replace(/^[•\-\*]\s*/, '');
        
        if (!content) return null; // Skip empty lines

        if (isBullet) {
          return (
            <li key={i} className="flex items-start gap-3 break-inside-avoid">
              <span className="flex-shrink-0 mt-0.5 select-none">
                {bulletStyle === 'arrow' && (
                    <span 
                      className="inline-block text-lg leading-none" 
                      style={{ color: accentColor, marginRight: '2px' }}
                    >
                      ➢
                    </span>
                )}
                {bulletStyle === 'check' && <Check className="w-4 h-4" style={{ color: accentColor }} strokeWidth={2.5} />}
                {bulletStyle === 'star' && <Star className="w-3.5 h-3.5 fill-current" style={{ color: accentColor }} />}
                {bulletStyle === 'dot' && (
                    <span 
                        className="block mt-2 w-1.5 h-1.5 rounded-full opacity-80" 
                        style={{ backgroundColor: accentColor }}
                    />
                )}
              </span>
              <span className="flex-1 leading-relaxed">{content}</span>
            </li>
          );
        }
        return <li key={i} className="block leading-relaxed break-inside-avoid">{line}</li>;
      })}
    </ul>
  );
};

const MinimalistLayout: React.FC<{ data: ResumeData }> = ({ data }) => {
  const { personalInfo, themeConfig } = data;
  const fullName = [personalInfo.firstName, personalInfo.lastName].filter(Boolean).join(' ');
  
  if (!fullName && !personalInfo.email) return null; // Render nothing if completely empty

  // Construct address based on visibility
  const addressParts = [];
  if (themeConfig.fieldVisibility.address && personalInfo.address) addressParts.push(personalInfo.address);
  if (themeConfig.fieldVisibility.city && personalInfo.city) addressParts.push(personalInfo.city);
  if (themeConfig.fieldVisibility.state && personalInfo.state) addressParts.push(personalInfo.state);
  if (themeConfig.fieldVisibility.country && personalInfo.country) addressParts.push(personalInfo.country);
  
  const locationStr = addressParts.join(', ');
  const fullLocation = themeConfig.fieldVisibility.postalCode && personalInfo.postalCode 
    ? `${locationStr} ${personalInfo.postalCode}`.trim() 
    : locationStr;

  return (
    <div className="text-slate-800">
      <header className="border-b-2 border-slate-800 pb-6 mb-8 break-inside-avoid">
        {fullName && <h1 className="text-4xl font-bold uppercase tracking-tight text-slate-900 mb-2">{fullName}</h1>}
        {themeConfig.fieldVisibility.jobTitle && <p className="text-xl text-slate-600 font-medium mb-4">{personalInfo.jobTitle}</p>}
        
        <div className="flex flex-wrap gap-y-2 gap-x-6 text-sm text-slate-600">
          {themeConfig.fieldVisibility.email && personalInfo.email && <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /><span>{personalInfo.email}</span></div>}
          {themeConfig.fieldVisibility.phone && personalInfo.phone && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /><span>{personalInfo.phone}</span></div>}
          {themeConfig.sectionVisibility.address && fullLocation && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /><span>{fullLocation}</span></div>}
          
          {themeConfig.sectionVisibility.links && (
             <>
                {themeConfig.fieldVisibility.linkedin && personalInfo.linkedin && <div className="flex items-center gap-1.5"><Linkedin className="w-3.5 h-3.5" /><span>{personalInfo.linkedin}</span></div>}
                {themeConfig.fieldVisibility.website && personalInfo.website && <div className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /><span>{personalInfo.website}</span></div>}
             </>
          )}
        </div>
        
        {themeConfig.sectionVisibility.personalDetails && (
            <div className="mt-3 text-xs text-slate-500 flex flex-wrap gap-x-4">
               {themeConfig.fieldVisibility.nationality && personalInfo.nationality && <span><span className="font-semibold">Nationality:</span> {personalInfo.nationality}</span>}
               {themeConfig.fieldVisibility.dateOfBirth && personalInfo.dateOfBirth && <span><span className="font-semibold">DOB:</span> {personalInfo.dateOfBirth}</span>}
               {themeConfig.fieldVisibility.maritalStatus && personalInfo.maritalStatus && <span><span className="font-semibold">Status:</span> {personalInfo.maritalStatus}</span>}
            </div>
        )}
      </header>

      {themeConfig.sectionVisibility.summary && data.summary && (
        <section className="mb-8 break-inside-avoid">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-200 pb-1">Professional Summary</h2>
          <RichText text={data.summary} className="text-sm leading-relaxed text-slate-700" />
        </section>
      )}

      {themeConfig.sectionVisibility.experience && data.experience.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 border-b border-slate-200 pb-1 break-inside-avoid">Experience</h2>
          <div className="space-y-6">
            {data.experience.map(exp => (
              <div key={exp.id} className="break-inside-avoid">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-slate-800 text-lg">{exp.role}</h3>
                  <span className="text-sm text-slate-500 font-medium whitespace-nowrap">{exp.startDate} – {exp.endDate}</span>
                </div>
                <div className="text-sm font-semibold text-indigo-700 mb-2">{exp.company}</div>
                <RichText text={exp.description} className="text-sm leading-relaxed text-slate-700" accentColor="#4338ca" />
              </div>
            ))}
          </div>
        </section>
      )}

      {themeConfig.sectionVisibility.education && data.education.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 border-b border-slate-200 pb-1 break-inside-avoid">Education</h2>
          <div className="space-y-4">
            {data.education.map(edu => (
              <div key={edu.id} className="break-inside-avoid">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800">{edu.school}</h3>
                    <div className="text-sm text-slate-600">{edu.degree}</div>
                    <div className="text-xs text-slate-500 mt-1 flex gap-3">
                        {edu.gpa && <span>GPA: {edu.gpa}</span>}
                        {edu.cgpa && <span>CGPA: {edu.cgpa}</span>}
                        {edu.grade && <span>Grade: {edu.grade}</span>}
                        {edu.percentage && <span>{edu.percentage}</span>}
                    </div>
                  </div>
                  <div className="text-sm text-slate-500 font-medium">{edu.year}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {themeConfig.sectionVisibility.skills && data.skills.length > 0 && (
        <section className="break-inside-avoid">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-200 pb-1">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill, idx) => (
              <span key={idx} className="bg-slate-100 text-slate-700 px-3 py-1 rounded text-xs font-medium print:bg-transparent print:p-0 print:text-slate-800 print:after:content-[','] print:last:after:content-[''] print:mr-1">
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const ClassicLayout: React.FC<{ data: ResumeData }> = ({ data }) => {
  const { personalInfo, themeConfig } = data;
  const fullName = [personalInfo.firstName, personalInfo.lastName].filter(Boolean).join(' ');

  if (!fullName && !personalInfo.email) return null;

  // Construct address
  const addressParts = [];
  if (themeConfig.fieldVisibility.address && personalInfo.address) addressParts.push(personalInfo.address);
  if (themeConfig.fieldVisibility.city && personalInfo.city) addressParts.push(personalInfo.city);
  if (themeConfig.fieldVisibility.state && personalInfo.state) addressParts.push(personalInfo.state);
  if (themeConfig.fieldVisibility.country && personalInfo.country) addressParts.push(personalInfo.country);
  if (themeConfig.fieldVisibility.postalCode && personalInfo.postalCode) addressParts.push(personalInfo.postalCode);
  const locationStr = addressParts.join(', ');

  return (
    <div className="font-serif text-slate-900">
      <header className="text-center border-b border-slate-300 pb-6 mb-6 break-inside-avoid">
        {fullName && <h1 className="text-3xl font-bold uppercase tracking-widest mb-2">{fullName}</h1>}
        {themeConfig.fieldVisibility.jobTitle && <p className="italic text-lg text-slate-700 mb-3">{personalInfo.jobTitle}</p>}
        
        <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-600 mb-2">
           {themeConfig.fieldVisibility.email && personalInfo.email && <span>{personalInfo.email}</span>}
           {themeConfig.fieldVisibility.phone && personalInfo.phone && <span className="border-l border-slate-400 pl-4">{personalInfo.phone}</span>}
           {themeConfig.sectionVisibility.address && locationStr && <span className="border-l border-slate-400 pl-4">{locationStr}</span>}
        </div>
        
        {themeConfig.sectionVisibility.personalDetails && (
            <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-500">
               {themeConfig.fieldVisibility.nationality && personalInfo.nationality && <span>Nationality: {personalInfo.nationality}</span>}
               {themeConfig.fieldVisibility.dateOfBirth && personalInfo.dateOfBirth && <span>Born: {personalInfo.dateOfBirth}</span>}
            </div>
        )}
      </header>

      {themeConfig.sectionVisibility.summary && data.summary && (
        <section className="mb-6 break-inside-avoid">
          <h2 className="text-center font-bold uppercase tracking-widest text-sm border-b border-slate-300 pb-2 mb-3">Professional Profile</h2>
          <RichText text={data.summary} className="text-sm leading-relaxed text-justify" />
        </section>
      )}

      {themeConfig.sectionVisibility.experience && data.experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-center font-bold uppercase tracking-widest text-sm border-b border-slate-300 pb-2 mb-4 break-inside-avoid">Work Experience</h2>
          <div className="space-y-6">
            {data.experience.map(exp => (
              <div key={exp.id} className="break-inside-avoid">
                <div className="flex justify-between items-baseline font-bold mb-1">
                  <h3 className="text-base">{exp.company}</h3>
                  <span className="text-sm italic">{exp.startDate} – {exp.endDate}</span>
                </div>
                <div className="text-sm italic mb-2">{exp.role}</div>
                <RichText text={exp.description} className="text-sm leading-relaxed" />
              </div>
            ))}
          </div>
        </section>
      )}

      {themeConfig.sectionVisibility.education && data.education.length > 0 && (
        <section className="mb-6">
          <h2 className="text-center font-bold uppercase tracking-widest text-sm border-b border-slate-300 pb-2 mb-4 break-inside-avoid">Education</h2>
          <div className="space-y-4">
            {data.education.map(edu => (
              <div key={edu.id} className="break-inside-avoid">
                <div className="flex justify-between font-bold text-sm">
                  <h3>{edu.school}</h3>
                  <span>{edu.year}</span>
                </div>
                <div className="text-sm italic">{edu.degree}</div>
                <div className="text-xs mt-1 italic text-slate-600">
                  {[
                    edu.gpa ? `GPA: ${edu.gpa}` : '', 
                    edu.cgpa ? `CGPA: ${edu.cgpa}` : '',
                    edu.grade ? `Grade: ${edu.grade}` : '',
                    edu.percentage ? `${edu.percentage}` : ''
                  ].filter(Boolean).join(' | ')}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

       {themeConfig.sectionVisibility.skills && data.skills.length > 0 && (
        <section className="break-inside-avoid">
          <h2 className="text-center font-bold uppercase tracking-widest text-sm border-b border-slate-300 pb-2 mb-3">Skills</h2>
          <p className="text-center text-sm leading-relaxed">
            {data.skills.join(' • ')}
          </p>
        </section>
      )}
    </div>
  );
};

const ModernLayout: React.FC<{ data: ResumeData }> = ({ data }) => {
  const { personalInfo, themeConfig } = data;
  const fullName = [personalInfo.firstName, personalInfo.lastName].filter(Boolean).join(' ');
  
  // Construct address
  const addressParts = [];
  if (themeConfig.fieldVisibility.city && personalInfo.city) addressParts.push(personalInfo.city);
  if (themeConfig.fieldVisibility.state && personalInfo.state) addressParts.push(personalInfo.state);
  if (themeConfig.fieldVisibility.country && personalInfo.country) addressParts.push(personalInfo.country);
  const locationStr = addressParts.join(', ');
  
  // Custom styles based on user selection
  const accentColor = themeConfig.accentColor; // Highlight/Text
  const primaryColor = themeConfig.primaryColor; // Sidebar BG
  
  const photoRadius = 
    themeConfig.photoShape === 'circle' ? 'rounded-full' : 
    themeConfig.photoShape === 'rounded' ? 'rounded-2xl' : 'rounded-none';

  return (
    <div className="flex min-h-[297mm] print:min-h-0 print:h-auto">
      {/* Sidebar - Uses Primary Color for Background */}
      <aside className="w-[34%] text-white p-8 flex flex-col gap-10 relative overflow-hidden print:h-auto" style={{ backgroundColor: primaryColor, printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
        {/* Decorative accent element */}
        <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: accentColor }}></div>

        {/* Profile Photo or Initials */}
        <div className="flex justify-center mt-4 break-inside-avoid">
             {themeConfig.photo ? (
                <div className={`w-48 h-48 ${photoRadius} overflow-hidden border-4 border-white/20 shadow-2xl bg-white relative`}>
                    <img 
                      src={themeConfig.photo} 
                      alt={fullName} 
                      className="w-full h-full object-cover object-top transform transition-transform hover:scale-105 duration-700" 
                    />
                </div>
             ) : (fullName.length > 0) && (
                <div 
                    className={`w-40 h-40 ${photoRadius} flex items-center justify-center text-5xl font-bold uppercase text-white shadow-xl`}
                    style={{ backgroundColor: accentColor }}
                >
                    {personalInfo.firstName.charAt(0)}{personalInfo.lastName.charAt(0)}
                </div>
             )}
        </div>
        
        {/* Contact Info */}
        <div className="mt-2 break-inside-avoid">
          <h2 className="font-bold text-sm uppercase tracking-wider mb-6 pb-2 border-b border-white/20 flex items-center gap-2" style={{ color: accentColor }}>
            Contact
          </h2>
          <div className="space-y-4 text-sm font-light text-white/90">
             {themeConfig.fieldVisibility.email && personalInfo.email && (
                <div className="flex items-start gap-3 group">
                    <Mail className="w-4 h-4 mt-0.5 opacity-70 shrink-0 group-hover:text-white transition-colors" style={{ color: accentColor }} />
                    <div className="break-all">{personalInfo.email}</div>
                </div>
             )}
             {themeConfig.fieldVisibility.phone && personalInfo.phone && (
                <div className="flex items-start gap-3 group">
                    <Phone className="w-4 h-4 mt-0.5 opacity-70 shrink-0 group-hover:text-white transition-colors" style={{ color: accentColor }} />
                    <div>{personalInfo.phone}</div>
                </div>
             )}
             {themeConfig.sectionVisibility.address && locationStr && (
                <div className="flex items-start gap-3 group">
                    <MapPin className="w-4 h-4 mt-0.5 opacity-70 shrink-0 group-hover:text-white transition-colors" style={{ color: accentColor }} />
                    <div>{locationStr}</div>
                </div>
             )}
             
             {themeConfig.sectionVisibility.links && (
               <>
                  {themeConfig.fieldVisibility.linkedin && personalInfo.linkedin && (
                     <div className="flex items-start gap-3 group">
                        <Linkedin className="w-4 h-4 mt-0.5 opacity-70 shrink-0 group-hover:text-white transition-colors" style={{ color: accentColor }} />
                        <div className="break-all">{personalInfo.linkedin.replace(/^https?:\/\//, '')}</div>
                     </div>
                  )}
                  {themeConfig.fieldVisibility.website && personalInfo.website && (
                     <div className="flex items-start gap-3 group">
                        <Globe className="w-4 h-4 mt-0.5 opacity-70 shrink-0 group-hover:text-white transition-colors" style={{ color: accentColor }} />
                        <div className="break-all">{personalInfo.website}</div>
                     </div>
                  )}
               </>
             )}
          </div>
        </div>

        {/* Personal Details */}
        {themeConfig.sectionVisibility.personalDetails && (
           <div className="break-inside-avoid">
            <h2 className="font-bold text-sm uppercase tracking-wider mb-6 pb-2 border-b border-white/20" style={{ color: accentColor }}>
                Personal Info
            </h2>
            <div className="grid grid-cols-1 gap-y-4 text-sm font-light text-white/90">
               {themeConfig.fieldVisibility.dateOfBirth && personalInfo.dateOfBirth && <div><span className="block text-xs font-bold uppercase mb-0.5 opacity-60">Born</span>{personalInfo.dateOfBirth}</div>}
               {themeConfig.fieldVisibility.placeOfBirth && personalInfo.placeOfBirth && <div><span className="block text-xs font-bold uppercase mb-0.5 opacity-60">Place of Birth</span>{personalInfo.placeOfBirth}</div>}
               {themeConfig.fieldVisibility.nationality && personalInfo.nationality && <div><span className="block text-xs font-bold uppercase mb-0.5 opacity-60">Nationality</span>{personalInfo.nationality}</div>}
               {themeConfig.fieldVisibility.gender && personalInfo.gender && <div><span className="block text-xs font-bold uppercase mb-0.5 opacity-60">Gender</span>{personalInfo.gender}</div>}
               {themeConfig.fieldVisibility.maritalStatus && personalInfo.maritalStatus && <div><span className="block text-xs font-bold uppercase mb-0.5 opacity-60">Marital Status</span>{personalInfo.maritalStatus}</div>}
               {themeConfig.fieldVisibility.drivingLicense && personalInfo.drivingLicense && <div><span className="block text-xs font-bold uppercase mb-0.5 opacity-60">License</span>{personalInfo.drivingLicense}</div>}
            </div>
          </div>
        )}

        {themeConfig.sectionVisibility.education && data.education.length > 0 && (
          <div className="break-inside-avoid">
             <h2 className="font-bold text-sm uppercase tracking-wider mb-6 pb-2 border-b border-white/20" style={{ color: accentColor }}>
                Education
             </h2>
             <div className="space-y-6">
              {data.education.map(edu => (
                <div key={edu.id}>
                  <div className="font-bold text-white text-base">{edu.school}</div>
                  <div className="text-sm font-medium mt-0.5" style={{ color: accentColor }}>{edu.degree}</div>
                  <div className="text-xs text-white/60 mt-1">{edu.year}</div>
                  <div className="text-[11px] text-white/60 mt-1 opacity-80">
                      {[edu.gpa && `GPA: ${edu.gpa}`, edu.percentage].filter(Boolean).join(', ')}
                  </div>
                </div>
              ))}
             </div>
          </div>
        )}

        {themeConfig.sectionVisibility.skills && data.skills.length > 0 && (
          <div className="break-inside-avoid">
            <h2 className="font-bold text-sm uppercase tracking-wider mb-6 pb-2 border-b border-white/20" style={{ color: accentColor }}>
                Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill, idx) => (
                <span key={idx} className="text-xs px-3 py-1.5 rounded bg-white/10 text-white border border-white/10 shadow-sm backdrop-blur-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 bg-white text-slate-800 relative">
         {/* Name Header */}
        <header className="mb-14 pt-4 break-inside-avoid">
          {fullName && (
              <h1 className="text-6xl font-extrabold uppercase tracking-tight text-slate-900 mb-2 leading-none" style={{ color: accentColor }}>
                  {personalInfo.firstName} <span className="text-slate-900">{personalInfo.lastName}</span>
              </h1>
          )}
          {themeConfig.fieldVisibility.jobTitle && <p className="text-2xl font-light tracking-wide text-slate-500 uppercase">{personalInfo.jobTitle}</p>}
        </header>

        {themeConfig.sectionVisibility.summary && data.summary && (
          <section className="mb-12 break-inside-avoid">
            <h2 className="font-bold uppercase tracking-wider text-slate-900 mb-5 flex items-center gap-3 text-lg">
              <span className="w-8 h-1 rounded-full" style={{ backgroundColor: accentColor }}></span> Profile
            </h2>
            <div className="text-slate-600 leading-relaxed pl-2">
                <RichText text={data.summary} accentColor={accentColor} bulletStyle="arrow" />
            </div>
          </section>
        )}

        {themeConfig.sectionVisibility.experience && data.experience.length > 0 && (
          <section>
            <h2 className="font-bold uppercase tracking-wider text-slate-900 mb-10 flex items-center gap-3 text-lg break-inside-avoid">
               <span className="w-8 h-1 rounded-full" style={{ backgroundColor: accentColor }}></span> Experience
            </h2>
            <div className="space-y-10">
               {data.experience.map(exp => (
                <div key={exp.id} className="relative pl-8 border-l-2 border-slate-100 group break-inside-avoid">
                  {/* Timeline Marker: Center aligned on the 2px border */}
                  <div 
                    className="absolute -left-[11px] top-0 bg-white w-6 h-6 flex items-center justify-center rounded-full transition-all group-hover:scale-110 duration-300 select-none" 
                  >
                    <span className="text-xl leading-none relative top-[-1px]" style={{ color: accentColor }}>◉</span>
                  </div>
                  
                  <div className="mb-3">
                     <h3 className="font-bold text-xl text-slate-800">{exp.role}</h3>
                     <div className="flex justify-between items-center text-sm mt-1">
                       <span className="font-bold text-base tracking-wide" style={{ color: accentColor }}>{exp.company}</span>
                       <span className="text-slate-400 font-medium bg-slate-50 px-2 py-0.5 rounded text-xs uppercase tracking-wide">{exp.startDate} – {exp.endDate}</span>
                     </div>
                  </div>
                  <div className="text-sm text-slate-600">
                    <RichText text={exp.description} accentColor={accentColor} bulletStyle="arrow" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

const BoldLayout: React.FC<{ data: ResumeData }> = ({ data }) => {
  const { personalInfo, themeConfig } = data;
  const fullName = [personalInfo.firstName, personalInfo.lastName].filter(Boolean).join(' ');
  const accentColor = themeConfig.primaryColor === '#ffffff' ? '#000000' : themeConfig.primaryColor;

  if (!fullName && !personalInfo.email) return null;

  return (
    <div className="text-slate-900">
      <header className="bg-slate-900 text-white p-12 mb-8 break-inside-avoid" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
        {fullName && <h1 className="text-5xl font-black uppercase tracking-tight mb-2 leading-none">{fullName}</h1>}
        {themeConfig.fieldVisibility.jobTitle && <p className="text-2xl font-light text-slate-300">{personalInfo.jobTitle}</p>}
        
        <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-slate-700 text-sm font-medium">
           {themeConfig.fieldVisibility.email && personalInfo.email && <span className="flex items-center gap-2"><Mail className="w-4 h-4" />{personalInfo.email}</span>}
           {themeConfig.fieldVisibility.phone && personalInfo.phone && <span className="flex items-center gap-2"><Phone className="w-4 h-4" />{personalInfo.phone}</span>}
           {themeConfig.sectionVisibility.links && themeConfig.fieldVisibility.linkedin && personalInfo.linkedin && (
             <span className="flex items-center gap-2"><Linkedin className="w-4 h-4" />{personalInfo.linkedin.replace(/^https?:\/\//, '')}</span>
           )}
        </div>
      </header>

      <div className="px-12 pb-12">
        {themeConfig.sectionVisibility.summary && data.summary && (
          <section className="mb-10 break-inside-avoid">
            <h2 className="text-xs font-black uppercase tracking-widest mb-4 bg-slate-200 inline-block px-2 py-1">Profile</h2>
            <RichText text={data.summary} className="text-base font-medium leading-relaxed text-slate-700" />
          </section>
        )}

        <div className="grid grid-cols-3 gap-12">
           <div className="col-span-2 space-y-10">
              {themeConfig.sectionVisibility.experience && data.experience.length > 0 && (
                <section>
                  <h2 className="text-xs font-black uppercase tracking-widest mb-6 bg-slate-200 inline-block px-2 py-1 break-inside-avoid">Experience</h2>
                  <div className="space-y-8">
                    {data.experience.map(exp => (
                      <div key={exp.id} className="break-inside-avoid">
                        <div className="flex justify-between items-baseline mb-2">
                           <h3 className="text-xl font-bold">{exp.role}</h3>
                           <span className="text-sm font-bold text-slate-400">{exp.startDate} – {exp.endDate}</span>
                        </div>
                        <div className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">{exp.company}</div>
                        <RichText text={exp.description} className="text-sm text-slate-600" bulletStyle="dot" />
                      </div>
                    ))}
                  </div>
                </section>
              )}
           </div>

           <div className="col-span-1 space-y-10">
             {themeConfig.sectionVisibility.education && data.education.length > 0 && (
                <section>
                  <h2 className="text-xs font-black uppercase tracking-widest mb-6 bg-slate-200 inline-block px-2 py-1 break-inside-avoid">Education</h2>
                  <div className="space-y-6">
                    {data.education.map(edu => (
                      <div key={edu.id} className="break-inside-avoid">
                        <div className="font-bold text-lg leading-tight">{edu.school}</div>
                        <div className="text-sm font-medium text-slate-600 mt-1">{edu.degree}</div>
                        <div className="text-xs font-bold text-slate-400 mt-1">{edu.year}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {themeConfig.sectionVisibility.skills && data.skills.length > 0 && (
                <section className="break-inside-avoid">
                  <h2 className="text-xs font-black uppercase tracking-widest mb-6 bg-slate-200 inline-block px-2 py-1">Expertise</h2>
                  <ul className="space-y-2">
                    {data.skills.map((skill, idx) => (
                      <li key={idx} className="font-bold text-slate-700 border-b border-slate-100 pb-1">{skill}</li>
                    ))}
                  </ul>
                </section>
              )}
              
              {themeConfig.sectionVisibility.address && (
                 <section className="break-inside-avoid">
                   <h2 className="text-xs font-black uppercase tracking-widest mb-6 bg-slate-200 inline-block px-2 py-1">Location</h2>
                   <p className="text-sm font-medium text-slate-600">
                     {[personalInfo.address, personalInfo.city, personalInfo.state, personalInfo.country].filter(Boolean).join(', ')}
                   </p>
                 </section>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

const TechLayout: React.FC<{ data: ResumeData }> = ({ data }) => {
  const { personalInfo, themeConfig } = data;
  const fullName = [personalInfo.firstName, personalInfo.lastName].filter(Boolean).join('_');

  return (
    <div className="font-mono text-slate-800 bg-slate-50 min-h-full p-12">
       <header className="mb-10 border-b-2 border-dashed border-slate-300 pb-8 break-inside-avoid">
          <div className="text-sm text-slate-400 mb-2">/** Resume v2.0.0 */</div>
          <h1 className="text-4xl font-bold text-emerald-700 mb-4">&lt;{fullName || "User"} /&gt;</h1>
          <div className="grid grid-cols-2 gap-2 text-sm">
             {themeConfig.fieldVisibility.jobTitle && <div><span className="text-purple-600">const</span> job = <span className="text-amber-600">"{personalInfo.jobTitle}"</span>;</div>}
             {themeConfig.fieldVisibility.email && <div><span className="text-purple-600">const</span> email = <span className="text-amber-600">"{personalInfo.email}"</span>;</div>}
             {themeConfig.fieldVisibility.phone && <div><span className="text-purple-600">const</span> phone = <span className="text-amber-600">"{personalInfo.phone}"</span>;</div>}
             {themeConfig.sectionVisibility.links && themeConfig.fieldVisibility.website && <div><span className="text-purple-600">const</span> web = <span className="text-amber-600">"{personalInfo.website}"</span>;</div>}
          </div>
       </header>

       {themeConfig.sectionVisibility.summary && data.summary && (
         <section className="mb-10 break-inside-avoid">
           <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
             <Code2 className="w-5 h-5 text-slate-400" /> summary.md
           </h2>
           <div className="bg-white p-4 border border-slate-200 rounded shadow-sm text-sm leading-relaxed text-slate-600">
              <RichText text={data.summary} />
           </div>
         </section>
       )}

       {themeConfig.sectionVisibility.experience && data.experience.length > 0 && (
          <section className="mb-10">
             <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 break-inside-avoid">
               <Terminal className="w-5 h-5 text-slate-400" /> experience.json
             </h2>
             <div className="space-y-6">
                {data.experience.map(exp => (
                   <div key={exp.id} className="group break-inside-avoid">
                      <div className="flex items-baseline gap-2 mb-2">
                         <span className="text-blue-600 font-bold">function</span> 
                         <span className="text-amber-700 font-bold">{exp.company.replace(/\s+/g, '')}</span>
                         <span className="text-slate-500">() {'{'}</span>
                      </div>
                      <div className="pl-6 border-l border-slate-300 ml-2 space-y-1 text-sm">
                         <div><span className="text-slate-400">// {exp.role}</span></div>
                         <div><span className="text-slate-400">// {exp.startDate} - {exp.endDate}</span></div>
                         <div className="mt-2 text-slate-600">
                            <RichText text={exp.description} bulletStyle="dot" />
                         </div>
                      </div>
                      <div className="text-slate-500 mt-1">{'}'}</div>
                   </div>
                ))}
             </div>
          </section>
       )}

       <div className="grid grid-cols-2 gap-8">
          {themeConfig.sectionVisibility.skills && data.skills.length > 0 && (
             <section className="break-inside-avoid">
                <h2 className="text-lg font-bold text-slate-900 mb-3">skills.array</h2>
                <div className="bg-slate-800 text-green-400 p-4 rounded text-xs leading-6 shadow-sm">
                   <span className="text-white">[</span><br/>
                   {data.skills.map((skill, i) => (
                      <span key={i} className="ml-4">"{skill}"{i < data.skills.length - 1 ? ',' : ''}<br/></span>
                   ))}
                   <span className="text-white">]</span>
                </div>
             </section>
          )}

          {themeConfig.sectionVisibility.education && data.education.length > 0 && (
             <section className="break-inside-avoid">
               <h2 className="text-lg font-bold text-slate-900 mb-3">education.log</h2>
               <div className="space-y-4">
                  {data.education.map(edu => (
                     <div key={edu.id} className="text-sm border-l-2 border-emerald-500 pl-3">
                        <div className="font-bold">{edu.school}</div>
                        <div className="text-slate-600">{edu.degree}</div>
                        <div className="text-slate-400 text-xs">{edu.year}</div>
                     </div>
                  ))}
               </div>
             </section>
          )}
       </div>
    </div>
  );
};

export const Preview: React.FC<PreviewProps> = ({ data, template }) => {
  return (
    <div id="resume-preview" className="relative bg-white shadow-2xl print:shadow-none w-full max-w-[210mm] min-h-[296mm] mx-auto print:w-full print:max-w-none print:absolute print:top-0 print:left-0 print:m-0 print:overflow-hidden overflow-visible">
      
      {/* Visual Guide for Pages (Only visible on screen, not print) */}
      <PageGuides />

      {template === 'classic' && <div className="p-[15mm] md:p-[20mm]"><ClassicLayout data={data} /></div>}
      {template === 'modern' && <ModernLayout data={data} />}
      {template === 'minimalist' && <div className="p-[15mm] md:p-[20mm]"><MinimalistLayout data={data} /></div>}
      {template === 'bold' && <BoldLayout data={data} />}
      {template === 'tech' && <div className="h-full bg-slate-50"><TechLayout data={data} /></div>}
    </div>
  );
};