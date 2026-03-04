# bitcoin-fo — /monthly Extension

## Additional Analysis

### Cycle Positioning
1. Current temperature vs month-ago temperature
2. Which cycle phase we're likely in (accumulation / markup / distribution / markdown)
3. Historical context: where current temperature sits relative to past cycles

### Halving Timeline
1. Days since last halving
2. Days until next halving (estimated)
3. Where we are in the typical 4-year cycle pattern

### Temperature-Based Strategy Adjustments
1. Review selling tier thresholds — still appropriate?
2. Review DCA base amount — still appropriate given portfolio size?
3. Review crash deployment reserves — adequate for current cycle position?

### Monthly DCA Summary
1. Total DCA'd this month
2. Average temperature and price
3. Cumulative DCA year-to-date

### Custody Deep Audit
1. Full custody distribution across all entities
2. Self-custody ratio trend (improving/declining)
3. Any custodian concentration issues

## Output Section
Add after core monthly report:

```
## Bitcoin Monthly (bitcoin-fo pack)

### Cycle Position
Temperature: XX/100 [ZONE] (was YY last month)
Cycle phase: [accumulation/markup/distribution/markdown]
Halving: [X days ago / X days until next]

### Strategy Status
Selling ladder: [status — which phases have fired YTD]
Crash deployment: [reserves available, % deployed]
DCA this month: $X at avg temp YY

### Custody Audit
Self-custody: X% ([direction] from Y% last month)
Largest custodian: [name] at Z% of portfolio
[Any flags]

### Outlook
[1-3 BTC-specific items for next month based on temperature trajectory]
```
