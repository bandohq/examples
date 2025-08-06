import React from 'react'

const LoadingSpinner = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-600">Loading products from Bando API...</p>
      </div>
    </div>
  )
}

export default LoadingSpinner