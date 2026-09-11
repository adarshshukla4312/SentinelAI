"use client";

import React from "react";

export type DocumentType = "passport" | "aadhaar" | "auto";

interface DocumentTypeSelectorProps {
  selectedType: DocumentType;
  onSelectType: (type: DocumentType) => void;
  disabled?: boolean;
}

export function DocumentTypeSelector({
  selectedType,
  onSelectType,
  disabled = false,
}: DocumentTypeSelectorProps) {
  const types: { id: DocumentType; label: string; icon: string; badge: string; desc: string }[] = [
    {
      id: "passport",
      label: "Passport (ICAO 9303)",
      icon: "",
      badge: "TD3 MRZ",
      desc: "Single bio-page with 7-3-1 modulo-10 check digits & MRZ",
    },
    {
      id: "aadhaar",
      label: "Indian Aadhaar (UIDAI)",
      icon: "",
      badge: "Dual-Sided",
      desc: "Front (Photo/UID/DOB) + Back (Address & Secure QR Code)",
    },
    {
      id: "auto",
      label: "Auto-Detect",
      icon: "",
      badge: "Smart OCR",
      desc: "Automatically detects document format and check rules",
    },
  ];

  return (
    <div className="doc-type-selector-card">
      <div className="doc-type-header">
        <span className="section-eyebrow">Document specification</span>
        <span className="doc-type-caption">Select document type to apply custom validation criteria.</span>
      </div>
      <div className="doc-type-grid" role="radiogroup" aria-label="Select identity document type">
        {types.map((t) => {
          const isSelected = selectedType === t.id;
          return (
            <button
              key={t.id}
              type="button"
              disabled={disabled}
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelectType(t.id)}
              className={`doc-type-pill ${isSelected ? "doc-type-pill-active" : ""}`}
            >
              <div className="doc-type-pill-top">
                <span className="doc-type-name">{t.label}</span>
                <span className={`doc-type-badge ${isSelected ? "badge-active" : ""}`}>
                  {t.badge}
                </span>
              </div>
              <p className="doc-type-desc">{t.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
