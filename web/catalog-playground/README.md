# Bando API Products Demo

A comprehensive Node.js demonstration script showcasing the Bando API `products/grouped/` endpoint with various filters and practical integration examples. This script serves as a complement to the API documentation at docs.bando.cool, providing hands-on examples for developers integrating with the Bando platform.

## 🚀 Status

✅ **FULLY FUNCTIONAL** - Successfully connecting to the Bando API and retrieving real product data!

The script now showcases thousands of real products including:
- **2000+ eSIM variants** with data packages, coverage, and pricing
- **20+ gift card brands** including Xbox Game Pass, Airbnb, Uber, Amazon
- **Complete validation requirements** and field specifications
- **Multiple currencies** (USD, MXN) and international coverage

## ✨ Features

- **Multiple Interface Options**: Command-line arguments, interactive mode, and predefined scenarios
- **Comprehensive Filtering**: Filter by country, product type, brand, and more
- **Smart Caching**: Automatic response caching with configurable TTL
- **Rate Limiting**: Built-in rate limiting with support for authenticated vs public access
- **Rich Output**: Color-coded, formatted output with detailed product information
- **Error Handling**: Comprehensive error handling with helpful suggestions
- **Integration Examples**: Real-world scenarios demonstrating API usage patterns

## 🚀 Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Run demonstration scenarios:**
```bash
node bando-api-demo.js --scenarios
```

3. **Test API connectivity:**
```bash
node bando-api-demo.js --test-connection
```

4. **Interactive mode:**
```bash
node bando-api-demo.js --interactive
```

## 📋 Usage Options

### Command Line Arguments

```bash
# Filter by specific criteria
node bando-api-demo.js --country US --type esim --pageSize 5

# Brand-specific filtering
node bando-api-demo.js --type gift_card --brand llbean

# Pagination example
node bando-api-demo.js --pageSize 10 --pageNumber 2

# Verbose output
node bando-api-demo.js --country MX --type topup --verbose
```

### Available Options

| Option | Alias | Description | Example |
|--------|-------|-------------|---------|
| `--country` | `-c` | Filter by country code | `US`, `MX`, `CA` |
| `--type` | `-t` | Product type filter | `esim`, `topup`, `gift_card` |
| `--brand` | `-b` | Brand name filter | `llbean`, `att` |
| `--subType` | `-s` | Product subtype filter | Various subtypes |
| `--pageSize` | `-p` | Items per page | `10` (default) |
| `--pageNumber` | `-n` | Page number | `1` (default) |
| `--interactive` | `-i` | Interactive mode | - |
| `--scenarios` | `--demo` | Run demo scenarios | - |
| `--test-connection` | - | Test API endpoints | - |
| `--auth-test` | - | Test authentication | - |
| `--clear-cache` | - | Clear response cache | - |
| `--verbose` | `-v` | Verbose output | - |

### Demonstration Scenarios

The script includes 8 predefined scenarios that showcase different aspects of the API:

1. **eSIM Products Overview** - Data packages and coverage options
2. **Gift Card Catalog** - Brand selection and denominations  
3. **Mobile Top-ups by Country** - Carrier-specific options
4. **Brand-Specific Filtering** - Focus on specific brands
5. **International eSIM Options** - Travel-focused products
6. **Pagination Demonstration** - Handling large result sets
7. **Large Page Size Example** - Bulk data retrieval
8. **Empty Filter Test** - Minimal filtering patterns

## 🔧 Configuration

### Environment Variables

While not required, you can set these environment variables for enhanced functionality:

- `BANDO_API_TOKEN` - Your API token for higher rate limits (contact api@bando.cool)
- `BANDO_API_BASE` - API base URL (default: https://api.bando.cool)
- `CACHE_TTL_MS` - Cache duration in milliseconds (default: 300000)

### Rate Limits

- **Public Access**: 10 requests per minute
- **Authenticated Access**: 100 requests per minute (with API token)

## 📊 Product Types & Filters

Based on the Bando API documentation, the following product types and filters are supported:

### Product Types
- `esim` - eSIM data packages with coverage details
- `gift_card` - Prepaid gift cards from various brands  
- `topup` - Mobile carrier top-up options

### Common Filters
- **Country**: `US`, `MX`, `CA`, etc.
- **Brand**: `llbean`, `att`, specific brand identifiers
- **Page Size**: 1-50 items per page
- **Page Number**: For pagination through large result sets

### Validation Requirements

Different product types have specific validation requirements:

- **eSIM & Top-up**: Phone number validation
- **Gift Cards**: Email address validation + recipient details
- **All Products**: Various required fields based on product type

## 🛠️ Integration Examples

### Basic API Call
```javascript
const response = await fetchProducts({
    type: 'esim',
    country: 'US', 
    pageSize: 10
});
```

### Error Handling
```javascript
try {
    const products = await fetchProducts(filters);
    // Process products
} catch (error) {
    if (error.message.includes('Rate limit')) {
        // Handle rate limiting
    } else if (error.message.includes('Unauthorized')) {
        // Handle authentication issues
    }
}
```

### Caching Implementation
The script includes built-in caching with configurable TTL:
```javascript
const cache = new CacheManager(300000); // 5 minutes
const cachedData = cache.get(cacheKey);
```

## 🔍 API Response Structure

### Product Response Format
```json
{
  "products": [
    {
      "productType": "esim",
      "brands": [
        {
          "brandName": "eSIM Provider",
          "brandSlug": "esim-provider",
          "imageUrl": "https://...",
          "order": 10000,
          "variants": [
            {
              "sku": "unique-sku-id",
              "shortNotes": "eSIM 30 Days, 50 GB",
              "notes": "Detailed coverage information",
              "price": {
                "fiatCurrency": "USD",
                "fiatValue": "62.00"
              },
              "referenceType": {
                "name": "phone",
                "valueType": "string",
                "regex": "validation-pattern"
              },
              "requiredFields": [...]
            }
          ]
        }
      ]
    }
  ]
}
```

## 🚨 Troubleshooting

### Common Issues

**404 Endpoint Not Found**
- The API endpoint structure may have changed
- Contact api@bando.cool for current documentation
- Try the connection test: `node bando-api-demo.js --test-connection`

**Rate Limit Exceeded**
- Wait 60 seconds before retrying
- Consider getting an API token for higher limits
- Use caching to reduce API calls

**Authentication Issues**
- Verify your API token is correctly set
- Check token expiration with: `node bando-api-demo.js --auth-test`
- Contact api@bando.cool for new credentials

### Debug Mode
```bash
node bando-api-demo.js --verbose --type esim --country US
```

## 📞 Support & Documentation

- **API Documentation**: [docs.bando.cool](https://docs.bando.cool)
- **Get API Token**: Email api@bando.cool
- **Issues**: Contact Bando support team

## 📝 Development Notes

This demonstration script was created to complement the official Bando API documentation and provide practical integration examples for developers. It showcases:

- Real-world API integration patterns
- Error handling best practices  
- Rate limiting implementation
- Response caching strategies
- Input validation examples
- Comprehensive filtering options

The script serves as both a learning tool and a starting point for integration projects.
