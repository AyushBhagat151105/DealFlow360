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

export type OrderConfirmationEmailProps = {
  customerName: string;
  quoteNumber: string;
  totalAmount: number;
  portalUrl: string;
  invoiceCount?: number;
  subscriptionCount?: number;
};

export function OrderConfirmationEmail({
  customerName = "Valued Customer",
  quoteNumber = "QT-2026-0001",
  totalAmount = 0,
  portalUrl = "http://localhost:5173/portal/quote/sample",
  invoiceCount = 1,
  subscriptionCount = 0,
}: OrderConfirmationEmailProps) {
  const formattedAmount = totalAmount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <Html>
      <Head />
      <Preview>Order Confirmed: {quoteNumber} is being processed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Text style={brandLabel}>DEALFLOW360 SALES OPERATIONS</Text>
            <Heading style={h1}>Order Confirmed & In Process</Heading>
          </Section>

          <Section style={contentSection}>
            <Text style={greetingText}>Hello {customerName},</Text>
            <Text style={bodyText}>
              Thank you for confirming quotation <span style={bold}>{quoteNumber}</span>. Your order has been officially accepted and routed for multi-warehouse fulfillment and billing reconciliation.
            </Text>

            <Section style={orderCard}>
              <div style={summaryRow}>
                <span style={summaryLabel}>Quote Number:</span>
                <span style={summaryValue}>{quoteNumber}</span>
              </div>
              <div style={summaryRow}>
                <span style={summaryLabel}>Order Total:</span>
                <span style={summaryValueBold}>{formattedAmount}</span>
              </div>
              <div style={summaryRow}>
                <span style={summaryLabel}>Status:</span>
                <span style={statusBadge}>CONFIRMED</span>
              </div>
              {invoiceCount > 0 && (
                <div style={summaryRow}>
                  <span style={summaryLabel}>Invoices Generated:</span>
                  <span style={summaryValue}>{invoiceCount}</span>
                </div>
              )}
              {subscriptionCount > 0 && (
                <div style={summaryRow}>
                  <span style={summaryLabel}>Active Subscriptions:</span>
                  <span style={summaryValue}>{subscriptionCount}</span>
                </div>
              )}
            </Section>

            <Section style={buttonContainer}>
              <Button style={primaryButton} href={portalUrl}>
                View Order & Invoice Status
              </Button>
            </Section>

            <Hr style={divider} />

            <Text style={nextStepsHeading}>What happens next?</Text>
            <Text style={nextStepsBody}>
              1. Our warehouse fulfillment system is allocating inventory from the optimal distribution centers.<br />
              2. Your billing invoices and recurring schedules have been initiated.<br />
              3. You can revisit your portal link anytime to check delivery updates and download invoice receipts.
            </Text>
          </Section>

          <Section style={footerSection}>
            <Text style={footerText}>
              © 2026 DealFlow360 Sales Operations Platform.
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
  backgroundColor: "#059669",
  padding: "32px 40px",
  textAlign: "center" as const,
};

const brandLabel = {
  color: "#d1fae5",
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
  margin: "0 0 24px 0",
};

const bold = {
  fontWeight: "700" as const,
  color: "#0f172a",
};

const orderCard = {
  backgroundColor: "#f0fdf4",
  border: "1px solid #bbf7d0",
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
  color: "#166534",
  fontSize: "13px",
};

const summaryValue = {
  color: "#14532d",
  fontSize: "13px",
  fontFamily: "monospace",
};

const summaryValueBold = {
  color: "#14532d",
  fontSize: "15px",
  fontWeight: "700" as const,
  fontFamily: "monospace",
};

const statusBadge = {
  backgroundColor: "#16a34a",
  color: "#ffffff",
  fontSize: "11px",
  fontWeight: "700" as const,
  padding: "2px 8px",
  borderRadius: "9999px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "0 0 24px 0",
};

const primaryButton = {
  backgroundColor: "#059669",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
};

const divider = {
  borderColor: "#e2e8f0",
  margin: "24px 0 16px 0",
};

const nextStepsHeading = {
  color: "#1e293b",
  fontSize: "13px",
  fontWeight: "600" as const,
  margin: "0 0 8px 0",
};

const nextStepsBody = {
  color: "#64748b",
  fontSize: "12px",
  lineHeight: "20px",
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
