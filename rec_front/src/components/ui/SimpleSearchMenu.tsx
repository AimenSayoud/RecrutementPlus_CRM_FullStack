// src/components/ui/SimpleSearchMenu.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/app/context/ThemeContext';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { Candidate, Company } from '@/types';

interface SimpleSearchMenuProps {
  isOpen: boolean;
  type: 'candidates' | 'companies';
  items: (Candidate | Company)[];
  onSelect: (item: Candidate | Company) => void;
  onClose: () => void;
}

const SimpleSearchMenu: React.FC<SimpleSearchMenuProps> = ({
  isOpen,
  type,
  items,
  onSelect,
  onClose
}) => {
  const { colors, theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState<(Candidate | Company)[]>(items);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when menu opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setFilteredItems(items);
      setSelectedIndex(0);
    }
  }, [isOpen, items]);

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

  // Filter items based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredItems(items);
      return;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    
    if (type === 'candidates') {
      const filtered = items.filter(item => {
        const candidate = item as Candidate;
        return (
          (candidate.firstName?.toLowerCase() || '').includes(lowerSearchTerm) ||
          (candidate.lastName?.toLowerCase() || '').includes(lowerSearchTerm) ||
          (candidate.email?.toLowerCase() || '').includes(lowerSearchTerm) ||
          (candidate.position?.toLowerCase() || '').includes(lowerSearchTerm)
        );
      });
      setFilteredItems(filtered);
    } else {
      const filtered = items.filter(item => {
        const company = item as Company;
        return (
          (company.name?.toLowerCase() || '').includes(lowerSearchTerm) ||
          (company.industry?.toLowerCase() || '').includes(lowerSearchTerm) ||
          (company.contactPerson?.toLowerCase() || '').includes(lowerSearchTerm) ||
          (company.contactEmail?.toLowerCase() || '').includes(lowerSearchTerm)
        );
      });
      setFilteredItems(filtered);
    }
    
    setSelectedIndex(0);
  }, [searchTerm, items, type]);

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
      if (filteredItems[selectedIndex]) {
        onSelect(filteredItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Render an item (candidate or company)
  const renderItem = (item: Candidate | Company, index: number) => {
    const isCandidate = type === 'candidates';
    
    if (isCandidate) {
      const candidate = item as Candidate;
      return (
        <div
          key={candidate.id}
          className={`px-3 py-2 flex items-center cursor-pointer ${
            index === selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
          }`}
          onClick={() => onSelect(candidate)}
        >
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center mr-2 flex-shrink-0 text-white font-medium"
            style={{ backgroundColor: colors.primary }}
          >
            {(candidate.firstName?.charAt(0) || '') + (candidate.lastName?.charAt(0) || '')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm flex items-center" style={{ color: colors.text }}>
              {candidate.firstName || 'No First Name'} {candidate.lastName || 'No Last Name'}
              {candidate.status && (
                <Badge
                  variant={
                    candidate.status === 'hired' ? 'success' :
                    candidate.status === 'rejected' ? 'danger' :
                    candidate.status === 'offer' ? 'warning' :
                    'primary'
                  }
                  className="ml-2 text-xs py-px px-1.5"
                >
                  {candidate.status}
                </Badge>
              )}
            </div>
            <div className="text-xs truncate" style={{ color: `${colors.text}80` }}>
              {candidate.position || 'No Position'} • {candidate.email || 'No Email'}
            </div>
          </div>
        </div>
      );
    } else {
      const company = item as Company;
      return (
        <div
          key={company.id}
          className={`px-3 py-2 flex items-center cursor-pointer ${
            index === selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
          }`}
          onClick={() => onSelect(company)}
        >
          <div 
            className="w-8 h-8 rounded-md flex items-center justify-center mr-2 flex-shrink-0 text-white font-medium"
            style={{ backgroundColor: colors.secondary }}
          >
            {company.name?.charAt(0) || 'C'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm" style={{ color: colors.text }}>
              {company.name || 'Unnamed Company'}
            </div>
            <div className="text-xs truncate" style={{ color: `${colors.text}80` }}>
              {company.industry || 'No Industry'} • {typeof company.openPositions === 'number' ? `${company.openPositions} position${company.openPositions !== 1 ? 's' : ''}` : 'No open positions'}
            </div>
          </div>
        </div>
      );
    }
  };

  // If not open, don't render
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          ref={menuRef}
          className="w-full max-w-lg rounded-lg shadow-xl overflow-hidden"
          style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: colors.border }}>
            <h3 className="font-medium" style={{ color: colors.text }}>
              {type === 'candidates' ? 'Search Candidates' : 'Search Companies'}
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

          <div className="p-3 border-b" style={{ borderColor: colors.border }}>
            <Input
              ref={inputRef}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Search ${type}...`}
              fullWidth
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>

          <div className="py-1 max-h-60 overflow-y-auto">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => renderItem(item, index))
            ) : (
              <div className="px-3 py-4 text-center" style={{ color: `${colors.text}60` }}>
                <p>No results found</p>
              </div>
            )}
          </div>

          <div className="p-3 border-t flex justify-between items-center" style={{ borderColor: colors.border }}>
            <button
              className="text-sm px-3 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              style={{ color: `${colors.text}80` }}
              onClick={onClose}
            >
              Cancel
            </button>
            <div className="text-xs" style={{ color: `${colors.text}60` }}>
              <span>Use ↑↓ to navigate, Enter to select, Esc to close</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SimpleSearchMenu;