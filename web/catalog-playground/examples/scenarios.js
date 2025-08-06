const chalk = require('chalk');
const { formatProductResponse, displayHeader } = require('../utils/formatters');

/**
 * Predefined demonstration scenarios
 */
const scenarios = [
    {
        name: 'eSIM Products Overview',
        description: 'Showcase eSIM data packages and coverage options',
        filters: { type: 'esim', country: 'US', pageSize: 5 },
        expectedResults: 'eSIM products with data packages, duration, and phone validation'
    },
    {
        name: 'Gift Card Catalog',
        description: 'Demonstrate gift card brands and denominations',
        filters: { type: 'gift_card', pageSize: 5 },
        expectedResults: 'Gift cards with email delivery and recipient requirements'
    },
    {
        name: 'Mobile Top-ups by Country',
        description: 'Show country-specific mobile top-up options',
        filters: { type: 'topup', country: 'US', pageSize: 5 },
        expectedResults: 'Carrier-specific top-up products with phone validation'
    },
    {
        name: 'Brand-Specific Filtering',
        description: 'Filter products by specific brand (LLBean gift cards)',
        filters: { type: 'gift_card', brand: 'llbean', pageSize: 3 },
        expectedResults: 'LLBean gift cards in various denominations'
    },
    {
        name: 'International eSIM Options',
        description: 'Explore eSIM products for international travelers',
        filters: { type: 'esim', country: 'MX', pageSize: 3 },
        expectedResults: 'Mexico eSIM packages for travelers'
    },
    {
        name: 'Pagination Demonstration',
        description: 'Show how to handle paginated results',
        filters: { pageSize: 2, pageNumber: 1 },
        expectedResults: 'Limited results demonstrating pagination structure'
    },
    {
        name: 'Large Page Size Example',
        description: 'Retrieve more products in a single request',
        filters: { type: 'esim', pageSize: 10 },
        expectedResults: 'Larger set of eSIM products across different countries'
    },
    {
        name: 'Empty Filter Test',
        description: 'Test API response with minimal filters',
        filters: { pageSize: 1 },
        expectedResults: 'Single product showing complete response structure'
    }
];

/**
 * Run a single scenario
 */
async function runScenario(scenario, fetchFunction, index, total) {
    const scenarioNumber = `${index + 1}/${total}`;
    
    console.log(chalk.cyan(`\n${'='.repeat(80)}`));
    console.log(chalk.cyan(`📊 Scenario ${scenarioNumber}: ${scenario.name}`));
    console.log(chalk.cyan(`${'='.repeat(80)}`));
    
    console.log(chalk.yellow(`\n📝 Description:`));
    console.log(chalk.white(`   ${scenario.description}`));
    
    console.log(chalk.yellow(`\n🔍 Filters:`));
    Object.entries(scenario.filters).forEach(([key, value]) => {
        console.log(chalk.gray(`   ${key}: ${value}`));
    });
    
    console.log(chalk.yellow(`\n🎯 Expected Results:`));
    console.log(chalk.white(`   ${scenario.expectedResults}`));
    
    console.log(chalk.blue(`\n🚀 Executing request...`));
    
    try {
        const startTime = Date.now();
        const data = await fetchFunction(scenario.filters);
        const responseTime = Date.now() - startTime;
        
        console.log(chalk.green(`✅ Response received in ${responseTime}ms`));
        
        // Format and display response
        formatProductResponse(data, scenario.filters, true);
        
        // Add analysis
        analyzeScenarioResults(data, scenario);
        
    } catch (error) {
        console.log(chalk.red(`❌ Scenario failed: ${error.message}`));
        
        // Show suggestions for common errors
        if (error.message.includes('Rate limit')) {
            console.log(chalk.yellow(`💡 Suggestion: Wait 60 seconds before retrying or use an API token for higher limits`));
        } else if (error.message.includes('Unauthorized')) {
            console.log(chalk.yellow(`💡 Suggestion: Check your BANDO_API_TOKEN environment variable`));
        }
    }
}

/**
 * Analyze scenario results and provide insights
 */
function analyzeScenarioResults(data, scenario) {
    console.log(chalk.magenta(`\n📈 Analysis:`));
    
    if (!data.products || data.products.length === 0) {
        console.log(chalk.red(`   No products found with the specified filters`));
        return;
    }
    
    const totalProducts = data.products.length;
    console.log(chalk.gray(`   Product types found: ${totalProducts}`));
    
    // Analyze product types
    const productTypes = data.products.map(p => p.productType);
    const uniqueTypes = [...new Set(productTypes)];
    console.log(chalk.gray(`   Unique product types: ${uniqueTypes.join(', ')}`));
    
    // Count total variants
    let totalVariants = 0;
    let totalBrands = 0;
    
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
    
    console.log(chalk.gray(`   Total brands: ${totalBrands}`));
    console.log(chalk.gray(`   Total product variants: ${totalVariants}`));
    
    // Analyze validation requirements
    if (totalVariants > 0) {
        let phoneValidation = 0;
        let emailValidation = 0;
        let requiredFields = 0;
        
        data.products.forEach(product => {
            product.brands?.forEach(brand => {
                brand.variants?.forEach(variant => {
                    if (variant.referenceType?.name === 'phone') phoneValidation++;
                    if (variant.referenceType?.name === 'email') emailValidation++;
                    if (variant.requiredFields?.length > 0) requiredFields++;
                });
            });
        });
        
        console.log(chalk.gray(`   Phone validation required: ${phoneValidation} variants`));
        console.log(chalk.gray(`   Email validation required: ${emailValidation} variants`));
        console.log(chalk.gray(`   Additional fields required: ${requiredFields} variants`));
    }
    
    // Scenario-specific insights
    switch (scenario.name) {
        case 'eSIM Products Overview':
            analyzeEsimProducts(data);
            break;
        case 'Gift Card Catalog':
            analyzeGiftCardProducts(data);
            break;
        case 'Mobile Top-ups by Country':
            analyzeTopupProducts(data);
            break;
        default:
            break;
    }
}

/**
 * Analyze eSIM-specific data
 */
function analyzeEsimProducts(data) {
    console.log(chalk.blue(`\n🌐 eSIM Analysis:`));
    
    const esimProducts = data.products.filter(p => p.productType === 'esim');
    if (esimProducts.length === 0) return;
    
    let dataPackages = [];
    let durations = [];
    
    esimProducts.forEach(product => {
        product.brands?.forEach(brand => {
            brand.variants?.forEach(variant => {
                const notes = variant.shortNotes || variant.notes || '';
                
                // Extract data amount
                const dataMatch = notes.match(/(\d+)\s*(GB|MB)/i);
                if (dataMatch) {
                    dataPackages.push(`${dataMatch[1]} ${dataMatch[2].toUpperCase()}`);
                }
                
                // Extract duration
                const durationMatch = notes.match(/(\d+)\s*(day|days|month|months)/i);
                if (durationMatch) {
                    durations.push(`${durationMatch[1]} ${durationMatch[2].toLowerCase()}`);
                }
            });
        });
    });
    
    if (dataPackages.length > 0) {
        const uniqueData = [...new Set(dataPackages)];
        console.log(chalk.gray(`   Data packages: ${uniqueData.slice(0, 5).join(', ')}${uniqueData.length > 5 ? '...' : ''}`));
    }
    
    if (durations.length > 0) {
        const uniqueDurations = [...new Set(durations)];
        console.log(chalk.gray(`   Durations: ${uniqueDurations.slice(0, 3).join(', ')}${uniqueDurations.length > 3 ? '...' : ''}`));
    }
}

/**
 * Analyze gift card-specific data
 */
function analyzeGiftCardProducts(data) {
    console.log(chalk.blue(`\n🎁 Gift Card Analysis:`));
    
    const giftCardProducts = data.products.filter(p => p.productType === 'gift_card');
    if (giftCardProducts.length === 0) return;
    
    let denominations = [];
    let brands = [];
    
    giftCardProducts.forEach(product => {
        product.brands?.forEach(brand => {
            brands.push(brand.brandName);
            
            brand.variants?.forEach(variant => {
                if (variant.price?.fiatValue) {
                    const amount = parseFloat(variant.price.fiatValue);
                    const currency = variant.price.fiatCurrency || 'USD';
                    denominations.push(`${currency} ${amount}`);
                }
            });
        });
    });
    
    const uniqueBrands = [...new Set(brands)];
    const uniqueDenominations = [...new Set(denominations)].sort();
    
    console.log(chalk.gray(`   Brands: ${uniqueBrands.slice(0, 3).join(', ')}${uniqueBrands.length > 3 ? '...' : ''}`));
    console.log(chalk.gray(`   Denominations: ${uniqueDenominations.slice(0, 5).join(', ')}${uniqueDenominations.length > 5 ? '...' : ''}`));
}

/**
 * Analyze top-up-specific data
 */
function analyzeTopupProducts(data) {
    console.log(chalk.blue(`\n📱 Top-up Analysis:`));
    
    const topupProducts = data.products.filter(p => p.productType === 'topup');
    if (topupProducts.length === 0) return;
    
    let carriers = [];
    let amounts = [];
    
    topupProducts.forEach(product => {
        product.brands?.forEach(brand => {
            // Extract carrier name from brand
            const carrierMatch = brand.brandName.match(/^([A-Z&T]+)/);
            if (carrierMatch) {
                carriers.push(carrierMatch[1]);
            }
            
            brand.variants?.forEach(variant => {
                if (variant.price?.fiatValue) {
                    const amount = parseFloat(variant.price.fiatValue);
                    amounts.push(amount);
                }
            });
        });
    });
    
    const uniqueCarriers = [...new Set(carriers)];
    const sortedAmounts = [...new Set(amounts)].sort((a, b) => a - b);
    
    console.log(chalk.gray(`   Carriers: ${uniqueCarriers.join(', ')}`));
    console.log(chalk.gray(`   Amount range: $${sortedAmounts[0]} - $${sortedAmounts[sortedAmounts.length - 1]}`));
}

/**
 * Run all demonstration scenarios
 */
async function runScenarios(fetchFunction) {
    displayHeader('🎪 Bando API Demonstration Scenarios');
    
    console.log(chalk.yellow(`Running ${scenarios.length} demonstration scenarios...`));
    console.log(chalk.gray(`Each scenario showcases different aspects of the products/grouped endpoint\n`));
    
    for (let i = 0; i < scenarios.length; i++) {
        await runScenario(scenarios[i], fetchFunction, i, scenarios.length);
        
        // Add delay between scenarios to avoid rate limiting
        if (i < scenarios.length - 1) {
            console.log(chalk.gray(`\n⏱️  Waiting 2 seconds before next scenario...`));
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    console.log(chalk.green(`\n✅ All ${scenarios.length} scenarios completed!`));
    console.log(chalk.cyan(`\n📚 Integration Tips:`));
    console.log(chalk.white(`   • Use caching to improve performance`));
    console.log(chalk.white(`   • Validate input fields before API calls`));
    console.log(chalk.white(`   • Implement proper error handling`));
    console.log(chalk.white(`   • Consider pagination for large result sets`));
    console.log(chalk.white(`   • Test with different filter combinations`));
}

module.exports = {
    runScenarios,
    scenarios
};
