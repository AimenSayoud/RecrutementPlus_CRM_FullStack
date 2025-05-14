// src/components/ai-assistant/CVAnalyzer/CVAnalyzer.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFileText, FiUpload, FiX, FiLoader, FiCheckCircle, FiAlertCircle, FiCpu } from 'react-icons/fi';
import { useTheme } from '@/app/context/ThemeContext';
import Button from '@/components/ui/Button';
import TextArea from '@/components/ui/TextArea';
import CVResult from './CVResult';

// Import CV analysis service
import { analyzeCv } from '@/lib/openai-service';

interface CVAnalyzerProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete: (analysis: any, cvText: string) => void;
}

type AnalysisStep = 'input' | 'processing' | 'result' | 'error';

const CVAnalyzer: React.FC<CVAnalyzerProps> = ({ isOpen, onClose, onAnalysisComplete }) => {
  const { colors, theme } = useTheme();
  const [cvText, setCvText] = useState('');
  const [currentStep, setCurrentStep] = useState<AnalysisStep>('input');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);

  // Clear state when component opens
  React.useEffect(() => {
    if (isOpen) {
      setCvText('');
      setCurrentStep('input');
      setAnalysisResult(null);
      setErrorMessage('');
      setProcessingProgress(0);
    }
  }, [isOpen]);

  // Simulate processing progress
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (currentStep === 'processing') {
      interval = setInterval(() => {
        setProcessingProgress(prev => {
          // Cap at 90% - the last 10% happens when we get the actual result
          const newProgress = prev + (2 * Math.random());
          return Math.min(newProgress, 90);
        });
      }, 200);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentStep]);

  // Handle pasted text input
  const handleCvTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCvText(e.target.value);
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCvText(event.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  // Start CV analysis process
  const handleAnalyze = async () => {
    if (!cvText.trim()) return;
    
    setCurrentStep('processing');
    setProcessingProgress(0);
    
    try {
      // Simulate some initial processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call actual CV analysis API
      const result = await analyzeCv(cvText);
      
      // Complete the progress bar
      setProcessingProgress(100);
      
      // Set result
      setAnalysisResult(result);
      setCurrentStep('result');
      
    } catch (error: any) {
      console.error('Error analyzing CV:', error);
      setErrorMessage(error.message || 'Failed to analyze CV. Please try again.');
      setCurrentStep('error');
    }
  };

  // Reset to input step
  const handleReset = () => {
    setCvText('');
    setCurrentStep('input');
    setAnalysisResult(null);
    setErrorMessage('');
    setProcessingProgress(0);
  };

  // Complete and close
  const handleComplete = () => {
    if (analysisResult) {
      onAnalysisComplete(analysisResult, cvText);
    }
    onClose();
  };

  // Demo data for pasting
  const sampleCvText = `John Smith
Senior Software Engineer
john.smith@example.com | (123) 456-7890 | New York, NY

SKILLS
JavaScript, TypeScript, React, Node.js, Express, MongoDB, AWS, Docker

EXPERIENCE
Senior Frontend Engineer | Tech Solutions Inc | January 2021 - Present
- Led development of a React-based dashboard used by over 10,000 customers
- Improved application performance by 40% through code optimization
- Mentored junior developers and conducted code reviews

Full Stack Developer | Digital Innovations | March 2018 - December 2020
- Developed and maintained multiple web applications using React and Node.js
- Implemented CI/CD pipeline using GitHub Actions and AWS
- Contributed to open-source projects and internal libraries

EDUCATION
Master of Computer Science | University of Technology | 2016-2018
Bachelor of Science in Software Engineering | State University | 2012-2016`;

  // If not open, don't render
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <motion.div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <motion.div
        className="w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative z-10"
        style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}
        role="dialog" 
        aria-modal="true"
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {/* Header */}
        <header className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: colors.border }}>
          <div className="flex items-center">
            <div className="mr-3 h-9 w-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${colors.primary}20` }}>
              <FiFileText className="w-5 h-5" style={{ color: colors.primary }} />
            </div>
            <h2 className="text-xl font-semibold" style={{ color: colors.text }}>
              {currentStep === 'result' ? 'CV Analysis Results' : 'CV Analyzer'}
            </h2>
          </div>
          <button
            className="p-1.5 rounded-full transition-colors text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={onClose} 
            aria-label="Close CV analyzer"
          >
            <FiX className="w-5 h-5" />
          </button>
        </header>
        
        {/* Content */}
        <div className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Input CV Text */}
            {currentStep === 'input' && (
              <motion.div 
                key="input-step"
                className="p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2" style={{ color: colors.text }}>
                    Paste CV Text
                  </h3>
                  <p className="text-sm opacity-70 mb-4" style={{ color: colors.text }}>
                    Paste the candidate's CV text below or upload a text file. Our AI will analyze it and extract key information.
                  </p>
                  
                  <div className="relative">
                    <TextArea
                      value={cvText}
                      onChange={handleCvTextChange}
                      placeholder="Paste CV text here..."
                      rows={12}
                      className="w-full p-3 border rounded-lg resize-none mb-2"
                      style={{ borderColor: colors.border }}
                    />
                    
                    {/* Word count indicator */}
                    <div className="text-xs opacity-60 text-right mb-3" style={{ color: colors.text }}>
                      {cvText.trim().split(/\s+/).filter(Boolean).length} words
                    </div>
                    
                    {/* Sample data button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCvText(sampleCvText)}
                      className="text-xs mb-3"
                    >
                      Use sample CV for testing
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="relative">
                      <input
                        type="file"
                        id="cv-file-upload"
                        accept=".txt,.pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Button
                        variant="outline"
                        leftIcon={<FiUpload className="w-4 h-4" />}
                      >
                        Upload File
                      </Button>
                    </div>
                    
                    <Button
                      variant="primary"
                      onClick={handleAnalyze}
                      disabled={cvText.trim().length < 50}
                      leftIcon={<FiCpu className="w-4 h-4" />}
                    >
                      Analyze CV
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Step 2: Processing */}
            {currentStep === 'processing' && (
              <motion.div 
                key="processing-step"
                className="p-6 flex flex-col items-center justify-center min-h-[300px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="relative w-20 h-20 mb-4">
                  <motion.div 
                    className="absolute inset-0 rounded-full"
                    style={{ borderWidth: '4px', borderColor: `${colors.primary}30`, borderStyle: 'solid' }}
                  />
                  <motion.div 
                    className="absolute inset-0 rounded-full"
                    style={{ 
                      borderWidth: '4px', 
                      borderLeftColor: colors.primary,
                      borderRightColor: 'transparent',
                      borderTopColor: 'transparent',
                      borderBottomColor: 'transparent',
                      borderStyle: 'solid',
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FiCpu className="w-8 h-8" style={{ color: colors.primary }} />
                  </div>
                </div>
                
                <h3 className="text-lg font-medium mb-2" style={{ color: colors.text }}>
                  Analyzing CV...
                </h3>
                <p className="text-sm opacity-70 mb-6 text-center max-w-md" style={{ color: colors.text }}>
                  Our AI is analyzing the CV to extract skills, experience, education, and other key information. This may take a moment.
                </p>
                
                {/* Progress bar */}
                <div className="w-full max-w-md h-2 rounded-full overflow-hidden mb-2" style={{ backgroundColor: `${colors.primary}20` }}>
                  <motion.div 
                    className="h-full rounded-full" 
                    style={{ backgroundColor: colors.primary }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${processingProgress}%` }}
                    transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                  />
                </div>
                <div className="text-sm opacity-60" style={{ color: colors.text }}>
                  {Math.round(processingProgress)}% complete
                </div>
              </motion.div>
            )}
            
            {/* Step 3: Results */}
            {currentStep === 'result' && analysisResult && (
              <motion.div 
                key="result-step"
                className="p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center mb-4">
                  <FiCheckCircle className="w-6 h-6 mr-2 text-green-500" />
                  <h3 className="text-lg font-medium" style={{ color: colors.text }}>
                    Analysis Complete
                  </h3>
                </div>
                
                <CVResult analysis={analysisResult} />
              </motion.div>
            )}
            
            {/* Step 4: Error */}
            {currentStep === 'error' && (
              <motion.div 
                key="error-step"
                className="p-6 flex flex-col items-center justify-center min-h-[300px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <FiAlertCircle className="w-16 h-16 mb-4 text-red-500" />
                <h3 className="text-lg font-medium mb-2" style={{ color: colors.text }}>
                  Analysis Failed
                </h3>
                <p className="text-sm opacity-70 mb-6 text-center max-w-md" style={{ color: colors.text }}>
                  {errorMessage}
                </p>
                <Button variant="primary" onClick={handleReset}>
                  Try Again
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Footer */}
        <footer className="p-4 border-t flex justify-between items-center" style={{ borderColor: colors.border }}>
          {currentStep === 'input' && (
            <>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <div className="text-xs opacity-60" style={{ color: colors.text }}>
                <span>Minimum 50 words required for analysis</span>
              </div>
            </>
          )}
          
          {currentStep === 'processing' && (
            <>
              <Button variant="outline" onClick={onClose} disabled>Cancel</Button>
              <div className="text-xs opacity-60" style={{ color: colors.text }}>
                <span>Please wait while we analyze the CV...</span>
              </div>
            </>
          )}
          
          {currentStep === 'result' && (
            <>
              <Button variant="outline" onClick={handleReset}>New Analysis</Button>
              <Button variant="primary" onClick={handleComplete}>
                Use Results
              </Button>
            </>
          )}
          
          {currentStep === 'error' && (
            <>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button variant="primary" onClick={handleReset}>Try Again</Button>
            </>
          )}
        </footer>
      </motion.div>
    </div>
  );
};

export default CVAnalyzer;