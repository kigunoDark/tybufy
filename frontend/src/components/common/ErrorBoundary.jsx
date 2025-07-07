// src/components/common/ErrorBoundary.js
import React from 'react';
import { AlertTriangle, RefreshCw, Home, Brain } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Логируем ошибку (в продакшене отправляйте в сервис мониторинга)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center px-6">
          <div className="max-w-md w-full text-center">
            {/* Logo */}
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <AlertTriangle className="text-white" size={40} />
            </div>
            
            {/* Error message */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Oops! Something went wrong
            </h1>
            
            <p className="text-lg text-gray-600 mb-8">
              We encountered an unexpected error. Don't worry, our team has been notified and we're working on a fix.
            </p>
            
            {/* Action buttons */}
            <div className="space-y-4">
              <button
                onClick={this.handleReload}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              >
                <RefreshCw size={20} />
                <span>Try Again</span>
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="w-full border-2 border-gray-300 hover:border-blue-400 text-gray-700 hover:text-blue-600 font-semibold py-3 px-6 rounded-xl transition-all duration-300 bg-white hover:bg-blue-50 flex items-center justify-center space-x-2"
              >
                <Home size={20} />
                <span>Go Home</span>
              </button>
            </div>
            
            {/* Tubify branding */}
            <div className="mt-12 flex items-center justify-center space-x-3 opacity-60">
              <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="text-white" size={16} />
              </div>
              <span className="text-lg font-black bg-gradient-to-r from-slate-700 to-blue-700 bg-clip-text text-transparent">
                Tubify
              </span>
            </div>
            
            {/* Debug info (только в development mode) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-8 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                  Show Error Details (Dev Mode)
                </summary>
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 overflow-auto">
                  <pre className="whitespace-pre-wrap">
                    {this.state.error.toString()}
                    <br />
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;