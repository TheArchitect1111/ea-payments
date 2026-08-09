import type { VideoProject } from '../schema';

export const wealthyDebtProject: VideoProject = {
  id: 'wealthy-debt',
  title: 'Why wealthy people use debt differently',
  topic: 'Why wealthy people use debt differently.',
  description: `A short Efficiency Architects explainer on how productive debt differs from consumer debt.

This is educational, not individualized financial, legal, or tax advice. Leverage can magnify losses as well as gains. Whether borrowing is appropriate depends on cash flow, risk tolerance, and the quality of the underlying asset.

Topics: productive vs consumer debt, liquidity, opportunity cost, and general tax mechanics at a principles level.`,
  aspectRatio: '16:9',
  fps: 30,
  width: 1920,
  height: 1080,
  youtubeTags: ['personal finance', 'debt', 'leverage', 'Efficiency Architects', 'explainer'],
  scenes: [
    {
      id: 'hook',
      type: 'title',
      durationInSeconds: 8,
      kicker: 'Efficiency Architects · Explainer',
      headline: 'The wealthy don’t avoid debt.',
      body: 'They choose a different kind.',
      narration:
        'Wealthy households are not magically debt-free. Many use debt on purpose — but they use a different kind.',
    },
    {
      id: 'two-kinds',
      type: 'narration',
      durationInSeconds: 12,
      kicker: 'The distinction',
      headline: 'Consumer debt vs productive debt',
      body: 'Consumer debt funds spending that is already consumed. Productive debt funds an asset that can throw off cash, appreciate, or replace a more expensive source of capital.',
      narration:
        'Consumer debt pays for things that are already gone — dinners, gadgets, lifestyle. Productive debt is attached to something that can earn, appreciate, or keep cash available.',
    },
    {
      id: 'stat-contrast',
      type: 'stat',
      durationInSeconds: 9,
      kicker: 'Same word. Different job.',
      headline: 'Debt is not one product.',
      statValue: 'Tool vs trap',
      statLabel: 'The balance sheet decides which one you have.',
      narration:
        'A credit card balance and a loan against a cash-flowing asset share a name. They do not share a job.',
    },
    {
      id: 'chart-drag',
      type: 'chart',
      durationInSeconds: 11,
      kicker: 'Illustrative, not a forecast',
      headline: 'What the payment is doing',
      body: 'One payment shrinks future options. The other is meant to keep or grow capacity — if the asset holds up.',
      chart: [
        { label: 'Consumer drag', value: 82, note: 'Lifestyle already spent' },
        { label: 'Asset-backed', value: 38, note: 'Tied to collateral / cash flow' },
        { label: 'Cash buffer kept', value: 64, note: 'Liquidity not sold' },
      ],
      narration:
        'Consumer payments mostly service yesterday. Asset-backed borrowing is a bet that keeping the asset — and the cash — is worth the interest.',
    },
    {
      id: 'leverage',
      type: 'narration',
      durationInSeconds: 11,
      kicker: 'Leverage',
      headline: 'Borrowing against what already works',
      body: 'Some households borrow against appreciating or productive assets instead of selling them. That can preserve ownership and liquidity. It also adds a lender to the story.',
      narration:
        'Instead of selling a productive asset to raise cash, some owners borrow against it. They keep the asset. They also take on a payment and a lien.',
    },
    {
      id: 'liquidity',
      type: 'data',
      durationInSeconds: 10,
      kicker: 'Liquidity',
      headline: 'Cash is an option. Selling is a decision.',
      body: 'Selling an asset raises cash and ends the upside. Borrowing can raise cash while the asset stays on the books. Opportunity cost is what you give up either way — interest, or future growth you no longer own.',
      narration:
        'Selling is final. Borrowing is reversible only if cash flow holds. Opportunity cost sits on both sides: interest paid, or upside sold.',
    },
    {
      id: 'quote',
      type: 'quote',
      durationInSeconds: 8,
      headline: 'Debt is a tool.',
      body: 'The balance sheet decides whether it cuts or builds.',
      quoteAttribution: 'Efficiency Architects · principle, not a promise',
      narration: 'Treat debt as a tool. The quality of the asset and the payment decide whether it helps or harms.',
    },
    {
      id: 'tax',
      type: 'narration',
      durationInSeconds: 11,
      kicker: 'Tax mechanics · not advice',
      headline: 'Interest and sale proceeds are different events',
      body: 'In general, selling an appreciated asset can trigger tax on the gain. Interest on some loans may be treated differently than ordinary spending. Rules depend on the asset, the loan, and the taxpayer. This is not tax advice.',
      narration:
        'Selling can create a taxable gain. Some interest may be treated differently than lifestyle spending. The right answer is personal. Get advice for your facts.',
    },
    {
      id: 'risk',
      type: 'narration',
      durationInSeconds: 11,
      kicker: 'Risk',
      headline: 'Leverage magnifies losses too',
      body: 'If the asset falls, cash flow breaks, or rates reprice, debt still comes due. Productive intent does not remove default, margin, or foreclosure risk.',
      narration:
        'Leverage cuts both ways. If the asset drops or income slips, the loan does not become kinder. That is the part glossy clips skip.',
    },
    {
      id: 'sources',
      type: 'citation',
      durationInSeconds: 9,
      kicker: 'Evidence, not hype',
      headline: 'Read the underlying ideas',
      citations: [
        {
          label: 'Household balance sheets',
          detail: 'Federal Reserve Survey of Consumer Finances — debt alongside assets, not instead of them.',
        },
        {
          label: 'Productive vs consumption credit',
          detail: 'Standard corporate/household finance: match liability to asset life and cash flow.',
        },
        {
          label: 'Tax treatment',
          detail: 'IRS publications on capital gains and interest deductibility — fact-specific; consult a professional.',
        },
      ],
      narration: 'The pattern is in public data and basic finance. It is not a secret club. It is a balance-sheet habit.',
    },
    {
      id: 'outro',
      type: 'outro',
      durationInSeconds: 8,
      kicker: 'Efficiency Architects',
      headline: 'Build capacity. Don’t decorate debt.',
      body: 'If debt is on the table, ask what asset it buys, what payment it requires, and what breaks if the story is wrong.',
      narration:
        'Efficiency Architects. Ask what the debt is for — and what happens if you are wrong.',
    },
  ],
};
