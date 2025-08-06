import React, { useState } from 'react'

const ApiFilters = ({ onSubmit, loading }) => {
  const [filters, setFilters] = useState({
    country: '',
    type: '',
    brand: '',
    pageSize: '10',
    pageNumber: '1'
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(filters)
  }

  const handleReset = () => {
    setFilters({
      country: '',
      type: '',
      brand: '',
      pageSize: '10',
      pageNumber: '1'
    })
  }

  const predefinedScenarios = [
    {
      name: 'US eSIMs',
      filters: { country: 'US', type: 'esim', pageSize: '5' }
    },
    {
      name: 'Gift Cards',
      filters: { type: 'gift_card', pageSize: '10' }
    },
    {
      name: 'Mexico Products',
      filters: { country: 'MX', pageSize: '8' }
    },
    {
      name: 'Mobile Top-ups',
      filters: { type: 'topup', pageSize: '6' }
    }
  ]

  const applyScenario = (scenarioFilters) => {
    setFilters(prev => ({
      ...prev,
      ...scenarioFilters,
      pageNumber: '1'
    }))
  }

  return (
    <div className="space-y-6">
      {/* Quick Scenarios */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Quick Scenarios
        </label>
        <div className="grid grid-cols-1 gap-2">
          {predefinedScenarios.map((scenario, index) => (
            <button
              key={index}
              onClick={() => applyScenario(scenario.filters)}
              className="text-left px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 text-blue-700 transition-colors"
              disabled={loading}
            >
              {scenario.name}
            </button>
          ))}
        </div>
      </div>

      {/* Manual Filters */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
            Country Code
          </label>
          <input
            type="text"
            id="country"
            name="country"
            value={filters.country}
            onChange={handleChange}
            placeholder="e.g., US, MX, CA"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Product Type
          </label>
          <select
            id="type"
            name="type"
            value={filters.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="esim">eSIM</option>
            <option value="gift_card">Gift Cards</option>
            <option value="topup">Mobile Top-ups</option>
          </select>
        </div>

        <div>
          <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
            Brand
          </label>
          <input
            type="text"
            id="brand"
            name="brand"
            value={filters.brand}
            onChange={handleChange}
            placeholder="e.g., llbean, att"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="pageSize" className="block text-sm font-medium text-gray-700 mb-1">
              Page Size
            </label>
            <select
              id="pageSize"
              name="pageSize"
              value={filters.pageSize}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>

          <div>
            <label htmlFor="pageNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Page
            </label>
            <input
              type="number"
              id="pageNumber"
              name="pageNumber"
              value={filters.pageNumber}
              onChange={handleChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Loading...' : 'Search Products'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  )
}

export default ApiFilters