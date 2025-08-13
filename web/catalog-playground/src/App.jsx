import React, { useState } from 'react'
import ApiFilters from './components/ApiFilters'
import ProductResults from './components/ProductResults'
import Header from './components/Header'
import { Container, Grid, Paper, Typography, Box, CircularProgress, Alert, ThemeProvider, createTheme } from '@mui/material'

// Create a dark theme with red accent
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: 'rgb(85, 197, 166)',
    },
    secondary: {
      main: '#ffffff',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

const App = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [requestInfo, setRequestInfo] = useState({
    url: 'https://api.bando.cool/api/v1/products/grouped/',
    method: 'GET'
  })

  const handleApiRequest = async (filters) => {
    setLoading(true)
    setError(null)
    
    // Save filters for display purposes
    const requestDetails = { ...filters };
    
    // Build query parameters for GET request
    const params = new URLSearchParams()
    
    // Only add non-empty filters as query parameters
    if (filters.country) params.append('country', filters.country)
    if (filters.type) params.append('type', filters.type)
    if (filters.brand) params.append('brand', filters.brand)
    
    // Build the URL with query parameters
    const url = `https://api.bando.cool/api/v1/products/grouped/${params.toString() ? '?' + params.toString() : ''}`
    requestDetails.url = url;
    
    console.log('Sending GET request to:', url)
    console.log('Request details:', requestDetails)
    
    try {
      // Send GET request with query parameters to Bando API
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Bando-API-Playground/1.0'
        },
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'API request failed')
      }
      
      setProducts(data.products || [])
      
      // Set request info with our own filter details since the API might not return it
      setRequestInfo({
        ...requestDetails,
        responseInfo: data.requestInfo || {}
      })
    } catch (err) {
      setError(err.message)
      setProducts([])
      setRequestInfo(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary', pb: 8 }}>
        <Header />
        
        <Container maxWidth="xl" sx={{ pt: 4, px: { xs: 2, sm: 3, md: 4 } }}>
          <Grid container spacing={3} sx={{ display: 'flex', flexWrap: 'nowrap' }}>
            {/* Filters Panel */}
            <Grid item xs={12} md={4} lg={3} xl={3} sx={{ flexShrink: 0 }}>
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 3, 
                  borderLeft: 4, 
                  borderColor: 'primary.main',
                  borderRadius: 1,
                  position: 'sticky',
                  top: '2rem',
                  bgcolor: 'background.paper',
                  mr: 2
                }}
              >
                <Typography variant="h5" fontWeight="bold" mb={3}>
                  Filters
                </Typography>
                <ApiFilters onSubmit={handleApiRequest} loading={loading} />
              </Paper>
            </Grid>
            
            {/* Results Panel */}
            <Grid item xs={12} md={8} lg={9} xl={9} sx={{ flexGrow: 1 }}>
              <Box sx={{ width: '100%' }}>
                {loading && (
                  <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress color="primary" />
                  </Box>
                )}
                
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}
                
                {!loading && !error && products.length > 0 && (
                  <ProductResults 
                    products={products} 
                    requestInfo={requestInfo}
                  />
                )}
              </Box>
              
              {!loading && !error && products.length === 0 && requestInfo && (
                <Paper 
                  elevation={2} 
                  sx={{ 
                    p: 4, 
                    textAlign: 'center',
                    borderLeft: 4,
                    borderColor: 'primary.main',
                    borderRadius: 1
                  }}
                >
                  <Typography variant="body1" color="text.secondary">
                    No products found for the selected filters.
                  </Typography>
                </Paper>
              )}
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  )
}

export default App