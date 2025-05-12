// src/components/ui/ModernAIInput.tsx
import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/app/context/ThemeContext';
import TextArea from '@/components/ui/TextArea';

interface ModernAIInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSend: () => void;
  onSlashCommand: () => void;
  placeholder?: string;
  disabled?: boolean;
  entityName?: string | null;
  entityType?: 'candidate' | 'company' | null;
}

const ModernAIInput = forwardRef<HTMLTextAreaElement, ModernAIInputProps>(({
  value,
  onChange,
  onKeyDown,
  onSend,
  onSlashCommand,
  placeholder = 'Type a message...',
  disabled = false,
  entityName = null,
  entityType = null
}, ref) => {
  const { colors, theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle slash command
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    // Check for slash command
    if (e.key === '/' && value === '') {
      e.preventDefault();
      onSlashCommand();
    }

    // Pass the event to the parent handler for other key events
    onKeyDown(e);
  };

  // Effect for animation when entity changes
  useEffect(() => {
    if (entityName && containerRef.current) {
      containerRef.current.classList.add('entity-changed');
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.classList.remove('entity-changed');
        }
      }, 800);
    }
  }, [entityName]);

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Entity badge */}
      {entityName && (
        <motion.div
          className="absolute -top-8 left-4 z-10 rounded-t-lg px-3 py-1.5 font-medium text-xs shadow-sm flex items-center gap-1.5"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          style={{
            background: entityType === 'candidate'
              ? `${colors.primary}15`
              : `${colors.secondary}15`,
            color: entityType === 'candidate'
              ? colors.primary
              : colors.secondary,
            borderBottomLeftRadius: '0',
            borderLeft: entityType === 'candidate'
              ? `2px solid ${colors.primary}`
              : `2px solid ${colors.secondary}`
          }}
        >
          {entityType === 'candidate' ? (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          )}
          <span>{entityName}</span>
        </motion.div>
      )}

      {/* Main input container */}
      <div
        className={`relative flex items-end rounded-xl px-3 pt-3 pb-2.5 transition-all duration-200 border ${
          isFocused ? `border-${colors.primary} shadow-md` : theme === 'light' ? 'border-gray-200' : 'border-gray-700'
        } ${entityName ? 'border-t-0 rounded-t-none' : ''}`}
        style={{
          background: colors.card,
          boxShadow: isFocused
            ? `0 4px 6px -1px ${colors.primary}20, 0 2px 4px -1px ${colors.primary}10`
            : 'none',
          borderColor: isFocused ? colors.primary : colors.border
        }}
      >
        <div className="relative flex-1">
          <TextArea
            ref={ref}
            value={value}
            onChange={onChange}
            onKeyDown={handleInputKeyDown}
            placeholder={value === '' ? 'Type / for commands or start typing...' : placeholder}
            rows={1}
            maxRows={6}
            fullWidth
            className="resize-none pr-14 border-0 shadow-none focus:shadow-none focus:ring-0 transition-all duration-200 rounded-lg bg-transparent"
            style={{
              paddingLeft: '0.5rem',
              paddingRight: '3.5rem', // Space for send button
              fontSize: '0.9375rem',
              lineHeight: '1.5',
              outline: 'none',
              color: colors.text
            }}
            disabled={disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </div>

        {/* Send button */}
        <button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className={`p-2 rounded-lg ml-1 flex items-center justify-center transition-all duration-200 transform ${
            value.trim() ? 'scale-100' : 'scale-95 opacity-70'
          }`}
          title="Send message"
          style={{
            background: value.trim()
              ? colors.primary
              : theme === 'light' ? '#E2E8F0' : '#334155',
            color: value.trim() ? '#FFFFFF' : theme === 'light' ? '#94A3B8' : '#475569'
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>

      {/* Custom animations via CSS */}
      <style jsx global>{`
        .entity-changed {
          animation: pulse 0.8s ease-in-out;
        }

        @keyframes pulse {
          0% { transform: translateY(0); }
          30% { transform: translateY(-2px); }
          60% { transform: translateY(1px); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
});

ModernAIInput.displayName = 'ModernAIInput';

export default ModernAIInput;