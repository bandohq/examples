import React from 'react'

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Bando API Playground
            </h1>
            <p className="text-gray-600 mt-1">
              Explore products, eSIMs, and gift cards through the Bando API
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Connected
            </span>
            <a
              href="https://docs.bando.cool"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              API Docs ↗
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header