import React, { useState, useEffect } from 'react';
import { Brain, BookOpen, Clock, TrendingUp, Users, Award, ChevronRight, Play, Lock } from 'lucide-react';
import { therapyService } from '../services/therapyService';
import { TherapyModule, TherapySessionState } from '../types/therapy';

interface Props {
  language: 'vi' | 'en';
  onStartSession?: (moduleId: string) => void;
}

export const TherapyModuleSelector: React.FC<Props> = ({ language, onStartSession }) => {
  const [modules, setModules] = useState<TherapyModule[]>([]);
  const [recommendations, setRecommendations] = useState<TherapyModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<TherapyModule | null>(null);

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      const availableModules = await therapyService.getAvailableModules();
      setModules(availableModules);
      
      // Get recommendations based on user symptoms (would come from assessment)
      const userSymptoms = ['stress', 'anxiety']; // Placeholder - would be dynamic
      const userPreferences = ['mindfulness']; // Placeholder - would be dynamic
      
      const recommended = await therapyService.recommendModules(userSymptoms, userPreferences);
      setRecommendations(recommended);
    } catch (error) {
      console.error('Failed to load therapy modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartModule = async (moduleId: string) => {
    try {
      await therapyService.startTherapySession(moduleId, 1);
      onStartSession?.(moduleId);
    } catch (error) {
      console.error('Failed to start therapy session:', error);
    }
  };

  const text = language === 'vi' ? {
    title: "Chương Trình Trị Liệu",
    subtitle: "Dựa trên bằng chứng lâm sàng",
    recommended: "Khuyến nghị cho bạn",
    available: "Tất cả chương trình",
    startSession: "Bắt đầu phiên",
    duration: "Thời lượng",
    sessions: "Phiên",
    evidence: "Bằng chứng",
    viewDetails: "Xem chi tiết",
    locked: "Yêu cầu đánh giá trước"
  } : {
    title: "Therapy Programs",
    subtitle: "Evidence-based interventions",
    recommended: "Recommended for you",
    available: "All programs",
    startSession: "Start Session",
    duration: "Duration",
    sessions: "Sessions",
    evidence: "Evidence",
    viewDetails: "View Details",
    locked: "Requires assessment"
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">{text.title}</h2>
        <p className="text-gray-600">{text.subtitle}</p>
      </div>

      {/* Recommended Modules */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            {text.recommended}
          </h3>
          <div className="grid gap-4">
            {recommendations.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                language={language}
                onStart={() => handleStartModule(module.id)}
                isRecommended={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Available Modules */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-500" />
          {text.available}
        </h3>
        <div className="grid gap-4">
          {modules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              language={language}
              onStart={() => handleStartModule(module.id)}
              isRecommended={recommendations.some(r => r.id === module.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface ModuleCardProps {
  module: TherapyModule;
  language: 'vi' | 'en';
  onStart: () => void;
  isRecommended: boolean;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ module, language, onStart, isRecommended }) => {
  const [showDetails, setShowDetails] = useState(false);

  const text = language === 'vi' ? {
    startSession: "Bắt đầu phiên",
    viewDetails: "Xem chi tiết",
    hideDetails: "Ẩn chi tiết",
    duration: "Thời lượng",
    sessions: "Phiên",
    evidence: "Bằng chứng",
    symptoms: "Triệu chứng mục tiêu",
    objectives: "Mục tiêu học tập"
  } : {
    startSession: "Start Session",
    viewDetails: "View Details",
    hideDetails: "Hide Details",
    duration: "Duration",
    sessions: "Sessions",
    evidence: "Evidence",
    symptoms: "Target Symptoms",
    objectives: "Learning Objectives"
  };

  const getModalityIcon = (modality: string) => {
    switch (modality) {
      case 'CBT-Depression': return <Brain className="w-5 h-5 text-purple-500" />;
      case 'ACT-Anxiety': return <Users className="w-5 h-5 text-green-500" />;
      case 'Mindfulness-Stress': return <Clock className="w-5 h-5 text-blue-500" />;
      default: return <BookOpen className="w-5 h-5 text-gray-500" />;
    }
  };

  const getModalityColor = (modality: string) => {
    switch (modality) {
      case 'CBT-Depression': return 'border-purple-200 bg-purple-50';
      case 'ACT-Anxiety': return 'border-green-200 bg-green-50';
      case 'Mindfulness-Stress': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className={`border rounded-lg p-4 transition-all hover:shadow-md ${getModalityColor(module.name)}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {getModalityIcon(module.name)}
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">{module.name}</h4>
            <p className="text-sm text-gray-600 mt-1">{module.description}</p>
            
            {/* Metadata */}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {module.sessions.length} {text.sessions}
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {module.evidence_base}
              </span>
            </div>
          </div>
        </div>
        
        {isRecommended && (
          <div className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
            Recommended
          </div>
        )}
      </div>

      {/* Target Symptoms */}
      <div className="mt-3">
        <p className="text-xs font-medium text-gray-700 mb-1">{text.symptoms}:</p>
        <div className="flex flex-wrap gap-1">
          {module.target_symptoms.map((symptom) => (
            <span
              key={symptom}
              className="text-xs bg-white px-2 py-1 rounded border border-gray-200"
            >
              {symptom}
            </span>
          ))}
        </div>
      </div>

      {/* Expandable Details */}
      <div className="mt-3">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          {showDetails ? text.hideDetails : text.viewDetails}
          <ChevronRight className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
        </button>

        {showDetails && (
          <div className="mt-3 space-y-3 text-sm">
            {/* First Session Preview */}
            <div>
              <p className="font-medium text-gray-700 mb-1">{text.objectives} (Session 1):</p>
              <ul className="text-xs text-gray-600 space-y-1">
                {module.sessions[0]?.learning_objectives.map((objective, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-blue-500 mt-0.5">•</span>
                    {objective}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={onStart}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <Play className="w-4 h-4" />
          {text.startSession}
        </button>
      </div>
    </div>
  );
};

// Therapy Session Component
export const TherapySession: React.FC<{
  language: 'vi' | 'en';
  sessionId?: string;
  onComplete?: () => void;
}> = ({ language, sessionId, onComplete }) => {
  const [sessionState, setSessionState] = useState<TherapySessionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<'opening' | 'exercise' | 'homework' | 'assessment' | 'complete'>('opening');

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    }
  }, [sessionId]);

  const loadSession = async (id: string) => {
    try {
      const session = await therapyService.getCurrentSession();
      setSessionState(session);
      if (session) {
        setCurrentStep(session.session_progress.current_step);
      }
    } catch (error) {
      console.error('Failed to load therapy session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceSession = async () => {
    if (!sessionState) return;
    
    try {
      const updatedSession = await therapyService.advanceSession();
      setSessionState(updatedSession);
      setCurrentStep(updatedSession.session_progress.current_step);
      
      if (updatedSession.session_progress.current_step === 'complete') {
        onComplete?.();
      }
    } catch (error) {
      console.error('Failed to advance session:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!sessionState) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">No active therapy session</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900">
          {sessionState.current_module?.name} - Session {sessionState.current_session?.number}
        </h3>
        <p className="text-sm text-blue-700 mt-1">
          {sessionState.current_session?.learning_objectives.join(', ')}
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        {['opening', 'exercise', 'homework', 'assessment', 'complete'].map((step, index) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                currentStep === step
                  ? 'bg-blue-600 text-white'
                  : index < ['opening', 'exercise', 'homework', 'assessment', 'complete'].indexOf(currentStep)
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {index + 1}
            </div>
            {index < 4 && (
              <div className="w-8 h-0.5 bg-gray-300 mx-1"></div>
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white border rounded-lg p-6">
        {currentStep === 'opening' && (
          <OpeningStep
            session={sessionState}
            language={language}
            onComplete={handleAdvanceSession}
          />
        )}
        {currentStep === 'exercise' && (
          <ExerciseStep
            session={sessionState}
            language={language}
            onComplete={handleAdvanceSession}
          />
        )}
        {currentStep === 'homework' && (
          <HomeworkStep
            session={sessionState}
            language={language}
            onComplete={handleAdvanceSession}
          />
        )}
        {currentStep === 'assessment' && (
          <AssessmentStep
            session={sessionState}
            language={language}
            onComplete={handleAdvanceSession}
          />
        )}
        {currentStep === 'complete' && (
          <CompleteStep
            session={sessionState}
            language={language}
            onComplete={onComplete}
          />
        )}
      </div>
    </div>
  );
};

// Step Components (simplified for now)
const OpeningStep: React.FC<{
  session: TherapySessionState;
  language: 'vi' | 'en';
  onComplete: () => void;
}> = ({ session, language, onComplete }) => {
  const opening = session.current_session?.conversation_flow.opening;
  
  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Brain className="w-8 h-8 text-blue-600" />
        </div>
        <p className="text-lg text-gray-800">{opening?.voice}</p>
      </div>
      
      <button
        onClick={onComplete}
        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Continue
      </button>
    </div>
  );
};

const ExerciseStep: React.FC<{
  session: TherapySessionState;
  language: 'vi' | 'en';
  onComplete: () => void;
}> = ({ session, language, onComplete }) => {
  const exercise = session.current_session?.conversation_flow.exercises[0];
  
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-900">{exercise?.name}</h4>
      <p className="text-gray-700">{exercise?.instructions.voice}</p>
      
      <button
        onClick={onComplete}
        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Complete Exercise
      </button>
    </div>
  );
};

const HomeworkStep: React.FC<{
  session: TherapySessionState;
  language: 'vi' | 'en';
  onComplete: () => void;
}> = ({ session, language, onComplete }) => {
  const homework = session.current_session?.conversation_flow.homework;
  
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-900">Homework Assignment</h4>
      <p className="text-gray-700">{homework?.voice}</p>
      
      <button
        onClick={onComplete}
        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Accept Homework
      </button>
    </div>
  );
};

const AssessmentStep: React.FC<{
  session: TherapySessionState;
  language: 'vi' | 'en';
  onComplete: () => void;
}> = ({ session, language, onComplete }) => {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-900">Progress Assessment</h4>
      <p className="text-gray-700">Quick check-in on your progress...</p>
      
      <button
        onClick={onComplete}
        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Complete Assessment
      </button>
    </div>
  );
};

const CompleteStep: React.FC<{
  session: TherapySessionState;
  language: 'vi' | 'en';
  onComplete?: () => void;
}> = ({ session, language, onComplete }) => {
  return (
    <div className="text-center space-y-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <Award className="w-8 h-8 text-green-600" />
      </div>
      <h4 className="font-semibold text-gray-900">Session Complete!</h4>
      <p className="text-gray-600">Great work today. See you next time.</p>
      
      {onComplete && (
        <button
          onClick={onComplete}
          className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Continue
        </button>
      )}
    </div>
  );
};
