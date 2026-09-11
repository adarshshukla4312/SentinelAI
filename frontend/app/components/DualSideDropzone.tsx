"use client";

import React, { useState } from "react";
import type { DocumentType } from "./DocumentTypeSelector";

interface DualSideDropzoneProps {
  documentType: DocumentType;
  frontFile: File | null;
  backFile: File | null;
  frontPreview: string | null;
  backPreview: string | null;
  onSelectFront: (file: File | null) => void;
  onSelectBack: (file: File | null) => void;
  mrz: string;
  onChangeMrz: (mrz: string) => void;
  disabled?: boolean;
}

export function DualSideDropzone({
  documentType,
  frontFile,
  backFile,
  frontPreview,
  backPreview,
  onSelectFront,
  onSelectBack,
  mrz,
  onChangeMrz,
  disabled = false,
}: DualSideDropzoneProps) {
  const [frontDragOver, setFrontDragOver] = useState(false);
  const [backDragOver, setBackDragOver] = useState(false);

  const isAadhaar = documentType === "aadhaar";
  const isPassport = documentType === "passport";

  return (
    <div className="dual-dropzone-container">
      {/* Aadhaar Guidance Header if Aadhaar is selected */}
      {isAadhaar && (
        <div className="aadhaar-guidance-banner">
          <div className="guidance-text">
            <strong>Indian Aadhaar card requirements.</strong>
            <p>
              <strong>Front page (required):</strong> Used for 1:1 facial biometric matching against live selfie and 12-digit Verhoeff mathematical checksum validation.
              <br />
              <strong>Back page (recommended):</strong> Contains residential address, Father/Husband (C/O), and UIDAI 2D Secure QR Code for offline cryptographic authenticity.
            </p>
          </div>
        </div>
      )}

      <div className={`slots-grid ${isPassport ? "slots-single" : "slots-dual"}`}>
        {/* SLOT 1: Front Side / Primary Bio-Page */}
        <div className="slot-card">
          <div className="slot-header">
            <span className="slot-badge required-badge">
              {isPassport ? "Passport bio-page · Required" : "Front side · Required"}
            </span>
            {frontFile && (
              <button
                type="button"
                className="slot-remove-btn"
                onClick={() => onSelectFront(null)}
                disabled={disabled}
              >
                ✕ Remove
              </button>
            )}
          </div>

          <label
            className={`dropzone-slot ${frontFile ? "has-file" : ""} ${frontDragOver ? "is-dragover" : ""}`}
            htmlFor="front-doc-upload"
            onDragOver={(e) => {
              e.preventDefault();
              setFrontDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setFrontDragOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setFrontDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) onSelectFront(f);
            }}
          >
            <input
              id="front-doc-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={disabled}
              onChange={(e) => onSelectFront(e.target.files?.[0] || null)}
            />

            {frontPreview ? (
              <div className="slot-preview-wrapper">
                <img src={frontPreview} alt="Front Document Preview" className="slot-preview-img" />
                <div className="slot-file-pill">
                  <span className="slot-file-name">{frontFile?.name}</span>
                  <span className="slot-file-size">
                    {frontFile ? Math.ceil(frontFile.size / 1024) : 0} KB · Ready
                  </span>
                </div>
              </div>
            ) : (
              <div className="slot-empty-state">
                <span className="slot-title">
                  {isPassport ? "Upload passport bio-page" : "Upload Aadhaar front side"}
                </span>
                <span className="slot-subtitle">
                  {isPassport
                    ? "Photo, passport number, DOB, expiry and MRZ"
                    : "Photo, full name, DOB, gender and 12-digit UID"}
                </span>
                <span className="slot-formats">JPEG, PNG or WebP · Up to 12 MB</span>
              </div>
            )}
          </label>
        </div>

        {/* SLOT 2: Back Side (For Aadhaar & Auto) */}
        {!isPassport && (
          <div className="slot-card">
            <div className="slot-header">
              <span className="slot-badge optional-badge">
                Back side · Recommended for full verification
              </span>
              {backFile && (
                <button
                  type="button"
                  className="slot-remove-btn"
                  onClick={() => onSelectBack(null)}
                  disabled={disabled}
                >
                  ✕ Remove
                </button>
              )}
            </div>

            <label
              className={`dropzone-slot ${backFile ? "has-file" : ""} ${backDragOver ? "is-dragover" : ""}`}
              htmlFor="back-doc-upload"
              onDragOver={(e) => {
                e.preventDefault();
                setBackDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setBackDragOver(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setBackDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) onSelectBack(f);
              }}
            >
              <input
                id="back-doc-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={disabled}
                onChange={(e) => onSelectBack(e.target.files?.[0] || null)}
              />

              {backPreview ? (
                <div className="slot-preview-wrapper">
                  <img src={backPreview} alt="Back Document Preview" className="slot-preview-img" />
                  <div className="slot-file-pill">
                    <span className="slot-file-name">{backFile?.name}</span>
                    <span className="slot-file-size">
                      {backFile ? Math.ceil(backFile.size / 1024) : 0} KB · Ready
                    </span>
                  </div>
                </div>
              ) : (
                <div className="slot-empty-state">
                  <span className="slot-title">Upload Aadhaar back side</span>
                  <span className="slot-subtitle">
                    Residential address, C/O (father or husband) and secure QR code
                  </span>
                  <span className="slot-formats">Enables offline QR cryptographic authentication</span>
                </div>
              )}
            </label>
          </div>
        )}
      </div>

      {/* Optional MRZ input for Passport */}
      {isPassport && (
        <div className="mrz-field-wrapper">
          <div className="mrz-header">
            <span>Optional passport TD3 MRZ (Auto-read by PP-OCRv4 if present)</span>
            <span className="mrz-counter">{mrz.length} / 90 chars</span>
          </div>
          <textarea
            id="mrz-input"
            maxLength={90}
            rows={2}
            value={mrz}
            disabled={disabled}
            onChange={(e) => onChangeMrz(e.target.value)}
            placeholder={"P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<\nL898902C36UTO7408122F1204159ZE184226B<<<<<10"}
            className="mrz-textarea"
          />
        </div>
      )}

      {/* Criteria Checklist applied to this document type */}
      <div className="criteria-checklist-card">
        <span className="criteria-title">Verification criteria applied for {isPassport ? "Passport" : isAadhaar ? "Aadhaar" : "Auto-detect"}:</span>
        <div className="criteria-chips">
          {isPassport && (
            <>
              <span className="criteria-chip">✓ ICAO 9303 (7-3-1) check digits</span>
              <span className="criteria-chip">✓ Passport number and composite checksum</span>
              <span className="criteria-chip">✓ MRZ-to-VIZ Levenshtein cross-check</span>
              <span className="criteria-chip">✓ ELA and FFT forensic signal processing</span>
              <span className="criteria-chip">✓ 1:1 ArcFace facial biometrics and liveness</span>
            </>
          )}
          {isAadhaar && (
            <>
              <span className="criteria-chip">✓ 12-digit UID Verhoeff dihedral checksum</span>
              <span className="criteria-chip">✓ Front VIZ: Name, DOB, Gender, UID</span>
              <span className="criteria-chip">✓ Back VIZ: Address, Care-Of and PIN code</span>
              <span className="criteria-chip">✓ UIDAI 2D secure QR code signature</span>
              <span className="criteria-chip">✓ 1:1 ArcFace facial biometrics and liveness</span>
            </>
          )}
          {!isPassport && !isAadhaar && (
            <>
              <span className="criteria-chip">✓ Auto-detecting checksum matrix</span>
              <span className="criteria-chip">✓ Universal optical character recognition</span>
              <span className="criteria-chip">✓ Passive compression forensics</span>
              <span className="criteria-chip">✓ Ephemeral 1:1 facial biometrics</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
