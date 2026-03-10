---
name: Implementation Plan
description: How to pick the right statistical tests to compare batches and identify differences
---

# Implementation Plan Skill

This skill is about selecting the **right statistical tests** to compare batches and identify how they differ. The agent must pick **no more than 4 tests** and output them in strict JSON format. Data extraction is handled separately by the Data skill — this skill only decides WHICH tests to run.

## Available Libraries

```
pandas, numpy, scipy, matplotlib, seaborn
```

All code is executed via the `execute_python` tool in a sandboxed Python environment.

## Output Format

The agent MUST return a JSON array of test recommendations. **Maximum 4 tests.**

```json
[
  {
    "test": "Z-Score Analysis",
    "reason": "Identifies which parameters in the target batch deviate significantly from the historical mean"
  },
  {
    "test": "Grubbs Test",
    "reason": "Detects if any target batch parameter value is a statistical outlier compared to the historical batch distribution"
  }
]
```

## Test Selection Decision Tree

The agent should follow this logic to pick the right tests based on the data:

### Step 1: Understand the Data Shape

- **pastData**: Each batch has ~36 continuous numerical parameters (yields, assays, dissolution rates, etc.)
- **deviationData**: Each batch has a list of deviation objects with severity (None/Minor/Moderate/Major/Critical)
- **Sample size**: Small N — parametric tests requiring normality assumptions are weak, prefer robust methods

### Step 2: Pick Tests by Question

| Question to Answer | Recommended Test | scipy / method |
|---|---|---|
| Which parameters shifted the most? | **Z-Score Analysis** | `scipy.stats.zscore` or manual `(x - mean) / std` |
| Is any parameter value an outlier? | **Grubbs Test** | Manual implementation using t-distribution `scipy.stats.t` |
| Did parameter distributions shift? | **Mann-Whitney U Test** | `scipy.stats.mannwhitneyu` |
| Are parameters correlated with batch order? | **Spearman Rank Correlation** | `scipy.stats.spearmanr` |
| Which parameters contribute most to batch difference? | **Mahalanobis Distance** | Manual using `numpy.linalg` |
| Is there a trend (drift) across batches? | **Linear Regression (OLS)** | `scipy.stats.linregress` |
| Did deviation severity increase? | **Chi-Square Test** | `scipy.stats.chi2_contingency` |
| Are parameter groups behaving differently? | **PCA / Dimensionality Reduction** | `numpy.linalg.eig` or manual SVD |

### Step 3: Prioritize Based on Context

Pick tests in this priority order:

1. **Always include Z-Score Analysis** — it's the most informative for small N, directly shows which parameters shifted
2. **If target batch has Critical/Major deviations** → add Grubbs Test to confirm outlier status statistically
3. **If comparing parameter trends over time** → add Spearman Rank Correlation or Linear Regression
4. **If comparing overall batch profiles** → add Mahalanobis Distance or PCA

### Step 4: Do NOT Pick

- **t-tests** — unreliable with N=3-4 (too few samples per group)
- **ANOVA** — requires more groups and larger samples
- **Kolmogorov-Smirnov** — needs larger sample sizes to be meaningful
- **Normality tests (Shapiro-Wilk)** — meaningless with N < 8

## Example Test Selection Scenarios

### Scenario A: Target batch has a Critical deviation (e.g. compression_hardness_min out of spec)
```json
[
  { "test": "Z-Score Analysis", "reason": "Quantifies how many standard deviations each parameter in batch 119069 deviates from the historical mean" },
  { "test": "Grubbs Test", "reason": "Statistically confirms whether compression_hardness_min = 32.2 N is a true outlier given the historical batch values" },
  { "test": "Spearman Rank Correlation", "reason": "Detects if there is a monotonic trend (drift) in key parameters like dissolution and hardness across batches" },
  { "test": "Mahalanobis Distance", "reason": "Measures overall multivariate distance of the target batch from the historical batch cluster to quantify how anomalous the batch is overall" }
]
```

### Scenario B: Target batch is within spec but user wants trend analysis
```json
[
  { "test": "Z-Score Analysis", "reason": "Identifies parameters in the target batch that are furthest from the historical mean even if within spec" },
  { "test": "Linear Regression", "reason": "Fits a trend line across batch sequence for each parameter to detect gradual drift toward spec limits" },
  { "test": "Spearman Rank Correlation", "reason": "Non-parametric check for monotonic trends in process parameters across batches" },
  { "test": "PCA", "reason": "Reduces the 36-parameter space to principal components to visualize if the target batch clusters with or separates from preceding batches" }
]
```

## Important Rules

1. **Maximum 4 tests** — do not exceed this
2. **Always output strict JSON** in the format `{ "test": "...", "reason": "..." }`
3. **Reason must reference the actual data** — mention specific batch numbers, parameter names, or severity levels
4. **Small sample awareness** — never recommend a test that requires N > 10 when we only have 3-4 data points
5. **Be specific** — "Z-Score Analysis" not just "statistical comparison"
