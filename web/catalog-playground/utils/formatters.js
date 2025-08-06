const chalk = require('chalk');

/**
 * Display a formatted header
 */
function displayHeader(title) {
    const border = '='.repeat(title.length + 4);
    console.log(chalk.cyan(`\n${border}`));
    console.log(chalk.cyan(`  ${title}  `));
    console.log(chalk.cyan(`${border}\n`));
}

/**
 * Format and display API error
 */
function formatError(error) {
    console.log(chalk.red(`Error: ${error.message}`));
    
    // Provide helpful suggestions based on error type
    if (error.message.includes('Rate limit')) {
        console.log(chalk.yellow(`\n💡 Rate Limiting Help:`));
        console.log(chalk.white(`   • Wait 60 seconds before making more requests`));
        console.log(chalk.white(`   • Get an API token for higher limits (email api@bando.cool)`));
        console.log(chalk.white(`   • Current limit: 10 requests/minute (public), 100/minute (authenticated)`));
    } else if (error.message.includes('Unauthorized') || error.message.includes('Invalid')) {
        console.log(chalk.yellow(`\n🔐 Authentication Help:`));
        console.log(chalk.white(`   • Check your BANDO_API_TOKEN environment variable`));
        console.log(chalk.white(`   • Ensure the token is valid and not expired`));
        console.log(chalk.white(`   • Contact api@bando.cool for a new token`));
    } else if (error.message.includes('Network') || error.message.includes('timeout')) {
        console.log(chalk.yellow(`\n🌐 Network Help:`));
        console.log(chalk.white(`   • Check your internet connection`));
        console.log(chalk.white(`   • Try again in a few minutes`));
        console.log(chalk.white(`   • Consider increasing timeout if on slow connection`));
    }
}

/**
 * Format validation requirements for display
 */
function formatValidationRequirements(referenceType, requiredFields) {
    const validationInfo = [];
    
    if (referenceType) {
        const { name, regex } = referenceType;
        validationInfo.push(`${chalk.blue(name)} validation required`);
        
        // Show user-friendly regex explanation
        if (name === 'phone') {
            validationInfo.push(`Format: International or domestic phone number`);
            validationInfo.push(`Examples: +1-555-123-4567, (555) 123-4567, 555.123.4567`);
        } else if (name === 'email') {
            validationInfo.push(`Format: Valid email address`);
            validationInfo.push(`Example: user@example.com`);
        }
        
        if (regex) {
            validationInfo.push(`Regex: ${chalk.gray(regex)}`);
        }
    }
    
    if (requiredFields && requiredFields.length > 0) {
        validationInfo.push(`Additional fields: ${requiredFields.map(f => chalk.cyan(f.name)).join(', ')}`);
    }
    
    return validationInfo;
}

/**
 * Format product variant for display
 */
function formatVariant(variant, index) {
    console.log(chalk.yellow(`    Variant ${index + 1}:`));
    console.log(chalk.white(`      SKU: ${variant.sku}`));
    
    if (variant.shortNotes) {
        console.log(chalk.white(`      Description: ${variant.shortNotes}`));
    }
    
    if (variant.notes && variant.notes !== variant.shortNotes) {
        console.log(chalk.white(`      Details: ${variant.notes}`));
    }
    
    if (variant.price) {
        const { fiatCurrency, fiatValue } = variant.price;
        console.log(chalk.green(`      Price: ${fiatCurrency} ${fiatValue}`));
    }
    
    // Display validation requirements
    const validation = formatValidationRequirements(variant.referenceType, variant.requiredFields);
    if (validation.length > 0) {
        console.log(chalk.blue(`      Validation:`));
        validation.forEach(req => {
            console.log(chalk.gray(`        • ${req}`));
        });
    }
}

/**
 * Format brand information for display
 */
function formatBrand(brand, brandIndex) {
    console.log(chalk.cyan(`  Brand ${brandIndex + 1}: ${brand.brandName}`));
    console.log(chalk.gray(`    Slug: ${brand.brandSlug}`));
    
    if (brand.imageUrl) {
        console.log(chalk.gray(`    Logo: ${brand.imageUrl}`));
    }
    
    if (brand.order !== undefined) {
        console.log(chalk.gray(`    Display Order: ${brand.order}`));
    }
    
    if (brand.variants && brand.variants.length > 0) {
        console.log(chalk.white(`    Variants (${brand.variants.length}):`));
        brand.variants.forEach((variant, variantIndex) => {
            formatVariant(variant, variantIndex);
            if (variantIndex < brand.variants.length - 1) {
                console.log(''); // Space between variants
            }
        });
    } else {
        console.log(chalk.red(`    No variants available`));
    }
}

/**
 * Format complete product response
 */
function formatProductResponse(data, filters = {}, isScenario = false) {
    if (!isScenario) {
        displayHeader('📊 Bando API Response');
        
        // Display request summary
        console.log(chalk.yellow('🔍 Request Filters:'));
        if (Object.keys(filters).length === 0) {
            console.log(chalk.gray('   No filters applied'));
        } else {
            Object.entries(filters).forEach(([key, value]) => {
                console.log(chalk.gray(`   ${key}: ${value}`));
            });
        }
        console.log('');
    }
    
    if (!data || !data.products) {
        console.log(chalk.red('❌ No data received or invalid response format'));
        return;
    }
    
    if (data.products.length === 0) {
        console.log(chalk.yellow('📭 No products found matching the specified filters'));
        console.log(chalk.gray('\n💡 Try adjusting your filters:'));
        console.log(chalk.gray('   • Remove or change country filter'));
        console.log(chalk.gray('   • Try different product types (esim, topup, gift_card)'));
        console.log(chalk.gray('   • Check brand name spelling'));
        return;
    }
    
    console.log(chalk.green(`✅ Found ${data.products.length} product type(s)\n`));
    
    // Display each product type
    data.products.forEach((product, productIndex) => {
        console.log(chalk.magenta(`Product Type ${productIndex + 1}: ${product.productType.toUpperCase()}`));
        
        if (product.brands && product.brands.length > 0) {
            console.log(chalk.white(`  Brands (${product.brands.length}):`));
            product.brands.forEach((brand, brandIndex) => {
                formatBrand(brand, brandIndex);
                if (brandIndex < product.brands.length - 1) {
                    console.log(''); // Space between brands
                }
            });
        } else {
            console.log(chalk.red(`  No brands available for this product type`));
        }
        
        if (productIndex < data.products.length - 1) {
            console.log(chalk.gray('\n' + '-'.repeat(80) + '\n'));
        }
    });
    
    // Display summary statistics
    let totalBrands = 0;
    let totalVariants = 0;
    
    data.products.forEach(product => {
        if (product.brands) {
            totalBrands += product.brands.length;
            product.brands.forEach(brand => {
                if (brand.variants) {
                    totalVariants += brand.variants.length;
                }
            });
        }
    });
    
    console.log(chalk.cyan(`\n📈 Summary:`));
    console.log(chalk.white(`   Product Types: ${data.products.length}`));
    console.log(chalk.white(`   Total Brands: ${totalBrands}`));
    console.log(chalk.white(`   Total Variants: ${totalVariants}`));
    
    // Show integration examples
    if (!isScenario && totalVariants > 0) {
        console.log(chalk.cyan(`\n🔗 Integration Examples:`));
        
        // Find first variant with each validation type
        const phoneExample = findExampleByValidation(data, 'phone');
        const emailExample = findExampleByValidation(data, 'email');
        
        if (phoneExample) {
            console.log(chalk.yellow(`\n   Phone Validation Example (${phoneExample.type}):`));
            console.log(chalk.gray(`   SKU: ${phoneExample.sku}`));
            console.log(chalk.gray(`   Validation: ${phoneExample.validation.regex}`));
            console.log(chalk.gray(`   Valid formats: +1-555-123-4567, (555) 123-4567`));
        }
        
        if (emailExample) {
            console.log(chalk.yellow(`\n   Email Validation Example (${emailExample.type}):`));
            console.log(chalk.gray(`   SKU: ${emailExample.sku}`));
            console.log(chalk.gray(`   Validation: ${emailExample.validation.regex}`));
            console.log(chalk.gray(`   Valid format: user@example.com`));
        }
    }
}

/**
 * Find example variant by validation type
 */
function findExampleByValidation(data, validationType) {
    for (const product of data.products) {
        if (product.brands) {
            for (const brand of product.brands) {
                if (brand.variants) {
                    for (const variant of brand.variants) {
                        if (variant.referenceType?.name === validationType) {
                            return {
                                type: product.productType,
                                sku: variant.sku,
                                validation: variant.referenceType
                            };
                        }
                    }
                }
            }
        }
    }
    return null;
}

/**
 * Format JSON for copying to documentation
 */
function formatForDocumentation(data, title = 'API Response Example') {
    console.log(chalk.cyan(`\n📋 ${title} (for documentation):`));
    console.log(chalk.gray('```json'));
    console.log(JSON.stringify(data, null, 2));
    console.log(chalk.gray('```'));
}

module.exports = {
    displayHeader,
    formatError,
    formatProductResponse,
    formatForDocumentation,
    formatValidationRequirements
};
