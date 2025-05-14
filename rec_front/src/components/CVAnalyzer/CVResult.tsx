// src/components/ai-assistant/CVAnalyzer/CVResult.tsx
import React, { useState } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { FiUser, FiCalendar, FiBookmark, FiTag, FiBriefcase, FiAward, FiInfo } from 'react-icons/fi';

interface CVResultProps {
  analysis: {
    skills?: string[];
    education?: Array<{
      degree?: string;
      institution?: string;
      field?: string;
      start_year?: string;
      end_year?: string;
    }>;
    experience?: Array<{
      title?: string;
      company?: string;
      duration?: string;
      start_date?: string;
      end_date?: string;
      current?: boolean;
      responsibilities?: string[];
    }>;
    total_experience_years?: number;
    summary?: string;
  };
}

// A component for displaying analysis results
const CVResult: React.FC<CVResultProps> = ({ analysis }) => {
  const { colors, theme } = useTheme();
  const [activeTab, setActiveTab] = useState('summary');
  
  // Tabs for different sections
  const tabs = [
    { id: 'summary', label: 'Summary', icon: <FiInfo /> },
    { id: 'skills', label: 'Skills', icon: <FiTag /> },
    { id: 'experience', label: 'Experience', icon: <FiBriefcase /> },
    { id: 'education', label: 'Education', icon: <FiBookmark /> },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border" style={{ borderColor: colors.border }}>
      {/* Tabs */}
      <div className="flex border-b overflow-x-auto" style={{ borderColor: colors.border }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`px-4 py-3 flex items-center text-sm font-medium transition-colors relative ${
              activeTab === tab.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            style={{ 
              color: activeTab === tab.id ? colors.primary : undefined,
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
            {activeTab === tab.id && (
              <div 
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full" 
                style={{ backgroundColor: colors.primary }}
              />
            )}
          </button>
        ))}
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border" style={{ borderColor: colors.border }}>
              <h3 className="font-medium mb-2 flex items-center" style={{ color: colors.text }}>
                <FiInfo className="mr-2" /> Professional Summary
              </h3>
              <p className="text-sm opacity-90" style={{ color: colors.text }}>
                {analysis.summary || 'No summary available.'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border" style={{ borderColor: colors.border }}>
                <h3 className="font-medium mb-2 flex items-center" style={{ color: colors.text }}>
                  <FiCalendar className="mr-2" /> Total Experience
                </h3>
                <p className="text-sm opacity-90" style={{ color: colors.text }}>
                  {analysis.total_experience_years !== undefined 
                    ? `${analysis.total_experience_years} year${analysis.total_experience_years === 1 ? '' : 's'}`
                    : 'Not available'}
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border" style={{ borderColor: colors.border }}>
                <h3 className="font-medium mb-2 flex items-center" style={{ color: colors.text }}>
                  <FiTag className="mr-2" /> Key Skills
                </h3>
                <p className="text-sm opacity-90" style={{ color: colors.text }}>
                  {analysis.skills && analysis.skills.length > 0 
                    ? analysis.skills.slice(0, 5).join(', ') + (analysis.skills.length > 5 ? '...' : '')
                    : 'No skills detected'}
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border" style={{ borderColor: colors.border }}>
              <h3 className="font-medium mb-2 flex items-center" style={{ color: colors.text }}>
                <FiUser className="mr-2" /> Career Highlights
              </h3>
              {analysis.experience && analysis.experience.length > 0 ? (
                <div className="text-sm opacity-90" style={{ color: colors.text }}>
                  <p>Most recent position: {analysis.experience[0]?.title || 'N/A'} at {analysis.experience[0]?.company || 'N/A'}</p>
                  <p>Companies worked for: {Array.from(new Set(analysis.experience.map(exp => exp.company).filter(Boolean))).length}</p>
                </div>
              ) : (
                <p className="text-sm opacity-90" style={{ color: colors.text }}>No experience data available</p>
              )}
            </div>
          </div>
        )}
        
        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <div>
            <h3 className="text-lg font-medium mb-3" style={{ color: colors.text }}>
              Skills Assessment
            </h3>
            
            {analysis.skills && analysis.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {analysis.skills.map((skill, index) => (
                  <div 
                    key={index} 
                    className="px-3 py-1.5 rounded-full text-sm"
                    style={{ 
                      backgroundColor: `${colors.primary}15`, 
                      color: colors.primary
                    }}
                  >
                    {skill}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm opacity-70" style={{ color: colors.text }}>
                No skills were detected in the CV. The CV may not explicitly list skills, or the AI couldn't identify them.
              </p>
            )}
          </div>
        )}
        
        {/* Experience Tab */}
        {activeTab === 'experience' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium mb-1" style={{ color: colors.text }}>
              Work Experience
            </h3>
            
            {analysis.experience && analysis.experience.length > 0 ? (
              <div className="space-y-4">
                {analysis.experience.map((exp, index) => (
                  <div key={index} className="border-l-2 pl-4 pt-1 pb-2 relative" style={{ borderColor: colors.primary }}>
                    <div 
                      className="absolute w-3 h-3 rounded-full -left-[6.5px] top-[6px]" 
                      style={{ backgroundColor: colors.primary }}
                    />
                    <h4 className="font-medium text-base" style={{ color: colors.text }}>
                      {exp.title || 'Untitled Position'}
                    </h4>
                    <p className="text-sm opacity-90 mb-2" style={{ color: colors.text }}>
                      {exp.company || 'Unknown Company'} | {exp.duration || 'Unknown Duration'}
                    </p>
                    {exp.responsibilities && exp.responsibilities.length > 0 ? (
                      <ul className="list-disc list-inside text-sm opacity-75 space-y-1" style={{ color: colors.text }}>
                        {exp.responsibilities.slice(0, 3).map((resp, idx) => (
                          <li key={idx}>{resp}</li>
                        ))}
                        {exp.responsibilities.length > 3 && (
                          <li className="opacity-60">...and {exp.responsibilities.length - 3} more responsibilities</li>
                        )}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm opacity-70" style={{ color: colors.text }}>
                No work experience data was extracted from the CV.
              </p>
            )}
          </div>
        )}
        
        {/* Education Tab */}
        {activeTab === 'education' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium mb-1" style={{ color: colors.text }}>
              Education
            </h3>
            
            {analysis.education && analysis.education.length > 0 ? (
              <div className="space-y-4">
                {analysis.education.map((edu, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border flex" style={{ borderColor: colors.border }}>
                    <div className="mr-4 mt-1">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center" 
                        style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}
                      >
                        <FiAward className="w-5 h-5" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1" style={{ color: colors.text }}>
                        {edu.degree || 'Degree Not Specified'}
                        {edu.field ? ` in ${edu.field}` : ''}
                      </h4>
                      <p className="text-sm opacity-90" style={{ color: colors.text }}>
                        {edu.institution || 'Institution Not Specified'}
                      </p>
                      {(edu.start_year || edu.end_year) && (
                        <p className="text-sm opacity-75 mt-1" style={{ color: colors.text }}>
                          {edu.start_year ? edu.start_year : ''} 
                          {edu.start_year && edu.end_year ? ' - ' : ''} 
                          {edu.end_year ? edu.end_year : ''}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm opacity-70" style={{ color: colors.text }}>
                No education data was extracted from the CV.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CVResult;