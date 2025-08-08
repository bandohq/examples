import React from 'react'
import { AppBar, Toolbar, Typography, Container, Box, Chip, Button, Link } from '@mui/material'
import { GitHub as GitHubIcon, Api as ApiIcon, ArrowOutward as ArrowOutwardIcon } from '@mui/icons-material'
import bandoLogo from '../../bando-logo-white.svg'

const Header = () => {
  return (
    <AppBar position="static" color="transparent" elevation={0} sx={{ 
      borderBottom: 1, 
      borderColor: 'divider',
      bgcolor: 'background.paper',
      mb: 3
    }}>
      <Container maxWidth="xl">
        <Toolbar sx={{ py: 2 }}>
          <Box sx={{ flexGrow: 1}}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <img style={{ width: '100px', height: 'auto' }} src={bandoLogo} alt="Bando Logo" width="100" height="auto" />
              <Typography variant="h5" component="h5" fontWeight="bold" color="text.primary">
                Catalog Explorer
              </Typography>
            </Box>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 0.5 }}>
              Explore products, eSIMs, and gift cards through the Bando API
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button 
              href="https://github.com/bandohq/examples/tree/main/web/catalog-playground"
              target="_blank"
              rel="noopener noreferrer"
              color="primary" 
              size="small" 
              variant='outlined'
              sx={{ display: 'flex', alignItems: 'center', gap: 1, textTransform: 'none' }}
            >
              Source Code
              <GitHubIcon fontSize="small" />
            </Button>
            <Button 
              href="https://docs.bando.cool"
              target="_blank"
              rel="noopener noreferrer"
              variant="outlined"
              color="primary"
              size="small"
              endIcon={<ArrowOutwardIcon fontSize="small" />}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, textTransform: 'none' }}
            >
              API Docs
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  )
}

export default Header