# bitcoin-fo — /check Extension

## Additional Checks

### Real-Time Temperature
1. Current temperature score and zone
2. How far from nearest zone boundary (e.g., "12 points from HOT zone")
3. Rate of change if multiple recent readings available

### BTC-Specific Stress Scenarios
In addition to core stress test (which uses portfolio-level drawdowns), add BTC-specific scenarios:

1. **Cycle top replay (-75% BTC):** Historical worst from ATH
   - Run: `calculateCrashSurvival` with 75% drawdown
   - Show: runway months, portfolio value, survival status

2. **Flash crash (-30% in 24h):**
   - Run: `calculateCrashSurvival` with 30% drawdown
   - Show: any margin calls? Any automated liquidations? DCA opportunity?

3. **Exchange failure (largest exchange holding → 0):**
   - Simulate losing all assets at largest exchange custodian
   - Show: portfolio impact, remaining runway, custody concentration after loss

4. **Prolonged bear (-60% for 18 months):**
   - Run crash survival at -60%
   - Check: can runway survive 18 months at current burn with reduced portfolio?

### Custody Verification
1. Self-custody ratio
2. Any single custodian above threshold
3. Last verification dates for each custodian

## Output Section
Add after core check report:

```
## Bitcoin Risk (bitcoin-fo pack)
Temperature: XX/100 [ZONE]
Distance to next zone: [X points to ZONE]

### BTC Stress Scenarios
| Scenario | Portfolio After | Runway | Status |
|----------|---------------|--------|--------|
| Cycle top (-75%) | $X | Y mo | [status] |
| Flash crash (-30%) | $X | Y mo | [status] |
| Exchange failure | $X | Y mo | [status] |
| Prolonged bear (-60%, 18mo) | $X | Y mo | [status] |

Custody: X% self-custody [ZONE]
[Any custody flags]
```
