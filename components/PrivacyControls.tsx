import React, { useState } from 'react';
import { PhenotypingConsent, SharingPreferences } from '../types/digitalPhenotyping';

interface PrivacyControlsProps {
  currentConsent: PhenotypingConsent | null;
  onConsentUpdate: (consent: PhenotypingConsent) => void;
  currentLanguage: 'vi' | 'en';
}

const PrivacyControls: React.FC<PrivacyControlsProps> = ({
  currentConsent,
  onConsentUpdate,
  currentLanguage
}) => {
  const [consentChoices, setConsentChoices] = useState({
    typing_analysis: currentConsent?.consent_choices.typing_analysis || false,
    voice_analysis: currentConsent?.consent_choices.voice_analysis || false,
    usage_patterns: currentConsent?.consent_choices.usage_patterns || false,
    device_sensors: currentConsent?.consent_choices.device_sensors || false,
    location_data: currentConsent?.consent_choices.location_data || false,
    communication_data: currentConsent?.consent_choices.communication_data || false,
  });

  const [sharingPreferences, setSharingPreferences] = useState({
    share_for_research: currentConsent?.sharing_preferences.share_for_research || false,
    research_identification: currentConsent?.sharing_preferences.research_identification || 'anonymous',
    share_with_therapist: currentConsent?.sharing_preferences.share_with_therapist || false,
    therapist_data_detail: currentConsent?.sharing_preferences.therapist_data_detail || 'summaries',
    share_commercial: false, // Never enabled by default
    auto_delete_after_days: currentConsent?.sharing_preferences.auto_delete_after_days || 365,
    export_format: currentConsent?.sharing_preferences.export_format || 'json',
  });

  const [understanding, setUnderstanding] = useState({
    purpose_understood: currentConsent?.purpose_understood || false,
    risks_understood: currentConsent?.risks_understood || false,
    withdrawal_rights_understood: currentConsent?.withdrawal_rights_understood || false,
  });

  const translations = {
    en: {
      title: "Privacy & Data Controls",
      subtitle: "Manage your privacy settings and data sharing preferences",
      dataCollection: "Data Collection",
      whatWeCollect: "What We Collect",
      typingAnalysis: {
        title: "Typing Analysis",
        description: "Analyze typing speed, rhythm, and patterns to detect stress and cognitive load indicators"
      },
      voiceAnalysis: {
        title: "Voice Analysis", 
        description: "Analyze voice pitch, energy, and speech patterns for emotional insights"
      },
      usagePatterns: {
        title: "Usage Patterns",
        description: "Track app engagement patterns and session timing for routine analysis"
      },
      deviceSensors: {
        title: "Device Sensors",
        description: "Use motion and activity sensors for mobility and routine tracking"
      },
      locationData: {
        title: "Location Data",
        description: "Track location patterns for routine and social engagement analysis"
      },
      communicationData: {
        title: "Communication Data",
        description: "Analyze communication patterns and social interaction metrics"
      },
      dataSharing: "Data Sharing",
      researchParticipation: "Research Participation",
      shareForResearch: "Share anonymized data for mental health research",
      anonymous: "Anonymous",
      pseudonymous: "Pseudonymous", 
      identified: "Identified",
      clinicalSharing: "Clinical Sharing",
      shareWithTherapist: "Share data with your healthcare provider",
      summaries: "Summaries only",
      patterns: "Patterns and trends",
      rawData: "Raw data",
      commercialSharing: "Commercial Data Sharing",
      shareCommercial: "Share data with third parties for commercial purposes",
      dataRetention: "Data Retention",
      autoDelete: "Automatically delete data after",
      days: "days",
      exportFormat: "Export data format",
      understanding: "Understanding & Consent",
      purpose: "I understand that my data will be used to provide personalized mental health insights and improve treatment outcomes",
      risks: "I understand the privacy risks associated with sharing sensitive mental health data",
      withdrawal: "I understand that I can withdraw consent at any time and request data deletion",
      saveChanges: "Save Changes",
      cancel: "Cancel",
      consentRequired: "Please confirm your understanding before saving",
      dataWillBeUsed: "Your data will be used to:",
      personalizedInsights: "Provide personalized mental health insights",
      improveTreatment: "Improve treatment recommendations",
      researchAdvancement: "Advance mental health research",
      privacyProtected: "Your privacy is protected by:",
      encryption: "End-to-end encryption",
      anonymization: "Data anonymization",
      retentionLimits: "Automatic data deletion",
      consentControl: "Granular consent control"
    },
    vi: {
      title: "Quyền riêng tư & Kiểm soát dữ liệu",
      subtitle: "Quản lý cài đặt quyền riêng tư và tùy chọn chia sẻ dữ liệu của bạn",
      dataCollection: "Thu thập dữ liệu",
      whatWeCollect: "Chúng tôi thu thập gì",
      typingAnalysis: {
        title: "Phân tích gõ phím",
        description: "Phân tích tốc độ, nhịp độ và mẫu gõ để phát hiện chỉ báo căng thẳng và tải nhận thức"
      },
      voiceAnalysis: {
        title: "Phân tích giọng nói",
        description: "Phân tích cao độ, năng lượng giọng nói và mẫu nói chuyện để có thông tin chi tiết về cảm xúc"
      },
      usagePatterns: {
        title: "Mẫu sử dụng",
        description: "Theo dõi mẫu tương tác ứng dụng và thời gian phiên để phân tích thói quen"
      },
      deviceSensors: {
        title: "Cảm biến thiết bị",
        description: "Sử dụng cảm biến chuyển động và hoạt động để theo dõi di chuyển và thói quen"
      },
      locationData: {
        title: "Dữ liệu vị trí",
        description: "Theo dõi mẫu vị trí để phân tích thói quen và tương tác xã hội"
      },
      communicationData: {
        title: "Dữ liệu giao tiếp",
        description: "Phân tích mẫu giao tiếp và chỉ số tương tác xã hội"
      },
      dataSharing: "Chia sẻ dữ liệu",
      researchParticipation: "Tham gia nghiên cứu",
      shareForResearch: "Chia sẻ dữ liệu ẩn danh cho nghiên cứu sức khỏe tâm thần",
      anonymous: "Ẩn danh",
      pseudonymous: "Giả danh",
      identified: "Đã xác định",
      clinicalSharing: "Chia sẻ lâm sàng",
      shareWithTherapist: "Chia sẻ dữ liệu với nhà cung cấp chăm sóc sức khỏe của bạn",
      summaries: "Chỉ tóm tắt",
      patterns: "Mẫu và xu hướng",
      rawData: "Dữ liệu thô",
      commercialSharing: "Chia sẻ dữ liệu thương mại",
      shareCommercial: "Chia sẻ dữ liệu với bên thứ ba cho mục đích thương mại",
      dataRetention: "Lưu trữ dữ liệu",
      autoDelete: "Tự động xóa dữ liệu sau",
      days: "ngày",
      exportFormat: "Định dạng xuất dữ liệu",
      understanding: "Hiểu & Đồng ý",
      purpose: "Tôi hiểu rằng dữ liệu của tôi sẽ được sử dụng để cung cấp thông tin chi tiết về sức khỏe tâm thần cá nhân hóa và cải thiện kết quả điều trị",
      risks: "Tôi hiểu các rủi ro về quyền riêng tư liên quan đến việc chia sẻ dữ liệu sức khỏe tâm thần nhạy cảm",
      withdrawal: "Tôi hiểu rằng tôi có thể rút lại sự đồng ý bất cứ lúc nào và yêu cầu xóa dữ liệu",
      saveChanges: "Lưu thay đổi",
      cancel: "Hủy",
      consentRequired: "Vui lòng xác nhận sự hiểu biết của bạn trước khi lưu",
      dataWillBeUsed: "Dữ liệu của bạn sẽ được sử dụng để:",
      personalizedInsights: "Cung cấp thông tin chi tiết về sức khỏe tâm thần cá nhân hóa",
      improveTreatment: "Cải thiện khuyến nghị điều trị",
      researchAdvancement: "Thúc đẩy nghiên cứu sức khỏe tâm thần",
      privacyProtected: "Quyền riêng tư của bạn được bảo vệ bởi:",
      encryption: "Mã hóa đầu cuối",
      anonymization: "Ẩm danh hóa dữ liệu",
      retentionLimits: "Xóa dữ liệu tự động",
      consentControl: "Kiểm soát đồng ý chi tiết"
    }
  };

  const handleConsentChange = (key: string, value: boolean) => {
    setConsentChoices(prev => ({ ...prev, [key]: value }));
  };

  const handleSharingChange = (key: string, value: any) => {
    setSharingPreferences(prev => ({ ...prev, [key]: value }));
  };

  const handleUnderstandingChange = (key: string, value: boolean) => {
    setUnderstanding(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!understanding.purpose_understood || !understanding.risks_understood || !understanding.withdrawal_rights_understood) {
      alert(translations[currentLanguage].consentRequired);
      return;
    }

    const newConsent: PhenotypingConsent = {
      version: '1.0',
      timestamp: Date.now(),
      consent_choices: consentChoices,
      sharing_preferences: sharingPreferences as SharingPreferences,
      ...understanding
    };

    onConsentUpdate(newConsent);
  };

  const isFormValid = understanding.purpose_understood && understanding.risks_understood && understanding.withdrawal_rights_understood;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {translations[currentLanguage].title}
        </h1>
        <p className="text-gray-600">
          {translations[currentLanguage].subtitle}
        </p>
      </div>

      {/* Data Collection Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {translations[currentLanguage].dataCollection}
        </h2>
        <p className="text-gray-600 mb-6">
          {translations[currentLanguage].whatWeCollect}
        </p>

        <div className="space-y-4">
          {/* Typing Analysis */}
          <div className="border rounded-lg p-4">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="typing_analysis"
                checked={consentChoices.typing_analysis}
                onChange={(e) => handleConsentChange('typing_analysis', e.target.checked)}
                className="mt-1 mr-3"
              />
              <div className="flex-1">
                <label htmlFor="typing_analysis" className="font-medium text-gray-800 cursor-pointer">
                  {translations[currentLanguage].typingAnalysis.title}
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  {translations[currentLanguage].typingAnalysis.description}
                </p>
              </div>
            </div>
          </div>

          {/* Voice Analysis */}
          <div className="border rounded-lg p-4">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="voice_analysis"
                checked={consentChoices.voice_analysis}
                onChange={(e) => handleConsentChange('voice_analysis', e.target.checked)}
                className="mt-1 mr-3"
              />
              <div className="flex-1">
                <label htmlFor="voice_analysis" className="font-medium text-gray-800 cursor-pointer">
                  {translations[currentLanguage].voiceAnalysis.title}
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  {translations[currentLanguage].voiceAnalysis.description}
                </p>
              </div>
            </div>
          </div>

          {/* Usage Patterns */}
          <div className="border rounded-lg p-4">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="usage_patterns"
                checked={consentChoices.usage_patterns}
                onChange={(e) => handleConsentChange('usage_patterns', e.target.checked)}
                className="mt-1 mr-3"
              />
              <div className="flex-1">
                <label htmlFor="usage_patterns" className="font-medium text-gray-800 cursor-pointer">
                  {translations[currentLanguage].usagePatterns.title}
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  {translations[currentLanguage].usagePatterns.description}
                </p>
              </div>
            </div>
          </div>

          {/* Device Sensors */}
          <div className="border rounded-lg p-4">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="device_sensors"
                checked={consentChoices.device_sensors}
                onChange={(e) => handleConsentChange('device_sensors', e.target.checked)}
                className="mt-1 mr-3"
              />
              <div className="flex-1">
                <label htmlFor="device_sensors" className="font-medium text-gray-800 cursor-pointer">
                  {translations[currentLanguage].deviceSensors.title}
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  {translations[currentLanguage].deviceSensors.description}
                </p>
              </div>
            </div>
          </div>

          {/* Location Data */}
          <div className="border rounded-lg p-4">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="location_data"
                checked={consentChoices.location_data}
                onChange={(e) => handleConsentChange('location_data', e.target.checked)}
                className="mt-1 mr-3"
              />
              <div className="flex-1">
                <label htmlFor="location_data" className="font-medium text-gray-800 cursor-pointer">
                  {translations[currentLanguage].locationData.title}
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  {translations[currentLanguage].locationData.description}
                </p>
              </div>
            </div>
          </div>

          {/* Communication Data */}
          <div className="border rounded-lg p-4">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="communication_data"
                checked={consentChoices.communication_data}
                onChange={(e) => handleConsentChange('communication_data', e.target.checked)}
                className="mt-1 mr-3"
              />
              <div className="flex-1">
                <label htmlFor="communication_data" className="font-medium text-gray-800 cursor-pointer">
                  {translations[currentLanguage].communicationData.title}
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  {translations[currentLanguage].communicationData.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Sharing Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {translations[currentLanguage].dataSharing}
        </h2>

        {/* Research Participation */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">
            {translations[currentLanguage].researchParticipation}
          </h3>
          
          <div className="border rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="share_for_research"
                checked={sharingPreferences.share_for_research}
                onChange={(e) => handleSharingChange('share_for_research', e.target.checked)}
                className="mt-1 mr-3"
              />
              <label htmlFor="share_for_research" className="text-gray-800 cursor-pointer">
                {translations[currentLanguage].shareForResearch}
              </label>
            </div>
          </div>

          {sharingPreferences.share_for_research && (
            <div className="ml-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentLanguage === 'en' ? 'Identification Level:' : 'Mức độ nhận dạng:'}
              </label>
              <select
                value={sharingPreferences.research_identification}
                onChange={(e) => handleSharingChange('research_identification', e.target.value)}
                className="block w-full p-2 border border-gray-300 rounded-lg"
                aria-label={currentLanguage === 'en' ? 'Identification Level' : 'Mức độ nhận dạng'}
              >
                <option value="anonymous">{translations[currentLanguage].anonymous}</option>
                <option value="pseudonymous">{translations[currentLanguage].pseudonymous}</option>
                <option value="identified">{translations[currentLanguage].identified}</option>
              </select>
            </div>
          )}
        </div>

        {/* Clinical Sharing */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">
            {translations[currentLanguage].clinicalSharing}
          </h3>
          
          <div className="border rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="share_with_therapist"
                checked={sharingPreferences.share_with_therapist}
                onChange={(e) => handleSharingChange('share_with_therapist', e.target.checked)}
                className="mt-1 mr-3"
              />
              <label htmlFor="share_with_therapist" className="text-gray-800 cursor-pointer">
                {translations[currentLanguage].shareWithTherapist}
              </label>
            </div>
          </div>

          {sharingPreferences.share_with_therapist && (
            <div className="ml-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentLanguage === 'en' ? 'Data Detail Level:' : 'Mức độ chi tiết dữ liệu:'}
              </label>
              <select
                value={sharingPreferences.therapist_data_detail}
                onChange={(e) => handleSharingChange('therapist_data_detail', e.target.value)}
                className="block w-full p-2 border border-gray-300 rounded-lg"
                aria-label={currentLanguage === 'en' ? 'Data Detail Level' : 'Mức độ chi tiết dữ liệu'}
              >
                <option value="summaries">{translations[currentLanguage].summaries}</option>
                <option value="patterns">{translations[currentLanguage].patterns}</option>
                <option value="raw_data">{translations[currentLanguage].rawData}</option>
              </select>
            </div>
          )}
        </div>

        {/* Commercial Sharing (Always Disabled) */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">
            {translations[currentLanguage].commercialSharing}
          </h3>
          
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="share_commercial"
                checked={sharingPreferences.share_commercial}
                onChange={() => {}} // Always disabled
                disabled
                className="mt-1 mr-3"
              />
              <label htmlFor="share_commercial" className="text-gray-500 cursor-not-allowed">
                {translations[currentLanguage].shareCommercial}
                <span className="block text-sm mt-1">
                  {currentLanguage === 'en' 
                    ? '(Never enabled - your data is never shared for commercial purposes)'
                    : '(Không bao giờ bật - dữ liệu của bạn không bao giờ được chia sẻ cho mục đích thương mại)'}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Data Retention */}
        <div>
          <h3 className="font-semibold text-gray-700 mb-3">
            {translations[currentLanguage].dataRetention}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {translations[currentLanguage].autoDelete}
              </label>
              <select
                value={sharingPreferences.auto_delete_after_days}
                onChange={(e) => handleSharingChange('auto_delete_after_days', parseInt(e.target.value))}
                className="block w-full p-2 border border-gray-300 rounded-lg"
                aria-label={translations[currentLanguage].autoDelete}
              >
                <option value={30}>30 {translations[currentLanguage].days}</option>
                <option value={90}>90 {translations[currentLanguage].days}</option>
                <option value={180}>180 {translations[currentLanguage].days}</option>
                <option value={365}>1 {currentLanguage === 'en' ? 'year' : 'năm'}</option>
                <option value={730}>2 {currentLanguage === 'en' ? 'years' : 'năm'}</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {translations[currentLanguage].exportFormat}
              </label>
              <select
                value={sharingPreferences.export_format}
                onChange={(e) => handleSharingChange('export_format', e.target.value)}
                className="block w-full p-2 border border-gray-300 rounded-lg"
                aria-label={translations[currentLanguage].exportFormat}
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Understanding & Consent */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {translations[currentLanguage].understanding}
        </h2>

        <div className="space-y-4 mb-6">
          <div className="flex items-start">
            <input
              type="checkbox"
              id="purpose_understood"
              checked={understanding.purpose_understood}
              onChange={(e) => handleUnderstandingChange('purpose_understood', e.target.checked)}
              className="mt-1 mr-3"
            />
            <label htmlFor="purpose_understood" className="text-gray-700 cursor-pointer">
              {translations[currentLanguage].purpose}
            </label>
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              id="risks_understood"
              checked={understanding.risks_understood}
              onChange={(e) => handleUnderstandingChange('risks_understood', e.target.checked)}
              className="mt-1 mr-3"
            />
            <label htmlFor="risks_understood" className="text-gray-700 cursor-pointer">
              {translations[currentLanguage].risks}
            </label>
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              id="withdrawal_rights_understood"
              checked={understanding.withdrawal_rights_understood}
              onChange={(e) => handleUnderstandingChange('withdrawal_rights_understood', e.target.checked)}
              className="mt-1 mr-3"
            />
            <label htmlFor="withdrawal_rights_understood" className="text-gray-700 cursor-pointer">
              {translations[currentLanguage].withdrawal}
            </label>
          </div>
        </div>

        {/* Information Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">
              {translations[currentLanguage].dataWillBeUsed}
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                {translations[currentLanguage].personalizedInsights}
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                {translations[currentLanguage].improveTreatment}
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                {translations[currentLanguage].researchAdvancement}
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 mb-3">
              {translations[currentLanguage].privacyProtected}
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                {translations[currentLanguage].encryption}
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                {translations[currentLanguage].anonymization}
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                {translations[currentLanguage].retentionLimits}
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                {translations[currentLanguage].consentControl}
              </li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            {translations[currentLanguage].cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={!isFormValid}
            className={`px-6 py-2 rounded-lg ${
              isFormValid
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {translations[currentLanguage].saveChanges}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyControls;
