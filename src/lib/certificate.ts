// Build a downloadable PDF certificate for the candidate. Pure client-side
// via jsPDF — no backend dependency, no auth, no verification — so this is
// a *vanity* certificate (someone reading the source can fake it). It does
// the basics well: typography, a real layout, the candidate's name + score
// + date + a serial. For a verifiable credential you'd need signing + a
// hosted /verify endpoint; that's deliberately out of scope here.

// NOTE: jspdf is only imported for its types up top — the value is loaded
// dynamically inside `downloadCertificate` so the ~400KB PDF library
// doesn't ship in the main bundle. The completion page is the only thing
// that needs it, and it's behind allPassed.
import type { ScoreBreakdown } from './scoring';

export interface CertificateInput {
  candidateName: string;
  score: ScoreBreakdown;
  /** Display version used in the certificate footer. */
  versionTag: string;
}

/** Trigger a download of the certificate PDF. Returns the filename used. */
export async function downloadCertificate(input: CertificateInput): Promise<string> {
  const { candidateName, score, versionTag } = input;
  const name = candidateName.trim() || 'Developer';

  // Dynamic import — keeps jspdf out of the initial bundle. Vite splits
  // it into its own chunk that's only fetched when this fn first runs.
  const { jsPDF } = await import('jspdf');

  // Landscape A4 in mm. 297 × 210.
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297;
  const H = 210;

  // Page background (off-white). jsPDF defaults to white, which we want.
  doc.setDrawColor(20, 20, 24);
  doc.setLineWidth(0.7);
  doc.rect(8, 8, W - 16, H - 16); // outer border
  doc.setLineWidth(0.2);
  doc.rect(11, 11, W - 22, H - 22); // inner trim line

  // Top eyebrow
  doc.setTextColor(120, 120, 130);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('UN-REACT  ·  CERTIFICATE OF COMPLETION', W / 2, 30, { align: 'center' });

  // Title
  doc.setTextColor(20, 20, 24);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(34);
  doc.text('Certificate of Completion', W / 2, 56, { align: 'center' });

  // "Presented to" line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(80, 80, 90);
  doc.text('This certifies that', W / 2, 80, { align: 'center' });

  // Candidate name — anchor of the page
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(40);
  doc.setTextColor(242, 162, 76); // amber from the logo
  doc.text(name, W / 2, 100, { align: 'center' });

  // Body
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(60, 60, 70);
  const bodyLine1 = 'has built a React-like framework from scratch by completing the un-React curriculum,';
  const bodyLine2 = `${score.passedCount} of ${score.totalSteps} step${score.totalSteps === 1 ? '' : 's'} passed — final score ${score.percent}%.`;
  doc.text(bodyLine1, W / 2, 118, { align: 'center' });
  doc.text(bodyLine2, W / 2, 126, { align: 'center' });

  // Score breakdown — small table on the lower half
  const tableTop = 145;
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 130);
  doc.text('STEP', W / 2 - 60, tableTop);
  doc.text('SCORE', W / 2 + 60, tableTop, { align: 'right' });
  doc.setDrawColor(200, 200, 210);
  doc.setLineWidth(0.2);
  doc.line(W / 2 - 60, tableTop + 1.5, W / 2 + 60, tableTop + 1.5);

  doc.setTextColor(20, 20, 24);
  doc.setFontSize(10);
  score.perStep.forEach((s, i) => {
    const y = tableTop + 7 + i * 6;
    if (y > H - 32) return; // don't overflow into footer
    doc.text(s.id, W / 2 - 60, y);
    doc.text(s.passed ? `${s.score}` : '—', W / 2 + 60, y, { align: 'right' });
  });

  // Footer: date, version, serial
  const issuedAt = new Date();
  const issuedStr = issuedAt.toISOString().slice(0, 10);
  const serial = makeSerial(name, score, issuedAt);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 130);
  doc.text(`Issued ${issuedStr}  ·  un-React ${versionTag}  ·  serial ${serial}`, W / 2, H - 16, { align: 'center' });
  doc.setFontSize(8);
  doc.text('Vanity certificate — verification is client-side only.', W / 2, H - 11, { align: 'center' });

  const filename = `un-react-certificate-${slug(name)}-${issuedStr}.pdf`;
  doc.save(filename);
  return filename;
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'developer';
}

/** Short deterministic-looking serial — not cryptographic, just identifying. */
function makeSerial(name: string, score: ScoreBreakdown, when: Date): string {
  const raw = `${name}|${score.percent}|${when.getTime()}`;
  let h = 0;
  for (let i = 0; i < raw.length; i++) h = (h * 31 + raw.charCodeAt(i)) | 0;
  const u = Math.abs(h).toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
  return `UR-${u}`;
}
