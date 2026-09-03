# Tasks: Crop Recommendation ML Model Training

**Input**: `specs/crop-recommendation/spec.md`, `specs/crop-recommendation/data-model.md`, `specs/crop-recommendation/contracts/route-handlers.md`
**Output**: `public/models/crop-scoring/model.json` + weight shards
**Prerequisite**: `specs/003-crop-recommendation/train-model.py` (scaffold)

---

## Phase 1: Training Data Preparation

**Purpose**: Build a representative labelled dataset from the crop catalogue, soil profiles, and rotation rules so the model learns real agronomic relationships instead of dummy patterns.

- [ ] T001 Define the 10-input feature vector schema matching `train-model.py`'s `Input(shape=(10,))`:
  - `soil_type` (one-hot, 9 values: 8 soil types + other)
  - `irrigation_type` (one-hot, 4 values: rainfed / canal / tubewell / mixed)
  - `budget_bracket` (one-hot, 4 values: low / medium / high / very_high)
  - `season` (one-hot, 6 values: summer / winter / autumn / spring / rainy / windy)
  - `crop_water_requirement` (1 value: 0=low, 0.5=medium, 1=high)
  - `crop_category` (one-hot, 4 values: staple / cash / pulse / vegetable)
  - `expected_revenue_per_acre` (1 value: normalised 0–1 from `crops.capital_requirement_per_acre_pkr`)
  - `capital_requirement_per_acre` (1 value: normalised 0–1)
  - `weather_fit` (1 value: 0–1 from weather forecast match to season)
  - `market_trend` (1 value: -1 to +1 from `crop_price_trends.trend`)

- [ ] T002 Define the label schema (model output, shape=(1,)):
  - `suitability_score` 0.0–1.0 — composite score combining soil compatibility (`crop_soil_compatibility.suitability_score`), weather fit, profitability, risk, and sustainability (rotation fit from `crop_rotation_rules` + nitrogen-fixing flag for pulses)

- [ ] T003 Build a labelled dataset generator (`specs/003-crop-recommendation/build-dataset.py`) that:
  - Reads all ~12 demo crops from `crops` table (or the seed SQL in `db/migrations/0009_crop_recommendation.sql`)
  - Reads `crop_soil_compatibility` scores
  - Reads `crop_rotation_rules` for sustainability signal
  - Reads `soil_profiles` for district-level defaults
  - Reads `crop_price_trends` for market signal
  - Generates one training example per (crop, soil_type, irrigation_type, budget_bracket, season) combination
  - Applies the same weighted scoring formula used by `lib/crops/scoring.ts` (5 dimensions) to compute the ground-truth label
  - Outputs `specs/003-crop-recommendation/data/train.csv` and `data/val.csv` (80/20 split)
  - Shuffles with fixed seed (42) for reproducibility

- [ ] T004 Add a `data/` directory to `specs/003-crop-recommendation/` and add `data/` to `.gitignore` (generated artefacts are rebuildable from seeds)

- [ ] T005 Document the feature→label mapping in `specs/003-crop-recommendation/FEATURES.md` so future maintainers understand what each input column represents

**Checkpoint**: `python specs/003-crop-recommendation/build-dataset.py` produces `data/train.csv` with ≥ 500 rows (minimum: 12 crops × 9 soil types × 4 irrigation × 4 budget × 6 seasons × some valid combos) and a matching `data/val.csv`.

---

## Phase 2: Model Architecture & Training Script

**Purpose**: Replace the dummy-dataset path in `train-model.py` with real data loading, and tune the architecture for the actual input/output shapes.

- [ ] T006 Update `train-model.py` to load `data/train.csv` and `data/val.csv` instead of calling `build_dummy_dataset()`
- [ ] T007 Normalise input features to [0, 1] range (or standardise) before feeding to the model — document the normalisation parameters (min/max per column) so the inference side can apply the same transform
- [ ] T008 Save normalisation parameters (`specs/003-crop-recommendation/data/normalisation.json`) alongside the model so the client can pre-process inputs identically
- [ ] T009 Tune the model architecture for the 10-dimensional input:
  - Input layer: shape=(10,)
  - Hidden layer 1: Dense(64, relu) + Dropout(0.2)
  - Hidden layer 2: Dense(32, relu) + Dropout(0.2)
  - Output layer: Dense(1, sigmoid)
  - Optimiser: Adam(lr=0.001)
  - Loss: binary_crossentropy
  - Metrics: mae, mse
- [ ] T010 Add training callbacks:
  - EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)
  - ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=5)
- [ ] T011 Add training logging output (epoch, loss, val_loss, mae) so convergence can be verified manually
- [ ] T012 Add model evaluation output after training: print val_mae, val_mse, and a sample of 5 predictions vs actuals

**Checkpoint**: `python specs/003-crop-recommendation/train-model.py` runs end-to-end on real data, prints convergence metrics, and writes `public/models/crop-scoring/model.json` + weight shards + `normalisation.json`.

---

## Phase 3: Model Validation

**Purpose**: Verify the trained model produces sensible scores before it is wired into the production scoring engine.

- [ ] T013 Write `specs/003-crop-recommendation/validate-model.py` that:
  - Loads the saved model and normalisation parameters
  - Runs the full validation set through the model
  - Reports: mean absolute error, R² score, and a confusion-style table (predicted score buckets vs actual score buckets)
  - Prints the top-3 predicted crops for 3 reference scenarios and compares against the scoring-engine top-3 from `lib/crops/scoring.ts`
- [ ] T014 Define acceptance thresholds:
  - val_mae < 0.08 on the normalised [0,1] scale
  - R² > 0.85 on the validation set
  - Top-3 overlap with scoring-engine top-3 ≥ 2/3 crops for each reference scenario
- [ ] T015 Add a `--seed-catalogue` CLI flag to `train-model.py` that regenerates `data/train.csv` from the current database catalogue (so the dataset stays in sync when the crop catalogue is updated)
- [ ] T016 Document the validation thresholds and how to re-run training in `specs/003-crop-recommendation/README.md`

**Checkpoint**: `python specs/003-crop-recommendation/validate-model.py` passes all thresholds. Reference scenario top-3 overlap is ≥ 2/3.

---

## Phase 4: Integration with Scoring Engine

**Purpose**: Connect the trained TF.js model to `lib/crops/scoring.ts` as an optional inference backend.

- [ ] T017 Add a `use_ml_model` flag to `lib/crops/scoring.ts` configuration (default: `false` — Python scoring remains the authority until the model is verified)
- [ ] T018 Implement `lib/crops/ml-model.ts`:
  - Load `public/models/crop-scoring/model.json` + normalisation.json at module init
  - Export `predictSuitability(inputVector: number[]): Promise<number>` that runs inference and returns the 0–1 suitability score
  - Apply the same normalisation (min/max per column) before inference and denormalise the output if needed
- [ ] T019 Add a fallback path: if the TF.js model fails to load or infer, fall back to the Python scoring engine with a warning log — the feature must never break because the model is unavailable
- [ ] T020 Wire `recommendCrops()` in `lib/crops/engine.ts` to call `predictSuitability()` when `use_ml_model` is `true`, and use the returned score as the `suitability_score` dimension in the 5-dimension weighted sum
- [ ] T021 Add a model version check: store the model's training data version (git SHA of `data/train.csv` at training time) in `model.json` metadata; if the catalogue has changed since training, log a warning suggesting re-training

**Checkpoint**: With `use_ml_model: true`, `recommendCrops()` returns the same top-3 for reference scenarios as the pure-Python path (within tolerance).

---

## Phase 5: CI & Reproducibility

**Purpose**: Ensure the model is rebuilt automatically when the catalogue or scoring weights change.

- [ ] T022 Add an npm script to `package.json`: `"train:crop-model": "python specs/003-crop-recommendation/train-model.py"`
- [ ] T023 Add an npm script: `"validate:crop-model": "python specs/003-crop-recommendation/validate-model.py"`
- [ ] T024 Add a pre-commit check or CI step (in the repo's existing CI config) that runs `validate:crop-model` and fails if thresholds are not met
- [ ] T025 Add `public/models/crop-scoring/` to `.gitignore` — model artefacts are generated at build/deploy time, not committed
- [ ] T026 Document the retrain trigger conditions in `specs/003-crop-recommendation/README.md`:
  - Crop catalogue changes (add/remove/edit crops in `crops` table)
  - Scoring weight changes in `lib/crops/scoring.ts`
  - Soil profile updates in `soil_profiles`
  - Price trend schema changes

**Checkpoint**: `npm run train:crop-model && npm run validate:crop-model` completes end-to-end in CI.

---

## Dependencies

| Task | Depends on |
|------|-----------|
| T001 | spec.md (crop catalogue, soil types, seasons), data-model.md |
| T002 | T001 |
| T003 | T002, db/migrations/0009 (catalogue seed data) |
| T004 | T003 |
| T005 | T003 |
| T006 | T004 |
| T007 | T006 |
| T008 | T006 |
| T009 | T007, T008 |
| T010 | T009 |
| T011 | T010 |
| T012 | T011 |
| T013 | T012 |
| T014 | T012 |
| T015 | T013 |
| T016 | T015 |
| T017 | spec.md (scoring weights, dimensions) |
| T018 | T016 |
| T019 | T018 |
| T020 | T017, T019 |
| T021 | T020 |
| T022 | T012 |
| T023 | T012 |
| T024 | T022, T023 |
| T025 | T024 |
| T026 | T025 |
