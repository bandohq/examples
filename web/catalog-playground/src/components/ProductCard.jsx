import React from 'react'
import { Card, CardContent, Typography, Box, Chip, Divider, Grid } from '@mui/material'

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
        required: true
      })
    }
    
    if (requiredFields && requiredFields.length > 0) {
      requiredFields.forEach(field => {
        validations.push({
          type: field.name,
          format: field.valueType || 'string',
          required: true
        })
      })
    }
    
    return validations
  }

  const validations = formatValidation(variant.referenceType, variant.requiredFields)
  
  // Extract product name and description from variant data
  const productName = variant.name || variant.productName
  const productDescription = variant.description || variant.productDescription

  return (
    <Card 
      variant="outlined" 
      sx={{
        borderLeft: 2, 
        borderColor: 'primary.main', 
        transition: 'all 0.3s ease', 
        '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 },
        height: '100%'
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              {productName || variant.shortNotes || variant.notes || `Product ${variant.sku?.slice(-8)}`}
            </Typography>
            {(productDescription || (variant.notes && variant.notes !== variant.shortNotes)) && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {productDescription || variant.notes}
              </Typography>
            )}
          </Box>
        </Box>

      {/* eSIM specific details */}
      {variant.dataGB && (
        <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
          <Chip size="small" label={`${variant.dataGB}GB`} color="primary" variant="outlined" />
          {variant.days && <Chip size="small" label={`${variant.days} days`} color="secondary" variant="outlined" />}
        </Box>
      )}

      {/* Price / SKU */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" color="primary" fontWeight="bold">
          ${formatPrice(variant.price)}
        </Typography>
        <Chip 
          label={variant.sku} 
          size="small" 
          variant="outlined" 
          color="default" 
          sx={{ bgcolor: 'background.default', fontSize: '0.6rem' }}
        />
      </Box>

      {/* Validations */}
      {validations.length > 0 && (
        <Box mb={2}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.5 }}>
            Required Fields
          </Typography>
          <Box display="flex" flexDirection="column" gap={1}>
            {validations.map((v, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  label={v.type} 
                  size="small" 
                  color="error" 
                  sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}
                />
                <Typography variant="caption" color="text.secondary">
                  <Box component="span" sx={{ bgcolor: 'grey.100', px: 0.5, py: 0.2, borderRadius: 0.5, fontFamily: 'monospace' }}>
                    {v.format}
                  </Box>
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Countries */}
      {(variant.countries && variant.countries.length > 0) && (
        <Box mb={2}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.5 }}>
            Available In
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={0.5}>
            {variant.countries.map((country, i) => (
              <Chip 
                key={i} 
                label={country} 
                size="small" 
                variant="outlined" 
                sx={{ fontSize: '0.6rem' }}
              />
            ))}
          </Box>
        </Box>
      )}
      
      {/* Fallback for countries_code */}
      {(!variant.countries || variant.countries.length === 0) && variant.countries_code && variant.countries_code.length > 0 && (
        <Box mb={2}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.5 }}>
            Available In
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={0.5}>
            {variant.countries_code.map((countryCode, i) => (
              <Chip 
                key={i} 
                label={countryCode} 
                size="small" 
                variant="outlined" 
                sx={{ fontSize: '0.6rem' }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Actions */}
      <Divider sx={{ my: 1.5 }} />
      <Box>
        {variant.status && (
          <Chip 
            label={variant.status} 
            size="small" 
            color={variant.status === 'active' ? 'success' : 'default'} 
            variant="outlined"
          />
        )}
      </Box>
    </CardContent>
  </Card>
  )
}

export default ProductCard