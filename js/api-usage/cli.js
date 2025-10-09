import fs from 'fs';
import ora from 'ora';
import { confirm, input, rawlist, password } from '@inquirer/prompts';
import { privateKeyToAccount } from 'viem/accounts';
import { createPublicClient, formatUnits, isAddress, getAddress, createWalletClient, defineChain, http, hexToBigInt } from 'viem';

const banner = fs.readFileSync('./res/banner.txt', 'utf8');
console.log('\x1b[36m%s\x1b[0m', banner);
console.log();
console.log('\x1b[32m%s\x1b[0m', 'Spending Protocol API demo usage');
console.log();

const NATIVE_SENTINELS = new Set([
  '0x0000000000000000000000000000000000000000',
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
]);

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

async function getHoldingsForTokens(client, walletAddress, tokenAddresses, opts = {}) {
  const wallet = getAddress(walletAddress);

  // 1) Normaliza, quita duplicados, ignora nativos y direcciones inválidas
  const uniq = Array.from(new Set(tokenAddresses.map(a => a.trim().toLowerCase())));
  const tokens = uniq
    .filter(a => !NATIVE_SENTINELS.has(a) && isAddress(a))
    .map(a => getAddress(a)); // checksum

  if (tokens.length === 0) return [];

  // 2) Un solo multicall para TODOS los balanceOf
  const balanceCalls = tokens.map(addr => ({
    address: addr,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [wallet],
  }));

  const balanceRes = await client.multicall({
    contracts: balanceCalls,
    ...(opts.multicallAddress ? { multicallAddress: opts.multicallAddress } : {}),
    // allowFailure: true (por defecto)
  });

  // 3) Filtra solo non-zero y exitosos
  const nonZero = balanceRes
    .map((res, i) => ({
      address: tokens[i],
      status: res.status,
      raw: res.status === 'success' ? BigInt(res.result) : 0n,
    }))
    .filter(x => x.status === 'success' && x.raw > 0n);

  if (nonZero.length === 0) return [];

  // 4) Segundo multicall SOLO para los que tienen balance: symbol + decimals
  const metaCalls = nonZero.flatMap(x => ([
    { address: x.address, abi: ERC20_ABI, functionName: 'symbol',   args: [] },
    { address: x.address, abi: ERC20_ABI, functionName: 'decimals', args: [] },
  ]));

  const metaRes = await client.multicall({
    contracts: metaCalls,
    ...(opts.multicallAddress ? { multicallAddress: opts.multicallAddress } : {}),
  });

  // 5) Ensambla respuesta final (orden consistente con nonZero)
  const holdings = nonZero.map((x, idx) => {
    const symRes = metaRes[idx * 2];
    const decRes = metaRes[idx * 2 + 1];

    const decimals = decRes?.status === 'success' ? Number(decRes.result) : 18;
    const symbol   = symRes?.status === 'success' ? String(symRes.result) : '???';

    return {
      address: x.address,
      symbol,
      decimals,
      raw: x.raw,
      formatted: formatUnits(x.raw, decimals),
    };
  });

  // Opcional: ordénalos por balance descendente (numérico)
  holdings.sort((a, b) => Number(b.formatted) - Number(a.formatted));

  return holdings;
}


const environment = await rawlist({
  message: 'Select Bando\'s environment',
  choices: [
    { name: 'Development - Sandbox', value: 'https://apidev.bando.cool/api/v1' },
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
const sortedBrands = [...productTypeSelected.brands].sort((a, b) => a.order - b.order);

const brandsAvailable = sortedBrands.map( b => {
  return {
    name: `${b.brandName}`,
    value: b.brandSlug
  };
});
const orderedBrands = brandsAvailable.sort((a, b) => a.order - b.order);

const selectedSlugBrand = await rawlist({
  message: `Found ${orderedBrands.length} brands, please select one:`,
  choices: orderedBrands,
});

const selectedBrand = productTypeSelected.brands.find(b => b.brandSlug === selectedSlugBrand);

console.log()

var variants = selectedBrand.variants.map(v => {
  return {
    name:`${v.sendPrice} ${v.sendCurrency}`,
    value:v
  }
});
variants.sort((a, b) => a.name - b.name);

if (variants.length > 15)
  variants = pickRepresentative(variants, 15);

const selectedVariant = await rawlist({
  message: `Found ${variants.length} variants, please select one:`,
  choices: variants
});

// console.log(`selectedVariant ${selectedVariant}`);

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

// const tokenAddressesSupported = responseTokensJson.data.filter(u => u.key === "USDC" || u.key === "USDT" );
const tokenAddressesSupported = responseTokensJson.data;
const tokenAddresses = tokenAddressesSupported.map( n => {
  return n.address;
});


const tokenChoices = responseTokensJson.data.map( n => {
  return {
    name: `${n.address}`,
    value: n
  };
});


const pk_env_key = `PK_${selectedNetwork.networkType.toUpperCase()}`

console.log('Looking for PK in environment...')
const pkConfigured = process.env[pk_env_key]


if (!pkConfigured) {
  console.log(`Not found PK configured in environment for key '${pk_env_key}'`);
} else {
  console.log(`Private Key found in environment with key '${pk_env_key}'`);
}

const walletPrivateKey = pkConfigured || await password({ message: `Enter your Wallet Private Key for network type '${selectedNetwork.networkType}'. We will not send or store it.` });


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
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
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


const wallet = accounts[0];

spinner = ora(`Getting tokens with balance, please wait...`).start();

const holdings = await getHoldingsForTokens(chainClient, wallet, tokenAddresses, {
  // just in case the chain has not preconfigured the Multicall3:
  // multicallAddress: '0xCA11bde05977b3631167028862bE2a173976CA11',
});
spinner.succeed(`Got tokens with balance...`);

const tokenChoices2 = holdings.map( n => {
  return {
    name: `${n.symbol} - ${n.formatted}`,
    value: n
  };
});

const selectedToken = await rawlist({
  message: `Found ${tokenChoices2.length} available tokens with balance, please select one:`,
  choices: tokenChoices2
});

// console.log(`Selected token`);
// console.log(selectedToken);

const payload = {
            sku: selectedVariant.id,
            fiatCurrency: selectedVariant.price.fiatCurrency,
            digitalAsset: selectedToken.address,
            sender: wallet,
            chainId: selectedNetwork.chainId
        };

const quoteEndpoint = `${environment}/quotes/`

spinner = ora(`Requesting quote to Bando, please wait...`).start();
const quoteResponse = await fetch(quoteEndpoint, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload), 
});
const quoteResult = await quoteResponse.json();
spinner.succeed(`Got quote...`);

if (!quoteResponse.ok) {
  console.log('\x1b[31m%s\x1b[0m', quoteResult.message);
  process.exit(0);
}

console.log("Quote details");
console.table([quoteResult], ['fiatCurrency', 'fiatAmount', 'digitalAsset', 'totalAmount']);

let reference;

if (selectedVariant.referenceType) {
  reference = await input({
      message: `Enter value for reference of type: ${selectedVariant.referenceType.name}. We use this to deliver your product:`,
    });
}


const requiredFields = [];

if (Array.isArray(selectedVariant.requiredFields) && selectedVariant.requiredFields.length > 0) {
  for (const field of selectedVariant.requiredFields) {
    const answer = await input({
      message: `Enter value for: ${field.name}:`,
    });

    // guardamos la respuesta usando el nombre del campo
    const rfi = {
      "key": field.name,
      "value": answer 
    };
    requiredFields.push(rfi);
  }

  // console.log("Respuestas:", answers);
} 

// console.log(quoteResult);

const answer = await confirm({ message: `Do you want to confirm the on-chain transaction?. You will send ${quoteResult.digitalAssetAmount} ${selectedToken.symbol}` });
let txHash = '';

if (answer) {
  spinner = ora(`Sending transaction to the blockchain, please wait...`).start();
  const transactionData = quoteResult.transactionRequest;
  const txParams = {
    to: transactionData.to,
    data: transactionData.data,
    value: hexToBigInt(transactionData.value),
  };
  // console.log("txParams");
  // console.log(txParams);

  txHash = await walletClient.sendTransaction(txParams);

  // Wait for the transaction to be mined
  const receipt = await chainClient.waitForTransactionReceipt({
      hash: txHash,
      confirmations: 1
  });

  if (receipt.status === 'reverted') {
      console.log("Transaction failed!");
      process.exit(0);
  }


  spinner.succeed(`Transaction successfully sent to the blockchain: ${txHash}`);

} else {
  process.exit(0);
}

const transactionIntent = {
    sku: quoteResult.sku,
    quantity: 1,
    amount: quoteResult.totalAmount,
    chain: selectedNetwork.key,
    token: quoteResult.digitalAsset,
    wallet: wallet,
    integrator: "bando-app",
    hasAcceptedTerms: true,
    quoteId: quoteResult.id,
};

const transactionReceipt = {
    hash: txHash,
    virtualMachineType: selectedNetwork.networkType
};

const payloadPaymentReceipt = {
            reference: reference,
            requiredFields: requiredFields,
            transactionIntent: transactionIntent,
            transactionReceipt: transactionReceipt
          };

// console.log('payloadPaymentReceipt');
// console.log(payloadPaymentReceipt);


const paymentReceiptEndpoint = `${environment}/wallets/${wallet}/transactions/?integrator=bando-app`

spinner = ora(`Registering transaction to Bando, please wait...`).start();
const paymentReceiptResponse = await fetch(paymentReceiptEndpoint, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    'Idempotency-Key': `${quoteResult.id}`
  },
  body: JSON.stringify(payloadPaymentReceipt), 
});
// console.log(paymentReceiptResponse);
const paymentReceiptResult = await paymentReceiptResponse.json();
spinner.succeed(`Registration end...`);

if (!paymentReceiptResponse.ok) {
  console.log('\x1b[31m%s\x1b[0m', paymentReceiptResult.message);
  process.exit(0);
}

// console.log(paymentReceiptResult);

console.log('\x1b[32m%s\x1b[0m', `Transaction successfully registered. Fulfillment is in progress. Please check-out the reference you provided ${paymentReceiptResult.givenReference}`);
console.log(`Bando's Transaction id: ${paymentReceiptResult.transactionId}`);
console.log('\x1b[36m%s\x1b[0m', 'Thanks for using Bando!');
