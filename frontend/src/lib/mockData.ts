import type { MessageAnalysisResponse, CurrencyAnalysisResponse } from '../types'

export function mockCurrencyResponse(verdict: 'REAL' | 'FAKE' = 'REAL'): CurrencyAnalysisResponse {
  if (verdict === 'REAL') {
    return {
      verdict: 'REAL',
      confidence: 87.3 + Math.random() * 10,
      authentic_probability: 87.3 + Math.random() * 10,
      counterfeit_probability: 2.1 + Math.random() * 8,
      recommendation: 'Currency appears authentic. Security features detected: watermark, security thread, micro-printing.',
    }
  }
  return {
    verdict: 'FAKE',
    confidence: 73.8 + Math.random() * 15,
    authentic_probability: 5.2 + Math.random() * 10,
    counterfeit_probability: 73.8 + Math.random() * 15,
    recommendation: 'Currency appears counterfeit. Missing security features: watermark absent, security thread mismatch, color bleed detected.',
  }
}

export function mockMessageResponse(threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'HIGH'): MessageAnalysisResponse {
  if (threatLevel === 'HIGH') {
    return {
      risk_score: 78,
      threat_level: 'HIGH',
      fraud_probability: 0.89,
      suggested_action: 'This message exhibits strong fraud indicators. Do not engage, do not share personal information, and report to cybercrime.gov.in immediately.',
      reasons: ['UPI ID solicitation detected', 'Urgency/panic language pattern', 'Suspicious shortened URL', 'Known scam template match'],
      matched_signals: ['upi_fraud', 'urgency_language', 'shortened_url', 'phishing_template'],
      extracted_entities: {
        phones: ['+91 98765 43210'],
        emails: ['fraudulent@scam-mail.com'],
        upi_ids: ['scammer@okaxis'],
        urls: ['https://bit.ly/xyz-scam'],
        account_numbers: ['50100123456789'],
        currency_mentions: ['₹50,000'],
      },
      rule_score: 0.65,
      ml_score: 0.89,
      ml_model_ready: true,
    }
  }
  if (threatLevel === 'MEDIUM') {
    return {
      risk_score: 45,
      threat_level: 'MEDIUM',
      fraud_probability: 0.48,
      suggested_action: 'Some suspicious patterns detected. Verify the sender identity through a separate channel before taking any action.',
      reasons: ['Unsolicited link detected', 'Request for personal information'],
      matched_signals: ['unsolicited_link', 'personal_info_request'],
      extracted_entities: {
        phones: ['+91 98765 12345'],
        emails: [],
        upi_ids: [],
        urls: ['https://unknown-site.com/verify'],
        account_numbers: [],
        currency_mentions: ['₹2,000'],
      },
      rule_score: 0.35,
      ml_score: 0.48,
      ml_model_ready: true,
    }
  }
  return {
    risk_score: 12,
    threat_level: 'LOW',
    fraud_probability: 0.12,
    suggested_action: 'No strong fraud indicators detected. Standard caution still advised.',
    reasons: [],
    matched_signals: [],
    extracted_entities: {
      phones: [],
      emails: [],
      upi_ids: [],
      urls: [],
      account_numbers: [],
      currency_mentions: [],
    },
    rule_score: 0.05,
    ml_score: 0.12,
    ml_model_ready: true,
  }
}

export const demoCurrencyImageUrl = 'https://images.unsplash.com/photo-1604593408539-e1ae24e17a9b?w=400&h=300&fit=crop'

export const demoScamMessages = {
  upi: 'Dear customer, your UPI ID has been blocked. To reactivate, click the link and enter your UPI PIN: https://upi-verify-secure.tk',
  lottery: 'CONGRATULATIONS! You have won ₹25,00,000 in the British Lottery! To claim your prize, send your bank details and ₹5,000 processing fee to account 1234567890.',
  bank: 'URGENT: Your SBI account will be closed in 24 hours. Verify your KYC immediately by calling +91-9876543210 and sharing your card details and OTP.',
  job: 'Work from Home! Earn ₹5,000 daily! Just invest ₹2,000 in our training program. UPI: getrich@paytm. Limited slots!',
  kyc: 'RBI NOTICE: Your KYC is incomplete. Update now via https://kyc-rbi-verify.site to avoid account freeze. PAN and Aadhaar required.',
  courier: 'FedEx: Your package is held at customs. Pay ₹499 processing fee at https://fedex-clearance.com to release your shipment.',
  aadhaar: 'UIDAI ALERT: Your Aadhaar card has been deactivated due to suspicious activity. Call 1800-XXX-XXXX immediately and provide your Aadhaar number and OTP.',
  tax: 'Income Tax Department: Tax refund of ₹15,000 approved for PAN XXXX1234X. Click https://it-refund-gov.in to claim within 24 hours.',
  telegram: 'Join our VIP Telegram channel for guaranteed stock tips! 100% returns in 7 days. Entry fee: ₹999 only. UPI: tradingtips@axis.',
  investment: 'Double your money in 30 days! Our AI-powered trading bot guarantees 200% returns. Minimum investment ₹10,000. Bank transfer only.',
  loan: 'Pre-approved personal loan of ₹10,00,000 at 1% interest! No documents needed. Pay ₹1,999 processing fee to UPI: fastloan@sbi to avail.',
  qr: 'Scan this QR code to receive your ₹500 cashback reward! Limited time offer from Paytm. Do not share OTP with anyone.',
  digitalArrest: 'DIGITAL ARREST WARRANT: CBI has issued an arrest warrant in your name. To cancel, transfer ₹50,000 to the designated account immediately. Do not disconnect this call.',
  jobOffer: 'URGENT HIRING: Amazon work-from-home. ₹50,000/month. No interview, no experience needed. Register now with ₹999 fee at https://amazon-jobs-fake.com.',
}

export function getRandomScamMessage(): string {
  const messages = Object.values(demoScamMessages)
  return messages[Math.floor(Math.random() * messages.length)]
}
