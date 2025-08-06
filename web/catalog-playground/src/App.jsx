import React, { useState, useEffect } from 'react'
import ApiFilters from './components/ApiFilters'
import ProductResults from './components/ProductResults'
import Header from './components/Header'
import LoadingSpinner from './components/LoadingSpinner'
import ErrorMessage from './components/ErrorMessage'

function App() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [requestInfo, setRequestInfo] = useState(null)

  const handleApiRequest = async (filters) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'API request failed')
      }
      
      setProducts(data.products || [])
      setRequestInfo(data.requestInfo)
    } catch (err) {
      setError(err.message)
      setProducts([])
      setRequestInfo(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Filters Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                API Filters
              </h2>
              <ApiFilters onSubmit={handleApiRequest} loading={loading} />
            </div>
          </div>
          
          {/* Results Panel */}
          <div className="lg:col-span-2">
            {loading && <LoadingSpinner />}
            {error && <ErrorMessage message={error} />}
            {!loading && !error && products.length > 0 && (
              <ProductResults 
                products={products} 
                requestInfo={requestInfo}
              />
            )}
            {!loading && !error && products.length === 0 && requestInfo && (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-500">No products found for the selected filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App