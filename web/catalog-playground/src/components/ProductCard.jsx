import React from 'react'

const ProductCard = ({ variant }) => {
  const formatPrice = (price) => {
    if (!price) return 'Price not available'
    
    const currency = price.fiatCurrency || 'USD'
    const value = parseFloat(price.fiatValue || 0).toFixed(2)
    return `${currency} ${value}`
  }

  const formatValidation = (referenceType, requiredFields) => {
    const validations = []
    
    if (referenceType) {
      validations.push({
        type: referenceType.name || 'Reference',
        format: referenceType.valueType || 'string',
        example: referenceType.name === 'email' ? 'user@example.com' : 'Required'
      })
    }
    
    if (requiredFields && requiredFields.length > 0) {
      requiredFields.forEach(field => {
        validations.push({
          type: field.name,
          format: field.valueType || 'string',
          example: field.name.includes('email') ? 'user@example.com' : 'Required'
        })
      })
    }
    
    return validations
  }

  const validations = formatValidation(variant.referenceType, variant.requiredFields)

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h5 className="font-medium text-gray-800 mb-1">
            {variant.shortNotes || variant.notes || `Product ${variant.sku?.slice(-8)}`}
          </h5>
          <div className="text-lg font-semibold text-green-600">
            {formatPrice(variant.price)}
          </div>
        </div>
        <div className="text-xs text-gray-500 ml-4">
          SKU: {variant.sku?.slice(-8)}...
        </div>
      </div>

      {variant.notes && variant.notes !== variant.shortNotes && (
        <div className="text-sm text-gray-600 mb-3 line-clamp-2">
          {variant.notes}
        </div>
      )}

      {/* eSIM specific details */}
      {variant.dataGB && (
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            📶 {variant.dataGB} GB
          </span>
          {variant.durationDays && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              📅 {variant.durationDays} days
            </span>
          )}
          {variant.voiceMinutes && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              📞 {variant.voiceMinutes} min
            </span>
          )}
        </div>
      )}

      {/* Validation requirements */}
      {validations.length > 0 && (
        <div className="border-t pt-3 mt-3">
          <div className="text-xs font-medium text-gray-700 mb-2">Required Fields:</div>
          <div className="space-y-1">
            {validations.map((validation, index) => (
              <div key={index} className="flex items-center text-xs text-gray-600">
                <span className="w-2 h-2 bg-orange-400 rounded-full mr-2"></span>
                <span className="font-medium">{validation.type}:</span>
                <span className="ml-1">{validation.example}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Countries supported */}
      {variant.supportedCountries && variant.supportedCountries.length > 0 && (
        <div className="border-t pt-3 mt-3">
          <div className="text-xs font-medium text-gray-700 mb-1">Supported Countries:</div>
          <div className="flex flex-wrap gap-1">
            {variant.supportedCountries.slice(0, 5).map((country, index) => (
              <span 
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
              >
                {country}
              </span>
            ))}
            {variant.supportedCountries.length > 5 && (
              <span className="text-xs text-gray-500">
                +{variant.supportedCountries.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductCard