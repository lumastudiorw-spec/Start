import nodemailer, { type Transporter } from 'nodemailer'

const DEFAULT_FROM = 'Eyes on Me <alerts@example.invalid>'

let transporter: Transporter | null = null
let warned = false

function getTransporter(): Transporter | null {
  if (transporter) return transporter
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    if (!warned) {
      console.warn(
        '[mailer] SMTP_* env vars not set — alert emails will be logged, not sent. See server/README.md.',
      )
      warned = true
    }
    return null
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
  return transporter
}

export async function sendAlertEmail(
  to: { name: string; email: string }[],
  message: string,
): Promise<boolean> {
  const t = getTransporter()
  if (!t || to.length === 0) {
    console.log(`[mailer] would send to ${to.map((c) => c.email).join(', ')}: ${message}`)
    return t !== null // "sent" only when actually configured; 0 recipients is not a delivery
  }
  const from = process.env.SMTP_FROM ?? DEFAULT_FROM
  try {
    await Promise.all(
      to.map((contact) =>
        t.sendMail({
          from,
          to: contact.email,
          subject: 'Eyes on Me — alert',
          text: `${contact.name ? `Hi ${contact.name}, ` : ''}${message}`,
        }),
      ),
    )
    return true
  } catch (err) {
    console.error('[mailer] send failed:', err)
    return false
  }
}
