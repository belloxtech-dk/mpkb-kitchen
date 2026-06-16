import type { Locale } from "./locale";

/**
 * SSOT for every user-facing string + the AI language directive.
 * `en` defines the shape; `id` must match it (typecheck enforces parity).
 * Functions cover interpolated strings. Used by both client (useMessages) and
 * server (reconcile engine, AI prompts, page titles).
 */

const en = {
  brand: "MPKB · Kitchen Integrity",
  poweredBy: "Powered by Claude",

  fleet: {
    activeLabel: "kitchens live",
    searchPlaceholder: "Search kitchens…",
    scaleLine: (total: string, provinces: string) => `${total} kitchens · ${provinces} provinces`,
    pilotBadge: "LIVE · PILOT",
    notActive: "Not yet active",
    noResults: "No kitchens match.",
    lockedNote:
      "Only the pilot kitchen (Lombok) is available for live monitoring in this preview. Other kitchens are enrolled in the programme but not yet provisioned.",
  },

  auth: {
    signInTitle: "Sign in to MPKB",
    signInSubtitle: "Invite-only. If your email has been invited, we'll send a sign-in link.",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    sendLink: "Send sign-in link",
    sending: "Sending…",
    checkEmailTitle: "Check your email",
    checkEmailBody: "If an invited account exists for that address, a sign-in link is on its way.",
    signOut: "Sign out",
    inviteOnly: "Invite-only access.",
    landingTagline: "AI integrity monitoring for school-meal kitchens.",
    landingBody:
      "Real-time SOP compliance, financial-integrity auditing, and a tamper-evident ledger across Indonesia's MBG kitchens.",
    navAdmin: "Admin",
    navSuperadmin: "Superadmin",
    adminTitle: "Admin",
    adminSubtitle: "Invite users and manage access.",
    inviteHeading: "Invite a user",
    nameLabel: "Name",
    roleLabel: "Role",
    invite: "Send invite",
    inviting: "Inviting…",
    inviteSent: (email: string) => `Invite sent to ${email}.`,
    inviteFailed: "Could not send the invite.",
    superadminTitle: "Superadmin",
    superadminSubtitle: "System-level controls.",
    placeholderNote: "Placeholder — reserved for future controls.",
    roleNames: { user: "User", admin: "Admin", superadmin: "Superadmin" },
    users: {
      heading: "Users",
      name: "Name",
      email: "Email",
      role: "Role",
      status: "Status",
      invitedOn: "Invited",
      lastSignIn: "Last sign-in",
      signIns: "Sign-ins",
      never: "Never",
      none: "No users yet.",
      statusInvited: "Invited",
      statusActive: "Active",
      statusBanned: "Banned",
    },
  },

  superadmin: {
    modelHeading: "AI model",
    modelSubtitle: "Used for all kitchen and finance analysis. Sonnet for testing, Opus for the demo.",
    modelNotes: {
      "claude-sonnet-4-6": "Faster and cheaper — good for development and testing.",
      "claude-opus-4-8": "Highest quality — best for the live demo.",
    },
  },

  nav: { floor: "Floor", books: "Books", ledger: "Ledger" },

  status: { pass: "PASS", warn: "WARN", fail: "FAIL" },
  severity: { low: "LOW", medium: "MEDIUM", high: "HIGH" },
  risk: { low: "LOW RISK", medium: "MEDIUM RISK", high: "HIGH RISK", critical: "CRITICAL" },

  meal: {
    enrolled: "Enrolled",
    present: "Present (attendance)",
    served: "Meals served (log)",
    billed: "Meals billed (invoice)",
  },

  ledger: { tag: "LEDGER", sealed: "sealed" },

  floor: {
    title: "The Floor — SOP compliance",
    subtitle: "Claude inspects each kitchen frame in real time, explains what it sees, and flags violations.",
    kitchenScore: "Kitchen score",
    zonesFlagged: "Zones flagged",
    analyzed: "Analyzed",
    runSweep: "Run sweep",
    sweeping: "Sweeping…",
    loadingZones: "Loading camera zones…",
    reasoningLabel: "AI observation",
    reasoningActive: "Analyzing frame…",
    reasoningIdle: "Awaiting a frame to inspect.",
    feedHint: "Sample CCTV feed — click a tile to pause, Analyze to inspect a frame, or drop your own kitchen photo on any zone.",
  },

  zone: {
    addHint: "Drop or click to add a frame",
    live: "LIVE",
    replace: "Replace",
    add: "Add frame",
    analyze: "Analyze",
    analyzing: "Analyzing…",
    rerun: "Re-run",
    invalidDrop: "Please drop an image file, or use Add frame.",
    rec: "REC",
    paused: "PAUSED",
    scanning: "ANALYZING",
    demoFeed: "Demo feed",
    yourFrame: "Your frame",
    tapResume: "Tap to resume",
  },

  verdict: {
    title: "SOP verdict",
    empty: "No frame analyzed yet.",
    score: "score",
    violations: "Violations",
  },

  alert: {
    sent: "Phone alert sent",
    delivered: "Delivered via Telegram ✓",
    notConfigured: "Telegram not configured — shown in-app only",
    bodyTpl: (zone: string, label: string, detail: string, action: string) =>
      `⚠️ ${zone}: ${label} issue. ${detail} Action: ${action}`,
  },

  books: {
    title: "The Books — financial integrity",
    subtitle:
      "A deterministic engine computes the exact figures; Claude explains and judges them — ghost meals, price markups, duplicate invoices, threshold-gaming, and supplier concentration.",
    procurementDay: "Procurement day",
    audit: "Audit the books",
    auditing: "Auditing…",
    reasoningLabel: "AI auditor",
    reasoningActive: "Reviewing the books…",
    reasoningIdle: "Run an audit to see the AI's reasoning.",
    mealCounts: "Meal counts",
    lineItems: "Procurement line items",
    invoices: "Invoices",
    awards: "Supplier awards (this month)",
    colItem: "Item",
    colSupplier: "Supplier",
    colQty: "Qty",
    colUnitPrice: "Unit price",
    colReference: "Reference",
    approvalThreshold: "Approval threshold",
    auditResult: "Audit result",
    estLeakage: "est. leakage",
    runToReconcile: "Run an audit to reconcile the books.",
    cleanComputed: "No irregularities computed for this day.",
    cleanConfirmed: "Books reconcile cleanly — no irregularities found for this day.",
    judging: "judging…",
    gapNote: (n: string, pct: string) => `${n} portions billed beyond meals served (${pct}).`,
    issuesAwaiting: (n: number) => `${n} issue(s) computed — awaiting AI judgement…`,
  },

  findingKind: {
    ghost_meals: "Ghost meals",
    price_markup: "Price markup",
    duplicate_invoice: "Duplicate invoice",
    threshold_gaming: "Threshold gaming",
    supplier_concentration: "Supplier concentration",
  },

  ledgerPage: {
    title: "The Ledger — tamper-evident audit trail",
    subtitle:
      "Every AI judgement — kitchen and financial — is sealed into an append-only, hash-chained ledger. Alter any past record and the chain breaks.",
    intact: "Chain intact — all records verified",
    tampered: "TAMPER DETECTED",
    tamperedAt: (seq: number) => `Record #${seq} was altered after it was sealed`,
    reasonAltered: "content no longer matches its seal",
    simulate: "Simulate tampering",
    restore: "Restore",
    reset: "Reset demo data",
    resetConfirm: "Clear all sealed records (Floor + Books + Ledger)? This cannot be undone.",
    empty: "No sealed records yet — run an inspection on the Floor or an audit in the Books first.",
    colSeq: "#",
    colTime: "Time",
    colSource: "Source",
    colRecord: "Record",
    kindSop: "Kitchen SOP",
    kindFinance: "Finance audit",
    prevLabel: "prev",
    note: "Each record's hash is computed from its content and the previous record's hash. Editing a sealed record changes its hash and breaks every link after it.",
  },

  // Used server-side by the reconciliation engine.
  finance: {
    titles: {
      ghost_meals: "Ghost meals — billed beyond served",
      price_markup: "Procurement markup over reference price",
      duplicate_invoice: "Duplicate invoice — potential double payment",
      threshold_gaming: "Invoice priced just under the approval threshold",
      supplier_concentration: "Supplier concentration — limited competition",
    },
    ev: {
      unaccounted: "Unaccounted portions",
      costPerPortion: "Cost / portion",
      estLeakage: "Estimated leakage",
      amountDiff: "Amount difference",
      approvalThreshold: "Approval threshold",
      underLimit: (pct: string) => `${pct} under limit`,
      ofAwards: (n: string, total: string, pct: string) => `${n} of ${total} awards (${pct})`,
      awardsCount: (n: string) => `${n} awards`,
      vsRef: (price: string, ref: string, pct: string, total: string) =>
        `${price} vs ref ${ref} — +${pct} = ${total}`,
    },
  },

  // Appended to AI prompts to control output language of free-text fields.
  aiDirective:
    "Write your narration and ALL free-text fields (summary, note, detail, explanation, recommendedAction) in English. Use the EXACT English JSON field names and enum values from the tool schema — do not rename or translate them. overallRisk must be one of: low, medium, high, critical. severity must be one of: low, medium, high. status must be one of: pass, warn, fail.",
};

export type Messages = typeof en;

const id: Messages = {
  brand: "MPKB · Integritas Dapur",
  poweredBy: "Didukung oleh Claude",

  fleet: {
    activeLabel: "dapur aktif",
    searchPlaceholder: "Cari dapur…",
    scaleLine: (total: string, provinces: string) => `${total} dapur · ${provinces} provinsi`,
    pilotBadge: "LIVE · PERCONTOHAN",
    notActive: "Belum aktif",
    noResults: "Tidak ada dapur yang cocok.",
    lockedNote:
      "Hanya dapur percontohan (Lombok) yang tersedia untuk pemantauan langsung pada pratinjau ini. Dapur lain terdaftar dalam program tetapi belum diaktifkan.",
  },

  auth: {
    signInTitle: "Masuk ke MPKB",
    signInSubtitle: "Hanya dengan undangan. Jika email Anda telah diundang, kami akan mengirim tautan masuk.",
    emailLabel: "Alamat email",
    emailPlaceholder: "anda@contoh.com",
    sendLink: "Kirim tautan masuk",
    sending: "Mengirim…",
    checkEmailTitle: "Periksa email Anda",
    checkEmailBody: "Jika akun undangan untuk alamat itu ada, tautan masuk sedang dikirim.",
    signOut: "Keluar",
    inviteOnly: "Akses hanya dengan undangan.",
    landingTagline: "Pemantauan integritas berbasis AI untuk dapur program makan sekolah.",
    landingBody:
      "Kepatuhan SOP real-time, audit integritas keuangan, dan buku besar anti-manipulasi di seluruh dapur MBG Indonesia.",
    navAdmin: "Admin",
    navSuperadmin: "Superadmin",
    adminTitle: "Admin",
    adminSubtitle: "Undang pengguna dan kelola akses.",
    inviteHeading: "Undang pengguna",
    nameLabel: "Nama",
    roleLabel: "Peran",
    invite: "Kirim undangan",
    inviting: "Mengundang…",
    inviteSent: (email: string) => `Undangan terkirim ke ${email}.`,
    inviteFailed: "Tidak dapat mengirim undangan.",
    superadminTitle: "Superadmin",
    superadminSubtitle: "Kontrol tingkat sistem.",
    placeholderNote: "Placeholder — disediakan untuk kontrol mendatang.",
    roleNames: { user: "Pengguna", admin: "Admin", superadmin: "Superadmin" },
    users: {
      heading: "Pengguna",
      name: "Nama",
      email: "Email",
      role: "Peran",
      status: "Status",
      invitedOn: "Diundang",
      lastSignIn: "Masuk terakhir",
      signIns: "Jumlah masuk",
      never: "Belum pernah",
      none: "Belum ada pengguna.",
      statusInvited: "Diundang",
      statusActive: "Aktif",
      statusBanned: "Diblokir",
    },
  },

  superadmin: {
    modelHeading: "Model AI",
    modelSubtitle: "Digunakan untuk semua analisis dapur dan keuangan. Sonnet untuk pengujian, Opus untuk demo.",
    modelNotes: {
      "claude-sonnet-4-6": "Lebih cepat dan lebih murah — cocok untuk pengembangan dan pengujian.",
      "claude-opus-4-8": "Kualitas tertinggi — terbaik untuk demo langsung.",
    },
  },

  nav: { floor: "Dapur", books: "Keuangan", ledger: "Buku Besar" },

  status: { pass: "LULUS", warn: "PERINGATAN", fail: "GAGAL" },
  severity: { low: "RENDAH", medium: "SEDANG", high: "TINGGI" },
  risk: { low: "RISIKO RENDAH", medium: "RISIKO SEDANG", high: "RISIKO TINGGI", critical: "KRITIS" },

  meal: {
    enrolled: "Terdaftar",
    present: "Hadir (absensi)",
    served: "Porsi disajikan (log)",
    billed: "Porsi ditagih (faktur)",
  },

  ledger: { tag: "BUKU BESAR", sealed: "tersegel" },

  floor: {
    title: "Dapur — Kepatuhan SOP",
    subtitle:
      "Claude memeriksa setiap frame dapur secara real-time, menjelaskan apa yang dilihat, dan menandai pelanggaran.",
    kitchenScore: "Skor dapur",
    zonesFlagged: "Zona ditandai",
    analyzed: "Dianalisis",
    runSweep: "Pindai semua",
    sweeping: "Memindai…",
    loadingZones: "Memuat zona kamera…",
    reasoningLabel: "Observasi AI",
    reasoningActive: "Menganalisis frame…",
    reasoningIdle: "Menunggu frame untuk diperiksa.",
    feedHint: "Umpan CCTV contoh — klik tile untuk jeda, Analisis untuk memeriksa frame, atau jatuhkan foto dapur Anda di zona mana pun.",
  },

  zone: {
    addHint: "Seret atau klik untuk menambah frame",
    live: "LANGSUNG",
    replace: "Ganti",
    add: "Tambah frame",
    analyze: "Analisis",
    analyzing: "Menganalisis…",
    rerun: "Ulangi",
    invalidDrop: "Jatuhkan berkas gambar, atau gunakan Tambah frame.",
    rec: "REC",
    paused: "JEDA",
    scanning: "MENGANALISIS",
    demoFeed: "Umpan demo",
    yourFrame: "Frame Anda",
    tapResume: "Ketuk untuk lanjut",
  },

  verdict: {
    title: "Putusan SOP",
    empty: "Belum ada frame dianalisis.",
    score: "skor",
    violations: "Pelanggaran",
  },

  alert: {
    sent: "Peringatan terkirim ke ponsel",
    delivered: "Terkirim via Telegram ✓",
    notConfigured: "Telegram belum dikonfigurasi — hanya tampil di aplikasi",
    bodyTpl: (zone: string, label: string, detail: string, action: string) =>
      `⚠️ ${zone}: ${label} bermasalah. ${detail} Tindakan: ${action}`,
  },

  books: {
    title: "Pembukuan — Integritas Keuangan",
    subtitle:
      "Mesin deterministik menghitung angka pasti; Claude menjelaskan dan menilainya — makanan fiktif, penggelembungan harga, faktur ganda, manipulasi ambang batas, dan konsentrasi pemasok.",
    procurementDay: "Hari pengadaan",
    audit: "Audit pembukuan",
    auditing: "Mengaudit…",
    reasoningLabel: "Auditor AI",
    reasoningActive: "Memeriksa pembukuan…",
    reasoningIdle: "Jalankan audit untuk melihat penalaran AI.",
    mealCounts: "Jumlah porsi",
    lineItems: "Rincian pengadaan",
    invoices: "Faktur",
    awards: "Pemenang tender (bulan ini)",
    colItem: "Barang",
    colSupplier: "Pemasok",
    colQty: "Jumlah",
    colUnitPrice: "Harga satuan",
    colReference: "Referensi",
    approvalThreshold: "Ambang persetujuan",
    auditResult: "Hasil audit",
    estLeakage: "estimasi kebocoran",
    runToReconcile: "Jalankan audit untuk merekonsiliasi pembukuan.",
    cleanComputed: "Tidak ada kejanggalan terhitung untuk hari ini.",
    cleanConfirmed: "Pembukuan terekonsiliasi bersih — tidak ada kejanggalan untuk hari ini.",
    judging: "menilai…",
    gapNote: (n: string, pct: string) => `${n} porsi ditagih melebihi yang disajikan (${pct}).`,
    issuesAwaiting: (n: number) => `${n} masalah terhitung — menunggu penilaian AI…`,
  },

  findingKind: {
    ghost_meals: "Makanan fiktif",
    price_markup: "Penggelembungan harga",
    duplicate_invoice: "Faktur ganda",
    threshold_gaming: "Manipulasi ambang",
    supplier_concentration: "Konsentrasi pemasok",
  },

  ledgerPage: {
    title: "Buku Besar — Jejak Audit Anti-Manipulasi",
    subtitle:
      "Setiap penilaian AI — dapur dan keuangan — disegel ke dalam buku besar berantai-hash yang hanya bisa ditambah. Ubah satu catatan lama dan rantainya rusak.",
    intact: "Rantai utuh — semua catatan terverifikasi",
    tampered: "MANIPULASI TERDETEKSI",
    tamperedAt: (seq: number) => `Catatan #${seq} diubah setelah disegel`,
    reasonAltered: "konten tidak lagi cocok dengan segelnya",
    simulate: "Simulasikan manipulasi",
    restore: "Pulihkan",
    reset: "Setel ulang data demo",
    resetConfirm: "Hapus semua catatan tersegel (Dapur + Keuangan + Buku Besar)? Tindakan ini tidak dapat dibatalkan.",
    empty: "Belum ada catatan tersegel — jalankan inspeksi di Dapur atau audit di Keuangan terlebih dahulu.",
    colSeq: "#",
    colTime: "Waktu",
    colSource: "Sumber",
    colRecord: "Catatan",
    kindSop: "SOP Dapur",
    kindFinance: "Audit keuangan",
    prevLabel: "sebelumnya",
    note: "Hash setiap catatan dihitung dari isinya dan hash catatan sebelumnya. Mengubah catatan tersegel mengubah hash-nya dan memutus setiap tautan setelahnya.",
  },

  finance: {
    titles: {
      ghost_meals: "Makanan fiktif — ditagih melebihi yang disajikan",
      price_markup: "Penggelembungan harga di atas harga referensi",
      duplicate_invoice: "Faktur ganda — potensi pembayaran ganda",
      threshold_gaming: "Faktur tepat di bawah ambang persetujuan",
      supplier_concentration: "Konsentrasi pemasok — persaingan terbatas",
    },
    ev: {
      unaccounted: "Porsi tak terhitung",
      costPerPortion: "Biaya / porsi",
      estLeakage: "Estimasi kebocoran",
      amountDiff: "Selisih nilai",
      approvalThreshold: "Ambang persetujuan",
      underLimit: (pct: string) => `${pct} di bawah batas`,
      ofAwards: (n: string, total: string, pct: string) => `${n} dari ${total} tender (${pct})`,
      awardsCount: (n: string) => `${n} tender`,
      vsRef: (price: string, ref: string, pct: string, total: string) =>
        `${price} vs referensi ${ref} — +${pct} = ${total}`,
    },
  },

  aiDirective:
    "Tulis narasi dan SEMUA kolom teks bebas (summary, note, detail, explanation, recommendedAction) dalam Bahasa Indonesia. PENTING: pertahankan nama field JSON dan nilai enum PERSIS dalam bahasa Inggris seperti pada skema alat — JANGAN menerjemahkannya. overallRisk harus salah satu dari: low, medium, high, critical. severity harus salah satu dari: low, medium, high. status harus salah satu dari: pass, warn, fail. Hanya isi teks bebas yang berbahasa Indonesia.",
};

export const MESSAGES: Record<Locale, Messages> = { en, id };

export function messagesFor(locale: Locale): Messages {
  return MESSAGES[locale];
}
