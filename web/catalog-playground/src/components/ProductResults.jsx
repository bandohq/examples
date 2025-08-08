import React, { useState } from 'react'
import ProductCard from './ProductCard'
import { Paper, Typography, Box, Grid, Card, CardHeader, CardContent, IconButton, Collapse, Divider, Chip, Button } from '@mui/material'
import { Add as AddIcon, Remove as RemoveIcon, ArrowBack as BackIcon, Code as CodeIcon, Terminal as TerminalIcon } from '@mui/icons-material'

const ProductResults = ({ products, requestInfo }) => {
  const [expandedCategories, setExpandedCategories] = useState(new Set())
  const [selectedBrand, setSelectedBrand] = useState(null)
  const [devInfoExpanded, setDevInfoExpanded] = useState(false)

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }
  
  const toggleDevInfo = () => {
    setDevInfoExpanded(!devInfoExpanded)
  }
  
  const viewBrand = (productType, brand, typeIndex, brandIndex) => {
    setSelectedBrand({ productType, brand, typeIndex, brandIndex })
  }
  
  const backToGrid = () => {
    setSelectedBrand(null)
  }

  const totalBrands = products.reduce((sum, productType) => 
    sum + (productType.brands?.length || 0), 0
  )

  const totalVariants = products.reduce((sum, productType) => 
    sum + (productType.brands?.reduce((brandSum, brand) => 
      brandSum + (brand.variants?.length || 0), 0
    ) || 0), 0
  )

  const generateCurlCommand = () => {
    if (!requestInfo) return '# No request information available'
    
    // If the URL is already in requestInfo, use it directly
    if (requestInfo.url) {
      return `curl -X GET "${requestInfo.url}" \
  -H "Accept: application/json" \
  -H "User-Agent: Bando-API-Playground/1.0"`
    }
    
    // Otherwise build it from parameters
    const baseUrl = 'https://api.bando.cool/api/v1/products/grouped/'
    
    // Build query parameters from requestInfo
    const params = new URLSearchParams()
    
    // Add all filter parameters that were used in the request
    if (requestInfo.country) params.append('country', requestInfo.country)
    if (requestInfo.type) params.append('type', requestInfo.type)
    if (requestInfo.brand) params.append('brand', requestInfo.brand)
    if (requestInfo.pageSize) params.append('pageSize', requestInfo.pageSize)
    if (requestInfo.pageNumber) params.append('pageNumber', requestInfo.pageNumber)
    if (requestInfo.productType) params.append('productType', requestInfo.productType)
    if (requestInfo.status) params.append('status', requestInfo.status)
    
    const urlWithParams = `${baseUrl}${params.toString() ? '?' + params.toString() : ''}`
    
    return `curl -X GET "${urlWithParams}" \
  -H "Accept: application/json" \
  -H "User-Agent: Bando-API-Playground/1.0"`
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
      {/* Brand Detail View */}
      {selectedBrand && (
        <Box>
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={backToGrid}
            sx={{ mb: 2 }}
          >
            Back to All Products
          </Button>
          
          <Paper elevation={2} sx={{ p: 3, borderLeft: 4, borderColor: 'primary.main' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                {selectedBrand.brand.imageUrl ? (
                  <Box 
                    component="img" 
                    src={selectedBrand.brand.imageUrl} 
                    alt={selectedBrand.brand.brandName}
                    sx={{ 
                      width: 40, 
                      height: 40, 
                      objectFit: 'contain',
                      mr: 2
                    }}
                    onError={(e) => {e.target.style.display = 'none'}}
                  />
                ) : (
                  <Box 
                    sx={{ 
                      height: 40, 
                      width: 40, 
                      bgcolor: 'background.default', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: 'primary.main',
                      fontWeight: 'bold',
                      mr: 2
                    }}
                  >
                    {selectedBrand.brand.brandName.charAt(0)}
                  </Box>
                )}
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {selectedBrand.brand.brandName}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    {selectedBrand.productType.productType} · {selectedBrand.brand.variants?.length || 0} products
                  </Typography>
                </Box>
              </Box>
            </Box>    
            
            <Grid container spacing={2}>
              {selectedBrand.brand.variants?.map((variant, variantIndex) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={variantIndex}>
                  <ProductCard variant={variant} />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Box>
      )}
      {/* Developer Information Panel */}
      <Paper 
        elevation={3} 
        sx={{
          mb: 2, 
          borderTop: 4, 
          borderColor: 'primary.main',
          position: 'relative',
          overflow: 'hidden',
          p: 0
        }}
      >
        <Box sx={{ 
          position: 'relative',
          bgcolor: 'primary.main', 
          color: 'white',
          px: 2,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          '&:hover': { bgcolor: 'primary.dark' }
        }} onClick={toggleDevInfo}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TerminalIcon fontSize="small" />
            <Typography variant="caption" fontWeight="medium" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Developer Panel
            </Typography>
          </Box>
          <IconButton 
            size="small" 
            sx={{ color: 'white', p: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              toggleDevInfo();
            }}
          >
            {devInfoExpanded ? <RemoveIcon fontSize="small" /> : <AddIcon fontSize="small" />}
          </IconButton>
        </Box>
        
        {/* Content only visible when expanded */}
        <Collapse in={devInfoExpanded} timeout="auto">
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
              API Results
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center', borderBottom: 2, borderColor: 'primary.main', p: 2 }}>
                  <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>{products.length}</Typography>
                  <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1, color: 'text.secondary' }}>Product Types</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center', borderBottom: 2, borderColor: 'secondary.main', p: 2 }}>
                  <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>{totalBrands}</Typography>
                  <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1, color: 'text.secondary' }}>Brands</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center', borderBottom: 2, borderColor: 'success.main', p: 2 }}>
                  <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>{totalVariants}</Typography>
                  <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1, color: 'text.secondary' }}>Products</Typography>
                </Box>
              </Grid>
            </Grid>
            
            {/* API curl command section */}
            <Divider sx={{ my: 3 }} />
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <CodeIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" fontWeight="bold">
                  API Request (curl)
                </Typography>
              </Box>
              
              <Typography 
                component="p"
                sx={{
                  p: 2,
                  borderRadius: 1,
                  bgcolor: '#282c34',
                  color: '#abb2bf',
                  overflow: 'auto',
                  fontSize: '0.75rem',
                  fontFamily: '\"Roboto Mono\", monospace',
                  my: 0,
                  wordWrap: 'break-word',
                  wordBreak: 'break-word',
                  overflowX: 'auto'
                }}
              >
                {generateCurlCommand()}
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={() => navigator.clipboard.writeText(generateCurlCommand())}
                >
                  Copy to Clipboard
                </Button>
              </Box>
            </Box>
          </Box>
        </Collapse>
      </Paper>

      {/* Product Types - Horizontal Layout */}
      {!selectedBrand && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {products.map((productType, typeIndex) => (
            <Paper 
              key={typeIndex}
              elevation={2} 
              sx={{ overflow: 'hidden', width: '100%' }}
            >
              <Box 
                sx={{
                  px: 3, 
                  py: 2, 
                  borderLeft: 4, 
                  borderColor: 'primary.main',
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                  transition: 'background-color 0.2s'
                }}
                onClick={() => toggleCategory(`category-${typeIndex}`)}
              >
                <Box>
                  <Typography variant="h6" fontWeight="bold" sx={{ textTransform: 'uppercase' }}>
                    {productType.productType}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {productType.brands?.length || 0} brands available
                  </Typography>
                </Box>
                <IconButton 
                  aria-expanded={expandedCategories.has(`category-${typeIndex}`)} 
                  aria-label="show more"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCategory(`category-${typeIndex}`);
                  }}
                >
                  {expandedCategories.has(`category-${typeIndex}`) ? 
                    <RemoveIcon /> : 
                    <AddIcon />}
                </IconButton>
              </Box>

              <Collapse in={expandedCategories.has(`category-${typeIndex}`)} timeout="auto" unmountOnExit>
                <Box sx={{ p: 3 }}>
                  <Divider sx={{ mb: 3 }} />
                  <Grid container spacing={2}>
                    {productType.brands?.map((brand, brandIndex) => (
                      <Grid item xs={12} sm={6} md={6} key={brandIndex}>
                        <Card variant="outlined" sx={{ bgcolor: 'background.paper', height: '100%' }}>
                          <CardHeader
                            sx={{ 
                              bgcolor: 'background.default', 
                              cursor: 'pointer',
                              '&:hover': { bgcolor: 'action.hover' },
                              transition: 'background-color 0.2s'
                            }}
                            onClick={() => viewBrand(productType, brand, typeIndex, brandIndex)}
                            avatar={
                              brand.imageUrl ? (
                                <Box 
                                  sx={{ 
                                    height: 40, 
                                    width: 40, 
                                    bgcolor: 'background.default', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center' 
                                  }}
                                >
                                  <Box 
                                    component="img" 
                                    src={brand.imageUrl} 
                                    alt={brand.brandName}
                                    sx={{ 
                                      width: 32, 
                                      height: 32, 
                                      objectFit: 'contain'
                                    }}
                                    onError={(e) => {
                                      e.target.style.display = 'none'
                                    }}
                                  />
                                </Box>
                              ) : (
                                <Box 
                                  sx={{ 
                                    height: 40, 
                                    width: 40, 
                                    bgcolor: 'background.default', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    color: 'primary.main',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  {brand.brandName.charAt(0)}
                                </Box>
                              )
                            }
                            title={brand.brandName}
                            titleTypographyProps={{ fontWeight: 'bold' }}
                            subheader={`${brand.variants?.length || 0} products`}
                            subheaderTypographyProps={{ variant: 'caption' }}
                          />

                          <CardContent sx={{ p: 2 }}>
                            <Button
                              size="small" 
                              variant="outlined"
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                viewBrand(productType, brand, typeIndex, brandIndex);
                              }}
                              sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                            >
                              View Products
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Collapse>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  )
}

export default ProductResults