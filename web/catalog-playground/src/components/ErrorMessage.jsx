import React from 'react'

const ErrorMessage = ({ message }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-medium text-red-800">API Request Failed</h3>
          <p className="text-red-600 mt-1">{message}</p>
          <p className="text-sm text-gray-600 mt-2">
            Please check your filters and try again, or verify the API connection.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ErrorMessage