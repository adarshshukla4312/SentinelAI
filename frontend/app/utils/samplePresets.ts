export interface SamplePreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  expectedVerdict: "CLEAR" | "HARD_REJECT" | "FLAG" | "REVIEW";
  documentType: "passport" | "aadhaar";
  vizPassport: string;
  vizName: string;
  vizDob: string;
  mrzLines: [string, string];
  mrz: string;
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: "valid-passport",
    name: "Valid passport",
    badge: "ICAO Pass",
    description: "Authentic specimen: all check digits match and visual fields reconcile perfectly.",
    expectedVerdict: "CLEAR",
    documentType: "passport",
    vizPassport: "L898902C3",
    vizName: "ERIKSSON ANNA MARIA",
    vizDob: "12 AUG 1974",
    mrzLines: [
      "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<",
      "L898902C36UTO7408122F1204159ZE184226B<<<<<10",
    ],
    mrz: "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<\nL898902C36UTO7408122F1204159ZE184226B<<<<<10",
  },
  {
    id: "valid-aadhaar",
    name: "Indian Aadhaar",
    badge: "Verhoeff Pass",
    description: "Authentic Indian Aadhaar specimen: 12-digit UID (5013 6373 8063) passes Verhoeff dihedral checksum.",
    expectedVerdict: "CLEAR",
    documentType: "aadhaar",
    vizPassport: "5013 6373 8063",
    vizName: "PRASHANT TRIPATHI",
    vizDob: "30/03/2007",
    mrzLines: ["", ""],
    mrz: "",
  },
  {
    id: "tampered-checkdigit",
    name: "Tampered check digit",
    badge: "Tier 1 Fail",
    description: "Cryptographic forgery: check digit modified (6 → 9), causing immediate Tier 1 rejection.",
    expectedVerdict: "HARD_REJECT",
    documentType: "passport",
    vizPassport: "L898902C3",
    vizName: "ERIKSSON ANNA MARIA",
    vizDob: "12 AUG 1974",
    mrzLines: [
      "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<",
      "L898902C39UTO7408122F1204159ZE184226B<<<<<10",
    ],
    mrz: "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<\nL898902C39UTO7408122F1204159ZE184226B<<<<<10",
  },
  {
    id: "forged-viz-mismatch",
    name: "VIZ/MRZ mismatch",
    badge: "Tier 2 Anomaly",
    description: "Visual alteration: document number altered to A9999999 while MRZ holds L898902C3.",
    expectedVerdict: "FLAG",
    documentType: "passport",
    vizPassport: "A9999999",
    vizName: "ERIKSSON ANNA MARIA",
    vizDob: "12 AUG 1974",
    mrzLines: [
      "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<",
      "L898902C36UTO7408122F1204159ZE184226B<<<<<10",
    ],
    mrz: "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<\nL898902C36UTO7408122F1204159ZE184226B<<<<<10",
  },
];

export function generateSamplePassportImage(preset: SamplePreset): Promise<File> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !document) {
      reject(new Error("Canvas generation requires a browser DOM environment."));
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 460;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Canvas 2D context could not be acquired."));
      return;
    }

    if (preset.documentType === "aadhaar") {
      // ─── AADHAAR CARD SPECIMEN GENERATOR ───
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 1000, 460);

      // Top Tri-Color Bar
      ctx.fillStyle = "#ff9933";
      ctx.fillRect(0, 0, 1000, 6);
      ctx.fillStyle = "#138808";
      ctx.fillRect(0, 454, 1000, 6);

      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, 980, 440);

      // Header: Government of India / भारत सरकार
      ctx.fillStyle = "#111827";
      ctx.font = "bold 18px Inter, Arial, sans-serif";
      ctx.fillText("भारत सरकार / Government of India", 140, 50);

      ctx.fillStyle = "#059669";
      ctx.font = "bold 13px Inter, Arial, sans-serif";
      ctx.fillText("UIDAI · UNIQUE IDENTIFICATION AUTHORITY OF INDIA", 140, 75);

      // Emblem Squircle Placeholder
      ctx.fillStyle = "#f3f4f6";
      ctx.beginPath();
      ctx.roundRect(32, 28, 80, 80, 16);
      ctx.fill();
      ctx.fillStyle = "#4b5563";
      ctx.font = "32px sans-serif";
      ctx.fillText("🏛️", 54, 80);

      // Photo Frame
      ctx.fillStyle = "#e5e7eb";
      ctx.fillRect(40, 130, 170, 210);
      ctx.strokeStyle = "#d1d5db";
      ctx.lineWidth = 1;
      ctx.strokeRect(40, 130, 170, 210);

      // Portrait Silhouette
      ctx.fillStyle = "#9ca3af";
      ctx.beginPath();
      ctx.arc(125, 205, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(125, 290, 65, 45, 0, Math.PI, 0);
      ctx.fill();

      // VIZ Data Fields
      const vizX = 250;
      ctx.fillStyle = "#111827";
      ctx.font = "bold 22px Inter, Arial, sans-serif";
      ctx.fillText(preset.vizName, vizX, 170);

      ctx.font = "18px Inter, Arial, sans-serif";
      ctx.fillStyle = "#374151";
      ctx.fillText(`DOB: ${preset.vizDob}`, vizX, 210);

      ctx.font = "17px Inter, Arial, sans-serif";
      ctx.fillText("पुरुष / MALE", vizX, 245);

      // 12-digit Aadhaar UID (Red / Bold)
      ctx.fillStyle = "#b91c1c";
      ctx.font = "bold 32px 'Courier New', Consolas, monospace";
      ctx.letterSpacing = "2px";
      ctx.fillText(preset.vizPassport, vizX, 320);

      // Footer divider & motto
      ctx.strokeStyle = "#e5e7eb";
      ctx.beginPath();
      ctx.moveTo(30, 370);
      ctx.lineTo(970, 370);
      ctx.stroke();

      ctx.fillStyle = "#6b7280";
      ctx.font = "italic 14px Inter, Arial, sans-serif";
      ctx.fillText("मेरा आधार, मेरी पहचान · Aadhaar is proof of identity, not of citizenship", 260, 410);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Failed to export canvas blob"));
          resolve(new File([blob], `${preset.id}.jpg`, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.96
      );
      return;
    }

    // ─── PASSPORT SPECIMEN GENERATOR ───
    ctx.fillStyle = "#faf9f6";
    ctx.fillRect(0, 0, 1000, 460);

    // Subtle guilloche lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(215, 215, 215, 0.45)";
    for (let x = -100; x < 1100; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + 50, 150, x - 50, 310, x, 460);
      ctx.stroke();
    }

    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, 984, 444);

    // Header
    ctx.fillStyle = "#141414";
    ctx.font = "bold 15px Inter, ui-sans-serif, system-ui, sans-serif";
    ctx.fillText("PASSPORT / PASSEPORT · OFFICIAL SAMPLE SPECIMEN", 32, 40);

    ctx.fillStyle = "#707070";
    ctx.font = "12px Inter, ui-sans-serif, system-ui, sans-serif";
    ctx.fillText("TYPE: P  ·  ISSUING COUNTRY: UTO  ·  SPECIMEN CONTROL: SIH26188", 32, 60);

    // Portrait Box
    ctx.fillStyle = "#ebebeb";
    ctx.fillRect(32, 80, 140, 180);
    ctx.strokeStyle = "#d4d4d4";
    ctx.lineWidth = 1;
    ctx.strokeRect(32, 80, 140, 180);

    ctx.fillStyle = "#9a9a9a";
    ctx.beginPath();
    ctx.arc(102, 145, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(102, 220, 52, 38, 0, Math.PI, 0);
    ctx.fill();

    // VIZ Fields
    const vizLeft = 205;
    ctx.fillStyle = "#141414";
    ctx.font = "bold 20px Inter, Arial, sans-serif";
    ctx.fillText(`PASSPORT NO: ${preset.vizPassport}`, vizLeft, 110);

    ctx.font = "bold 17px Inter, Arial, sans-serif";
    ctx.fillText(`NAME: ${preset.vizName}`, vizLeft, 150);

    ctx.font = "bold 17px Inter, Arial, sans-serif";
    ctx.fillText(`DATE OF BIRTH: ${preset.vizDob}`, vizLeft, 190);

    ctx.fillStyle = "#707070";
    ctx.font = "13px Inter, Arial, sans-serif";
    ctx.fillText("NATIONALITY: UTO     SEX: F     EXPIRY: 15 APR 2032", vizLeft, 230);

    // MRZ Zone
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(20, 290, 960, 145);
    ctx.strokeStyle = "#e0e0e0";
    ctx.strokeRect(20, 290, 960, 145);

    ctx.fillStyle = "#141414";
    ctx.font = "bold 22px 'Courier New', Consolas, Monaco, monospace";
    ctx.letterSpacing = "3px";
    ctx.fillText(preset.mrzLines[0], 40, 345);
    ctx.fillText(preset.mrzLines[1], 40, 400);

    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("Failed to export canvas blob"));
        resolve(new File([blob], `${preset.id}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.96
    );
  });
}
