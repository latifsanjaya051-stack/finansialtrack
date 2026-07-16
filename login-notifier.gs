// ============================================================
//  Login Notifier — Google Apps Script (Web App)
//  Mengirim email notifikasi login ke admin.
//  Deploy: Extensions > Apps Script > tempel kode ini >
//  Deploy > New deployment > type "Web app" >
//  Execute as: Me, Who has access: Anyone.
//  Lalu tempel URL yang dihasilkan ke NOTIFY_ENDPOINT di index.html.
// ============================================================

// Ganti dengan email tujuan notifikasi Anda.
const ADMIN_EMAIL = 'cas832545@gmail.com';

// Kunci rahasia — harus sama dengan NOTIFY_SECRET di index.html.
// Ganti dengan string acak yang kuat (mis. hasil generator password).
const SECRET = 'GANTI_DENGAN_KUNCI_RAHASIA';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // Validasi secret sederhana (cegah spam sembarangan).
    if (data.secret !== SECRET) {
      return ContentService.createTextOutput(
        JSON.stringify({ ok: false, error: 'unauthorized' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const waktu = new Date(data.time || Date.now());
    const waktuLokal = Utilities.formatDate(
      waktu,
      Session.getScriptTimeZone(),
      'dd-MM-yyyy HH:mm:ss'
    );

    const subject = '🔔 Notifikasi Login Baru — ' + (data.email || 'tanpa email');
    const body =
      'Ada aktivitas login baru pada aplikasi Web Catatan.\n\n' +
      'Waktu (ISO)   : ' + (data.time || '-') + '\n' +
      'Waktu lokal   : ' + waktuLokal + '\n' +
      'Nama          : ' + (data.name || '-') + '\n' +
      'Email akun    : ' + (data.email || '-') + '\n' +
      'IP            : ' + (data.ip || '-') + '\n' +
      'User-Agent    : ' + (data.ua || '-') + '\n\n' +
      'Pesan otomatis dari sistem notifikasi login.';

    // === Branch: backup data finansial ke email ===
    if (data.action === 'backup') {
      const backupTo = (data.to && String(data.to)) || ADMIN_EMAIL;
      const backupSubject = data.subject || ('Backup Data Finansial Track — ' + waktuLokal);
      const backupHtml = data.html || '';
      const rawData = data.rawData || '';

      // Kirim email HTML berisi ringkasan
      MailApp.sendEmail({
        to: backupTo,
        subject: backupSubject,
        htmlBody: backupHtml,
        body: 'Backup data finansial terlampir. Lihat versi HTML untuk tampilan lengkap.\n\n' +
              'Data mentah (JSON):\n' + rawData
      });

      // Lampirkan JSON mentah sebagai file jika tersedia
      if (rawData) {
        const blob = Utilities.newBlob(rawData, 'application/json', 'backup-data.json');
        MailApp.sendEmail({
          to: backupTo,
          subject: backupSubject + ' (lampiran)',
          body: 'Lampiran JSON data backup.',
          attachments: [blob]
        });
      }

      return ContentService.createTextOutput(
        JSON.stringify({ ok: true, action: 'backup' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    MailApp.sendEmail({
      to: ADMIN_EMAIL,
      subject: subject,
      body: body
    });

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// doGet agar URL bisa diakses tanpa error saat dibuka manual.
function doGet() {
  return ContentService.createTextOutput('Login notifier aktif.');
}
