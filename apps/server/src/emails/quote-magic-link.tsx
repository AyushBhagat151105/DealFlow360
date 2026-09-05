/** @jsxImportSource react */
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";

export type QuoteMagicLinkEmailProps = {
  customerName: string;
  quoteNumber: string;
  totalAmount: number;
  portalUrl: string;
  customMessage?: string;
  lineItemCount?: number;
};

export function QuoteMagicLinkEmail({
  customerName = "Valued Customer",
  quoteNumber = "QT-2026-0001",
  totalAmount = 0,
  portalUrl = "http://localhost:5173/portal/quote/sample",
  customMessage,
  lineItemCount,
}: QuoteMagicLinkEmailProps) {
  const formattedAmount = totalAmount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <Html>
      <Head />
      <Preview>Your DealFlow360 Quotation {quoteNumber} is ready for review</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Text style={brandLabel}>DEALFLOW360 SALES OPERATIONS</Text>
            <Heading style={h1}>Quotation Ready for Review</Heading>
          </Section>

          <Section style={contentSection}>
            <Text style={greetingText}>Hello {customerName},</Text>
            <Text style={bodyText}>
              A new quotation <span style={bold}>{quoteNumber}</span> has been prepared for you. You can view full line-item specifications, negotiate terms, and confirm the order directly inside your private customer portal.
            </Text>

            {customMessage && (
              <Section style={customMessageCard}>
                <Text style={customMessageHeader}>Note from your Sales Representative:</Text>
                <Text style={customMessageContent}>"{customMessage}"</Text>
              </Section>
            )}

            <Section style={summaryCard}>
              <div style={summaryRow}>
                <span style={summaryLabel}>Quote Number:</span>
                <span style={summaryValue}>{quoteNumber}</span>
              </div>
              <div style={summaryRow}>
                <span style={summaryLabel}>Total Amount:</span>
                <span style={summaryValueBold}>{formattedAmount}</span>
              </div>
              {lineItemCount !== undefined && (
                <div style={summaryRow}>
                  <span style={summaryLabel}>Line Items:</span>
                  <span style={summaryValue}>{lineItemCount} product(s)</span>
                </div>
              )}
            </Section>

            <Section style={buttonContainer}>
              <Button style={primaryButton} href={portalUrl}>
                Review & Negotiate Quotation
              </Button>
            </Section>

            <Text style={linkFallbackText}>
              If the button above does not work, copy and paste this secure link into your browser:
            </Text>
            <Text style={urlText}>{portalUrl}</Text>

            <Hr style={divider} />

            <Text style={securityNotice}>
              This is a secure 1-click magic link generated specifically for your account. No password is required. You can propose counter-discounts, leave line-by-line questions, or confirm terms directly.
            </Text>
          </Section>

          <Section style={footerSection}>
            <Text style={footerText}>
              © 2026 DealFlow360 Sales Operations Platform. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f8fafc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  padding: "0",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  maxWidth: "580px",
  overflow: "hidden" as const,
};

const headerSection = {
  backgroundColor: "#0f172a",
  padding: "32px 40px",
  textAlign: "center" as const,
};

const brandLabel = {
  color: "#38bdf8",
  fontSize: "11px",
  fontWeight: "700" as const,
  letterSpacing: "0.1em",
  margin: "0 0 8px 0",
};

const h1 = {
  color: "#ffffff",
  fontSize: "22px",
  fontWeight: "700" as const,
  margin: "0",
  lineHeight: "28px",
};

const contentSection = {
  padding: "36px 40px 24px 40px",
};

const greetingText = {
  color: "#1e293b",
  fontSize: "16px",
  fontWeight: "600" as const,
  margin: "0 0 12px 0",
};

const bodyText = {
  color: "#475569",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 20px 0",
};

const bold = {
  fontWeight: "700" as const,
  color: "#0f172a",
};

const customMessageCard = {
  backgroundColor: "#f1f5f9",
  borderLeft: "4px solid #0284c7",
  padding: "12px 16px",
  borderRadius: "0 4px 4px 0",
  margin: "0 0 20px 0",
};

const customMessageHeader = {
  color: "#0369a1",
  fontSize: "12px",
  fontWeight: "600" as const,
  margin: "0 0 4px 0",
};

const customMessageContent = {
  color: "#334155",
  fontSize: "13px",
  fontStyle: "italic" as const,
  margin: "0",
};

const summaryCard = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  padding: "16px 20px",
  borderRadius: "6px",
  margin: "0 0 28px 0",
};

const summaryRow = {
  display: "flex",
  justifyContent: "space-between",
  padding: "4px 0",
};

const summaryLabel = {
  color: "#64748b",
  fontSize: "13px",
};

const summaryValue = {
  color: "#1e293b",
  fontSize: "13px",
  fontFamily: "monospace",
};

const summaryValueBold = {
  color: "#0f172a",
  fontSize: "15px",
  fontWeight: "700" as const,
  fontFamily: "monospace",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "0 0 24px 0",
};

const primaryButton = {
  backgroundColor: "#0284c7",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
};

const linkFallbackText = {
  color: "#94a3b8",
  fontSize: "12px",
  margin: "0 0 4px 0",
};

const urlText = {
  color: "#0284c7",
  fontSize: "12px",
  wordBreak: "break-all" as const,
  margin: "0 0 20px 0",
};

const divider = {
  borderColor: "#e2e8f0",
  margin: "24px 0 16px 0",
};

const securityNotice = {
  color: "#94a3b8",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "0",
};

const footerSection = {
  backgroundColor: "#f8fafc",
  borderTop: "1px solid #e2e8f0",
  padding: "16px 40px",
  textAlign: "center" as const,
};

const footerText = {
  color: "#94a3b8",
  fontSize: "11px",
  margin: "0",
};
