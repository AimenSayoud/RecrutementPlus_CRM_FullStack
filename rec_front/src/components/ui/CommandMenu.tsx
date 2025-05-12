// src/components/ui/CommandMenu.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/app/context/ThemeContext';
import Input from '@/components/ui/Input';
import { Candidate, Company } from '@/types';

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCandidate?: (candidate: Candidate) => void;
  onSelectCompany?: (company: Company) => void;
  candidates: Candidate[];
  companies: Company[];
  initialCommand?: 'search_candidate' | 'search_company' | null;
  selectedEntity?: Candidate | Company | null;
}

const CommandMenu: React.FC<CommandMenuProps> = ({
  isOpen,
  onClose,
  onSelectCandidate,
  onSelectCompany,
  candidates,
  companies,
  initialCommand = null,
  selectedEntity = null,
}) => {
  const { colors, theme } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Command flow state
  const [currentStep, setCurrentStep] = useState<'initial' | 'search_candidate' | 'search_company' | 'command_options' | 'template'>('initial');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState<(Candidate | Company)[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Set up initial command if provided
  useEffect(() => {
    if (initialCommand) {
      // Set the current step based on the initialCommand
      setCurrentStep(initialCommand);
    } else if (selectedEntity && currentStep === 'initial') {
      // If we already have a selected entity but are on the initial step,
      // move directly to command options
      setCurrentStep('command_options');
    }
  }, [initialCommand, selectedEntity, currentStep]);

  // Handle when the menu opens
  useEffect(() => {
    if (isOpen) {
      // If we have a selected entity and no initial command is specified,
      // go directly to command options
      if (selectedEntity && !initialCommand && currentStep === 'initial') {
        setCurrentStep('command_options');
      }

      // Focus the input if we're in a search step
      if (inputRef.current &&
          (currentStep === 'search_candidate' || currentStep === 'search_company')) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    } else {
      // Reset to initial step when menu closes
      setCurrentStep('initial');
    }
  }, [isOpen, currentStep, selectedEntity, initialCommand]);

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Reset search when step changes
  useEffect(() => {
    setSearchTerm('');
    setSelectedIndex(0);
    
    // Set initial filtered items based on the current step
    if (currentStep === 'search_candidate') {
      setFilteredItems(candidates);
    } else if (currentStep === 'search_company') {
      setFilteredItems(companies);
    } else {
      setFilteredItems([]);
    }
  }, [currentStep, candidates, companies]);

  // Filter items based on search term
  useEffect(() => {
    if (currentStep !== 'search_candidate' && currentStep !== 'search_company') return;
    
    if (!searchTerm.trim()) {
      setFilteredItems(currentStep === 'search_candidate' ? candidates : companies);
      return;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    
    if (currentStep === 'search_candidate') {
      const filtered = candidates.filter(candidate => 
        (candidate.firstName?.toLowerCase() || '').includes(lowerSearchTerm) ||
        (candidate.lastName?.toLowerCase() || '').includes(lowerSearchTerm) ||
        (candidate.email?.toLowerCase() || '').includes(lowerSearchTerm) ||
        (candidate.position?.toLowerCase() || '').includes(lowerSearchTerm)
      );
      setFilteredItems(filtered);
    } else if (currentStep === 'search_company') {
      const filtered = companies.filter(company => 
        (company.name?.toLowerCase() || '').includes(lowerSearchTerm) ||
        (company.industry?.toLowerCase() || '').includes(lowerSearchTerm) ||
        (company.contactPerson?.toLowerCase() || '').includes(lowerSearchTerm) ||
        (company.contactEmail?.toLowerCase() || '').includes(lowerSearchTerm)
      );
      setFilteredItems(filtered);
    }
    
    setSelectedIndex(0);
  }, [searchTerm, currentStep, candidates, companies]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleItemSelect();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (currentStep === 'initial') {
        onClose();
      } else {
        // Go back one step
        setCurrentStep(prevStep => {
          if (prevStep === 'search_candidate' || prevStep === 'search_company') {
            return 'initial';
          } else if (prevStep === 'command_options') {
            return selectedEntity && 'firstName' in selectedEntity 
              ? 'search_candidate' 
              : 'search_company';
          } else if (prevStep === 'template') {
            return 'command_options';
          }
          return 'initial';
        });
      }
    }
  };

  // Handle item selection based on current step
  const handleItemSelect = () => {
    if (currentStep === 'initial') {
      // Handle initial commands - they don't depend on filteredItems
      if (selectedIndex === 0) {
        setCurrentStep('search_candidate');
      } else {
        setCurrentStep('search_company');
      }
      return;
    }

    if ((currentStep === 'search_candidate' || currentStep === 'search_company') && filteredItems.length === 0) {
      return;
    }

    if (currentStep === 'search_candidate') {
      if (filteredItems.length > 0 && onSelectCandidate) {
        const selectedItem = filteredItems[selectedIndex];
        onSelectCandidate(selectedItem as Candidate);
        // Move to command options after selecting a candidate
        setCurrentStep('command_options');
      }
    } else if (currentStep === 'search_company') {
      if (filteredItems.length > 0 && onSelectCompany) {
        const selectedItem = filteredItems[selectedIndex];
        onSelectCompany(selectedItem as Company);
        // Move to command options after selecting a company
        setCurrentStep('command_options');
      }
    } else if (currentStep === 'command_options') {
      // Handle command option selection
      switch (selectedIndex) {
        case 0: // Email template
          setSelectedTemplate('email');
          setCurrentStep('template');
          break;
        case 1: // Suggestions
          setSelectedTemplate('suggestions');
          setCurrentStep('template');
          break;
        case 2: // Open chat
          setSelectedTemplate('chat');
          onClose();
          break;
      }
    }
  };

  // Handle click selection
  const handleClickSelect = (index: number) => {
    setSelectedIndex(index);
    setTimeout(() => handleItemSelect(), 10); // Add small timeout to ensure index is updated
  };

  // Render initial command options
  const renderInitialCommands = () => (
    <div className="py-1 max-h-60 overflow-y-auto">
      <motion.div
        className={`px-3 py-2 flex items-center cursor-pointer ${
          selectedIndex === 0 ? theme === 'light' ? 'bg-gray-100' : 'bg-gray-700' : ''
        }`}
        style={{ 
          backgroundColor: selectedIndex === 0 
            ? theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' 
            : 'transparent' 
        }}
        whileHover={{
          backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'
        }}
        onClick={() => handleClickSelect(0)}
      >
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center mr-2 flex-shrink-0"
          style={{ 
            backgroundColor: `${colors.primary}15`, 
            color: colors.primary 
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <div className="font-medium text-sm" style={{ color: colors.text }}>
            Search Candidates
          </div>
          <div className="text-xs" style={{ color: `${colors.text}80` }}>
            Find and select a candidate
          </div>
        </div>
      </motion.div>
      <motion.div
        className={`px-3 py-2 flex items-center cursor-pointer ${
          selectedIndex === 1 ? theme === 'light' ? 'bg-gray-100' : 'bg-gray-700' : ''
        }`}
        style={{ 
          backgroundColor: selectedIndex === 1 
            ? theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' 
            : 'transparent' 
        }}
        whileHover={{
          backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'
        }}
        onClick={() => handleClickSelect(1)}
      >
        <div 
          className="w-8 h-8 rounded-md flex items-center justify-center mr-2 flex-shrink-0"
          style={{ 
            backgroundColor: `${colors.secondary}15`, 
            color: colors.secondary 
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div>
          <div className="font-medium text-sm" style={{ color: colors.text }}>
            Search Companies
          </div>
          <div className="text-xs" style={{ color: `${colors.text}80` }}>
            Find and select a company
          </div>
        </div>
      </motion.div>
    </div>
  );

  // Render entity search results
  const renderSearchResults = () => {
    const isCandidate = currentStep === 'search_candidate';
    
    return (
      <div className="py-1 max-h-60 overflow-y-auto">
        {filteredItems.length > 0 ? (
          filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              className={`px-3 py-2 flex items-center cursor-pointer ${
                index === selectedIndex ? theme === 'light' ? 'bg-gray-100' : 'bg-gray-700' : ''
              }`}
              style={{ 
                backgroundColor: index === selectedIndex 
                  ? theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' 
                  : 'transparent' 
              }}
              whileHover={{
                backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'
              }}
              onClick={() => handleClickSelect(index)}
            >
              {isCandidate ? (
                <>
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center mr-2 flex-shrink-0 text-white font-medium"
                    style={{ backgroundColor: colors.primary }}
                  >
                    {((item as Candidate).firstName?.charAt(0) || '') + ((item as Candidate).lastName?.charAt(0) || '')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm flex items-center" style={{ color: colors.text }}>
                      {(item as Candidate).firstName || 'No First Name'} {(item as Candidate).lastName || 'No Last Name'}
                    </div>
                    <div className="text-xs truncate" style={{ color: `${colors.text}80` }}>
                      {(item as Candidate).position || 'No Position'} • {(item as Candidate).email || 'No Email'}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div 
                    className="w-8 h-8 rounded-md flex items-center justify-center mr-2 flex-shrink-0 text-white font-medium"
                    style={{ backgroundColor: colors.secondary }}
                  >
                    {(item as Company).name?.charAt(0) || 'C'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm" style={{ color: colors.text }}>
                      {(item as Company).name || 'Unnamed Company'}
                    </div>
                    <div className="text-xs truncate" style={{ color: `${colors.text}80` }}>
                      {(item as Company).industry || 'No Industry'} • {(item as Company).contactPerson || 'No Contact'}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ))
        ) : (
          <div className="px-3 py-4 text-center" style={{ color: `${colors.text}60` }}>
            <p>No results found</p>
          </div>
        )}
      </div>
    );
  };

  // Render command options after selecting an entity
  const renderCommandOptions = () => {
    // First try to use the selectedEntity prop, then fallback to using the most recently selected item
    const entity = selectedEntity ||
      (filteredItems.length > 0 ? filteredItems[selectedIndex] : null);

    if (!entity) {
      console.error("No entity available for command options");
      return (
        <div className="py-4 text-center" style={{ color: `${colors.text}60` }}>
          <p>No entity selected. Please go back and select a candidate or company.</p>
        </div>
      );
    }

    const isCandidate = 'firstName' in entity;
    const entityName = isCandidate
      ? `${(entity as Candidate).firstName} ${(entity as Candidate).lastName}`
      : (entity as Company)?.name;

    return (
      <div className="py-1 max-h-60 overflow-y-auto">
        <div className="px-3 py-2 border-b mb-2" style={{ borderColor: colors.border }}>
          <p className="text-sm font-medium" style={{ color: colors.text }}>
            Selected {isCandidate ? 'Candidate' : 'Company'}: {entityName}
          </p>
        </div>

        <motion.div
          className={`px-3 py-2 flex items-center cursor-pointer ${
            selectedIndex === 0 ? theme === 'light' ? 'bg-gray-100' : 'bg-gray-700' : ''
          }`}
          style={{ 
            backgroundColor: selectedIndex === 0 
              ? theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' 
              : 'transparent' 
          }}
          whileHover={{
            backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'
          }}
          onClick={() => handleClickSelect(0)}
        >
          <div 
            className="w-8 h-8 rounded-md flex items-center justify-center mr-2 flex-shrink-0"
            style={{ 
              backgroundColor: `${colors.primary}15`, 
              color: colors.primary 
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <div className="font-medium text-sm" style={{ color: colors.text }}>
              Generate Email Template
            </div>
            <div className="text-xs" style={{ color: `${colors.text}80` }}>
              Create an email for {entityName}
            </div>
          </div>
        </motion.div>

        <motion.div
          className={`px-3 py-2 flex items-center cursor-pointer ${
            selectedIndex === 1 ? theme === 'light' ? 'bg-gray-100' : 'bg-gray-700' : ''
          }`}
          style={{ 
            backgroundColor: selectedIndex === 1 
              ? theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' 
              : 'transparent' 
          }}
          whileHover={{
            backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'
          }}
          onClick={() => handleClickSelect(1)}
        >
          <div 
            className="w-8 h-8 rounded-md flex items-center justify-center mr-2 flex-shrink-0"
            style={{ 
              backgroundColor: `${colors.secondary}15`, 
              color: colors.secondary 
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <div className="font-medium text-sm" style={{ color: colors.text }}>
              Get Suggestions
            </div>
            <div className="text-xs" style={{ color: `${colors.text}80` }}>
              Personalized recommendations
            </div>
          </div>
        </motion.div>

        <motion.div
          className={`px-3 py-2 flex items-center cursor-pointer ${
            selectedIndex === 2 ? theme === 'light' ? 'bg-gray-100' : 'bg-gray-700' : ''
          }`}
          style={{ 
            backgroundColor: selectedIndex === 2 
              ? theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' 
              : 'transparent' 
          }}
          whileHover={{
            backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'
          }}
          onClick={() => handleClickSelect(2)}
        >
          <div 
            className="w-8 h-8 rounded-md flex items-center justify-center mr-2 flex-shrink-0"
            style={{ 
              backgroundColor: `${colors.primary}15`, 
              color: colors.primary 
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <div className="font-medium text-sm" style={{ color: colors.text }}>
              Open Chat
            </div>
            <div className="text-xs" style={{ color: `${colors.text}80` }}>
              Ask anything about {entityName}
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  // If not open, don't render
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="w-full max-w-lg rounded-lg shadow-xl overflow-hidden"
          style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: colors.border }}>
            <h3 className="font-medium" style={{ color: colors.text }}>
              {currentStep === 'search_candidate' 
                ? 'Search Candidates' 
                : currentStep === 'search_company' 
                  ? 'Search Companies' 
                  : currentStep === 'command_options'
                    ? 'Choose an Action'
                    : currentStep === 'template'
                      ? selectedTemplate === 'email' 
                        ? 'Generate Email Template' 
                        : 'Get Suggestions'
                      : 'AI Assistant Commands'}
            </h3>
            <button
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              onClick={onClose}
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div>
            {/* Search input for candidate/company search steps */}
            {(currentStep === 'search_candidate' || currentStep === 'search_company') && (
              <div className="p-3 border-b" style={{ borderColor: colors.border }}>
                <Input
                  ref={inputRef}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Search ${currentStep === 'search_candidate' ? 'candidates' : 'companies'}...`}
                  fullWidth
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  }
                />
              </div>
            )}

            {/* Step-specific content */}
            {currentStep === 'initial' && renderInitialCommands()}
            {(currentStep === 'search_candidate' || currentStep === 'search_company') && renderSearchResults()}
            {currentStep === 'command_options' && renderCommandOptions()}

            {/* Template step content */}
            {currentStep === 'template' && (
              <div className="p-4 text-center">
                <p className="mb-3" style={{ color: colors.text }}>
                  {selectedTemplate === 'email'
                    ? 'Email template will be generated and inserted into the chat'
                    : 'Suggestions will be generated based on the selected entity'}
                </p>
                <button
                  className="px-4 py-2 rounded-md text-white"
                  style={{ backgroundColor: colors.primary }}
                  onClick={onClose}
                >
                  Continue
                </button>
              </div>
            )}
          </div>

          {/* Navigation footer */}
          <div className="p-3 border-t flex justify-between items-center" style={{ borderColor: colors.border }}>
            <button
              className="text-sm px-3 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              style={{ color: `${colors.text}80` }}
              onClick={() => {
                if (currentStep === 'initial') {
                  onClose();
                } else {
                  setCurrentStep(prevStep => {
                    if (prevStep === 'search_candidate' || prevStep === 'search_company') {
                      return 'initial';
                    } else if (prevStep === 'command_options') {
                      return selectedEntity && 'firstName' in selectedEntity
                        ? 'search_candidate'
                        : 'search_company';
                    } else if (prevStep === 'template') {
                      return 'command_options';
                    }
                    return 'initial';
                  });
                }
              }}
            >
              {currentStep === 'initial' ? 'Cancel' : 'Back'}
            </button>
            <div className="text-xs" style={{ color: `${colors.text}60` }}>
              <span>Use ↑↓ to navigate, Enter to select, Esc to go back</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CommandMenu;