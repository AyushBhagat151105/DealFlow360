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

export type CounterOfferAlertEmailProps = {
  repName?: string;
  customerName: string;
  quoteNumber: string;
  blendedRiskScore: number;
  reviewUrl: string;
  customerComment?: string;
  proposedDiscountSummary: string;
};

export function CounterOfferAlertEmail({
  repName = "Sales Team",
  customerName = "Customer",
  quoteNumber = "QT-2026-0001",
  blendedRiskScore = 0,
  reviewUrl = "http://localhost:5173/workspace/approvals",
  customerComment,
  proposedDiscountSummary = "Customer proposed revised line discounts",
}: CounterOfferAlertEmailProps) {
  const isHighRisk = blendedRiskScore > 10;
  const isModerateRisk = blendedRiskScore > 0 && blendedRiskScore <= 10;

  return (
    <Html>
      <Head />
      <Preview>Customer Counter-Offer: {quoteNumber} ({customerName})</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Text style={brandLabel}>DEALFLOW360 GOVERNANCE ENGINE</Text>
            <Heading style={h1}>Customer Proposed Counter-Offer</Heading>
          </Section>

          <Section style={contentSection}>
            <Text style={greetingText}>Hello {repName},</Text>
            <Text style={bodyText}>
              <span style={bold}>{customerName}</span> has submitted a counter-negotiation on Quotation <span style={bold}>{quoteNumber}</span> via the Customer Portal.
            </Text>

            {customerComment && (
              <Section style={commentCard}>
                <Text style={commentHeader}>Customer Message:</Text>
                <Text style={commentText}>"{customerComment}"</Text>
              </Section>
            )}

            <Section style={riskCard}>
              <div style={summaryRow}>
                <span style={summaryLabel}>Quote Number:</span>
                <span style={summaryValue}>{quoteNumber}</span>
              </div>
              <div style={summaryRow}>
                <span style={summaryLabel}>Account:</span>
                <span style={summaryValue}>{customerName}</span>
              </div>
              <div style={summaryRow}>
                <span style={summaryLabel}>Counter Summary:</span>
                <span style={summaryValue}>{proposedDiscountSummary}</span>
              </div>
              <div style={summaryRow}>
                <span style={summaryLabel}>New Blended Risk Score:</span>
                <span
                  style={{
                    ...summaryValue,
                    color: isHighRisk ? "#dc2626" : isModerateRisk ? "#d97706" : "#16a34a",
                    fontWeight: "700",
                  }}
                >
                  {blendedRiskScore} / 20
                </span>
              </div>
            </Section>

            <Section style={buttonContainer}>
              <Button style={actionButton} href={reviewUrl}>
                Review in Approvals Queue
              </Button>
            </Section>

            <Hr style={divider} />

            <Text style={noticeText}>
              The deal has automatically been moved to <span style={bold}>UNDER_NEGOTIATION</span>. If the proposed discount exceeds allowed ceilings, it has been re-enqueued for manager/finance approval.
            </Text>
          </Section>

          <Section style={footerSection}>
            <Text style={footerText}>
              © 2026 DealFlow360 Sales Operations Platform. Automated governance alert.
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
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  maxWidth: "580px",
  overflow: "hidden" as const,
};

const headerSection = {
  backgroundColor: "#0f172a",
  padding: "28px 40px",
  textAlign: "center" as const,
};

const brandLabel = {
  color: "#f59e0b",
  fontSize: "11px",
  fontWeight: "700" as const,
  letterSpacing: "0.1em",
  margin: "0 0 8px 0",
};

const h1 = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: "700" as const,
  margin: "0",
};

const contentSection = {
  padding: "32px 40px 24px 40px",
};

const greetingText = {
  color: "#1e293b",
  fontSize: "15px",
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

const commentCard = {
  backgroundColor: "#fef3c7",
  borderLeft: "4px solid #f59e0b",
  padding: "12px 16px",
  borderRadius: "0 4px 4px 0",
  margin: "0 0 20px 0",
};

const commentHeader = {
  color: "#92400e",
  fontSize: "12px",
  fontWeight: "600" as const,
  margin: "0 0 4px 0",
};

const commentText = {
  color: "#78350f",
  fontSize: "13px",
  fontStyle: "italic" as const,
  margin: "0",
};

const riskCard = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  padding: "16px 20px",
  borderRadius: "6px",
  margin: "0 0 24px 0",
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

const buttonContainer = {
  textAlign: "center" as const,
  margin: "0 0 20px 0",
};

const actionButton = {
  backgroundColor: "#f59e0b",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 28px",
};

const divider = {
  borderColor: "#e2e8f0",
  margin: "20px 0 16px 0",
};

const noticeText = {
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
