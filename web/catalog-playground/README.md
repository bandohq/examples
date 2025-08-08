# Bando Catalog Explorer

A comprehensive web application showcasing the Bando API `products/grouped/` endpoint with various filters and practical integration examples. This script serves as a complement to the API documentation at docs.bando.cool, providing hands-on examples for developers integrating with the Bando platform.

## 🚀 Status

✅ **FULLY FUNCTIONAL** - Successfully connecting to the Bando API and retrieving real product data!

- **2000+ eSIM variants** with data packages, coverage, and pricing
- **20+ gift card brands** including Xbox Game Pass, Airbnb, Uber, Amazon
- **Complete validation requirements** and field specifications
- **Multiple currencies** (USD, MXN) and international coverage

## 🚀 Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Run the application:**
```bash
npx vite
```

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

### Validation Requirements

Different product types have specific validation requirements:

- **eSIM & Top-up**: Phone number validation
- **Gift Cards**: Email address validation + recipient details
- **All Products**: Various required fields based on product type


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
