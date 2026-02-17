import { parseUnits, formatUnits, type Address } from 'viem';

// Token addresses on Ethereum mainnet
export const TOKENS: Record<string, { address: Address; decimals: number; name: string }> = {
  ETH: { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18, name: 'Ethereum' },
  WETH: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18, name: 'Wrapped Ether' },
  USDT: { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, name: 'Tether USD' },
  USDC: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, name: 'USD Coin' },
  WBTC: { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8, name: 'Wrapped BTC' },
  DAI: { address: '0x6B175474E89094C44Da98b954EessdcdFB92266', decimals: 18, name: 'Dai Stablecoin' },
};

// Uniswap V3 Router address
export const UNISWAP_ROUTER = '0xE592427A0AEce92De3Edee1F18E0157C05861564' as Address;

// ERC20 ABI for approval
export const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
] as const;

// Uniswap V3 SwapRouter ABI (simplified)
export const SWAP_ROUTER_ABI = [
  {
    name: 'exactInputSingle',
    type: 'function',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'recipient', type: 'address' },
          { name: 'deadline', type: 'uint256' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'amountOutMinimum', type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
      },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
] as const;

export interface SwapParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  slippageTolerance: number; // e.g., 0.5 for 0.5%
  recipient: Address;
}

export interface SwapQuote {
  amountIn: string;
  amountOut: string;
  priceImpact: number;
  fee: string;
  route: string;
}

// Get a quote for a swap (simplified - in production use Uniswap SDK)
export async function getSwapQuote(
  tokenIn: string,
  tokenOut: string,
  amountIn: string
): Promise<SwapQuote | null> {
  try {
    const tokenInInfo = TOKENS[tokenIn];
    const tokenOutInfo = TOKENS[tokenOut];
    
    if (!tokenInInfo || !tokenOutInfo) {
      throw new Error('Token not supported');
    }

    // In production, this would call Uniswap's quoter contract or API
    // For now, return a simulated quote
    const amountInParsed = parseFloat(amountIn);
    
    // Simulated exchange rates
    const rates: Record<string, Record<string, number>> = {
      ETH: { USDT: 3500, USDC: 3500, WBTC: 0.055, DAI: 3500 },
      WBTC: { USDT: 65000, USDC: 65000, ETH: 18, DAI: 65000 },
      USDT: { ETH: 0.000285, WBTC: 0.0000154, USDC: 1, DAI: 1 },
      USDC: { ETH: 0.000285, WBTC: 0.0000154, USDT: 1, DAI: 1 },
    };

    const rate = rates[tokenIn]?.[tokenOut] || 1;
    const estimatedOut = amountInParsed * rate;
    
    return {
      amountIn,
      amountOut: estimatedOut.toFixed(6),
      priceImpact: 0.3, // Simulated
      fee: '0.3%',
      route: `${tokenIn} → ${tokenOut}`,
    };
  } catch (error) {
    console.error('Error getting swap quote:', error);
    return null;
  }
}

// Build swap transaction parameters
export function buildSwapTransaction(
  params: SwapParams,
  _quote: SwapQuote
): {
  to: Address;
  data: `0x${string}`;
  value: bigint;
} {
  const tokenIn = TOKENS[params.tokenIn];
  const tokenOut = TOKENS[params.tokenOut];
  
  if (!tokenIn || !tokenOut) {
    throw new Error('Token not supported');
  }

  const amountIn = parseUnits(params.amountIn, tokenIn.decimals);

  // For ETH input, send value; for tokens, value is 0
  const isETHIn = params.tokenIn === 'ETH';

  // This is a simplified encoding - in production use viem's encodeFunctionData
  return {
    to: UNISWAP_ROUTER,
    data: '0x' as `0x${string}`, // Would be properly encoded swap data
    value: isETHIn ? amountIn : BigInt(0),
  };
}

// Format balance for display
export function formatTokenBalance(balance: bigint, decimals: number, precision: number = 6): string {
  return parseFloat(formatUnits(balance, decimals)).toFixed(precision);
}
