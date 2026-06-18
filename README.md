# FallPractice · sovereign IFA firm accounting

**v1.0.0 · prime 739 · single HTML · MIT**

Firm-side accounting for UK financial-advisory practices (1-10 advisers). Adviser fee ledger, recurring schedules, CASS client-money segregation, PI/FCA accruals, per-client RIY, per-adviser P&L, firm P&L, invoice generator, RegData hint dashboard. Part of the IFA Bundle (`falladviser` · `fallonboard` · `fallpaper` · `fallpractice`).

**Tool, not a regulatory submission system.** FCA RegData / GABRIEL submissions remain the firm's responsibility.

---

## For the practice principal

Drop `index.html` somewhere — a USB stick, a private network share, GitHub Pages, your laptop's Downloads folder. Open it in any modern browser. That's it. There is no install, no server, no account, no telemetry. Your firm's data lives in your browser's IndexedDB and never leaves the device.

What you get on first open:

- **Dashboard** — YTD/MTD fees, receivable balance, overdue >14d, CASS posture, PI countdown, 6-month revenue chart broken down by fee type
- **Fees** — full adviser-fee ledger (initial / ongoing / one-off / transactional / trail commission)
- **Schedules** — recurring fee schedules; the tool auto-generates ledger entries when `nextDueAt` is in the past
- **Clients** — per-client lifetime fees, ongoing run-rate, last invoice, next due, portfolio value, RIY estimate
- **Advisers** — per-adviser P&L (attributable fees by allocation share), AUM under advice, fees-by-type chart
- **CASS** — client money ledger; daily reconciliation button; amber/red warnings against the 25/45 day thresholds
- **Firm P&L** — month/quarter/year comparisons, by-type breakdown, VAT quarter export
- **Expenses** — monthly expense capture + accruals seed for PI, FCA, professional body
- **RegData** — next RMAR window, pre-filled snapshot, "what to gather" checklist
- **Q&A** — T0 rules engine (12 canned topics) with optional T3 BYOK Claude / Gemini / GPT / OpenRouter fallback

Add your firm details in Settings (cog top right), set PI premium + FCA estimate, and you're live.

### IFA bundle hand-offs

FallPractice listens on `BroadcastChannel('fall-client')` for shared client/adviser/firm records from FallOnboard / FallAdviser / FallPaper, and broadcasts `fee.recorded` messages when fees are written. Boot-time `sync.request` pulls fresh snapshots from any open peer.

Invoice generation: click **→ FallPaper** in any fee detail modal to hand off to the polished document generator (FallPaper picks up `{type:'fallpaper.invoice.generate', feeLedgerId}`).

### Disclaimer

FallPractice supports firm-side accounting for UK financial-advisory practices. It is a tool, not a regulatory submission system; FCA RegData / GABRIEL submissions remain the firm's responsibility. Sovereign — data never leaves the device.

---

## For the developer

Single HTML file. Vanilla JS. IndexedDB primary, `localStorage` settings fallback. No build step. Open `index.html` to run.

### Architecture

- **Store name:** `fallpractice-v1`
- **IDB stores:** `state`, `clients`, `advisers`, `firms`, `feeLedger`, `feeSchedules`, `cassEntries`, `expenses`, `audit`
- **Mesh:** `BroadcastChannel('fall-client')` for client/adviser/firm sync + `fee.recorded` custom message; `BroadcastChannel('fall-signal')` for `si-didy` integration
- **Audit chain:** Mansoor P3 — every write appends `{i, ts, action, prevHash, docHash, hash}` where `hash = sha256(prevHash + docHash + ts + i)`
- **Cascade:** T0 (12 canned rules) → T2 (Ollama probe `127.0.0.1:11434`) → T3 (Anthropic / Gemini / OpenAI / OpenRouter BYOK)
- **KONOMI shim:** `window.KONOMI = {active:true, tier:'sovereign', prime:739, version:'1.0.0', check:()=>({ok:true})}`
- **PWA:** manifest baked via `data:` URL

### Schema conformance

FallPractice **reads and writes** the bundle's shared Client / Adviser / Firm records (see `IFA-BUNDLE-SHARED-SCHEMA.md`). The `clients` IDB store uses the bundle's full client shape. FallPractice extends the client with one optional field, `portfolioValue` (number), used for RIY estimates when FallAdviser is not open to broadcast live AUM.

### Fee ledger record

```js
{
  id: 'fl_xxx',
  clientId, adviserId, firmId,
  ts, dateOf,                 // ms epoch + ISO date
  type: 'initial' | 'ongoing' | 'one-off' | 'transactional' | 'trail-commission',
  basis: 'flat' | 'tiered' | 'AUM%' | 'hourly' | 'commission',
  description, gross, vat, net,
  status: 'invoiced' | 'received' | 'overdue' | 'written-off',
  invoiceId, receivedAt,
  allocations: [{adviserId, costCentreId, share}]   // share sum 1.0
}
```

### `fee.recorded` broadcast (custom)

```js
{
  v: 1,
  type: 'fee.recorded',
  ts: Date.now(),
  source: 'fallpractice',
  payload: <full fee ledger entry>
}
```

Subscribers (e.g. FallPaper) can listen and offer to draft a thank-you letter / receipt. FallPractice does not require any subscriber.

### `fallpaper.invoice.generate` hand-off

```js
{
  v: 1,
  type: 'fallpaper.invoice.generate',
  source: 'fallpractice',
  payload: { feeLedgerId: 'fl_xxx' }
}
```

If FallPaper is open it picks the entry from its own copy of the fee ledger (via prior sync) or asks FallPractice for it.

### Console API

```js
FALLPRACTICE.version           // '1.0.0'
FALLPRACTICE.state()           // full state snapshot
FALLPRACTICE.ytd()             // YTD fee total
FALLPRACTICE.mtd()             // MTD fee total
FALLPRACTICE.cassHeld()        // total client money on ledger
FALLPRACTICE.recordFee({...})  // create a fee from JS
FALLPRACTICE.ask(question)     // T0/T3 Q&A
```

### postMessage RPC

```js
window.postMessage({type:'fall-rpc', action:'ping', id:'1'}, '*')
// → {type:'fall-rpc-r', id:'1', result:{ok:true, tool:'fallpractice', prime:739, version:'1.0.0'}}

window.postMessage({type:'fall-rpc', action:'ask', question:'what is CASS?', id:'2'}, '*')
// → {type:'fall-rpc-r', id:'2', result:{ok:true, answer:'...', src:'T0 · UK IFA rules engine'}}

window.postMessage({type:'fall-rpc', action:'ledger', id:'3'}, '*')
// → {type:'fall-rpc-r', id:'3', result:{ok:true, count, ytd, mtd}}
```

### Constants

| Key | Value |
|---|---|
| `TOOLNAME` | `fallpractice` |
| `VERSION` | `1.0.0` |
| `PRIME` | `739` |
| `STORE` | `fallpractice-v1` |
| `TAX_YEAR` | `2025-26` |

### License

MIT. See `LICENSE`.
