import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Lock } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class CryptoErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[CryptoErrorBoundary] Cryptographic operation failed:', error);
    console.error('[CryptoErrorBoundary] Component stack:', errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo
    });

    // Log crypto errors securely (don't log sensitive data)
    const errorData = {
      type: 'CRYPTO_ERROR',
      message: error.message,
      timestamp: Date.now(),
      stack: error.stack?.substring(0, 500) // Limit stack trace length
    };

    // In production, send to secure logging service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Implement secure error reporting
      console.warn('[CryptoErrorBoundary] Production error logging not implemented');
    }
  }

  handleReset = () => {
    // Clear any potentially corrupted crypto state
    try {
      // Force vault lock to ensure security
      const { VaultService } = require('../services/crypto');
      if (VaultService.isAuthenticated()) {
        VaultService.lockVault();
      }
    } catch (e) {
      console.warn('[CryptoErrorBoundary] Failed to lock vault during reset');
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="fixed inset-0 z-[70] bg-red-900/95 backdrop-blur-md flex flex-col items-center justify-center text-white p-8">
          <div className="bg-red-800 p-6 rounded-full mb-6 animate-pulse">
            <Lock className="w-16 h-16 text-red-300" />
          </div>
          
          <AlertTriangle className="w-12 h-12 text-yellow-400 mb-4" />
          
          <h1 className="text-2xl md:text-3xl font-bold mb-4 text-center">
            Lỗi Bảo Mật / Security Error
          </h1>
          
          <p className="text-lg text-center max-w-md mb-6 text-red-100">
            Đã xảy ra lỗi trong hệ thống bảo mật. Dữ liệu của bạn vẫn được an toàn.
          </p>
          
          <p className="text-sm text-center max-w-md mb-8 text-red-200">
            A security error occurred. Your data remains safe and encrypted.
          </p>

          <div className="bg-red-800/50 rounded-lg p-4 mb-6 max-w-md w-full">
            <h3 className="font-semibold mb-2 text-yellow-300">Khuyến nghị / Recommendation:</h3>
            <ul className="text-sm space-y-1 text-red-100">
              <li>• Làm mới ứng dụng để khởi tạo lại hệ thống bảo mật</li>
              <li>• Refresh the app to reinitialize security systems</li>
              <li>• Mọi dữ liệu nhạy cảm vẫn được mã hóa</li>
              <li>• All sensitive data remains encrypted</li>
            </ul>
          </div>

          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-lg"
          >
            <RefreshCw size={18} />
            Làm mới / Reset Security
          </button>

          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
          >
            Tải lại ứng dụng / Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
