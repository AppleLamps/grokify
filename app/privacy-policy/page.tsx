import type { ReactNode } from "react";

export default function PrivacyPolicy() {
  return (
    <div
      style={{
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        backgroundColor: "#FFFFFF",
        color: "#000000",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: "#000000",
          padding: "40px 24px",
        }}
      >
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div
            style={{
              fontWeight: 900,
              fontSize: 28,
              color: "#FFFFFF",
              letterSpacing: -0.5,
              lineHeight: 1,
            }}
          >
            SEISMIC
          </div>
          <div
            style={{
              fontWeight: 900,
              fontSize: 28,
              color: "#FF3000",
              letterSpacing: -0.5,
              lineHeight: 1,
              marginTop: 2,
            }}
          >
            ALERTS
          </div>
          <div
            style={{
              fontWeight: 700,
              fontSize: 10,
              color: "#999999",
              letterSpacing: 3,
              marginTop: 16,
              textTransform: "uppercase",
            }}
          >
            Privacy Policy
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 24px 80px" }}>
        <p
          style={{
            fontSize: 11,
            color: "#999999",
            letterSpacing: 1,
            fontWeight: 700,
            marginBottom: 32,
          }}
        >
          EFFECTIVE DATE: APRIL 3, 2026
        </p>

        <Section title="OVERVIEW">
          <P>
            Seismic Alerts is an earthquake monitoring application that displays
            real-time seismic data from the United States Geological Survey
            (USGS). This privacy policy explains what information the app
            collects, how it is stored, and how it is used.
          </P>
        </Section>

        <Section title="DATA WE COLLECT">
          <P>
            Seismic Alerts collects only the information you voluntarily provide
            within the app&apos;s notification settings:
          </P>
          <Ul>
            <Li>
              <Strong>Postal code</Strong> &mdash; the postal or ZIP code you
              enter to set a location-based alert filter.
            </Li>
            <Li>
              <Strong>Alert radius</Strong> &mdash; your chosen distance
              threshold (e.g., 100, 250, 500, or 1,000 miles) for filtering
              earthquake alerts around your entered postal code.
            </Li>
            <Li>
              <Strong>Magnitude threshold</Strong> &mdash; your preferred
              minimum earthquake magnitude for receiving notifications.
            </Li>
          </Ul>
        </Section>

        <Section title="HOW YOUR DATA IS STORED">
          <P>
            All data is stored <Strong>locally on your device</Strong> using
            on-device storage. Your postal code, alert radius, and notification
            preferences never leave your device and are not transmitted to any
            external server controlled by us.
          </P>
        </Section>

        <Section title="HOW YOUR DATA IS USED">
          <P>Your locally stored information is used solely to:</P>
          <Ul>
            <Li>
              Filter earthquake notifications so you only receive alerts
              relevant to your specified area and magnitude preference.
            </Li>
            <Li>
              Resolve your entered postal code to geographic coordinates using
              the OpenStreetMap Nominatim geocoding service, so that distance
              calculations can be performed on-device.
            </Li>
          </Ul>
        </Section>

        <Section title="THIRD-PARTY SERVICES">
          <P>Seismic Alerts uses the following third-party services:</P>
          <Ul>
            <Li>
              <Strong>USGS Earthquake Hazards Program</Strong> &mdash; provides
              the real-time earthquake data displayed in the app. No personal
              information is sent to USGS.
            </Li>
            <Li>
              <Strong>OpenStreetMap Nominatim</Strong> &mdash; used to convert
              the postal code you enter into geographic coordinates. The postal
              code is sent to the Nominatim API for geocoding. No other personal
              data is included in this request.
            </Li>
          </Ul>
        </Section>

        <Section title="DATA SHARING">
          <P>
            We do not sell, trade, or otherwise transfer your information to
            third parties. Your postal code and alert radius are stored only on
            your device and are not collected by us.
          </P>
        </Section>

        <Section title="DATA RETENTION & DELETION">
          <P>
            Because all data is stored locally on your device, you have full
            control over it at all times. You can clear your location data
            directly within the app&apos;s notification settings, or by uninstalling
            the app, which removes all stored data.
          </P>
        </Section>

        <Section title="CHILDREN'S PRIVACY">
          <P>
            Seismic Alerts does not knowingly collect personal information from
            children under the age of 13. The app does not require account
            creation or collect any identifying information.
          </P>
        </Section>

        <Section title="CHANGES TO THIS POLICY">
          <P>
            We may update this privacy policy from time to time. Any changes
            will be reflected on this page with an updated effective date.
          </P>
        </Section>

        <Section title="CONTACT">
          <P>
            If you have questions about this privacy policy or the app&apos;s data
            practices, please contact us at{" "}
            <a
              href="mailto:privacy@grokify.ai"
              style={{ color: "#FF3000", fontWeight: 700 }}
            >
              privacy@grokify.ai
            </a>
            .
          </P>
        </Section>
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  children: ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2
        style={{
          fontWeight: 900,
          fontSize: 13,
          letterSpacing: 2,
          marginBottom: 12,
          color: "#000000",
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

interface ChildrenProps {
  children: ReactNode;
}

function P({ children }: ChildrenProps) {
  return (
    <p
      style={{
        fontSize: 14,
        lineHeight: 1.7,
        color: "#333333",
        marginBottom: 12,
      }}
    >
      {children}
    </p>
  );
}

function Ul({ children }: ChildrenProps) {
  return (
    <ul style={{ paddingLeft: 20, marginTop: 8, marginBottom: 12 }}>
      {children}
    </ul>
  );
}

function Li({ children }: ChildrenProps) {
  return (
    <li
      style={{
        fontSize: 14,
        lineHeight: 1.7,
        color: "#333333",
        marginBottom: 8,
      }}
    >
      {children}
    </li>
  );
}

function Strong({ children }: ChildrenProps) {
  return <strong style={{ fontWeight: 700, color: "#000000" }}>{children}</strong>;
}
