import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      {/* 1. Detached Stadium Pill Navigation Bar */}
      <header>
        <nav className="nav-pill" aria-label="SentinelAI main navigation">
          <Link className="brand" href="/" aria-label="SentinelAI home">
            <span className="brand-mark" aria-hidden="true">S</span>
            <span className="brand-title">SentinelAI</span>
          </Link>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#defense-tiers">5-Tier Defense</a>
            <a href="#architecture">Architecture</a>
            <a href="#security">Security</a>
          </div>
          <div className="nav-actions">
            <span className="nav-security">SIH26188 · MHA</span>
            <Link className="nav-cta-btn" href="/test">
              Launch Testing Console →
            </Link>
          </div>
        </nav>
      </header>

      {/* 2. Hero Section */}
      <section className="hero" id="hero">
        <p className="eyebrow">Ctrl S · Ministry of Home Affairs · AI Document Screening</p>
        <h1>Verify identity with evidence, not assumptions.</h1>
        <p className="hero-copy">
          An offline-first multi-tier document screening and biometric verification engine.
          Eliminates false senses of security with deterministic cryptography, passive forensics,
          and tamper-proof blockchain audit trails.
        </p>

        <div className="hero-actions">
          <Link className="button-primary" href="/test">
            Launch Testing Console →
          </Link>
          <a className="button-secondary" href="#defense-tiers">
            Explore 5-Tier Defense ↓
          </a>
        </div>

        {/* Highlight Metric Pills */}
        <div className="hero-metrics" aria-label="Key system performance metrics">
          <div className="metric-pill">
            <span className="metric-dot" aria-hidden="true" />
            <span className="metric-val">&lt; 800ms</span>
            <span className="metric-lbl">Latency</span>
          </div>
          <div className="metric-pill">
            <span className="metric-dot" aria-hidden="true" />
            <span className="metric-val">5-Tier</span>
            <span className="metric-lbl">Defense-in-Depth</span>
          </div>
          <div className="metric-pill">
            <span className="metric-dot" aria-hidden="true" />
            <span className="metric-val">0 Bytes</span>
            <span className="metric-lbl">Biometric Persistence (Match-and-Discard)</span>
          </div>
          <div className="metric-pill">
            <span className="metric-dot" aria-hidden="true" />
            <span className="metric-val">SHA-256</span>
            <span className="metric-lbl">Polygon Amoy Ledger</span>
          </div>
        </div>
      </section>

      {/* Core Features Overview Section */}
      <section className="showcase-section" id="features" aria-labelledby="features-heading">
        <div className="section-header">
          <p className="eyebrow">Core Capabilities</p>
          <h2 className="section-title" id="features-heading">Sovereign-Grade Document Screening</h2>
          <p className="section-subtitle">
            Engineered for immigration checkpoints, consular border control, and high-assurance
            identity verification with zero reliance on centralized cloud vendors.
          </p>
        </div>

        <div className="features-grid">
          <article className="feature-card">
            <div className="feature-top">
              <div className="feature-glyph" aria-hidden="true">⌁</div>
              <span className="feature-tag">Hybrid Defense</span>
            </div>
            <h3>Multi-Modal Verification</h3>
            <p>
              Simultaneously validates physical document security traits, ICAO 9303 cryptographic check digits,
              OCR text schemas, and live facial biometrics in a single atomic pass.
            </p>
          </article>

          <article className="feature-card">
            <div className="feature-top">
              <div className="feature-glyph" aria-hidden="true">⚡</div>
              <span className="feature-tag">Edge Native</span>
            </div>
            <h3>100% Offline Capability</h3>
            <p>
              Pure local ONNX execution. Functions autonomously at remote border posts, naval check stations,
              and tactical checkpoints with zero internet and zero telemetry.
            </p>
          </article>

          <article className="feature-card">
            <div className="feature-top">
              <div className="feature-glyph" aria-hidden="true">◫</div>
              <span className="feature-tag">Passive Forensics</span>
            </div>
            <h3>Pixel-Level Forensic Vision</h3>
            <p>
              Detects photo replacement, JPEG recompression discrepancies (ELA Q=90), and halftone print patterns (2D FFT)
              without requiring active user intervention or specialized sensors.
            </p>
          </article>

          <article className="feature-card">
            <div className="feature-top">
              <div className="feature-glyph" aria-hidden="true">⛓</div>
              <span className="feature-tag">Non-Repudiation</span>
            </div>
            <h3>Cryptographic Audit Dockets</h3>
            <p>
              Every decision produces an automated SHA-256 evidence PDF docket anchored into an append-only
              Merkle hash chain on the Polygon Amoy blockchain.
            </p>
          </article>

          <article className="feature-card">
            <div className="feature-top">
              <div className="feature-glyph" aria-hidden="true">🛡</div>
              <span className="feature-tag">DPDP Compliant</span>
            </div>
            <h3>Match-and-Discard Privacy</h3>
            <p>
              Facial biometric embeddings and live video frames exist ephemerally in RAM and are immediately wiped
              post-inference. Zero bytes are stored on disk.
            </p>
          </article>

          <article className="feature-card">
            <div className="feature-top">
              <div className="feature-glyph" aria-hidden="true">⚖</div>
              <span className="feature-tag">Zero Black-Box</span>
            </div>
            <h3>Deterministic Decision Fusion</h3>
            <p>
              Replaces opaque AI predictions with an explainable Bayesian risk model. Evaluates each tier against
              hard mathematical rules, issuing unambiguous CLEAR, REVIEW, FLAG, or HARD_REJECT verdicts.
            </p>
          </article>
        </div>
      </section>

      {/* 3. The 5-Tier Defense-in-Depth Architecture Showcase (#defense-tiers) */}
      <section className="showcase-section" id="defense-tiers" aria-labelledby="tiers-heading">
        <div className="section-header">
          <p className="eyebrow">Defense-in-Depth</p>
          <h2 className="section-title" id="tiers-heading">The 5-Tier Verification Architecture</h2>
          <p className="section-subtitle">
            A cascading defense matrix combining deterministic cryptography, computer vision,
            signal processing, live biometrics, and distributed ledger provenance.
          </p>
        </div>

        <div className="tiers-showcase-grid">
          {/* Tier 1: Deterministic ICAO 9303 Cryptography */}
          <article className="tier-showcase-card tier-card-1">
            <div className="tier-info">
              <div className="tier-header">
                <span className="tier-color-pill">Tier 1 · Electric Blue</span>
                <span className="tier-tech-badge">ICAO Doc 9303</span>
                <span className="tier-tech-badge">&lt; 10ms execution</span>
              </div>
              <h3 className="tier-showcase-title">Deterministic ICAO 9303 Cryptography</h3>
              <p className="tier-showcase-desc">
                Executes standard-compliant 7-3-1 weight cycling modulo 10 checksum validation over Machine Readable
                Travel Documents (MRTD). Mathematically validates Passport Number, Date of Birth, Expiry Date, and
                Composite checksums. Immediate hard-rejection is enforced upon any single tampered character.
              </p>
              <ul className="tier-bullets">
                <li className="tier-bullet-item">
                  <span className="tier-bullet-icon">✓</span>
                  <span><strong>7-3-1 Weight Cycling:</strong> Modulo-10 checksum validation against ISO/IEC 7810 and ICAO Doc 9303 standards.</span>
                </li>
                <li className="tier-bullet-item">
                  <span className="tier-bullet-icon">✓</span>
                  <span><strong>Instant Hard Rejection:</strong> Any check-digit discrepancy triggers an immediate HARD_REJECT verdict before executing costly neural passes.</span>
                </li>
                <li className="tier-bullet-item">
                  <span className="tier-bullet-icon">✓</span>
                  <span><strong>Zero False Acceptance:</strong> 100% deterministic mathematical boundary guarding against manual digit alteration or forgery.</span>
                </li>
              </ul>
            </div>
            <div className="tier-tech-box">
              <div>
                <div className="tech-box-label">Algorithm Specification</div>
                <div className="tech-box-code">{`// ICAO 9303 Modulo 10 Checksum
weights = [7, 3, 1]
sum = 0
for i, char in enumerate(mrz_field):
  val = char_to_val(char)
  sum += val * weights[i % 3]
check_digit = sum % 10

if calculated != actual:
  verdict = "HARD_REJECT"
  flags.append("ICAO_CHECKSUM_TAMPER")`}</div>
              </div>
              <div className="tech-box-stats">
                <div className="stat-item">
                  <span className="stat-val">Mod 10 (7-3-1)</span>
                  <span className="stat-lbl">Mathematical Core</span>
                </div>
                <div className="stat-item">
                  <span className="stat-val">0% Tolerance</span>
                  <span className="stat-lbl">Checksum Discrepancy</span>
                </div>
              </div>
            </div>
          </article>

          {/* Tier 2: PP-OCRv4 & VIZ-to-MRZ Schema Reconciliation */}
          <article className="tier-showcase-card tier-card-2">
            <div className="tier-info">
              <div className="tier-header">
                <span className="tier-color-pill">Tier 2 · Teal / Cyan</span>
                <span className="tier-tech-badge">PP-OCRv4 ONNX</span>
                <span className="tier-tech-badge">~120ms execution</span>
              </div>
              <h3 className="tier-showcase-title">PP-OCRv4 &amp; VIZ-to-MRZ Schema Reconciliation</h3>
              <p className="tier-showcase-desc">
                High-performance ONNX optical character recognition pipeline equipped with chevron noise recovery.
                Extracts multi-lingual fields from the Visual Inspection Zone (VIZ) and reconciles them against MRZ lines
                using Levenshtein distance matching to detect text splicing or identity swapping.
              </p>
              <ul className="tier-bullets">
                <li className="tier-bullet-item">
                  <span className="tier-bullet-icon">✓</span>
                  <span><strong>RapidOCR ONNX Engine:</strong> Ultra-fast text detection (DBNet) and directional text recognition (SVTR) models.</span>
                </li>
                <li className="tier-bullet-item">
                  <span className="tier-bullet-icon">✓</span>
                  <span><strong>Chevron Noise Recovery:</strong> Automatically corrects scan artifacts and degraded filler chevrons (&lt;&lt;) in degraded passport scans.</span>
                </li>
                <li className="tier-bullet-item">
                  <span className="tier-bullet-icon">✓</span>
                  <span><strong>Cross-Zone Reconciliation:</strong> Calculates normalized Levenshtein distance for Given Names, Surname, DOB, Nationality, and Passport Number.</span>
                </li>
              </ul>
            </div>
            <div className="tier-tech-box">
              <div>
                <div className="tech-box-label">Schema Reconciliation Engine</div>
                <div className="tech-box-code">{`// VIZ-to-MRZ Cross Verification
viz = extract_viz_fields(document_img)
mrz = parse_mrz_lines(raw_mrz)

name_dist = levenshtein(viz.name, mrz.name)
if name_dist > 2 or viz.dob != mrz.dob:
  tier2_status = "MISMATCH"
  risk_delta += 45
  reason = "VIZ_MRZ_FIELD_DISCREPANCY"`}</div>
              </div>
              <div className="tech-box-stats">
                <div className="stat-item">
                  <span className="stat-val">Levenshtein &le; 2</span>
                  <span className="stat-lbl">Name Match Threshold</span>
                </div>
                <div className="stat-item">
                  <span className="stat-val">Exact Match</span>
                  <span className="stat-lbl">DOB / DocID Parity</span>
                </div>
              </div>
            </div>
          </article>

          {/* Tier 3: Passive Forensic Signal Processing */}
          <article className="tier-showcase-card tier-card-3">
            <div className="tier-info">
              <div className="tier-header">
                <span className="tier-color-pill">Tier 3 · Amethyst Violet</span>
                <span className="tier-tech-badge">ELA Q=90 + 2D FFT</span>
                <span className="tier-tech-badge">~250ms execution</span>
              </div>
              <h3 className="tier-showcase-title">Passive Forensic Signal Processing</h3>
              <p className="tier-showcase-desc">
                Inspects pixel-level physical artifacts and spatial frequency signatures without relying on user cooperation.
                Identifies digital image manipulation, spliced photo boundaries, and printed counterfeit substrates.
              </p>
              <ul className="tier-bullets">
                <li className="tier-bullet-item">
                  <span className="tier-bullet-icon">✓</span>
                  <span><strong>Error Level Analysis (ELA Q=90):</strong> Resaves image at 90% quality and computes pixel error matrices to expose differential compression across photoshopped text and replaced headshots.</span>
                </li>
                <li className="tier-bullet-item">
                  <span className="tier-bullet-icon">✓</span>
                  <span><strong>2D Fast Fourier Transform (FFT):</strong> Transforms spatial pixel grids into frequency domain power spectrums to detect periodic halftone dot screens and laser printer rasterization.</span>
                </li>
                <li className="tier-bullet-item">
                  <span className="tier-bullet-icon">✓</span>
                  <span><strong>Forensic Curtain Heatmap:</strong> Generates real-time visual heatmaps allowing border inspectors to swipe between raw document and compression anomalies.</span>
                </li>
              </ul>
            </div>
            <div className="tier-tech-box">
              <div>
                <div className="tech-box-label">Signal Processing Core</div>
                <div className="tech-box-code">{`// ELA Compression Differential
resaved = jpeg_encode(raw_img, quality=90)
diff_matrix = abs(raw_img - resaved) * scale
anomaly_score = mean_top_percentile(diff_matrix)

// 2D FFT Spectral Peak Detection
fft_spectrum = fftshift(fft2(grayscale_img))
halftone_peaks = detect_frequency_harmonics(fft_spectrum)
if halftone_peaks > THRESHOLD:
  flags.append("PRINT_HALFTONE_SCREEN_DETECTED")`}</div>
              </div>
              <div className="tech-box-stats">
                <div className="stat-item">
                  <span className="stat-val">Q = 90</span>
                  <span className="stat-lbl">JPEG ELA Baseline</span>
                </div>
                <div className="stat-item">
                  <span className="stat-val">2D FFT</span>
                  <span className="stat-lbl">Halftone Screen Analysis</span>
                </div>
              </div>
            </div>
          </article>

          {/* Tier 4: Ephemeral ArcFace & MiniFASNet Anti-Spoofing */}
          <article className="tier-showcase-card tier-card-4">
            <div className="tier-info">
              <div className="tier-header">
                <span className="tier-color-pill">Tier 4 · Warm Amber</span>
                <span className="tier-tech-badge">ArcFace + MiniFASNet</span>
                <span className="tier-tech-badge">~280ms execution</span>
              </div>
              <h3 className="tier-showcase-title">Ephemeral ArcFace &amp; MiniFASNet Anti-Spoofing</h3>
              <p className="tier-showcase-desc">
                High-assurance 1:1 facial biometric verification between document portrait crop and live webcam feed.
                Coupled with state-of-the-art presentation attack detection and a strict privacy guarantee.
              </p>
              <ul className="tier-bullets">
                <li className="tier-bullet-item">
                  <span className="tier-bullet-icon">✓</span>
                  <span><strong>InsightFace ArcFace 1:1 Matching:</strong> Extracts 512-dimensional hyperspherical facial embeddings, computing cosine similarity (threshold &ge; 0.45).</span>
                </li>
                <li className="tier-bullet-item">
                  <span className="tier-bullet-icon">✓</span>
                  <span><strong>MiniFASNet 2.7 Anti-Spoofing:</strong> Neural presentation attack detection (threshold &ge; 0.70) blocking 2D printed masks, tablet displays, silicone moulds, and screen replays.</span>
                </li>
                <li className="tier-bullet-item">
                  <span className="tier-bullet-icon">✓</span>
                  <span><strong>Match-and-Discard Privacy:</strong> Facial crops and vectors reside strictly in volatile RAM and are automatically purged post-inference (0 bytes persisted).</span>
                </li>
              </ul>
            </div>
            <div className="tier-tech-box">
              <div>
                <div className="tech-box-label">Biometric Verification Pipeline</div>
                <div className="tech-box-code">{`// Ephemeral Cosine Facial Verification
live_crop = detect_and_align_face(live_frame)
doc_crop  = extract_portrait_crop(document_img)

liveness = mini_fasnet.predict(live_crop)
if liveness < 0.70:
  throw SpoofDetected("PRESENTATION_ATTACK")

emb_live = arcface.embed(live_crop)
emb_doc  = arcface.embed(doc_crop)
similarity = cosine_sim(emb_live, emb_doc)

// Purge volatile buffers immediately
secure_erase(emb_live, emb_doc, live_crop, doc_crop)`}</div>
              </div>
              <div className="tech-box-stats">
                <div className="stat-item">
                  <span className="stat-val">&ge; 0.45</span>
                  <span className="stat-lbl">Cosine Match Threshold</span>
                </div>
                <div className="stat-item">
                  <span className="stat-val">&ge; 0.70</span>
                  <span className="stat-lbl">Liveness Confidence Score</span>
                </div>
              </div>
            </div>
          </article>

          {/* Tier 5: Bayesian Risk Aggregation & Polygon Ledger */}
          <article className="tier-showcase-card tier-card-5">
            <div className="tier-info">
              <div className="tier-header">
                <span className="tier-color-pill">Tier 5 · Emerald Green</span>
                <span className="tier-tech-badge">Bayesian Fusion + Polygon Amoy</span>
                <span className="tier-tech-badge">~30ms execution</span>
              </div>
              <h3 className="tier-showcase-title">Bayesian Risk Aggregation &amp; Polygon Ledger</h3>
              <p className="tier-showcase-desc">
                Multi-factor decision engine that synthesizes signals from Tiers 1 through 4 into a deterministic risk
                score (0-100) and actionable operational verdict. Automatically anchors an append-only SHA-256 Merkle hash
                docket to the Polygon Amoy testnet for legally verifiable non-repudiation.
              </p>
              <ul className="tier-bullets">
                <li className="tier-bullet-item">
                  <span className="tier-bullet-icon">✓</span>
                  <span><strong>Deterministic Decision Fusion:</strong> Outputs CLEAR (0-24), REVIEW (25-49), FLAG (50-74), or HARD_REJECT (75-100) based on codified border security policies.</span>
                </li>
                <li className="tier-bullet-item">
                  <span className="tier-bullet-icon">✓</span>
                  <span><strong>Polygon Amoy Ledger Anchoring:</strong> Submits screening hash digests and tier proofs to smart contracts for an immutable, tamper-evident audit record.</span>
                </li>
                <li className="tier-bullet-item">
                  <span className="tier-bullet-icon">✓</span>
                  <span><strong>Instant Docket Generation:</strong> Automatically exports court-admissible PDF evidence packages stamped with session hashes and cryptographic receipts.</span>
                </li>
              </ul>
            </div>
            <div className="tier-tech-box">
              <div>
                <div className="tech-box-label">Decision Fusion &amp; Ledger Anchor</div>
                <div className="tech-box-code">{`// Deterministic Bayesian Risk Fusion
weights = { t1: 0.35, t2: 0.20, t3: 0.20, t4: 0.25 }
risk_score = sum(tier_risk[k] * weights[k] for k in weights)

if tier1.hard_reject or tier4.spoof:
  decision = "HARD_REJECT"
elif risk_score < 25:
  decision = "CLEAR"

// Commit to Polygon Amoy Testnet
tx_hash = polygon_contract.commit_screening(
  screening_id=session_id,
  evidence_merkle_root=sha256_root
)`}</div>
              </div>
              <div className="tech-box-stats">
                <div className="stat-item">
                  <span className="stat-val">0 - 100</span>
                  <span className="stat-lbl">Bayesian Risk Index</span>
                </div>
                <div className="stat-item">
                  <span className="stat-val">SHA-256</span>
                  <span className="stat-lbl">Merkle Root Anchor</span>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* 4. End-to-End Screening Architecture Flow (#architecture) */}
      <section className="showcase-section" id="architecture" aria-labelledby="architecture-heading">
        <div className="section-header">
          <p className="eyebrow">End-to-End Pipeline</p>
          <h2 className="section-title" id="architecture-heading">Real-Time Screening Architecture Flow</h2>
          <p className="section-subtitle">
            How a credential travels through SentinelAI from edge ingestion to cryptographic commitment in under 800 milliseconds.
          </p>
        </div>

        <div className="architecture-flow">
          {/* Step 1 */}
          <div className="arch-step-card">
            <div className="arch-step-top">
              <span className="arch-step-num">1</span>
              <span className="arch-step-latency">&lt; 15ms</span>
            </div>
            <h3 className="arch-step-title">Document Ingestion</h3>
            <p className="arch-step-desc">
              High-resolution document capture via flatbed scanner, checkpoint camera, or test preset. Normalizes perspective, color profile, and DPI.
            </p>
            <span className="arch-step-tier-tag">Stage: Ingestion</span>
          </div>

          {/* Step 2 */}
          <div className="arch-step-card">
            <div className="arch-step-top">
              <span className="arch-step-num">2</span>
              <span className="arch-step-latency">&lt; 10ms</span>
            </div>
            <h3 className="arch-step-title">Cryptographic Check Digits</h3>
            <p className="arch-step-desc">
              Instantaneous 7-3-1 weight cycling validation over ICAO 9303 Doc 9303 checksums. Blocks altered digits before costly neural passes.
            </p>
            <span className="arch-step-tier-tag">Tier 1 Cryptography</span>
          </div>

          {/* Step 3 */}
          <div className="arch-step-card">
            <div className="arch-step-top">
              <span className="arch-step-num">3</span>
              <span className="arch-step-latency">~120ms</span>
            </div>
            <h3 className="arch-step-title">OCR &amp; Reconciliation</h3>
            <p className="arch-step-desc">
              RapidOCR ONNX model extracts VIZ text fields and performs Levenshtein parity reconciliation against parsed MRZ data zones.
            </p>
            <span className="arch-step-tier-tag">Tier 2 OCR Engine</span>
          </div>

          {/* Step 4 */}
          <div className="arch-step-card">
            <div className="arch-step-top">
              <span className="arch-step-num">4</span>
              <span className="arch-step-latency">~250ms</span>
            </div>
            <h3 className="arch-step-title">Compression &amp; Halftone Forensics</h3>
            <p className="arch-step-desc">
              Error Level Analysis (ELA Q=90) uncovers digital splicing while 2D FFT spectral peak analysis detects paper reprints and halftone screens.
            </p>
            <span className="arch-step-tier-tag">Tier 3 Signal Processing</span>
          </div>

          {/* Step 5 */}
          <div className="arch-step-card">
            <div className="arch-step-top">
              <span className="arch-step-num">5</span>
              <span className="arch-step-latency">~280ms</span>
            </div>
            <h3 className="arch-step-title">Facial Verification &amp; Anti-Spoof</h3>
            <p className="arch-step-desc">
              MiniFASNet 2.7 validates traveler liveness followed by ArcFace 512-D cosine facial match between live webcam and ID portrait.
            </p>
            <span className="arch-step-tier-tag">Tier 4 Biometrics</span>
          </div>

          {/* Step 6 */}
          <div className="arch-step-card">
            <div className="arch-step-top">
              <span className="arch-step-num">6</span>
              <span className="arch-step-latency">~30ms</span>
            </div>
            <h3 className="arch-step-title">Bayesian Fusion &amp; Ledger Anchor</h3>
            <p className="arch-step-desc">
              Fuses evidence into an actionable verdict (CLEAR / REVIEW / FLAG / HARD_REJECT) and anchors SHA-256 Merkle root to Polygon Amoy.
            </p>
            <span className="arch-step-tier-tag">Tier 5 Risk &amp; Ledger</span>
          </div>
        </div>
      </section>

      {/* 5. Enterprise & Government Security Pillars (#security) */}
      <section className="showcase-section" id="security" aria-labelledby="security-heading">
        <div className="section-header">
          <p className="eyebrow">Enterprise &amp; Sovereign Defense</p>
          <h2 className="section-title" id="security-heading">Government-Grade Security Pillars</h2>
          <p className="section-subtitle">
            Architected specifically for the Ministry of Home Affairs, border security forces, and international immigration authorities.
          </p>
        </div>

        <div className="security-pillars-grid">
          <article className="security-card">
            <div className="security-icon" aria-hidden="true">🌐</div>
            <h3>Offline-First by Design</h3>
            <p>
              Operates autonomously at remote mountain border posts, sea checkpoints, and tactical deployment points without requiring an active internet connection.
            </p>
            <ul className="security-pills-list">
              <li className="security-pill-item"><span className="security-check">✓</span> 100% Local ONNX Runtime Inference</li>
              <li className="security-pill-item"><span className="security-check">✓</span> Zero External Cloud Dependencies</li>
              <li className="security-pill-item"><span className="security-check">✓</span> Resilient Against Network Blackouts</li>
            </ul>
          </article>

          <article className="security-card">
            <div className="security-icon" aria-hidden="true">🔒</div>
            <h3>Absolute Biometric Privacy</h3>
            <p>
              Strict Match-and-Discard architecture compliant with India's DPDP Act 2023, EU GDPR Article 9, and ICAO Doc 9303 data protection standards.
            </p>
            <ul className="security-pills-list">
              <li className="security-pill-item"><span className="security-check">✓</span> Ephemeral In-Memory Execution</li>
              <li className="security-pill-item"><span className="security-check">✓</span> 0 Bytes Saved to Disk or Databases</li>
              <li className="security-pill-item"><span className="security-check">✓</span> Instant RAM Purge Post-Inference</li>
            </ul>
          </article>

          <article className="security-card">
            <div className="security-icon" aria-hidden="true">📜</div>
            <h3>Verifiable Cryptographic Receipts</h3>
            <p>
              Every screening session produces an automated, court-admissible SHA-256 PDF evidence docket with non-repudiation anchored to the blockchain.
            </p>
            <ul className="security-pills-list">
              <li className="security-pill-item"><span className="security-check">✓</span> Cryptographic Merkle Hash Chains</li>
              <li className="security-pill-item"><span className="security-check">✓</span> Immutable Polygon Amoy Testnet Ledger</li>
              <li className="security-pill-item"><span className="security-check">✓</span> Forensic Evidence Heatmap Archival</li>
            </ul>
          </article>
        </div>
      </section>

      {/* 6. Interactive Live Demo Banner / Callout */}
      <section className="demo-banner" aria-label="Interactive demo callout">
        <div className="demo-banner-left">
          <p className="eyebrow eyebrow-inverted">Interactive Testing Console</p>
          <h2 className="demo-banner-title">Ready to test live specimens?</h2>
          <p className="demo-banner-copy">
            Experience the 5-tier screening pipeline in action with real-time feedback,
            an interactive forensic curtain slider, and live facial verification.
            Test with pristine passports, check-digit tampered specimens, or digital photo splices.
          </p>
          <div className="demo-presets-preview">
            <span className="demo-specimen-badge">Specimen: happy4.jpg (Clean Pass)</span>
            <span className="demo-specimen-badge">Specimen: Mod-10 Checksum Tamper</span>
            <span className="demo-specimen-badge">Specimen: ELA Photo Splicing</span>
          </div>
        </div>
        <div className="demo-banner-right">
          <Link className="demo-banner-cta-btn" href="/test">
            Open Screening Console →
          </Link>
        </div>
      </section>

      {/* 7. Footer */}
      <footer>
        <div className="footer-left">
          <span className="footer-mark app-icon-squircle" aria-hidden="true">S</span>
          <strong>SentinelAI</strong>
        </div>
        <div className="footer-nav-links">
          <a href="#features">Features</a>
          <a href="#defense-tiers">5-Tier Defense</a>
          <a href="#architecture">Architecture</a>
          <a href="#security">Security</a>
          <Link href="/test">Testing Console</Link>
        </div>
        <p className="footer-tagline">
          AI-based fake identity &amp; document screening for accountable checkpoints.
          Ministry of Home Affairs (MHA) · Smart India Hackathon (SIH26188).
        </p>
        <span className="footer-legal">Team Ctrl S · 2026</span>
      </footer>
    </main>
  );
}
