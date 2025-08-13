import React, { useState } from 'react'
import { 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Button, 
  Box, 
  Typography, 
  Grid, 
  Chip,
  FormHelperText,
  ButtonGroup,
  Paper
} from '@mui/material'
import { 
  Search as SearchIcon, 
  RestartAlt as ResetIcon 
} from '@mui/icons-material'

const ApiFilters = ({ onSubmit, loading }) => {
  const [filters, setFilters] = useState({
    country: '',
    type: '',
    brand: '',
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
    })
  }

  // Removed predefined scenarios

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Filters */}
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          id="country"
          name="country"
          label="Country Code"
          value={filters.country}
          onChange={handleChange}
          placeholder="e.g., US, MX, CA"
          fullWidth
          variant="outlined"
          size="small"
          helperText="ISO country code (2 letters)"
          disabled={loading}
        />

        <FormControl fullWidth size="small">
          <InputLabel id="product-type-label">Product Type</InputLabel>
          <Select
            labelId="product-type-label"
            id="type"
            name="type"
            value={filters.type}
            onChange={handleChange}
            label="Product Type"
            disabled={loading}
          >
            <MenuItem value="">All Types</MenuItem>
            <MenuItem value="esim">eSIM</MenuItem>
            <MenuItem value="gift_card">Gift Cards</MenuItem>
            <MenuItem value="topup">Mobile Top-ups</MenuItem>
          </Select>
          <FormHelperText>Filter by product category</FormHelperText>
        </FormControl>

        {/*<TextField
          id="brand"
          name="brand"
          label="Brand"
          value={filters.brand}
          onChange={handleChange}
          placeholder="e.g., llbean, att"
          fullWidth
          variant="outlined"
          size="small"
          helperText="Brand name or identifier"
          disabled={loading}
        />*/}

        <Grid container spacing={2}>
          {/*<Grid item xs={6}>
            <FormControl fullWidth size="small">
              <InputLabel id="page-size-label">Page Size</InputLabel>
              <Select
                labelId="page-size-label"
                id="pageSize"
                name="pageSize"
                value={filters.pageSize}
                onChange={handleChange}
                label="Page Size"
                disabled={loading}
              >
                <MenuItem value="5">5</MenuItem>
                <MenuItem value="10">10</MenuItem>
                <MenuItem value="20">20</MenuItem>
                <MenuItem value="50">50</MenuItem>
              </Select>
              <FormHelperText>Results per page</FormHelperText>
            </FormControl>
          </Grid>*/}

          {/*<Grid item xs={6}>
            <TextField
              id="pageNumber"
              name="pageNumber"
              label="Page"
              type="number"
              value={filters.pageNumber}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              size="small"
              inputProps={{ min: 1 }}
              helperText="Page number"
              disabled={loading}
            />
          </Grid>*/}
        </Grid>

        <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            fullWidth
            startIcon={<SearchIcon />}
          >
            {loading ? 'Loading...' : 'Search Products'}
          </Button>
          
          <Button
            type="button"
            variant="outlined"
            onClick={handleReset}
            disabled={loading}
            startIcon={<ResetIcon />}
          >
            Reset
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

export default ApiFilters