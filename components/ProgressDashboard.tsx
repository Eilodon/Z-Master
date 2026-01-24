import React, { useState, useEffect } from 'react';
import { AssessmentHistory, CombinedAssessmentResult, TrendData } from '../types/clinicalAssessments.js';
import { ConversationMemory } from '../types.js';
import { MindfulnessMetrics } from '../types.js';
import './styles/ProgressDashboard.css';

interface ProgressDashboardProps {
  assessmentHistory: AssessmentHistory;
  conversationMemory: ConversationMemory;
  currentLanguage: 'vi' | 'en';
}

const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  assessmentHistory,
  conversationMemory,
  currentLanguage
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedMetric, setSelectedMetric] = useState<'depression' | 'anxiety' | 'mindfulness' | 'overall'>('overall');

  const translations = {
    en: {
      title: "Your Progress Dashboard",
      overview: "Overview",
      trends: "Trends",
      milestones: "Milestones",
      insights: "Insights",
      lastAssessment: "Last Assessment",
      improvement: "Improvement",
      trend: "Trend",
      score: "Score",
      noData: "No data available for this time period",
      depression: "Depression (PHQ-9)",
      anxiety: "Anxiety (GAD-7)",
      mindfulness: "Mindfulness (MAAS)",
      overall: "Overall Mental Health",
      improving: "Improving 📈",
      stable: "Stable ➡️",
      worsening: "Worsening 📉",
      week: "Last Week",
      month: "Last Month",
      quarter: "Last Quarter",
      year: "Last Year"
    },
    vi: {
      title: "Bảng điều khiển tiến trình của bạn",
      overview: "Tổng quan",
      trends: "Xu hướng",
      milestones: "Cột mốc",
      insights: "Thông tin chi tiết",
      lastAssessment: "Đánh giá cuối cùng",
      improvement: "Cải thiện",
      trend: "Xu hướng",
      score: "Điểm số",
      noData: "Không có dữ liệu cho khoảng thời gian này",
      depression: "Trầm cảm (PHQ-9)",
      anxiety: "Lo âu (GAD-7)",
      mindfulness: "Chánh niệm (MAAS)",
      overall: "Sức khỏe tinh thần tổng thể",
      improving: "Cải thiện 📈",
      stable: "Ổn định ➡️",
      worsening: "Xấu đi 📉",
      week: "Tuần trước",
      month: "Tháng trước",
      quarter: "Quý trước",
      year: "Năm trước"
    }
  };

  const getDepressionHeightClass = (score: number) => {
    if (score <= 4) return 'height-4';
    if (score <= 7) return 'height-7';
    if (score <= 11) return 'height-11';
    if (score <= 14) return 'height-14';
    if (score <= 18) return 'height-18';
    if (score <= 22) return 'height-22';
    return 'height-27';
  };

  const getAnxietyHeightClass = (score: number) => {
    if (score <= 4) return 'height-anxiety-4';
    if (score <= 7) return 'height-anxiety-7';
    if (score <= 10) return 'height-anxiety-10';
    if (score <= 14) return 'height-anxiety-14';
    if (score <= 17) return 'height-anxiety-17';
    return 'height-anxiety-21';
  };

  const getMindfulnessHeightClass = (score: number) => {
    const rounded = Math.round(score);
    return `height-mindfulness-${rounded}`;
  };

  const getLatestScores = () => {
    const latestPHQ9 = assessmentHistory.assessments.phq9_history[assessmentHistory.assessments.phq9_history.length - 1];
    const latestGAD7 = assessmentHistory.assessments.gad7_history[assessmentHistory.assessments.gad7_history.length - 1];
    const latestMAAS = assessmentHistory.assessments.maas_history[assessmentHistory.assessments.maas_history.length - 1];

    return {
      depression: latestPHQ9?.depression_score,
      anxiety: latestGAD7?.anxiety_score,
      mindfulness: latestMAAS?.average_score,
      lastAssessment: Math.max(
        latestPHQ9?.timestamp || 0,
        latestGAD7?.timestamp || 0,
        latestMAAS?.timestamp || 0
      )
    };
  };

  const getTrendIcon = (trend: TrendData) => {
    if (trend.slope < -0.1) return "📉"; // Improving (negative slope for depression/anxiety)
    if (trend.slope > 0.1) return "📈";  // Worsening
    return "➡️"; // Stable
  };

  const getTrendText = (trend: TrendData) => {
    if (trend.slope < -0.1) return translations[currentLanguage].improving;
    if (trend.slope > 0.1) return translations[currentLanguage].worsening;
    return translations[currentLanguage].stable;
  };

  const formatScore = (score: number, type: 'depression' | 'anxiety' | 'mindfulness') => {
    if (type === 'mindfulness') {
      return score.toFixed(1);
    }
    return score.toString();
  };

  const getScoreColor = (score: number, type: 'depression' | 'anxiety' | 'mindfulness') => {
    if (type === 'mindfulness') {
      if (score >= 4.5) return 'text-green-600';
      if (score >= 3.5) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      if (score <= 4) return 'text-green-600';
      if (score <= 9) return 'text-yellow-600';
      if (score <= 14) return 'text-orange-600';
      return 'text-red-600';
    }
  };

  const getOverallSeverity = () => {
    const scores = getLatestScores();
    if (!scores.depression && !scores.anxiety) return 'minimal';
    
    const maxScore = Math.max(scores.depression || 0, scores.anxiety || 0);
    if (maxScore <= 4) return 'minimal';
    if (maxScore <= 9) return 'mild';
    if (maxScore <= 14) return 'moderate';
    return 'severe';
  };

  const getProgressInsights = () => {
    const insights = [];
    const trends = assessmentHistory.trends;
    
    if (trends.depression_trend.significant_change) {
      insights.push({
        type: 'depression',
        message: currentLanguage === 'en' 
          ? `Significant ${trends.depression_trend.slope < 0 ? 'improvement' : 'decline'} in depression symptoms`
          : `Cải thiện ${trends.depression_trend.slope < 0 ? 'đáng kể' : 'suy giảm'} triệu chứng trầm cảm`,
        priority: trends.depression_trend.slope < 0 ? 'positive' : 'concerning'
      });
    }
    
    if (trends.anxiety_trend.significant_change) {
      insights.push({
        type: 'anxiety',
        message: currentLanguage === 'en'
          ? `Significant ${trends.anxiety_trend.slope < 0 ? 'improvement' : 'decline'} in anxiety symptoms`
          : `Cải thiện ${trends.anxiety_trend.slope < 0 ? 'đáng kể' : 'suy giảm'} triệu chứng lo âu`,
        priority: trends.anxiety_trend.slope < 0 ? 'positive' : 'concerning'
      });
    }
    
    if (trends.mindfulness_trend.significant_change) {
      insights.push({
        type: 'mindfulness',
        message: currentLanguage === 'en'
          ? `Significant ${trends.mindfulness_trend.slope > 0 ? 'improvement' : 'decline'} in mindfulness`
          : `Cải thiện ${trends.mindfulness_trend.slope > 0 ? 'đáng kể' : 'suy giảm'} chánh niệm`,
        priority: trends.mindfulness_trend.slope > 0 ? 'positive' : 'concerning'
      });
    }
    
    return insights;
  };

  const latestScores = getLatestScores();
  const overallSeverity = getOverallSeverity();
  const insights = getProgressInsights();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {translations[currentLanguage].title}
        </h1>
        <p className="text-gray-600">
          {currentLanguage === 'en' 
            ? `Track your mental health journey over time`
            : 'Theo dõi hành trình sức khỏe tinh thần của bạn theo thời gian'}
        </p>
      </div>

      {/* Time Range Selector */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex flex-wrap gap-2">
          {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setSelectedTimeRange(range)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedTimeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {translations[currentLanguage][range]}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Depression */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {translations[currentLanguage].depression}
          </h3>
          {latestScores.depression !== undefined ? (
            <>
              <div className={`text-3xl font-bold ${getScoreColor(latestScores.depression, 'depression')}`}>
                {formatScore(latestScores.depression, 'depression')}
              </div>
              <div className="flex items-center mt-2 text-sm text-gray-600">
                <span className="mr-2">{getTrendIcon(assessmentHistory.trends.depression_trend)}</span>
                <span>{getTrendText(assessmentHistory.trends.depression_trend)}</span>
              </div>
            </>
          ) : (
            <div className="text-gray-400">
              {translations[currentLanguage].noData}
            </div>
          )}
        </div>

        {/* Anxiety */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {translations[currentLanguage].anxiety}
          </h3>
          {latestScores.anxiety !== undefined ? (
            <>
              <div className={`text-3xl font-bold ${getScoreColor(latestScores.anxiety, 'anxiety')}`}>
                {formatScore(latestScores.anxiety, 'anxiety')}
              </div>
              <div className="flex items-center mt-2 text-sm text-gray-600">
                <span className="mr-2">{getTrendIcon(assessmentHistory.trends.anxiety_trend)}</span>
                <span>{getTrendText(assessmentHistory.trends.anxiety_trend)}</span>
              </div>
            </>
          ) : (
            <div className="text-gray-400">
              {translations[currentLanguage].noData}
            </div>
          )}
        </div>

        {/* Mindfulness */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {translations[currentLanguage].mindfulness}
          </h3>
          {latestScores.mindfulness !== undefined ? (
            <>
              <div className={`text-3xl font-bold ${getScoreColor(latestScores.mindfulness, 'mindfulness')}`}>
                {formatScore(latestScores.mindfulness, 'mindfulness')}
              </div>
              <div className="flex items-center mt-2 text-sm text-gray-600">
                <span className="mr-2">{getTrendIcon(assessmentHistory.trends.mindfulness_trend)}</span>
                <span>{getTrendText(assessmentHistory.trends.mindfulness_trend)}</span>
              </div>
            </>
          ) : (
            <div className="text-gray-400">
              {translations[currentLanguage].noData}
            </div>
          )}
        </div>

        {/* Overall */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {translations[currentLanguage].overall}
          </h3>
          <div className={`text-3xl font-bold capitalize ${getScoreColor(
            overallSeverity === 'minimal' ? 2 : 
            overallSeverity === 'mild' ? 7 : 
            overallSeverity === 'moderate' ? 12 : 18, 'depression'
          )}`}>
            {overallSeverity}
          </div>
          <div className="text-sm text-gray-600 mt-2">
            {latestScores.lastAssessment > 0 && (
              currentLanguage === 'en'
                ? `Last: ${new Date(latestScores.lastAssessment).toLocaleDateString()}`
                : `Lần cuối: ${new Date(latestScores.lastAssessment).toLocaleDateString()}`
            )}
          </div>
        </div>
      </div>

      {/* Progress Visualization */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {translations[currentLanguage].trends}
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Depression Trend */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-3">
              {translations[currentLanguage].depression}
            </h3>
            <div className="h-32 flex items-end justify-between chart-container">
              {assessmentHistory.assessments.phq9_history.slice(-7).map((result, index) => (
                <div key={result.id} className="flex flex-col items-center flex-1 chart-column">
                  <div 
                    className={`w-full bg-blue-500 rounded-t chart-bar chart-bar-depression ${getDepressionHeightClass(result.depression_score)}`}
                  />
                  <div className="text-xs text-gray-500 mt-1 chart-label">
                    {new Date(result.timestamp).getDate()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Anxiety Trend */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-3">
              {translations[currentLanguage].anxiety}
            </h3>
            <div className="h-32 flex items-end justify-between chart-container">
              {assessmentHistory.assessments.gad7_history.slice(-7).map((result, index) => (
                <div key={result.id} className="flex flex-col items-center flex-1 chart-column">
                  <div 
                    className={`w-full bg-green-500 rounded-t chart-bar chart-bar-anxiety ${getAnxietyHeightClass(result.anxiety_score)}`}
                  />
                  <div className="text-xs text-gray-500 mt-1 chart-label">
                    {new Date(result.timestamp).getDate()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mindfulness Trend */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-3">
              {translations[currentLanguage].mindfulness}
            </h3>
            <div className="h-32 flex items-end justify-between chart-container">
              {assessmentHistory.assessments.maas_history.slice(-7).map((result, index) => (
                <div key={result.id} className="flex flex-col items-center flex-1 chart-column">
                  <div 
                    className={`w-full bg-purple-500 rounded-t chart-bar chart-bar-mindfulness ${getMindfulnessHeightClass(result.average_score)}`}
                  />
                  <div className="text-xs text-gray-500 mt-1 chart-label">
                    {new Date(result.timestamp).getDate()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {translations[currentLanguage].insights}
          </h2>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  insight.priority === 'positive' 
                    ? 'bg-green-50 border-green-500'
                    : 'bg-yellow-50 border-yellow-500'
                }`}
              >
                <p className="text-gray-700">{insight.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Milestones */}
      {assessmentHistory.milestones.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {translations[currentLanguage].milestones}
          </h2>
          <div className="space-y-3">
            {assessmentHistory.milestones.slice(-5).map((milestone, index) => (
              <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3" />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{milestone.details}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(milestone.achieved_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressDashboard;
