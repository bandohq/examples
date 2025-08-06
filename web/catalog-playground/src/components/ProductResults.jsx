import React, { useState } from 'react'
import ProductCard from './ProductCard'

const ProductResults = ({ products, requestInfo }) => {
  const [expandedBrands, setExpandedBrands] = useState(new Set())

  const toggleBrand = (brandSlug) => {
    setExpandedBrands(prev => {
      const newSet = new Set(prev)
      if (newSet.has(brandSlug)) {
        newSet.delete(brandSlug)
      } else {
        newSet.add(brandSlug)
      }
      return newSet
    })
  }

  const totalBrands = products.reduce((sum, productType) => 
    sum + (productType.brands?.length || 0), 0
  )

  const totalVariants = products.reduce((sum, productType) => 
    sum + (productType.brands?.reduce((brandSum, brand) => 
      brandSum + (brand.variants?.length || 0), 0
    ) || 0), 0
  )

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            API Results
          </h2>
          {requestInfo && (
            <div className="text-sm text-gray-500">
              {requestInfo.url}
            </div>
          )}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{products.length}</div>
            <div className="text-sm text-gray-600">Product Types</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalBrands}</div>
            <div className="text-sm text-gray-600">Brands</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{totalVariants}</div>
            <div className="text-sm text-gray-600">Products</div>
          </div>
        </div>
      </div>

      {/* Product Types */}
      {products.map((productType, typeIndex) => (
        <div key={typeIndex} className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b bg-gray-50 rounded-t-lg">
            <h3 className="text-lg font-semibold text-gray-800 uppercase">
              {productType.productType}
            </h3>
            <p className="text-sm text-gray-600">
              {productType.brands?.length || 0} brands available
            </p>
          </div>

          <div className="p-6 space-y-4">
            {productType.brands?.map((brand, brandIndex) => (
              <div key={brandIndex} className="border rounded-lg overflow-hidden">
                <div 
                  className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleBrand(`${typeIndex}-${brandIndex}`)}
                >
                  <div className="flex items-center space-x-3">
                    {brand.imageUrl && (
                      <img 
                        src={brand.imageUrl} 
                        alt={brand.brandName}
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    )}
                    <div>
                      <h4 className="font-medium text-gray-800">{brand.brandName}</h4>
                      <p className="text-sm text-gray-600">
                        {brand.variants?.length || 0} products
                      </p>
                    </div>
                  </div>
                  <div className="text-gray-400">
                    {expandedBrands.has(`${typeIndex}-${brandIndex}`) ? '−' : '+'}
                  </div>
                </div>

                {expandedBrands.has(`${typeIndex}-${brandIndex}`) && (
                  <div className="p-4 bg-white">
                    <div className="grid gap-4">
                      {brand.variants?.slice(0, 10).map((variant, variantIndex) => (
                        <ProductCard key={variantIndex} variant={variant} />
                      ))}
                      {brand.variants?.length > 10 && (
                        <div className="text-center py-2 text-sm text-gray-500">
                          ... and {brand.variants.length - 10} more products
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ProductResults