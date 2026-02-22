// AI Portfolio Assistant Service
// Provides intelligent insights, recommendations, and natural language interaction

export interface PortfolioInsight {
  type: 'opportunity' | 'risk' | 'info' | 'action';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionLabel?: string;
  actionData?: any;
}

export interface TokenAnalysis {
  symbol: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  riskLevel: 'low' | 'medium' | 'high';
  insights: string[];
  priceTarget?: { low: number; mid: number; high: number };
}

export interface PortfolioHealth {
  score: number; // 0-100
  diversification: 'poor' | 'fair' | 'good' | 'excellent';
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  suggestions: string[];
}

// Analyze portfolio and generate insights
export const analyzePortfolio = async (
  holdings: Array<{ symbol: string; balance: number; value: number }>,
  totalValue: number
): Promise<PortfolioInsight[]> => {
  const insights: PortfolioInsight[] = [];
  
  // Check diversification
  const topHolding = holdings.reduce((max, h) => h.value > max.value ? h : max, holdings[0]);
  const topHoldingPercent = (topHolding?.value / totalValue) * 100;
  
  if (topHoldingPercent > 50) {
    insights.push({
      type: 'risk',
      title: 'High Concentration Risk',
      description: `${topHolding.symbol} makes up ${topHoldingPercent.toFixed(0)}% of your portfolio. Consider diversifying.`,
      priority: 'high',
      actionLabel: 'Swap Some',
      actionData: { action: 'swap', fromToken: topHolding.symbol }
    });
  }

  // Check for stablecoin ratio
  const stablecoins = ['USDT', 'USDC', 'DAI', 'BUSD', 'TUSD'];
  const stableValue = holdings
    .filter(h => stablecoins.includes(h.symbol.toUpperCase()))
    .reduce((sum, h) => sum + h.value, 0);
  const stablePercent = (stableValue / totalValue) * 100;
  
  if (stablePercent < 10 && totalValue > 1000) {
    insights.push({
      type: 'info',
      title: 'Consider Adding Stables',
      description: 'Having 10-20% in stablecoins can help you take advantage of dips.',
      priority: 'medium',
    });
  }

  // Gas optimization suggestion
  if (holdings.length > 5) {
    insights.push({
      type: 'opportunity',
      title: 'Gas Optimization Available',
      description: 'Bundle your next transactions to save on gas fees.',
      priority: 'low',
    });
  }

  // DeFi yield opportunity
  const idleAssets = holdings.filter(h => 
    !stablecoins.includes(h.symbol.toUpperCase()) && 
    h.value > 100
  );
  
  if (idleAssets.length > 0) {
    insights.push({
      type: 'opportunity',
      title: 'Yield Opportunities',
      description: `You have ${idleAssets.length} tokens that could be earning yield in DeFi protocols.`,
      priority: 'medium',
      actionLabel: 'Explore',
      actionData: { action: 'defi' }
    });
  }

  return insights;
};

// Get portfolio health score
export const getPortfolioHealth = (
  holdings: Array<{ symbol: string; balance: number; value: number }>,
  totalValue: number
): PortfolioHealth => {
  let score = 50; // Start at neutral
  const suggestions: string[] = [];

  // Diversification scoring
  const holdingCount = holdings.filter(h => h.value > 10).length;
  if (holdingCount >= 5) score += 15;
  else if (holdingCount >= 3) score += 10;
  else if (holdingCount === 1) score -= 10;

  // Concentration check
  const concentrations = holdings.map(h => (h.value / totalValue) * 100);
  const maxConcentration = Math.max(...concentrations);
  
  if (maxConcentration > 70) {
    score -= 20;
    suggestions.push('Diversify: One asset dominates your portfolio');
  } else if (maxConcentration > 50) {
    score -= 10;
    suggestions.push('Consider reducing your largest position');
  } else if (maxConcentration < 30 && holdingCount >= 4) {
    score += 10;
  }

  // Stablecoin buffer
  const stablecoins = ['USDT', 'USDC', 'DAI', 'BUSD'];
  const stablePercent = holdings
    .filter(h => stablecoins.includes(h.symbol.toUpperCase()))
    .reduce((sum, h) => sum + (h.value / totalValue) * 100, 0);
  
  if (stablePercent >= 10 && stablePercent <= 30) {
    score += 10;
  } else if (stablePercent < 5) {
    suggestions.push('Add stablecoins for buying opportunities');
  } else if (stablePercent > 50) {
    score -= 5;
    suggestions.push('Consider deploying stablecoins for yield');
  }

  // Determine risk level
  let riskLevel: PortfolioHealth['riskLevel'] = 'moderate';
  if (stablePercent > 40) riskLevel = 'conservative';
  else if (maxConcentration > 60 || stablePercent < 5) riskLevel = 'aggressive';

  // Determine diversification level
  let diversification: PortfolioHealth['diversification'] = 'fair';
  if (holdingCount >= 7 && maxConcentration < 30) diversification = 'excellent';
  else if (holdingCount >= 5 && maxConcentration < 40) diversification = 'good';
  else if (holdingCount <= 2) diversification = 'poor';

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  return { score, diversification, riskLevel, suggestions };
};

// AI Chat response generation
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// Helper to get a random item from an array
const random = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Format currency
const formatUSD = (value: number): string => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
};

export const generateAIResponse = async (
  message: string,
  holdings: Array<{ symbol: string; balance: number; value: number }>,
  totalValue: number
): Promise<string> => {
  const msg = message.toLowerCase().trim();
  const health = getPortfolioHealth(holdings, totalValue);
  const topHoldings = [...holdings].sort((a, b) => b.value - a.value);
  const topAsset = topHoldings[0];
  const stablecoins = ['USDT', 'USDC', 'DAI', 'BUSD', 'TUSD'];
  const stableHoldings = holdings.filter(h => stablecoins.includes(h.symbol.toUpperCase()));
  const stableValue = stableHoldings.reduce((sum, h) => sum + h.value, 0);
  const stablePercent = totalValue > 0 ? (stableValue / totalValue) * 100 : 0;
  
  // Greetings
  if (msg.match(/^(hi|hello|hey|sup|yo|gm|good morning|good evening|what's up|howdy)/i)) {
    const greetings = [
      `Hey! 👋 Your portfolio is worth ${formatUSD(totalValue)} right now. ${health.score >= 70 ? "Looking healthy!" : "I have some suggestions to improve it."} What would you like to know?`,
      `Hi there! I see you have ${holdings.length} tokens worth ${formatUSD(totalValue)}. How can I help you today?`,
      `Hello! 🚀 Ready to help you manage your crypto. Your portfolio health score is ${health.score}/100. Ask me anything!`,
    ];
    return random(greetings);
  }

  // Portfolio analysis
  if (msg.match(/portfolio|holdings|balance|assets|what do i (have|own)|my (coins|tokens|crypto)|analyze|analysis|how am i doing|overview/)) {
    let response = `📊 **Portfolio Analysis**\n\n`;
    response += `💰 Total Value: **${formatUSD(totalValue)}**\n`;
    response += `📈 Health Score: **${health.score}/100**\n`;
    response += `🎯 Diversification: ${health.diversification}\n`;
    response += `⚖️ Risk Level: ${health.riskLevel}\n\n`;
    
    if (topHoldings.length > 0) {
      response += `**Your Top Assets:**\n`;
      topHoldings.slice(0, 5).forEach((h, i) => {
        const percent = totalValue > 0 ? ((h.value / totalValue) * 100).toFixed(1) : '0';
        const emoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '•';
        response += `${emoji} ${h.symbol}: ${formatUSD(h.value)} (${percent}%)\n`;
      });
    } else {
      response += `You don't have any holdings yet. Use the **Buy** or **Receive** buttons to get started!`;
    }
    
    if (health.suggestions.length > 0) {
      response += `\n💡 **My Suggestions:**\n`;
      health.suggestions.forEach(s => response += `• ${s}\n`);
    }
    
    return response;
  }

  // Specific token questions
  const tokenMatch = msg.match(/(?:about|how is|what about|tell me about|check)\s+([a-z]{2,10})/i) ||
                    msg.match(/([a-z]{2,10})\s+(?:price|doing|status|info)/i);
  if (tokenMatch) {
    const symbol = tokenMatch[1].toUpperCase();
    const holding = holdings.find(h => h.symbol.toUpperCase() === symbol);
    
    if (holding) {
      const percent = totalValue > 0 ? ((holding.value / totalValue) * 100).toFixed(1) : '0';
      return `📈 **${holding.symbol}**\n\nYou have **${holding.balance.toLocaleString()} ${holding.symbol}**\nValue: **${formatUSD(holding.value)}** (${percent}% of portfolio)\n\nTo trade this token, go to the Swap tab!`;
    } else {
      return `I don't see ${symbol} in your wallet. You can add it via:\n\n• **Buy** - Purchase with card/bank\n• **Receive** - Get your wallet address\n• **Swap** - Exchange another token for it\n• **Add Token** - Import by contract address`;
    }
  }

  // Gas/fees
  if (msg.match(/gas|fee|cheap|expensive|transaction cost|gwei/)) {
    return `⛽ **Gas Optimization Tips**\n\n🕐 Best times to transact:\n• Weekends (Saturday-Sunday)\n• Late night UTC (2-6 AM)\n• Early morning in the US\n\n💡 Pro tips:\n• Use Layer 2s (Arbitrum, Base, Optimism) for 10-100x cheaper fees\n• Bundle transactions when possible\n• Set custom gas prices for non-urgent txns\n\nCheck the gas widget on your home screen for real-time prices!`;
  }

  // Swap/trade
  if (msg.match(/swap|trade|exchange|convert|buy|sell|when should i/)) {
    if (totalValue === 0) {
      return `💱 **Getting Started**\n\nYou don't have any tokens to swap yet!\n\n1. Tap **Buy** to purchase crypto with your card\n2. Or tap **Receive** to get tokens from another wallet\n3. Then come back and swap!`;
    }
    
    let response = `💱 **Swap Recommendations**\n\n`;
    
    if (topAsset && (topAsset.value / totalValue) > 0.5) {
      response += `⚠️ ${topAsset.symbol} is ${((topAsset.value / totalValue) * 100).toFixed(0)}% of your portfolio. Consider swapping some for diversification.\n\n`;
    }
    
    if (stablePercent < 10 && totalValue > 100) {
      response += `💡 You have only ${stablePercent.toFixed(0)}% in stablecoins. Consider keeping 10-20% in USDC/USDT to buy dips.\n\n`;
    }
    
    response += `**How to swap:**\n`;
    response += `1. Go to the **Swap** tab\n`;
    response += `2. Select tokens to swap\n`;
    response += `3. We'll find the best rate across DEXes\n\n`;
    response += `Our aggregator searches Uniswap, SushiSwap, 1inch & more!`;
    
    return response;
  }

  // Security
  if (msg.match(/safe|secure|scam|hack|phish|protect|security|rug|honey/)) {
    return `🔒 **Security Best Practices**\n\n**DO:**\n✅ Use our Token Scanner before buying new tokens\n✅ Verify contract addresses on block explorers\n✅ Keep your seed phrase offline & secret\n✅ Enable transaction previews\n✅ Bookmark official sites\n\n**DON'T:**\n❌ Share your seed phrase with ANYONE\n❌ Click links from DMs\n❌ Approve unlimited token spending\n❌ Rush into "urgent" opportunities\n\n🔍 Use the Token Scanner (tap the shield icon) to check any contract!`;
  }

  // Help/what can you do
  if (msg.match(/help|what can you|how to use|commands|options|menu/)) {
    return `🤖 **I can help you with:**\n\n📊 **Portfolio** - "Analyze my portfolio", "How am I doing?"\n\n💱 **Trading** - "When should I swap?", "Tell me about ETH"\n\n⛽ **Gas** - "Gas fees", "Best time to trade?"\n\n🔒 **Security** - "How to stay safe", "Is this token safe?"\n\n📈 **Market** - "Market overview", "What's trending?"\n\nJust type naturally - I understand context! 💬`;
  }

  // Market/trends
  if (msg.match(/market|trend|bull|bear|sentiment|outlook|news/)) {
    return `📈 **Market Insights**\n\nI analyze your portfolio in real-time. Here's what I see:\n\n• Your portfolio has **${holdings.length} tokens**\n• Risk level: **${health.riskLevel}**\n• Diversification: **${health.diversification}**\n\n💡 For price charts, tap any token in your wallet.\n\nWant me to analyze a specific token? Just ask "How is [TOKEN] doing?"`;
  }

  // Stablecoins
  if (msg.match(/stable|usdt|usdc|dai|busd/)) {
    return `💵 **Stablecoin Status**\n\nYou have **${formatUSD(stableValue)}** in stablecoins (${stablePercent.toFixed(1)}% of portfolio)\n\n${stablePercent < 10 ? '⚠️ Consider adding more stables (10-20% recommended) to buy dips!' : '✅ Good stablecoin allocation for flexibility!'}\n\nStablecoins in your wallet:\n${stableHoldings.length > 0 ? stableHoldings.map(h => `• ${h.symbol}: ${formatUSD(h.value)}`).join('\n') : '• None yet - consider adding USDC or USDT'}`;
  }

  // DeFi/yield
  if (msg.match(/defi|yield|stake|staking|earn|apy|interest|farm/)) {
    return `🌾 **DeFi & Yield Opportunities**\n\n${totalValue > 100 ? `With ${formatUSD(totalValue)}, you could explore:` : 'To earn yield, you need some tokens first!'}\n\n• **Staking** - Earn 3-8% APY on ETH, MATIC, etc.\n• **Lending** - Supply stables for 2-10% APY\n• **LP Farming** - Higher risk/reward\n\n⚠️ DeFi has smart contract risks. Always:\n• Research protocols thoroughly\n• Start with small amounts\n• Use audited protocols only\n\nWant to explore DeFi? Check the Discover tab!`;
  }

  // Thank you / positive
  if (msg.match(/thank|thanks|awesome|great|perfect|nice|cool|good job|helpful/)) {
    return random([
      "You're welcome! 🙌 Let me know if you need anything else!",
      "Happy to help! Feel free to ask anytime! 🚀",
      "Glad I could help! Your crypto journey is in good hands 💪",
    ]);
  }

  // Confused / don't understand
  if (msg.match(/what|huh|confused|don't understand|explain|wdym/)) {
    return `No worries, let me clarify! 😊\n\nI can help you with:\n• Portfolio analysis\n• Swap recommendations\n• Gas optimization\n• Security tips\n\nTry asking something like:\n• "Analyze my portfolio"\n• "When should I swap?"\n• "How do I stay safe?"\n\nWhat would you like to know?`;
  }

  // Default - try to be helpful
  const hasTokens = holdings.length > 0;
  return `I'm not sure I understood that, but here's what I can see:\n\n${hasTokens ? `📊 Your portfolio: ${formatUSD(totalValue)} across ${holdings.length} tokens\n📈 Health score: ${health.score}/100` : '👋 Your wallet is empty - tap Buy or Receive to get started!'}\n\nTry asking me:\n• "Analyze my portfolio"\n• "Gas tips"\n• "How to stay safe"\n• "When should I swap?"\n\nI'm here to help! 🤖`;
};

// Quick action suggestions based on context
export const getQuickActions = (
  holdings: Array<{ symbol: string; balance: number; value: number }>,
  gasPrice: number
): Array<{ label: string; action: string; data?: any }> => {
  const actions = [];
  
  // Always show receive
  actions.push({ label: '📥 Receive', action: 'receive' });
  
  // Show swap if has holdings
  if (holdings.length > 0) {
    actions.push({ label: '💱 Swap', action: 'swap' });
  }
  
  // Show send if has balance
  const hasBalance = holdings.some(h => h.value > 0);
  if (hasBalance) {
    actions.push({ label: '📤 Send', action: 'send' });
  }
  
  // Low gas alert
  if (gasPrice < 30) {
    actions.push({ label: '⛽ Low Gas Now!', action: 'gas_alert' });
  }
  
  return actions;
};
