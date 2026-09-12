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
    <div className="dual-dropzone-container w-full flex flex-col gap-4">
      {/* Aadhaar Guidance Header if Aadhaar is selected */}
      {isAadhaar && (
        <div className="aadhaar-guidance-banner p-4 bg-[#09090b] border border-[#2c2c2e] rounded-2xl text-xs text-zinc-300">
          <div className="guidance-text leading-relaxed">
            <strong className="text-white font-semibold block mb-1">Indian Aadhaar card requirements.</strong>
            <p className="text-zinc-400">
              <strong className="text-zinc-200">Front page (required):</strong> Used for 1:1 facial biometric matching against live selfie and 12-digit Verhoeff mathematical checksum validation.
              <br />
              <strong className="text-zinc-200">Back page (recommended):</strong> Contains residential address, Father/Husband (C/O), and UIDAI 2D Secure QR Code for offline cryptographic authenticity.
            </p>
          </div>
        </div>
      )}

      <div className={`grid gap-4 w-full ${isPassport ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
        {/* SLOT 1: Front Side / Primary Bio-Page */}
        <div className="slot-card flex flex-col bg-[#121214] border border-[#2c2c2e] rounded-2xl p-4 overflow-hidden min-h-[320px]">
          <div className="slot-header min-h-[36px] flex items-center justify-between pb-2 border-b border-white/5 mb-3">
            <span className="slot-badge required-badge text-xs font-medium text-zinc-300">
              {isPassport ? "Passport bio-page · Required" : "Front side · Required"}
            </span>
            {frontFile ? (
              <button
                type="button"
                className="slot-remove-btn text-xs text-rose-400 hover:text-rose-300 transition-colors"
                onClick={() => onSelectFront(null)}
                disabled={disabled}
              >
                ✕ Remove
              </button>
            ) : (
              <span className="text-[11px] text-zinc-500 font-mono">STEP 01</span>
            )}
          </div>

          <label
            className={`dropzone-slot flex-1 relative overflow-hidden flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-700/60 hover:border-[#2997ff]/60 rounded-xl cursor-pointer transition-all bg-black/40 hover:bg-[#2997ff]/5 ${
              frontFile ? "border-solid border-[#2997ff]/40 bg-black/60" : ""
            } ${frontDragOver ? "border-[#2997ff] bg-[#2997ff]/10" : ""}`}
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
              className="hidden absolute w-0 h-0 opacity-0 pointer-events-none overflow-hidden"
              style={{ display: "none", opacity: 0, width: 0, height: 0 }}
              onChange={(e) => onSelectFront(e.target.files?.[0] || null)}
            />

            {frontPreview ? (
              <div className="slot-preview-wrapper flex flex-col items-center justify-center w-full h-full">
                <img src={frontPreview} alt="Front Document Preview" className="slot-preview-img rounded-lg max-h-44 object-contain shadow-lg" />
                <div className="slot-file-pill mt-3 px-3.5 py-1.5 bg-[#2997ff]/20 border border-[#2997ff]/40 rounded-full text-xs text-white flex items-center gap-2">
                  <span className="slot-file-name font-medium truncate max-w-[180px]">{frontFile?.name}</span>
                  <span className="slot-file-size text-zinc-400">
                    ({frontFile ? Math.ceil(frontFile.size / 1024) : 0} KB)
                  </span>
                </div>
              </div>
            ) : (
              <div className="slot-empty-state flex flex-col items-center justify-center text-center gap-2.5 w-full h-full">
                <div className="w-10 h-10 rounded-full bg-[#2997ff]/10 border border-[#2997ff]/30 flex items-center justify-center text-[#2997ff] text-lg mb-1">
                  ↑
                </div>
                <span className="slot-title font-semibold text-sm text-white min-h-[20px] flex items-center justify-center">
                  {isPassport ? "Upload passport bio-page" : "Upload Aadhaar front side"}
                </span>
                <span className="slot-subtitle text-xs text-zinc-400 max-w-xs min-h-[32px] flex items-center justify-center">
                  {isPassport
                    ? "Photo, passport number, DOB, expiry and MRZ"
                    : "Photo, full name, DOB, gender and 12-digit UID"}
                </span>
                <div className="mt-1 px-6 py-2.5 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-all duration-300 shadow-[0_0_30px_rgba(3,103,254,0.5),0_10px_20px_rgba(0,0,0,0.5)]">
                  Select Document File
                </div>
                <span className="slot-formats text-[11px] text-zinc-500 mt-1 min-h-[16px] flex items-center justify-center">JPEG, PNG or WebP · Up to 12 MB</span>
              </div>
            )}
          </label>
        </div>

        {/* SLOT 2: Back Side (For Aadhaar & Auto) */}
        {!isPassport && (
          <div className="slot-card flex flex-col bg-[#121214] border border-[#2c2c2e] rounded-2xl p-4 overflow-hidden min-h-[320px]">
            <div className="slot-header min-h-[36px] flex items-center justify-between pb-2 border-b border-white/5 mb-3">
              <span className="slot-badge optional-badge text-xs font-medium text-zinc-300">
                Back side · Recommended for full verification
              </span>
              {backFile ? (
                <button
                  type="button"
                  className="slot-remove-btn text-xs text-rose-400 hover:text-rose-300 transition-colors"
                  onClick={() => onSelectBack(null)}
                  disabled={disabled}
                >
                  ✕ Remove
                </button>
              ) : (
                <span className="text-[11px] text-zinc-500 font-mono">STEP 02</span>
              )}
            </div>

            <label
              className={`dropzone-slot flex-1 relative overflow-hidden flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-700/60 hover:border-[#2997ff]/60 rounded-xl cursor-pointer transition-all bg-black/40 hover:bg-[#2997ff]/5 ${
                backFile ? "border-solid border-[#2997ff]/40 bg-black/60" : ""
              } ${backDragOver ? "border-[#2997ff] bg-[#2997ff]/10" : ""}`}
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
                className="hidden absolute w-0 h-0 opacity-0 pointer-events-none overflow-hidden"
                style={{ display: "none", opacity: 0, width: 0, height: 0 }}
                onChange={(e) => onSelectBack(e.target.files?.[0] || null)}
              />

              {backPreview ? (
                <div className="slot-preview-wrapper flex flex-col items-center justify-center w-full h-full">
                  <img src={backPreview} alt="Back Document Preview" className="slot-preview-img rounded-lg max-h-44 object-contain shadow-lg" />
                  <div className="slot-file-pill mt-3 px-3.5 py-1.5 bg-[#2997ff]/20 border border-[#2997ff]/40 rounded-full text-xs text-white flex items-center gap-2">
                    <span className="slot-file-name font-medium truncate max-w-[180px]">{backFile?.name}</span>
                    <span className="slot-file-size text-zinc-400">
                      ({backFile ? Math.ceil(backFile.size / 1024) : 0} KB)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="slot-empty-state flex flex-col items-center justify-center text-center gap-2.5 w-full h-full">
                  <div className="w-10 h-10 rounded-full bg-[#2997ff]/10 border border-[#2997ff]/30 flex items-center justify-center text-[#2997ff] text-lg mb-1">
                    ↑
                  </div>
                  <span className="slot-title font-semibold text-sm text-white min-h-[20px] flex items-center justify-center">
                    Upload Aadhaar back side
                  </span>
                  <span className="slot-subtitle text-xs text-zinc-400 max-w-xs min-h-[32px] flex items-center justify-center">
                    Residential address, C/O (father or husband) and secure QR code
                  </span>
                  <div className="mt-1 px-6 py-2.5 rounded-full bg-transparent text-blue-300 border-2 border-blue-500 hover:bg-blue-500/20 transition-all duration-300 text-xs font-semibold shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                    Select Back Side Image
                  </div>
                  <span className="slot-formats text-[11px] text-zinc-500 mt-1 min-h-[16px] flex items-center justify-center">
                    Enables offline QR cryptographic authentication
                  </span>
                </div>
              )}
            </label>
          </div>
        )}
      </div>

      {/* Optional MRZ input for Passport */}
      {isPassport && (
        <div className="mrz-field-wrapper bg-[#09090b] border border-[#2c2c2e] rounded-xl p-4 flex flex-col gap-2">
          <div className="mrz-header flex items-center justify-between text-xs text-zinc-300">
            <span>Optional passport TD3 MRZ (Auto-read by PP-OCRv4 if present)</span>
            <span className="mrz-counter font-mono text-zinc-500">{mrz.length} / 90 chars</span>
          </div>
          <textarea
            id="mrz-input"
            maxLength={90}
            rows={2}
            value={mrz}
            disabled={disabled}
            onChange={(e) => onChangeMrz(e.target.value)}
            placeholder={"P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<\nL898902C36UTO7408122F1204159ZE184226B<<<<<10"}
            className="mrz-textarea bg-black border border-zinc-800 rounded-lg p-3 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#2997ff]"
          />
        </div>
      )}

      {/* Criteria Checklist applied to this document type */}
      <div className="criteria-checklist-card bg-[#09090b] border border-[#2c2c2e] rounded-xl p-4 flex flex-col gap-2">
        <span className="criteria-title text-xs font-semibold text-zinc-300">Verification criteria applied for {isPassport ? "Passport" : isAadhaar ? "Aadhaar" : "Auto-detect"}:</span>
        <div className="criteria-chips flex flex-wrap gap-2 mt-1">
          {isPassport && (
            <>
              <span className="criteria-chip px-3 py-1 bg-zinc-800/80 border border-zinc-700/60 rounded-full text-[11px] text-zinc-300">✓ ICAO 9303 (7-3-1) check digits</span>
              <span className="criteria-chip px-3 py-1 bg-zinc-800/80 border border-zinc-700/60 rounded-full text-[11px] text-zinc-300">✓ Passport number and composite checksum</span>
              <span className="criteria-chip px-3 py-1 bg-zinc-800/80 border border-zinc-700/60 rounded-full text-[11px] text-zinc-300">✓ MRZ-to-VIZ Levenshtein cross-check</span>
              <span className="criteria-chip px-3 py-1 bg-zinc-800/80 border border-zinc-700/60 rounded-full text-[11px] text-zinc-300">✓ ELA and FFT forensic signal processing</span>
              <span className="criteria-chip px-3 py-1 bg-zinc-800/80 border border-zinc-700/60 rounded-full text-[11px] text-zinc-300">✓ 1:1 ArcFace facial biometrics and liveness</span>
            </>
          )}
          {isAadhaar && (
            <>
              <span className="criteria-chip px-3 py-1 bg-zinc-800/80 border border-zinc-700/60 rounded-full text-[11px] text-zinc-300">✓ 12-digit UID Verhoeff dihedral checksum</span>
              <span className="criteria-chip px-3 py-1 bg-zinc-800/80 border border-zinc-700/60 rounded-full text-[11px] text-zinc-300">✓ Front VIZ: Name, DOB, Gender, UID</span>
              <span className="criteria-chip px-3 py-1 bg-zinc-800/80 border border-zinc-700/60 rounded-full text-[11px] text-zinc-300">✓ Back VIZ: Address, Care-Of and PIN code</span>
              <span className="criteria-chip px-3 py-1 bg-zinc-800/80 border border-zinc-700/60 rounded-full text-[11px] text-zinc-300">✓ UIDAI 2D secure QR code signature</span>
              <span className="criteria-chip px-3 py-1 bg-zinc-800/80 border border-zinc-700/60 rounded-full text-[11px] text-zinc-300">✓ 1:1 ArcFace facial biometrics and liveness</span>
            </>
          )}
          {!isPassport && !isAadhaar && (
            <>
              <span className="criteria-chip px-3 py-1 bg-zinc-800/80 border border-zinc-700/60 rounded-full text-[11px] text-zinc-300">✓ Auto-detecting checksum matrix</span>
              <span className="criteria-chip px-3 py-1 bg-zinc-800/80 border border-zinc-700/60 rounded-full text-[11px] text-zinc-300">✓ Universal optical character recognition</span>
              <span className="criteria-chip px-3 py-1 bg-zinc-800/80 border border-zinc-700/60 rounded-full text-[11px] text-zinc-300">✓ Passive compression forensics</span>
              <span className="criteria-chip px-3 py-1 bg-zinc-800/80 border border-zinc-700/60 rounded-full text-[11px] text-zinc-300">✓ Ephemeral 1:1 facial biometrics</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
