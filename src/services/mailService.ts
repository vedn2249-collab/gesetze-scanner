import nodemailer, { type Transporter } from "nodemailer";

export interface WiderrufEmailParams {
  id: string;
  name: string;
  email: string;
  transaction_id: string;
  reason?: string;
  created_at: string;
}

export interface MailDispatchResult {
  customerSuccess: boolean;
  adminSuccess: boolean;
  customerMessageId?: string;
  adminMessageId?: string;
  previewUrl?: string;
  error?: string;
}

let cachedTransporter: Transporter | null = null;

/**
 * Erstellt oder liefert den Nodemailer-Transporter.
 * Unterstützt SMTP-Konfiguration über Umgebungsvariablen (SMTP_HOST / GMAIL_APP_PASSWORD),
 * oder richtet automatisch einen verifizierten Test-Transport ein.
 */
async function getTransporter(): Promise<Transporter> {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const rawUser = process.env.SMTP_USER || process.env.GMAIL_USER || "vedn2249@gmail.com";
  const rawPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "";
  const smtpUser = rawUser.trim();
  const smtpPass = rawPass.replace(/\s+/g, "");

  // 1. Wenn SMTP_PASS vorhanden ist und Gmail genutzt wird:
  if (smtpPass && (smtpHost?.includes("gmail") || !smtpHost || smtpUser.endsWith("@gmail.com"))) {
    console.log(`[MAIL SERVICE]: Verwende verifizierten Gmail SMTP-Transporter für ${smtpUser}`);
    cachedTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
    return cachedTransporter;
  }

  // 2. Benutzerdefinierter SMTP-Server (z. B. eigener Mailserver):
  if (smtpHost && smtpUser && smtpPass) {
    console.log(`[MAIL SERVICE]: Verwende konfigurierten SMTP-Server ${smtpHost}:${smtpPort} (${smtpUser})`);
    cachedTransporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
    return cachedTransporter;
  }

  // 3. Fallback: Ethereal Mail für sichere Zustellungstests ohne Absturz
  console.log("[MAIL SERVICE]: Keine SMTP-Zugangsdaten in .env gefunden. Initialisiere Test-Account (Ethereal SMTP)...");
  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log(`[MAIL SERVICE]: Test-SMTP aktiv. Zugangsdaten: ${testAccount.user}`);
    return cachedTransporter;
  } catch (err) {
    console.warn("[MAIL SERVICE]: Konnte keinen Ethereal Test-Account erstellen, nutze Stream-Fallback:", err);
    // Stream-Transporter falls offline
    cachedTransporter = nodemailer.createTransport({
      jsonTransport: true
    });
    return cachedTransporter;
  }
}

/**
 * Sendet echte E-Mails für den Widerruf:
 * 1. Automatische Eingangsbestätigung an den Kunden (§ 356a Abs. 2 BGB)
 * 2. Benachrichtigung an Admin (vedn2249@gmail.com)
 */
export async function dispatchWiderrufEmails(params: WiderrufEmailParams): Promise<MailDispatchResult> {
  const result: MailDispatchResult = {
    customerSuccess: false,
    adminSuccess: false
  };

  try {
    const transporter = await getTransporter();
    const formattedDate = new Date(params.created_at).toLocaleString("de-DE", {
      timeZone: "Europe/Berlin",
      dateStyle: "medium",
      timeStyle: "medium"
    });

    const user = process.env.SMTP_USER || process.env.GMAIL_USER || "vedn2249@gmail.com";
    const fromAddress = process.env.MAIL_FROM || `"Gesetze-Scanner" <${user}>`;
    const adminAddress = process.env.ADMIN_EMAIL || "vedn2249@gmail.com";

    // 1. E-Mail an den Kunden
    const customerMailOptions = {
      from: fromAddress,
      to: params.email,
      subject: `Eingangsbestätigung Ihres Widerrufs (ID: ${params.id}) - Gesetze-Scanner`,
      text: `Sehr geehrte(r) ${params.name},

wir bestätigen den Eingang Ihres Widerrufs gemäß § 356a BGB n.F.

Details Ihres Widerrufs:
- Widerrufs-ID: ${params.id}
- Eingangsdatum: ${formattedDate}
- Transaktions- / Bestell-ID: ${params.transaction_id}
- Status: Eingegangen / In Prüfung

Ihr Widerruf ist bei uns ordnungsgemäß eingegangen und wird unverzüglich bearbeitet.
Diese E-Mail dient Ihnen als dauerhafter Nachweis über den rechtzeitigen Zugang Ihres Widerrufs.

Mit freundlichen Grüßen
Ihr Gesetze-Scanner Team
https://gesetze-scanner.de`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border-radius: 8px;">
          <div style="background-color: #0f172a; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">Gesetze-Scanner</h1>
            <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Elektronische Widerrufsbestätigung nach § 356a BGB</p>
          </div>
          <div style="background-color: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
            <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 12px 16px; margin-bottom: 20px;">
              <strong style="color: #065f46; font-size: 15px;">Widerruf erfolgreich eingegangen</strong>
              <p style="color: #047857; margin: 4px 0 0 0; font-size: 13px;">Wir bestätigen hiermit den unverzüglichen Eingang Ihres Widerrufs auf einem dauerhaften Datenträger.</p>
            </div>
            
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">
              Sehr geehrte(r) <strong>${params.name}</strong>,<br>
              Ihr Widerruf bezüglich Ihrer Bestellung ist bei uns eingegangen.
            </p>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 0; color: #64748b; width: 40%;">Widerrufs-ID:</td>
                <td style="padding: 8px 0; color: #0f172a; font-family: monospace; font-weight: 600;">${params.id}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 0; color: #64748b;">Eingangsdatum:</td>
                <td style="padding: 8px 0; color: #0f172a;">${formattedDate}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 0; color: #64748b;">Transaktions- / Bestell-ID:</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${params.transaction_id}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Status:</td>
                <td style="padding: 8px 0; color: #10b981; font-weight: 600;">Eingegangen / In Bearbeitung</td>
              </tr>
            </table>

            <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
              Diese Eingangsbestätigung wird Ihnen automatisch nach Ausfüllen und Absenden der elektronischen Widerrufserklärung gemäß § 356a Abs. 2 BGB zugesandt.
            </p>
          </div>
        </div>
      `
    };

    const customerInfo = await transporter.sendMail(customerMailOptions);
    result.customerSuccess = true;
    result.customerMessageId = customerInfo.messageId;
    console.log(`[MAIL SERVICE]: E-Mail an Kunden ${params.email} versendet. Message-ID: ${customerInfo.messageId}`);

    const previewUrl = nodemailer.getTestMessageUrl(customerInfo);
    if (previewUrl) {
      result.previewUrl = previewUrl.toString();
      console.log(`[MAIL SERVICE]: Ethereal Preview URL: ${previewUrl}`);
    }

    // 2. Admin-E-Mail an vedn2249@gmail.com
    const adminMailOptions = {
      from: fromAddress,
      to: adminAddress,
      subject: `🚨 Neuer Widerruf eingegangen (${params.transaction_id}) - Gesetze-Scanner`,
      text: `Neuer Widerruf eingegangen nach § 356a BGB n.F.

Details:
- Widerrufs-ID: ${params.id}
- Name: ${params.name}
- E-Mail: ${params.email}
- Transaktions-ID: ${params.transaction_id}
- Eingangsdatum: ${formattedDate}
- Angegebener Grund: ${params.reason || "Keine Angabe"}
- Status: Eingegangen

Bitte in Paddle bzw. im Zahlungssystem prüfen und die Erstattung veranlassen.`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; padding: 20px; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">
          <h2 style="color: #991b1b; margin-top: 0;">🚨 Neuer Widerruf eingegangen</h2>
          <p style="font-size: 14px; color: #374151;">Ein Kunde hat soeben über das elektronische Formular nach § 356a BGB n.F. widerrufen:</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; background: white; padding: 12px; border-radius: 4px;">
            <tr><td style="padding: 6px; font-weight: bold; color: #4b5563;">Widerrufs-ID:</td><td style="padding: 6px; font-family: monospace;">${params.id}</td></tr>
            <tr><td style="padding: 6px; font-weight: bold; color: #4b5563;">Kunde:</td><td style="padding: 6px;">${params.name} (${params.email})</td></tr>
            <tr><td style="padding: 6px; font-weight: bold; color: #4b5563;">Transaktions-ID:</td><td style="padding: 6px; font-weight: bold;">${params.transaction_id}</td></tr>
            <tr><td style="padding: 6px; font-weight: bold; color: #4b5563;">Datum:</td><td style="padding: 6px;">${formattedDate}</td></tr>
            <tr><td style="padding: 6px; font-weight: bold; color: #4b5563;">Grund:</td><td style="padding: 6px; color: #6b7280;">${params.reason || "Keine Angabe"}</td></tr>
          </table>
        </div>
      `
    };

    const adminInfo = await transporter.sendMail(adminMailOptions);
    result.adminSuccess = true;
    result.adminMessageId = adminInfo.messageId;
    console.log(`[MAIL SERVICE]: Admin-Mail an ${adminAddress} versendet. Message-ID: ${adminInfo.messageId}`);

  } catch (error: any) {
    console.error("[MAIL SERVICE]: Fehler beim Versenden der E-Mails:", error);
    result.error = error?.message || "E-Mail-Versand fehlgeschlagen";
  }

  return result;
}

/**
 * Sendet nach erfolgreichem Kauf die Bestätigung über den Widerrufsausschluss (§ 356 Abs. 5 BGB)
 */
export async function dispatchWithdrawalExpiryEmail(email: string, transactionId: string): Promise<boolean> {
  try {
    const user = process.env.SMTP_USER || process.env.GMAIL_USER || "vedn2249@gmail.com";
    const fromAddress = process.env.MAIL_FROM || `"Gesetze-Scanner Service" <${user}>`;
    const transporter = await getTransporter();

    await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: `Bestätigung Ihres Kaufs & vorzeitiges Erlöschen des Widerrufsrechts - Gesetze-Scanner`,
      text: `Sehr geehrte Kundin, sehr geehrter Kunde,

vielen Dank für Ihre Bestellung beim Gesetze-Scanner (Transaktion: ${transactionId}).

Wichtiger Hinweis zum Widerrufsrecht gemäß § 356 Abs. 5 BGB:
Sie haben vor Beginn der Ausführung ausdrücklich zugestimmt, dass wir mit der Bereitstellung der digitalen Inhalte vor Ablauf der 14-tägigen Widerrufsfrist beginnen. Zudem haben Sie Ihre Kenntnis darüber bestätigt, dass Sie durch diese Zustimmung mit Beginn der Ausführung Ihr Widerrufsrecht verlieren.

Wir bestätigen Ihnen hiermit die Kenntnisnahme und Ihre Zustimmung auf einem dauerhaften Datenträger (§ 356 Abs. 5 Satz 2 BGB).

Mit freundlichen Grüßen
Ihr Gesetze-Scanner Team`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; padding: 24px; background-color: #f8fafc; border-radius: 8px;">
          <h2 style="color: #0f172a; margin-top: 0;">Bestätigung Ihrer Bestellung</h2>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">
            Vielen Dank für Ihre Bestellung beim Gesetze-Scanner (Transaktions-ID: <strong>${transactionId}</strong>).
          </p>
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 16px 0;">
            <strong style="color: #92400e; font-size: 14px;">Gesetzliche Information zum Widerrufsrecht (§ 356 Abs. 5 BGB)</strong>
            <p style="color: #78350f; font-size: 13px; margin: 4px 0 0 0; line-height: 1.5;">
              Sie haben vor Abschluss der Bestellung ausdrücklich zugestimmt, dass mit der Ausführung der digitalen Dienstleistung vor Ablauf der Widerrufsfrist begonnen wird, und bestätigt, dass Ihr Widerrufsrecht mit Beginn der Ausführung erlischt. Hiermit bestätigen wir Ihre ausdrückliche Zustimmung und Kenntnisnahme.
            </p>
          </div>
        </div>
      `
    });
    console.log(`[MAIL SERVICE]: Bestätigung über Widerrufsausschluss an ${email} versendet.`);
    return true;
  } catch (error) {
    console.error("[MAIL SERVICE]: Fehler beim Senden der Expiry-Mail:", error);
    return false;
  }
}

/**
 * Sendet eine echte E-Mail für die Test-Eilwarnung
 */
export async function dispatchTestAlertEmail(
  recipientEmail: string,
  alert: any
): Promise<{ success: boolean; messageId?: string; previewUrl?: string; error?: string }> {
  try {
    const user = process.env.SMTP_USER || process.env.GMAIL_USER || "vedn2249@gmail.com";
    const fromAddress = process.env.MAIL_FROM || `"Gesetze-Scanner Eilwarnung" <${user}>`;
    const transporter = await getTransporter();

    const emailSubject = `[EIL-WARNUNG] ${alert?.title || "BGH Urteil: Verschärfte Begründungspflicht bei Kündigungen (§ 573 BGB)"}`;
    const emailBodyHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #09090b; color: #f4f4f5; padding: 24px; border-radius: 16px; border: 1px solid #27272a;">
        <div style="border-bottom: 1px solid #27272a; padding-bottom: 16px; margin-bottom: 16px;">
          <span style="background: #ef444420; color: #f87171; border: 1px solid #ef444450; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
            🚨 EIL-WARNSTUFE ROT • BUNDESGERICHTSHOF
          </span>
          <h2 style="color: #ffffff; margin-top: 12px; font-size: 18px;">${alert?.title || "Rechtsprechungs-Änderung"}</h2>
          <p style="color: #fbbf24; font-size: 13px; margin: 4px 0;">Rechtsgebiet: ${alert?.category || "Mietrecht"} | Norm: ${alert?.lawCode || "§ 573 BGB"}</p>
        </div>
        
        <p style="color: #d4d4d8; font-size: 14px; line-height: 1.6;">
          <strong>Sehr geehrte(r) Abonnent(in),</strong><br/>
          Unser 24/7 Gesetzes-Monitor hat soeben eine signifikante Änderung für Ihren gewählten Fachbereich registriert.
        </p>

        <div style="background: #18181b; border: 1px solid #3f3f46; border-radius: 12px; padding: 16px; margin: 16px 0;">
          <p style="color: #e4e4e7; font-size: 13px; margin: 0 0 8px 0;"><strong>Zusammenfassung:</strong> ${alert?.summary || "Formvorschriften verschärft."}</p>
          <p style="color: #fbbf24; font-size: 13px; margin: 0 0 8px 0;"><strong>Auswirkung:</strong> ${alert?.impactOnSubscribers || "Laufende Verfahren betroffen."}</p>
          <p style="color: #34d399; font-size: 13px; margin: 0;"><strong>Handlungsempfehlung:</strong> ${alert?.recommendedAction || "Prüfung veranlassen."}</p>
        </div>

        <p style="color: #a1a1aa; font-size: 12px; border-top: 1px solid #27272a; padding-top: 12px;">
          Sie erhalten diese Benachrichtigung auf Basis Ihrer individuellen Benachrichtigungs-Matrix für <em>${recipientEmail}</em>.
        </p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: recipientEmail,
      subject: emailSubject,
      html: emailBodyHtml,
      text: `${alert?.title || "Eilwarnung"}\n\n${alert?.summary || ""}\n\nHandlungsempfehlung: ${alert?.recommendedAction || ""}`
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[MAIL SERVICE]: Test-Eilwarnung an ${recipientEmail} versendet. Message-ID: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl ? previewUrl.toString() : undefined
    };
  } catch (error: any) {
    console.error("[MAIL SERVICE]: Fehler beim Versenden der Test-Eilwarnung:", error);
    return {
      success: false,
      error: error?.message || "E-Mail-Versand fehlgeschlagen"
    };
  }
}

