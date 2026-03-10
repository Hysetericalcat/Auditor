---
name: Report
description: How to generate a markdown report summarizing batch comparison insights from statistical test results
---

# Report Skill

Generate a comprehensive markdown report that summarizes how the current batch differs from the last three batches, using the insights received after running the statistical tests via the Code skill.

## Input

You will have the **printed output** from the executed Python statistical tests (Z-Score, Grubbs, Spearman, Mahalanobis, etc.). Use these results to create the report.

## Output

A single **markdown string** structured as a complete report. Follow this template:

```markdown
# Batch Comparison Report: Batch [TARGET_BATCH_NUMBER]

## Overview
- **Target Batch**: [batch_number] (manufactured [date])
- **Reference Batches**: [batch_1], [batch_2], [batch_3]
- **Tests Performed**: [list of statistical tests run]

## Key Findings

Summarize the most critical insights in 3-5 bullet points. Lead with the most severe findings.

- 🔴 **Critical**: [any out-of-spec or critical deviations found]
- 🟡 **Warning**: [parameters trending toward spec limits]
- 🟢 **Normal**: [parameters within expected range]

## Statistical Analysis

### [Test 1 Name] (e.g. Z-Score Analysis)

Summarize what this test revealed:
- Which parameters had the highest z-scores
- What the values mean in practical terms
- Table of significant results:

| Parameter | Target Value | Historical Mean | Z-Score | Status |
|-----------|-------------|-----------------|---------|--------|
| ...       | ...         | ...             | ...     | ...    |

### [Test 2 Name] (e.g. Grubbs Test)

- Which parameters were flagged as outliers
- G-statistic vs critical value

### [Test 3 Name] (e.g. Spearman Rank Correlation)

- Which parameters show strong monotonic trends
- Direction of drift (increasing/decreasing)

### [Test 4 Name] (e.g. Mahalanobis Distance)

- Overall multivariate distance score
- Top contributing parameters

## Parameters of Concern

List the parameters that appeared across multiple tests as problematic:

| Parameter | Z-Score | Outlier? | Trend | Severity |
|-----------|---------|----------|-------|----------|
| ...       | ...     | ...      | ...   | ...      |

## Conclusion

2-3 sentences summarizing:
1. Overall batch health (pass/fail/watch)
2. Root cause hypothesis if applicable
3. Recommended next steps
```

## Rules

1. **Use the actual numbers** from the test outputs — do not fabricate or approximate
2. **Use emoji indicators** for severity: 🔴 Critical, 🟡 Warning, 🟢 Normal
3. **Include tables** for any multi-parameter results — they are easier to scan
4. **Cross-reference across tests** — if a parameter appears in multiple test results, call it out in "Parameters of Concern"
5. **Be concise** — each test section should be 3-5 lines max, let the tables do the heavy lifting
6. **End with actionable conclusion** — not just "there were deviations" but what should be investigated
