import { marked } from 'marked'

export const DEFAULT_BANTCARE_TEMPLATE = `# Deal Name: <Deal Name>
# Client: <Client Name>
# Total Contract Value: <e.g., SGD 2.5M>
# Bidding Team VP: <VP Name>
# Bidding Team Sales: <Sales Names>
# Bidding Team Presales: <Presales Names>
# Bidding Team DM: <DM Name>
# Win Probability: <e.g., 70%>
# Sales Model: <e.g., Fix Price>
# 1st Year Revenue: <e.g., SGD 500K>
# Margin: <e.g., 45%>
# Contract Term: <e.g., 3+2>
# Qualified: YES
# Qualified Reason: <why?>
# Winning Theme: <e.g., very strong technical expertise>

## Budget
**[TIP]:** Inquire about the prospect's budget allocation for the solution or service you're offering.

Questions might include:
1. Do you have a budget set aside for this project?
2. How do you typically allocate funds for solutions like this?
3. Can you share your budget expectations or constraints for this initiative?

## Authority

| | Decision Maker | Influencer |
|---|---|---|
| Promoter | <Name, Title> | <Name, Title> |
| Neutral | <Name, Title> | |
| Detractor | | |

## Need
**[Expectation]:** Determine the prospect's specific pain points and requirements that your solution can address.

Questions might include:
1. What challenges or issues are you currently facing that you hope our solution can solve?
2. What specific goals or outcomes are you aiming to achieve with this project?
3. How does our solution align with your current needs and objectives?

## Timeline
**[Expectation]:**
- When will the client start the project? Or when do they have to select a vendor?
- Project timeline: e.g., how many months for development, warranty, maintenance
- Submission Date

## Competitors
1. <Competitor 1> - <insight>
2. <Competitor 2> - <insight>
3. <Competitor 3> - <insight>

## Advantages & Value Proposition
**[Expectation]:** FPT advantages in comparison with other vendors/competitors above

## Risk / Challenges / Not Clear
- ☐ **Risk:** <describe risks>
- ☐ **Challenges:** <describe challenges>
- ☐ **Not Clear:** <what is not clear>

## Expertise
<Describe FPT's relevant expertise, certifications, and resources for this opportunity>
`

export interface BantCareMetadata {
  dealName: string
  client: string
  totalContractValue: string
  biddingTeamVP: string
  biddingTeamSales: string
  biddingTeamPresales: string
  biddingTeamDM: string
  winProbability: string
  salesModel: string
  firstYearRevenue: string
  margin: string
  contractTerm: string
  qualified: string
  qualifiedReason: string
  winningTheme: string
}

export interface BantCareSections {
  budget: string
  authority: string
  need: string
  timeline: string
  competitors: string
  advantages: string
  risk: string
  expertise: string
}

interface BantCareData extends BantCareMetadata {
  sections: Record<string, string>
}

function parseBantCare(markdown: string): BantCareData {
  const data: BantCareData = {
    dealName: '', client: '', totalContractValue: '',
    biddingTeamVP: '', biddingTeamSales: '', biddingTeamPresales: '', biddingTeamDM: '',
    winProbability: '', salesModel: '', firstYearRevenue: '',
    margin: '', contractTerm: '', qualified: '', qualifiedReason: '',
    winningTheme: '', sections: {},
  }

  const lines = markdown.split('\n')
  let currentSection: string | null = null
  const sectionLines: Record<string, string[]> = {}

  for (const line of lines) {
    if (line.startsWith('## ')) {
      currentSection = line.slice(3).trim().toLowerCase()
      sectionLines[currentSection] = []
      continue
    }

    if (currentSection === null && line.startsWith('# ')) {
      const colonIdx = line.indexOf(':')
      if (colonIdx > 0) {
        const key = line.slice(2, colonIdx).trim().toLowerCase()
        const value = line.slice(colonIdx + 1).trim()
        switch (key) {
          case 'deal name':             data.dealName = value; break
          case 'client':                data.client = value; break
          case 'total contract value':  data.totalContractValue = value; break
          case 'bidding team vp':       data.biddingTeamVP = value; break
          case 'bidding team sales':    data.biddingTeamSales = value; break
          case 'bidding team presales': data.biddingTeamPresales = value; break
          case 'bidding team dm':       data.biddingTeamDM = value; break
          case 'win probability':       data.winProbability = value; break
          case 'sales model':           data.salesModel = value; break
          case '1st year revenue':      data.firstYearRevenue = value; break
          case 'margin':                data.margin = value; break
          case 'contract term':         data.contractTerm = value; break
          case 'qualified':             data.qualified = value; break
          case 'qualified reason':      data.qualifiedReason = value; break
          case 'winning theme':         data.winningTheme = value; break
        }
      }
      continue
    }

    if (currentSection !== null) {
      sectionLines[currentSection].push(line)
    }
  }

  for (const [key, lines] of Object.entries(sectionLines)) {
    data.sections[key] = lines.join('\n').trim()
  }

  return data
}

function getSection(sections: Record<string, string>, key: string): string {
  const k = key.toLowerCase()
  if (sections[k]) return sections[k]
  for (const [sk, sv] of Object.entries(sections)) {
    if (sk.includes(k) || k.includes(sk)) return sv
  }
  return ''
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderMarkdown(md: string): string {
  if (!md.trim()) return '<p style="color:#aaa;font-style:italic">—</p>'
  let html = marked.parse(md) as string
  html = html
    .replace(/\[TIP\]/g, '<span class="bc-marker">[TIP]</span>')
    .replace(/\[Expectation\]/g, '<span class="bc-marker">[Expectation]</span>')
    .replace(/\[Example\]/g, '<span class="bc-marker">[Example]</span>')
  return html
}

function renderAuthority(md: string): string {
  if (!md.trim()) return '<p style="color:#aaa;font-style:italic">—</p>'
  let html = marked.parse(md) as string
  html = html
    .replace(/(<tr>)(\s*)(<td>Promoter<\/td>)/gi, '<tr class="bc-promoter">$2$3')
    .replace(/(<tr>)(\s*)(<td>Neutral<\/td>)/gi,   '<tr class="bc-neutral">$2$3')
    .replace(/(<tr>)(\s*)(<td>Detractor<\/td>)/gi, '<tr class="bc-detractor">$2$3')
  return html
}

function infoTile(icon: string, label: string, value: string): string {
  return `<div class="bc-info-tile"><div class="bc-tile-icon">${icon}</div><div><div class="bc-info-label">${label}</div><div class="bc-info-value">${value}</div></div></div>`
}

function bRow(label: string, content: string, side: 'bant' | 'care'): string {
  return `<div class="bc-row bc-${side}-row"><div class="bc-row-lbl">${label}</div><div class="bc-row-cnt">${content}</div></div>`
}

export const EMPTY_METADATA: BantCareMetadata = {
  dealName: '', client: '', totalContractValue: '',
  biddingTeamVP: '', biddingTeamSales: '', biddingTeamPresales: '', biddingTeamDM: '',
  winProbability: '', salesModel: '', firstYearRevenue: '',
  margin: '', contractTerm: '', qualified: 'YES', qualifiedReason: '',
  winningTheme: '',
}

export const EMPTY_SECTIONS: BantCareSections = {
  budget: '', authority: '', need: '', timeline: '',
  competitors: '', advantages: '', risk: '', expertise: '',
}

export function metadataToMarkdown(meta: BantCareMetadata): string {
  return [
    `# Deal Name: ${meta.dealName}`,
    `# Client: ${meta.client}`,
    `# Total Contract Value: ${meta.totalContractValue}`,
    `# Bidding Team VP: ${meta.biddingTeamVP}`,
    `# Bidding Team Sales: ${meta.biddingTeamSales}`,
    `# Bidding Team Presales: ${meta.biddingTeamPresales}`,
    `# Bidding Team DM: ${meta.biddingTeamDM}`,
    `# Win Probability: ${meta.winProbability}`,
    `# Sales Model: ${meta.salesModel}`,
    `# 1st Year Revenue: ${meta.firstYearRevenue}`,
    `# Margin: ${meta.margin}`,
    `# Contract Term: ${meta.contractTerm}`,
    `# Qualified: ${meta.qualified}`,
    `# Qualified Reason: ${meta.qualifiedReason}`,
    `# Winning Theme: ${meta.winningTheme}`,
  ].join('\n')
}

export function sectionsToMarkdown(s: BantCareSections): string {
  return [
    `## Budget\n${s.budget}`,
    `## Authority\n${s.authority}`,
    `## Need\n${s.need}`,
    `## Timeline\n${s.timeline}`,
    `## Competitors\n${s.competitors}`,
    `## Advantages & Value Proposition\n${s.advantages}`,
    `## Risk / Challenges / Not Clear\n${s.risk}`,
    `## Expertise\n${s.expertise}`,
  ].join('\n\n')
}

export function extractMetadataAndSections(markdown: string): { metadata: BantCareMetadata; sections: BantCareSections } {
  const d = parseBantCare(markdown)
  const gs = (key: string) => getSection(d.sections, key)
  return {
    metadata: {
      dealName: d.dealName, client: d.client, totalContractValue: d.totalContractValue,
      biddingTeamVP: d.biddingTeamVP, biddingTeamSales: d.biddingTeamSales,
      biddingTeamPresales: d.biddingTeamPresales, biddingTeamDM: d.biddingTeamDM,
      winProbability: d.winProbability, salesModel: d.salesModel,
      firstYearRevenue: d.firstYearRevenue, margin: d.margin,
      contractTerm: d.contractTerm, qualified: d.qualified,
      qualifiedReason: d.qualifiedReason, winningTheme: d.winningTheme,
    },
    sections: {
      budget: gs('budget'),
      authority: gs('authority'),
      need: gs('need'),
      timeline: gs('timeline'),
      competitors: gs('competitors'),
      advantages: gs('advantages'),
      risk: gs('risk'),
      expertise: gs('expertise'),
    },
  }
}

export function generateBantCareHTML(markdown: string): string {
  if (!markdown.trim()) return ''

  const d = parseBantCare(markdown)
  const gs = (key: string) => getSection(d.sections, key)

  const isYes = d.qualified.trim().toUpperCase().startsWith('Y')
  const qualBadge = `<span class="${isYes ? 'bc-yes' : 'bc-no-dim'}">YES</span>/<span class="${isYes ? 'bc-no-dim' : 'bc-no'}">NO</span>`

  const biddingParts = [
    d.biddingTeamVP       && `<div>VP: ${esc(d.biddingTeamVP)}</div>`,
    d.biddingTeamSales    && `<div>Sales: ${esc(d.biddingTeamSales)}</div>`,
    d.biddingTeamPresales && `<div>Presales: ${esc(d.biddingTeamPresales)}</div>`,
    d.biddingTeamDM       && `<div>DM: ${esc(d.biddingTeamDM)}</div>`,
  ].filter(Boolean).join('')
  const biddingTeam = biddingParts || '—'

  return `<div class="bc-page">
<div class="bc-header">
  <div class="bc-header-left">
    <div class="bc-title">BANT &amp; CARE: ${d.dealName ? esc(d.dealName) : '&lt;Deal Name&gt;'}</div>
  </div>
  <div class="bc-header-right">
    ${d.client ? `<div class="bc-client-badge">${esc(d.client)}</div>` : ''}
    <div class="bc-tcv-box">
      <div class="bc-tcv-label">Total Contract Value</div>
      <div class="bc-tcv-value">${esc(d.totalContractValue || '—')}</div>
    </div>
  </div>
</div>
<div class="bc-infobar">
  ${infoTile('👤', 'Bidding Team', biddingTeam)}
  ${infoTile('🎯', 'Win Probability', esc(d.winProbability || '—'))}
  ${infoTile('⚙️', 'Sales Model', esc(d.salesModel || '—'))}
  ${infoTile('💰', '1st Year Revenue', esc(d.firstYearRevenue || '—'))}
  ${infoTile('📊', 'Margin', esc(d.margin || '—'))}
  ${infoTile('📅', 'Contract Term', esc(d.contractTerm || '—'))}
  <div class="bc-info-tile bc-tile-wide"><div><div class="bc-info-label">Qualified: ${qualBadge}</div><div class="bc-info-value">${esc(d.qualifiedReason || '—')}</div></div></div>
  <div class="bc-info-tile bc-tile-wider"><div><div class="bc-info-label">Winning Theme</div><div class="bc-info-value">${esc(d.winningTheme || '—')}</div></div></div>
</div>
<div class="bc-body">
  <div class="bc-col-hdr bc-bant-hdr">BANT Analysis</div>
  <div class="bc-col-hdr">CARE Analysis</div>
  ${bRow('Budget',    renderMarkdown(gs('budget')),    'bant')}
  ${bRow('Competitors',                        renderMarkdown(gs('competitors')),  'care')}
  ${bRow('Authority', renderAuthority(gs('authority')), 'bant')}
  ${bRow('Advantages &amp; Value Proposition', renderMarkdown(gs('advantages')),   'care')}
  ${bRow('Need',      renderMarkdown(gs('need')),      'bant')}
  ${bRow('Risk / Challenges / Not Clear',      renderMarkdown(gs('risk')),         'care')}
  ${bRow('Timeline',  renderMarkdown(gs('timeline')),  'bant')}
  ${bRow('Expertise',                          renderMarkdown(gs('expertise')),    'care')}
</div>
</div>`
}
