---
name: Code Execution
description: How to generate and execute Python code for statistical tests on batch manufacturing data
---

# Code Execution Skill

This skill handles generating Python code that performs statistical tests on batch JSON data. The code runs in a sandboxed Docker environment via the `execute_python` tool.

## Prerequisites — Get the Data First

Before writing any Python code, you MUST extract the batch JSON data using the tools from `data-utils.ts`:

1. Call `extract_target_batch({ batchNumber })` → gets the **current batch** JSON (pastData + deviationData)
2. Call `extract_last_three_batches({ batchNumber })` → gets the **last 3 batches** JSON (pastBatches + deviationBatches)

These return JSON strings. You will embed this data directly into the Python code as inline dictionaries.

## Available Libraries

```python
import pandas as pd
import numpy as np
from scipy import stats
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
```

## Code Generation Rules

### 1. Embed JSON Data Inline

The sandbox has no filesystem access to your JSONs. Embed the data directly:

```python
target_batch = {
    "batch_number": "119069",
    "manufacturing_date": "2025-03-11",
    "parameters": {
        "api_assay_bempedoic_acid": 100.0,
        "binder_spray_rate": 2.124,
        # ... all parameters from extract_target_batch result
    }
}

past_batches = [
    { "batch_number": "118998", "manufacturing_date": "2025-03-04", "parameters": { ... } },
    { "batch_number": "118997", "manufacturing_date": "2025-03-01", "parameters": { ... } },
    { "batch_number": "118995", "manufacturing_date": "2025-02-19", "parameters": { ... } },
]
```

### 2. Print EVERY Single Output

The sandbox only returns what is printed to stdout. If you don't print it, the agent cannot see it. Every computation must be printed.

```python
# CORRECT — print everything
print("=== Z-Score Analysis ===")
for param, zscore in results.items():
    print(f"  {param}: z-score = {zscore:.4f}")

print(f"\nTop 5 deviating parameters:")
for param, zscore in sorted_results[:5]:
    print(f"  {param}: {zscore:.4f}")

print(f"\nSummary: {len(significant)} parameters with |z| > 2")

# WRONG — no output captured
results = compute_zscores(data)  # result is lost!
```

### 3. Structure the Code

Every Python script must follow this structure:

```python
import pandas as pd
import numpy as np
from scipy import stats
import json

# ── 1. DATA (embedded from tool results) ──
target_batch = { ... }
past_batches = [ ... ]

# ── 2. BUILD DATAFRAME ──
all_batches = past_batches + [target_batch]
params = [b["parameters"] for b in all_batches]
df = pd.DataFrame(params)
df.insert(0, "batch_number", [b["batch_number"] for b in all_batches])
print("DataFrame shape:", df.shape)
print(df.to_string())

# ── 3. RUN STATISTICAL TEST ──
print("\n=== [Test Name] ===")
# ... test logic ...

# ── 4. PRINT ALL RESULTS ──
print("\n=== Results ===")
# ... every result printed with labels ...

# ── 5. PRINT FINAL SUMMARY ──
print("\n=== Summary ===")
print(json.dumps(summary_dict, indent=2))
```

## Code Templates Per Test

### Z-Score Analysis

```python
import pandas as pd
import numpy as np
import json

target_batch = { ... }  # from extract_target_batch
past_batches = [ ... ]  # from extract_last_three_batches

past_params = pd.DataFrame([b["parameters"] for b in past_batches])
target_params = target_batch["parameters"]

print("=== Z-Score Analysis ===")
print(f"Target batch: {target_batch['batch_number']}")
print(f"Reference batches: {[b['batch_number'] for b in past_batches]}\n")

results = {}
for col in past_params.columns:
    mean = past_params[col].mean()
    std = past_params[col].std()
    if std == 0:
        z = 0.0
    else:
        z = (target_params[col] - mean) / std
    results[col] = {"z_score": round(z, 4), "target": target_params[col], "hist_mean": round(mean, 4), "hist_std": round(std, 4)}
    print(f"  {col}: z={z:.4f} (target={target_params[col]}, mean={mean:.4f}, std={std:.4f})")

significant = {k: v for k, v in results.items() if abs(v["z_score"]) > 2}
print(f"\n=== Significant Deviations (|z| > 2) ===")
for param, vals in sorted(significant.items(), key=lambda x: abs(x[1]["z_score"]), reverse=True):
    print(f"  {param}: z={vals['z_score']}")

print(f"\nTotal significant: {len(significant)} / {len(results)}")
print(f"\n=== JSON Output ===")
print(json.dumps({"test": "Z-Score Analysis", "significant_params": significant, "total_params": len(results)}, indent=2))
```

### Grubbs Test

```python
import pandas as pd
import numpy as np
from scipy import stats
import json

target_batch = { ... }
past_batches = [ ... ]

all_batches = past_batches + [target_batch]
all_params = pd.DataFrame([b["parameters"] for b in all_batches])

print("=== Grubbs Test (Outlier Detection) ===")
n = len(all_params)
t_crit = stats.t.ppf(1 - 0.05 / (2 * n), n - 2)
grubbs_crit = ((n - 1) / np.sqrt(n)) * np.sqrt(t_crit**2 / (n - 2 + t_crit**2))

print(f"N={n}, Grubbs critical value={grubbs_crit:.4f}\n")

outliers = {}
for col in all_params.columns:
    values = all_params[col].values
    mean = np.mean(values)
    std = np.std(values, ddof=1)
    if std == 0:
        continue
    target_val = values[-1]  # target batch is last
    G = abs(target_val - mean) / std
    is_outlier = G > grubbs_crit
    print(f"  {col}: G={G:.4f}, critical={grubbs_crit:.4f}, outlier={is_outlier}")
    if is_outlier:
        outliers[col] = {"G_statistic": round(G, 4), "value": target_val, "mean": round(mean, 4)}

print(f"\n=== Outlier Parameters ===")
for param, vals in outliers.items():
    print(f"  {param}: G={vals['G_statistic']} (value={vals['value']}, mean={vals['mean']})")

print(f"\nTotal outliers: {len(outliers)} / {len(all_params.columns)}")
print(f"\n=== JSON Output ===")
print(json.dumps({"test": "Grubbs Test", "outliers": outliers, "critical_value": round(grubbs_crit, 4)}, indent=2))
```

### Spearman Rank Correlation

```python
import pandas as pd
import numpy as np
from scipy import stats
import json

target_batch = { ... }
past_batches = [ ... ]

all_batches = past_batches + [target_batch]
all_batches.sort(key=lambda b: b["manufacturing_date"])
all_params = pd.DataFrame([b["parameters"] for b in all_batches])
batch_order = list(range(len(all_batches)))

print("=== Spearman Rank Correlation (Trend Detection) ===")
print(f"Batch order: {[b['batch_number'] for b in all_batches]}\n")

trends = {}
for col in all_params.columns:
    rho, p_value = stats.spearmanr(batch_order, all_params[col].values)
    direction = "increasing" if rho > 0 else "decreasing"
    print(f"  {col}: rho={rho:.4f}, p={p_value:.4f}, trend={direction}")
    if abs(rho) >= 0.8:
        trends[col] = {"rho": round(rho, 4), "p_value": round(p_value, 4), "direction": direction}

print(f"\n=== Strong Trends (|rho| >= 0.8) ===")
for param, vals in trends.items():
    print(f"  {param}: rho={vals['rho']}, direction={vals['direction']}")

print(f"\nTotal strong trends: {len(trends)} / {len(all_params.columns)}")
print(f"\n=== JSON Output ===")
print(json.dumps({"test": "Spearman Rank Correlation", "strong_trends": trends}, indent=2))
```

### Mahalanobis Distance

```python
import pandas as pd
import numpy as np
import json

target_batch = { ... }
past_batches = [ ... ]

past_params = pd.DataFrame([b["parameters"] for b in past_batches])
target_vals = np.array([target_batch["parameters"][col] for col in past_params.columns])

mean_vec = past_params.mean().values
cov_matrix = past_params.cov().values

print("=== Mahalanobis Distance ===")
try:
    cov_inv = np.linalg.pinv(cov_matrix)
    diff = target_vals - mean_vec
    mahal_dist = np.sqrt(diff @ cov_inv @ diff)
    print(f"Mahalanobis distance: {mahal_dist:.4f}")
    print(f"Interpretation: Higher values = target batch is more anomalous")

    param_contributions = {}
    for i, col in enumerate(past_params.columns):
        contrib = abs(diff[i]) * np.sqrt(abs(cov_inv[i, i]))
        param_contributions[col] = round(contrib, 4)
        print(f"  {col}: contribution={contrib:.4f}")

    top_contributors = dict(sorted(param_contributions.items(), key=lambda x: x[1], reverse=True)[:10])
    print(f"\n=== Top 10 Contributors ===")
    for p, c in top_contributors.items():
        print(f"  {p}: {c}")

    print(f"\n=== JSON Output ===")
    print(json.dumps({"test": "Mahalanobis Distance", "distance": round(mahal_dist, 4), "top_contributors": top_contributors}, indent=2))
except Exception as e:
    print(f"Error: {e}")
```

## Important Rules

1. **PRINT EVERYTHING** — the sandbox only returns stdout. Any unprinted result is lost forever
2. **Embed data inline** — no file I/O, no external API calls from the sandbox
3. **Always print a JSON summary** at the end with `json.dumps()` for structured parsing
4. **Use `matplotlib.use('Agg')`** if importing matplotlib (no display in sandbox)
5. **Handle edge cases** — division by zero (std=0), singular covariance matrices (use `pinv`), missing parameters
6. **Label every print** — use headers like `=== Test Name ===` so outputs are scannable
