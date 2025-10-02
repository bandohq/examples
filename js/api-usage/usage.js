import ora from 'ora';
import { rawlist, password } from '@inquirer/prompts';
import { privateKeyToAccount } from 'viem/accounts';
import { createPublicClient, createWalletClient, defineChain, http, hexToBigInt } from 'viem';


const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [{ "name": "_owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "balance", "type": "uint256" }],
    "type": "function",
    "stateMutability": "view"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "name": "", "type": "uint8" }],
    "type": "function",
    "stateMutability": "view"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{ "name": "", "type": "string" }],
    "type": "function",
    "stateMutability": "view"
  }
];


function pickRepresentative(arr, count = 10) {
  const sorted = [...arr].sort((a, b) => parseFloat(a.name) - parseFloat(b.name));
  const step = Math.floor(sorted.length / count);
  return Array.from({ length: count }, (_, i) => sorted[i * step]);
}


const environment = await rawlist({
  message: 'Select Bando\'s environment',
  choices: [
    { name: 'Develoment - Sandbox', value: 'https://apidev.bando.cool/api/v1' },
    { name: 'Production - Live', value: 'https://api.bando.cool/api/v1' },
  ],
});

let spinner = ora("Getting countries...").start();
const countryEndpoint = `${environment}/countries/`
const responseCountries = await fetch(countryEndpoint);
const responseCountriesJson = await responseCountries.json();

const countryChoices = responseCountriesJson.data.results.map(c => {
  return {
    name: c.name,
    value: c.isoAlpha2
  };
});

spinner.succeed("Countries received...");
const country = await rawlist({
  message: 'Select country',
  choices: countryChoices,
});

const productType = await rawlist({
  message: 'Select Product type',
  choices: [
    { name: 'All (*)', value: '' },
    { name: 'TopUp', value: 'topup' },
    { name: 'Gift Card', value: 'gift_card'},
    { name: 'eSIM', value: 'esim'},
  ],
});

spinner = ora(`Getting products of type '${productType}'...`).start();
const productTypeParam = productType ? `&type=${productType}` : productType;
const productsEndpoint = `${environment}/products/grouped/?country=${country}${productTypeParam}`
const responseProducts = await fetch(productsEndpoint);
spinner.succeed(`products received of type ${productType}...`);
const responseProductsJson = await responseProducts.json();

const productsTypesFound = responseProductsJson.products.map(c => {
  return {
    name: c.productType,
    value: c.productType
  };
});

const ptf = await rawlist({
  message: `Found ${productsTypesFound.length} products types, please select one:`,
  choices: productsTypesFound,
});

const productTypeSelected = responseProductsJson.products.find(n => n.productType === ptf);
const brandsAvailable = productTypeSelected.brands.map( b => {
  return {
    name: `${b.order} - ${b.brandName}`,
    value: b.brandSlug
  };
});
const orderedBrands = brandsAvailable.sort((a, b) => a.order - b.order);

const selectedSlugBrand = await rawlist({
  message: `Found ${orderedBrands.length} brands, please select one:`,
  choices: orderedBrands,
});

const selectedBrand = productTypeSelected.brands.find(b => b.brandSlug === selectedSlugBrand);

var variants = selectedBrand.variants.map(v => {
  return {
    name:`${v.sendPrice} ${v.sendCurrency}`,
    value:v.id
  }
});
variants.sort((a, b) => a.name - b.name);

if (variants.length > 15)
  variants = pickRepresentative(variants, 15);

const selectedVariant = await rawlist({
  message: `Found ${variants.length} variants, please select one:`,
  choices: variants
});

spinner = ora("Getting supported networks...").start();
const networksEndpoint = `${environment}/networks/`
const responseNetworks = await fetch(networksEndpoint);
spinner.succeed("networks received...");
const responseNetworksJson = await responseNetworks.json();

const networkChoices = responseNetworksJson.data.map( n => {
  return {
    name: `${n.name}`,
    value: n
  };
});

const selectedNetwork = await rawlist({
  message: `Found ${networkChoices.length} available networks, please select one:`,
  choices: networkChoices
});

// console.log(selectedNetwork);

spinner = ora(`Getting supported tokens for network ${selectedNetwork.name}...`).start();
const tokensEndpoint = `${environment}/tokens/${selectedNetwork.key}`
const responseTokens = await fetch(tokensEndpoint);
spinner.succeed(`Supported token list received for chain ${selectedNetwork.name}...`);
const responseTokensJson = await responseTokens.json();

const tokenAddressesSupported = responseTokensJson.data.filter(u => u.key === "USDC" || u.key === "USDT" || u.key === selectedNetwork.nativeToken.symbol);
const tokenAddresses = tokenAddressesSupported.map( n => {
  return n.address;
});


const tokenChoices = responseTokensJson.data.map( n => {
  return {
    name: `${n.address}`,
    value: n
  };
});

// const selectedToken = await rawlist({
//   message: `Found ${tokenChoices.length} available tokens for network ${selectedNetwork.name}, please select one:`,
//   choices: tokenChoices
// });

// console.log(selectedToken);

const walletPrivateKey = await password({ message: 'Enter your Private Key. We will not send or store it.' });


const account = privateKeyToAccount(walletPrivateKey);
// console.log(selectedNetwork);

export const definedChain = defineChain({
  id: selectedNetwork.chainId,
  name: selectedNetwork.name,
  nativeCurrency: {
    decimals: selectedNetwork.nativeToken.decimals,
    name: selectedNetwork.nativeToken.name,
    symbol: selectedNetwork.nativeToken.symbol,
  },
  rpcUrls: {
    default: {
      http: [selectedNetwork.rpcUrl],
      webSocket: [],
    },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: '' },
  },
  contracts: {
    multicall3: {
      address: '',
      blockCreated: 1,
    },
  },
});


const chainClient = createPublicClient({
  chain: definedChain, 
  transport: http()
});

const walletClient = createWalletClient({
            account: account,
            chain: definedChain,
            transport: http(selectedNetwork.rpcUrl)
        });

const accounts = await walletClient.getAddresses();
// console.log(accounts);

const calls = tokenAddresses.map(addr => ({
  address: addr,
  abi: ERC20_ABI,
  functionName: 'balanceOf',
  args: accounts,
}));

// console.log(calls);

const balances = await Promise.all(
  calls.map(c => chainClient.readContract({
    address: c.address,
    abi: c.abi,
    functionName: c.functionName,
    args: c.args,
  }))
);

console.log(balances);

// account = privateKeyToAccount(walletPrivateKey);
// publicClient = createPublicClient({
//             chain: arbitrum,
//             transport: http(selectedNetwork.rpcUrl)
//         });
