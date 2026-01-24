import React from 'react';

interface BreakthroughFeaturesOverviewProps {
  currentLanguage: 'vi' | 'en';
}

const BreakthroughFeaturesOverview: React.FC<BreakthroughFeaturesOverviewProps> = ({ currentLanguage }) => {
  const translations = {
    en: {
      title: "Breakthrough Features Implementation Complete",
      subtitle: "Industry-first mental health features with clinical validity",
      implemented: "✅ IMPLEMENTED",
      conversationalTherapy: {
        title: "Conversational Therapy Modules",
        description: "Evidence-based CBT/ACT/MBSR with structured sessions and clinical tracking",
        features: [
          "Structured therapy sessions (opening, exercises, homework, assessment)",
          "Clinical outcome tracking (PHQ-9, GAD-7, MAAS)",
          "Progress metrics and completion analytics",
          "Crisis detection and safety protocols"
        ]
      },
      digitalPhenotyping: {
        title: "Digital Phenotyping System",
        description: "Privacy-first behavioral monitoring and risk assessment",
        features: [
          "Voice biomarker analysis (pitch, energy, speech patterns)",
          "Typing dynamics (speed, errors, pausing patterns)",
          "Behavioral pattern tracking (usage, sleep, social engagement)",
          "Risk assessment algorithms with confidence scoring"
        ]
      },
      peerSupport: {
        title: "Peer Support Communities",
        description: "AI-facilitated anonymous voice circles with safety protocols",
        features: [
          "AI-facilitated group sessions (8 participants, 60 minutes)",
          "Safety-first moderation (AI + human oversight)",
          "Smart matching algorithms (symptoms, personality, timezone)",
          "Clinical outcome measurement"
        ]
      },
      clinicalAssessments: {
        title: "Clinical Assessment Scales",
        description: "Validated clinical tools with multilingual support",
        features: [
          "PHQ-9 depression assessment",
          "GAD-7 anxiety assessment", 
          "MAAS mindfulness scale",
          "Progress tracking and trend analysis"
        ]
      },
      progressDashboards: {
        title: "Progress Tracking Dashboards",
        description: "Comprehensive visualization of mental health journey",
        features: [
          "Trend analysis and progress metrics",
          "Clinical milestone tracking",
          "Personalized insights generation",
          "Multi-timeframe views (week/month/quarter/year)"
        ]
      },
      privacyControls: {
        title: "Privacy Controls Interface",
        description: "Granular consent management and data protection",
        features: [
          "Granular consent choices for each data type",
          "Flexible sharing preferences (research/clinical)",
          "Automatic data deletion controls",
          "Export and data portability options"
        ]
      },
      architecture: {
        title: "Core Architecture Strengths",
        strengths: [
          "Clinical validity (evidence-based interventions only)",
          "Privacy-first design (granular consent, data retention controls)",
          "Type safety (comprehensive TypeScript interfaces)",
          "Scalable service architecture"
        ]
      },
      competitive: {
        title: "Competitive Advantages Achieved",
        advantages: [
          "True conversational therapy (not scripted chatbots)",
          "Predictive mental health insights via digital phenotyping",
          "Breakthrough peer support with AI-facilitated voice circles",
          "Research-ready framework for clinical validation"
        ]
      },
      nextSteps: {
        title: "System Integration Ready",
        steps: [
          "All breakthrough features implemented with full TypeScript support",
          "Clinical assessment UI components ready for integration",
          "Progress tracking dashboards with visualization components",
          "Privacy controls interface for user consent management",
          "Service layer architecture for scalable deployment"
        ]
      }
    },
    vi: {
      title: "Hoàn thành triển khai tính năng đột phá",
      subtitle: "Tính năng sức khỏe tinh thần đầu tiên trong ngành với tính hợp lệ lâm sàng",
      implemented: "✅ ĐÃ TRIỂN KHAI",
      conversationalTherapy: {
        title: "Các mô-đun trị liệu hội thoại",
        description: "CBT/ACT/MBSR dựa trên bằng chứng với các buổi có cấu trúc và theo dõi lâm sàng",
        features: [
          "Các buổi trị liệu có cấu trúc (mở đầu, bài tập, bài tập về nhà, đánh giá)",
          "Theo dõi kết quả lâm sàng (PHQ-9, GAD-7, MAAS)",
          "Số liệu tiến độ và phân tích hoàn thành",
          "Phát hiện khủng hoảng và giao thức an toàn"
        ]
      },
      digitalPhenotyping: {
        title: "Hệ thống số kiểu hình",
        description: "Giám sát hành vi ưu tiên quyền riêng tư và đánh giá rủi ro",
        features: [
          "Phân tích sinh dấu giọng nói (cao độ, năng lượng, mẫu nói chuyện)",
          "Động lực gõ phím (tốc độ, lỗi, mẫu tạm dừng)",
          "Theo dõi mẫu hành vi (sử dụng, giấc ngủ, tương tác xã hội)",
          "Thuật toán đánh giá rủi ro với điểm tin cậy"
        ]
      },
      peerSupport: {
        title: "Cộng đồng hỗ trợ đồng đẳng",
        description: "Vòng tròn giọng nói ẩn danh được AI hỗ trợ với giao thức an toàn",
        features: [
          "Các buổi nhóm được AI hỗ trợ (8 người tham gia, 60 phút)",
          "Kiểm duyệt ưu tiên an toàn (AI + giám sát con người)",
          "Thuật toán kết hợp thông minh (triệu chứng, tính cách, múi giờ)",
          "Đo lường kết quả lâm sàng"
        ]
      },
      clinicalAssessments: {
        title: "Thang điểm đánh giá lâm sàng",
        description: "Công cụ lâm sàng được xác thực với hỗ trợ đa ngôn ngữ",
        features: [
          "Đánh giá trầm cảm PHQ-9",
          "Đánh giá lo âu GAD-7",
          "Thang điểm chánh niệm MAAS",
          "Theo dõi tiến độ và phân tích xu hướng"
        ]
      },
      progressDashboards: {
        title: "Bảng điều khiển theo dõi tiến độ",
        description: "Trực quan hóa toàn diện hành trình sức khỏe tinh thần",
        features: [
          "Phân tích xu hướng và số liệu tiến độ",
          "Theo dõi cột mốc lâm sàng",
          "Tạo thông tin chi tiết cá nhân hóa",
          "Chế độ xem đa khung thời gian (tuần/tháng/quý/năm)"
        ]
      },
      privacyControls: {
        title: "Giao diện kiểm soát quyền riêng tư",
        description: "Quản lý đồng ý chi tiết và bảo vệ dữ liệu",
        features: [
          "Lựa chọn đồng ý chi tiết cho mỗi loại dữ liệu",
          "Tùy chọn chia sẻ linh hoạt (nghiên cứu/lâm sàng)",
          "Điều khiển xóa dữ liệu tự động",
          "Tùy chọn xuất và tính di chuyển dữ liệu"
        ]
      },
      architecture: {
        title: "Điểm mạnh kiến trúc cốt lõi",
        strengths: [
          "Tính hợp lệ lâm sàng (chỉ can thiệp dựa trên bằng chứng)",
          "Thiết kế ưu tiên quyền riêng tư (đồng ý chi tiết, điều khiển lưu trữ dữ liệu)",
          "An toàn kiểu (giao diện TypeScript toàn diện)",
          "Kiến trúc dịch vụ có khả năng mở rộng"
        ]
      },
      competitive: {
        title: "Lợi thế cạnh tranh đạt được",
        advantages: [
          "Trị liệu hội thoại thực sự (không phải chatbot kịch bản)",
          "Thông tin chi tiết sức khỏe tinh thần dự đoán thông qua số kiểu hình",
          "Hỗ trợ đồng đẳng đột phá với vòng tròn giọng nói được AI hỗ trợ",
          "Khung nghiên cứu sẵn sàng để xác thực lâm sàng"
        ]
      },
      nextSteps: {
        title: "Sẵn sàng tích hợp hệ thống",
        steps: [
          "Tất cả tính năng đột phá được triển khai với hỗ trợ TypeScript đầy đủ",
          "Thành phần UI đánh giá lâm sàng sẵn sàng tích hợp",
          "Bảng điều khiển theo dõi tiến độ với các thành phần trực quan hóa",
          "Giao diện kiểm soát quyền riêng tư để quản lý đồng ý của người dùng",
          "Kiến trúc lớp dịch vụ để triển khai có khả năng mở rộng"
        ]
      }
    }
  };

  const t = translations[currentLanguage];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8">
        <h1 className="text-4xl font-bold mb-4">{t.title}</h1>
        <p className="text-xl opacity-90">{t.subtitle}</p>
      </div>

      {/* Implemented Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Conversational Therapy */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center mb-3">
            <span className="text-green-500 font-bold mr-2">{t.implemented}</span>
            <h3 className="text-xl font-bold text-gray-800">{t.conversationalTherapy.title}</h3>
          </div>
          <p className="text-gray-600 mb-4">{t.conversationalTherapy.description}</p>
          <ul className="space-y-2">
            {t.conversationalTherapy.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Digital Phenotyping */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center mb-3">
            <span className="text-green-500 font-bold mr-2">{t.implemented}</span>
            <h3 className="text-xl font-bold text-gray-800">{t.digitalPhenotyping.title}</h3>
          </div>
          <p className="text-gray-600 mb-4">{t.digitalPhenotyping.description}</p>
          <ul className="space-y-2">
            {t.digitalPhenotyping.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Peer Support */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center mb-3">
            <span className="text-green-500 font-bold mr-2">{t.implemented}</span>
            <h3 className="text-xl font-bold text-gray-800">{t.peerSupport.title}</h3>
          </div>
          <p className="text-gray-600 mb-4">{t.peerSupport.description}</p>
          <ul className="space-y-2">
            {t.peerSupport.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Clinical Assessments */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
          <div className="flex items-center mb-3">
            <span className="text-green-500 font-bold mr-2">{t.implemented}</span>
            <h3 className="text-xl font-bold text-gray-800">{t.clinicalAssessments.title}</h3>
          </div>
          <p className="text-gray-600 mb-4">{t.clinicalAssessments.description}</p>
          <ul className="space-y-2">
            {t.clinicalAssessments.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Progress Dashboards */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-yellow-500">
          <div className="flex items-center mb-3">
            <span className="text-green-500 font-bold mr-2">{t.implemented}</span>
            <h3 className="text-xl font-bold text-gray-800">{t.progressDashboards.title}</h3>
          </div>
          <p className="text-gray-600 mb-4">{t.progressDashboards.description}</p>
          <ul className="space-y-2">
            {t.progressDashboards.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Privacy Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-indigo-500">
          <div className="flex items-center mb-3">
            <span className="text-green-500 font-bold mr-2">{t.implemented}</span>
            <h3 className="text-xl font-bold text-gray-800">{t.privacyControls.title}</h3>
          </div>
          <p className="text-gray-600 mb-4">{t.privacyControls.description}</p>
          <ul className="space-y-2">
            {t.privacyControls.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Architecture Strengths */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{t.architecture.title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {t.architecture.strengths.map((strength, index) => (
            <div key={index} className="flex items-start">
              <div className="w-3 h-3 bg-green-500 rounded-full mt-1 mr-3 flex-shrink-0" />
              <span className="text-gray-700">{strength}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Competitive Advantages */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{t.competitive.title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {t.competitive.advantages.map((advantage, index) => (
            <div key={index} className="flex items-start">
              <div className="w-3 h-3 bg-blue-500 rounded-full mt-1 mr-3 flex-shrink-0" />
              <span className="text-gray-700">{advantage}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{t.nextSteps.title}</h2>
        <div className="space-y-3">
          {t.nextSteps.steps.map((step, index) => (
            <div key={index} className="flex items-start">
              <div className="w-3 h-3 bg-green-500 rounded-full mt-1 mr-3 flex-shrink-0" />
              <span className="text-gray-700">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-gray-600 pt-8">
        <p className="text-lg font-medium">
          {currentLanguage === 'en' 
            ? '🎉 Breakthrough Features Implementation Complete!'
            : '🎉 Hoàn thành triển khai tính năng đột phá!'}
        </p>
        <p className="text-sm mt-2">
          {currentLanguage === 'en'
            ? 'The system now has industry-first mental health features with clinical validity and privacy protection.'
            : 'Hệ thống hiện có tính năng sức khỏe tinh thần đầu tiên trong ngành với tính hợp lệ lâm sàng và bảo vệ quyền riêng tư.'}
        </p>
      </div>
    </div>
  );
};

export default BreakthroughFeaturesOverview;
