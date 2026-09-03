import React from "react";
import { useTranslation } from "react-i18next";
import Header from "@/components/HomeHeader";
import Footer from "@/components/HomeFooter";
import { Disclosure } from "@/components/Base/Headless";
import { useCookieConsent } from "@/contexts/cookieConsentContext";

const carbonSubsections: {
  heading: string;
  bullets: { title: string; desc: string }[];
}[] = [
    {
      heading:
        "A. Low-Carbon Digital Infrastructure and Cloud Architecture",
      bullets: [
        {
          title: "Green Cloud Hosting",
          desc: "We contractually prioritize cloud service providers (such as AWS, Google Cloud, or Microsoft Azure) that utilize 100% renewable energy zones to host our data operations, software builds, and extended reality (XR) platforms.",
        },
        {
          title: "Data Efficiency",
          desc: "Our Data Operations Manager routinely audits our databases to delete redundant data, optimize code efficiency, and compress assets. This directly reduces the processing power and server cooling energy required by our digital systems.",
        },
      ],
    },
    {
      heading: "B. Sustainable Hardware and E-Waste Management",
      bullets: [
        {
          title: "Lifecycle Extensions",
          desc: "We actively combat e-waste by maintaining a strict procurement policy that favors high-performance, easily repairable development machines and VR headsets, extending their operational lifespan to a minimum of 4–5 years.",
        },
        {
          title: "Circular Economy Donations",
          desc: "In line with our social value model, 100% of decommissioned but functional IT equipment and test VR headsets are refurbished and donated to local underfunded alternative education schools and community hubs, bypassing the landfill lifecycle.",
        },
        {
          title: "Certified Recycling",
          desc: "Any hardware that reaches a total end-of-life state is contractually recycled via licensed Waste Electrical and Electronic Equipment (WEEE) certified facilities to ensure raw materials are recovered sustainably.",
        },
      ],
    },
    {
      heading: "C. Minimizing Operational Energy and Travel",
      bullets: [
        {
          title: "Digital-First & Hybrid Working",
          desc: "We operate a highly flexible, remote-first workplace model. By utilizing video conferencing and collaborative cloud environments for internal milestones, director reviews, and developer syncs, we eliminate daily commuting emissions.",
        },
        {
          title: "Virtual Client Deliverables",
          desc: "Leveraging our core product line, we actively encourage clients to conduct design consultations, product testing, and framework training within virtual immersive spaces, significantly reducing carbon-heavy business travel and physical shipping requirements.",
        },
        {
          title: "Public Transit Priority",
          desc: "Where physical site visits or client deployments are unavoidable, MXR policies dictate that staff must utilize public rail networks rather than private cars wherever logistically viable.",
        },
      ],
    },
  ];

const carbonGovernance = [
  {
    title: "Annual Review",
    desc: "This policy is reviewed annually by the Board of Directors to ensure our operational footprint scales cleanly alongside our commercial pipelines.",
  },
  {
    title: "Employee Awareness",
    desc: "All current staff and incoming apprentices are fully inducted into our digital energy conservation practices (such as power-down protocols for testing equipment and eco-routing for server architectures).",
  },
];

const retentionSchedule = [
  ["Customer Contracts & Account Data", "MSAs, SOWs, customer contacts", "6 years after contract end", "Limitation Act 1980 (contractual claims)", "Secure deletion of digital copies; shred paper"],
  ["Invoices & Finance Records", "Billing, VAT, payments", "6 years from end of FY", "HMRC/company law", "Secure deletion; retain in finance system only"],
  ["Support Tickets & Comms", "Email, chat, service logs", "3 years from closure", "Business need / dispute defence", "Purge from helpdesk system; anonymise if retained"],
  ["System & Security Logs", "Access logs, auth events", "12–18 months", "Security forensics", "Auto-purge from SIEM; overwrite backups"],
  ["Product Telemetry / Usage Metrics", "Non-essential analytics", "12 months (aggregate thereafter)", "Minimisation principle", "Aggregate/anonymise beyond 12m"],
  ["Training Performance Records", "Scores, attempts, instructor notes", "4 years (unless client specifies)", "Safety/compliance needs", "Delete user identifiers; retain anonymised for benchmarking"],
  ["Marketing Contacts (opt-in)", "Email, preferences", "Until withdrawal or 2 yrs inactivity", "PECR consent/soft opt-in", "Opt-out handling; delete from CRM"],
  ["Job Applicant Data", "CVs, notes", "6–12 months from completion", "Employment law / equality claims defence", "Secure deletion from HR system"],
  ["Employee HR Files", "Contracts, payroll, leave", "6 years post-employment", "Employment law", "Secure delete; shred paper"],
  ["Health & Safety Records", "Accident reports, training", "3 years from incident", "H&S legislation", "Secure deletion"],
];

const legalBasesMatrix = [
  ["Sales & prospecting", "Name, contact, role, org", "Legitimate Interests / Pre-contract", "Must document LIA (balancing test)"],
  ["Customer onboarding & contract fulfilment", "Identity, billing, contacts", "Contract", ""],
  ["Platform usage / user accounts", "Login data, usage logs", "Contract / Legitimate Interests", "For diagnostics/security, LIA; for essential features, contract"],
  ["Product analytics / improvements", "Aggregated usage metrics", "Legitimate Interests", "Allow opt-out or anonymisation where appropriate"],
  ["Marketing communication", "Email, preferences", "Consent or Soft Opt-in", "Respect PECR rules for electronic marketing"],
  ["Finance, billing, tax", "Payment data, invoices", "Legal Obligation / Contract", "Must comply with HMRC, audit, accounting laws"],
  ["Support services", "Interactions, logs, email", "Contract / Legitimate Interests", "Data minimisation and retention controls"],
  ["Security / fraud prevention", "Access logs, IP, anomalies", "Legitimate Interests", "Implement strong safeguards"],
];

const definitionsTable = [
  ["Personal Data", "Any information relating to an identified or identifiable living individual"],
  ["Special Category Data", "Includes e.g. health, biometric, racial/ethnic, genetic, etc."],
  ["Processing", "Any operation on personal data: collection, use, storage, erasure, transfer, etc."],
  ["Controller", "Entity that determines the purposes and means of processing personal data"],
  ["Processor", "Entity that processes personal data on behalf of a controller"],
  ["Sub-processor", "A processor engaged by MXR (or another processor) to help perform processing under contract"],
  ["Data Subject", "The individual whose personal data is processed"],
  ["Data Protection Impact Assessment (DPIA)", "A process to evaluate risks to individuals' rights and consider mitigations"],
  ["Transfer", "Disclosure, access, transmission, or movement of data across geographic boundaries"],
  ["ROPA", "Records of Processing Activities under Article 30"],
];

const DataTable: React.FC<{ headers: string[]; rows: string[][] }> = ({
  headers,
  rows,
}) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm border-collapse mt-2">
      <thead>
        <tr className="text-left border-b border-slate-300">
          {headers.map((h) => (
            <th key={h} className="py-2 pr-4 font-medium">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row[0]} className="border-b border-slate-200/60 align-top">
            {row.map((cell, i) => (
              <td key={i} className="py-2 pr-4 whitespace-pre-line">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

interface PolicyEntry {
  key: string;
  title: string;
  content: React.ReactNode;
}

const PoliciesPage: React.FC = () => {
  const { t } = useTranslation();
  const { openPreferences } = useCookieConsent();

  // Add each further policy here as its own entry — the accordion below
  // renders whatever is in this array, one collapsed item per policy.
  const policies: PolicyEntry[] = [
    {
      key: "acceptable-use-policy",
      title: "Acceptable Use Policy (AUP)",
      content: (
        <>
          <p>
            This Acceptable Use Policy ("AUP") defines the permitted and
            prohibited uses of the virtual spaces, software applications,
            developer tools, and generative artificial intelligence engines
            available via the MXR.AI platform (collectively, the
            "Services"). This policy applies to all visitors, registered
            users, enterprise accounts, and creators utilizing our platform.
          </p>

          <h3 className="font-semibold mt-4">
            1.1 Prohibited Use of Generative AI Platforms
          </h3>
          <p>
            You may not use our generative text-to-image, text-to-3D, or
            natural language processing tools to create, upload, download,
            or share any digital assets, textures, code, or environments
            that:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <span className="font-medium">Generate Harmful Content:</span>{" "}
              Promote hate speech, violence, self-harm, harassment, or
              real-world physical or financial damage.
            </li>
            <li>
              <span className="font-medium">
                Produce Sexually Explicit Material:
              </span>{" "}
              Generate or distribute pornographic, highly suggestive, or
              sexually explicit XR textures, avatars, or virtual models.
            </li>
            <li>
              <span className="font-medium">
                Create Unregulated Weaponry/Hazards:
              </span>{" "}
              Generate blueprints, 3D printing code, or operational
              step-by-step schematics for firearms, biological weapons, or
              illegal hazardous materials.
            </li>
            <li>
              <span className="font-medium">
                Deceive or Manipulate (Deepfakes):
              </span>{" "}
              Intentionally generate deceptive, realistic spatial clones,
              voice synthetics, or deepfakes of real individuals without
              their explicit written consent.
            </li>
          </ul>

          <h3 className="font-semibold mt-4">
            1.2 System Manipulation and Reverse Engineering
          </h3>
          <p>
            You strictly agree not to abuse or exploit our underlying AI
            models and software infrastructure. Prohibited activities
            include:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <span className="font-medium">
                Prompt Injection &amp; Jailbreaking:
              </span>{" "}
              Employing systematic patterns of prompting designed to bypass
              the safety controls, content filters, or ethical guardrails
              embedded within our Large Language Models or Visual-Language
              Models.
            </li>
            <li>
              <span className="font-medium">
                Scraping for Competitive Training:
              </span>{" "}
              Employing scrapers, bots, or programmatic extractors to
              systematically harvest output data, weights, or asset
              structures from our platform to train or fine-tune competing
              machine learning or computer vision models.
            </li>
            <li>
              <span className="font-medium">Reverse Engineering:</span>{" "}
              Attempting to decompile, unpack, or discover the underlying
              proprietary source code or model weights of our on-device edge
              AI algorithms or cloud architectures.
            </li>
          </ul>

          <h3 className="font-semibold mt-4">
            1.3 Enforcement and Account Termination
          </h3>
          <p>
            We use automated safety filters and internal auditing tools to
            spot violations of this policy. If a breach is detected, we hold
            the absolute right to:
          </p>
          <ol className="list-decimal pl-6 space-y-1">
            <li>Block or delete the offending generated asset or prompt input instantly.</li>
            <li>
              Suspend or permanently terminate your MXR platform access and
              licensing, with zero right to a financial refund on
              outstanding invoices.
            </li>
            <li>Report criminal actions directly to UK law enforcement authorities.</li>
          </ol>
        </>
      ),
    },
    {
      key: "cookie-policy",
      title: "Cookie Policy",
      content: (
        <>
          <p>
            This Cookie Policy explains how Meta Extended Reality Ltd ("we",
            "us", "our", or "MXR.AI") uses cookies and similar tracking
            technologies when you visit our website (
            <a
              href="https://mxr.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-2 hover:underline"
            >
              https://mxr.ai
            </a>
            ) and use our online customer and billing portals.
          </p>
          <p>
            This policy should be read alongside our Privacy Policy, which
            details how we process your broader personal data.
          </p>

          <h3 className="font-semibold mt-4">1. What Are Cookies?</h3>
          <p>
            Cookies are small text files placed on your computer, smartphone,
            or tablet when you browse a website. They are widely used to make
            websites work efficiently, remember your preferences, secure your
            account sessions, and provide analytics data to site owners.
          </p>
          <p>
            We also use similar technologies, such as web beacons, tracking
            pixels, and local storage, which we collectively refer to as
            "cookies" throughout this policy.
          </p>

          <h3 className="font-semibold mt-4">2. How We Use Cookies</h3>
          <p>
            We use cookies to improve your digital experience on our
            platform. Some cookies are strictly necessary to allow you to
            navigate the website and use its core features (such as secure
            login fields or processing invoices). Other cookies help us
            analyse website traffic, remember your regional settings, and
            deliver tailored promotional material.
          </p>

          <h3 className="font-semibold mt-4">
            3. Categories of Cookies We Deploy
          </h3>
          <p>We categorise our cookies into four distinct functional types:</p>

          <h4 className="font-medium mt-3">
            3.1 Strictly Necessary Cookies (Always Active)
          </h4>
          <p>
            These cookies are essential for our website to function properly.
            Without them, core requested services cannot be provided. You
            cannot disable these via our cookie banner.
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <span className="font-medium">Purpose:</span> Managing secure
              user authentication, maintaining active platform login
              sessions, storing interface preferences, preventing fraudulent
              activity, and facilitating secure digital invoice processing.
            </li>
            <li>
              <span className="font-medium">Legal Basis:</span> Performance
              of a contract / Legitimate Interests.
            </li>
          </ul>

          <h4 className="font-medium mt-3">
            3.2 Performance & Analytics Cookies (Consent Required)
          </h4>
          <p>
            These cookies collect anonymous information about how visitors
            interact with our website.
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <span className="font-medium">Purpose:</span> Counting page
              visits, identifying traffic sources, tracking which
              documentation pages are most popular, and identifying website
              system errors or crash zones.
            </li>
            <li>
              <span className="font-medium">Data Captured:</span> Anonymised
              IP addresses, browser versions, and user navigation paths.
            </li>
            <li>
              <span className="font-medium">Legal Basis:</span> Consent.
            </li>
          </ul>

          <h4 className="font-medium mt-3">
            3.3 Functionality Cookies (Consent Required)
          </h4>
          <p>
            These cookies allow our website to remember choices you make to
            provide an enhanced, more personalised user experience.
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <span className="font-medium">Purpose:</span> Remembering your
              language preferences, regional configurations, or persistent
              custom portal dashboard layouts.
            </li>
            <li>
              <span className="font-medium">Legal Basis:</span> Consent.
            </li>
          </ul>

          <h4 className="font-medium mt-3">
            3.4 Targeting & Advertising Cookies (Consent Required)
          </h4>
          <p>
            These cookies may be set through our site by authorised
            advertising partners to build a profile of your interests and
            show you relevant adverts on outside platforms.
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <span className="font-medium">Purpose:</span> Measuring the
              financial performance of our online marketing campaigns and
              preventing you from seeing the same advertisement repeatedly.
            </li>
            <li>
              <span className="font-medium">Legal Basis:</span> Consent.
            </li>
          </ul>

          <h3 className="font-semibold mt-4">
            4. Third-Party Cookies and Operations
          </h3>
          <p>
            Because we utilise specialised cloud infrastructures to support
            our commercial workflows, the following third-party applications
            place cookies on your device when you interact with our website:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <span className="font-medium">
                Authorised Financial Processors (Strictly Necessary):
              </span>{" "}
              Essential, non-consensual cookies are deployed to securely
              authenticate your identity during commercial billing
              operations, verify digital invoices, prevent transaction
              fraud, and execute encrypted account payouts.
            </li>
            <li>
              <span className="font-medium">
                Cloud Hosting & Performance (Strictly Necessary):
              </span>{" "}
              Infrastructure cookies are used to route web traffic
              dynamically, protect our servers from cybersecurity threats
              (such as DDoS attacks), and ensure our web elements load at
              high speeds.
            </li>
            <li>
              <span className="font-medium">Web Analytics (Optional):</span>{" "}
              If you grant active consent via our banner, analytics engines
              deploy persistent tracking tags to evaluate visitor
              interactions across the domain.
            </li>
          </ul>

          <h3 className="font-semibold mt-4">
            5. Managing Your Cookie Preferences
          </h3>
          <p>
            You have full statutory control over how cookies are stored on
            your devices. We enforce a Privacy-by-Design standard, meaning
            all non-essential cookies are blocked by default until you grant
            affirmative permission.
          </p>

          <h4 className="font-medium mt-3">
            5.1 Our Website Consent Banner
          </h4>
          <p>
            When you first visit MXR.AI, a cookie settings choice window
            will appear. You can click "Accept All", "Reject All", or select
            "Manage Settings" to fine-tune your specific tracking choices.
            You can change your mind and adjust these configurations at any
            time by clicking the{" "}
            <button
              type="button"
              onClick={openPreferences}
              className="underline font-medium hover:opacity-80 transition"
            >
              static "Cookie Preferences" link
            </button>{" "}
            in our website footer.
          </p>

          <h4 className="font-medium mt-3">
            5.2 Modifying Your Web Browser Settings
          </h4>
          <p>
            Most internet browsers allow you to modify your configurations
            to block all cookies, accept third-party cookies only, or clear
            your history upon closing. The settings links for the most
            common web applications include:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Google Chrome Cookie Controls</li>
            <li>Microsoft Edge Cookie Controls</li>
            <li>Apple Safari Cookie Controls</li>
            <li>Mozilla Firefox Cookie Controls</li>
          </ul>
          <p className="italic">
            Please note that if you completely block all cookies via your
            browser settings, critical parts of our website and invoicing
            system may fail to work properly.
          </p>

          <h3 className="font-semibold mt-4">
            6. Cookie Expiration & Retention
          </h3>
          <p>Cookies operate under two primary lifecycles:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <span className="font-medium">Session Cookies:</span> Temporary
              files that expire and self-delete the moment you close your
              web browser or log out of your MXR portal.
            </li>
            <li>
              <span className="font-medium">Persistent Cookies:</span> Files
              that remain on your local drive for a predetermined timeline
              (varying from 30 days up to 12 months) unless manually
              cleared. These recognise your device upon return visits.
            </li>
          </ul>

          <h3 className="font-semibold mt-4">
            7. Changes to this Cookie Policy
          </h3>
          <p>
            We will update this Cookie Policy from time to time to reflect
            operational updates or changes to relevant data tracking laws.
            Any modifications will be posted publicly with an updated
            revision date at the top of this page.
          </p>

          <h3 className="font-semibold mt-4">8. Contact Us</h3>
          <p>
            If you have any questions regarding how we deploy tracking
            technologies on our website, please get in touch with our
            internal data operations desk:
          </p>
          <p>
            <span className="font-medium">Data Privacy Team</span>
            <br />
            Meta Extended Reality Ltd
            <br />
            267 Argyll Avenue, Slough, England, SL1 4HE
            <br />
            <a href="mailto:navjotkhaira@mxr.ai" className="underline">
              navjotkhaira@mxr.ai
            </a>
          </p>
        </>
      ),
    },
    {
      key: "data-protection-policy",
      title: "Data Protection Policy (Controller & Processor)",
      content: (
        <>
          <h3 className="font-semibold mt-4">1. Purpose & Scope</h3>
          <p>
            This policy establishes how Meta Extended Reality Ltd ("MXR")
            handles, safeguards, and governs personal data relating to
            customers, prospects, end-users (and others) in all
            jurisdictions in which it operates, and ensures compliance with
            the UK GDPR / Data Protection Act 2018.
          </p>
          <p>It applies whenever MXR acts in either of the following capacities:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <span className="font-medium">Controller</span> — deciding
              purposes and means of processing (e.g. marketing, customer
              onboarding, billing, user accounts).
            </li>
            <li>
              <span className="font-medium">Processor</span> — processing
              data on behalf of a customer (controller) under
              contract/instructions (e.g. in delivering the XR platform,
              analytics, support).
            </li>
          </ul>
          <p>
            This policy applies to all MXR employees, contractors, third
            parties acting under MXR's control, and sub-processors engaged
            by MXR.
          </p>

          <h3 className="font-semibold mt-4">2. Definitions</h3>
          <DataTable headers={["Term", "Meaning"]} rows={definitionsTable} />

          <h3 className="font-semibold mt-4">3. Roles & Responsibilities</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium">Board / Executive Sponsor</span>{" "}
              — Overall accountability. Ensures adequate resources,
              oversight, and that privacy is integrated into strategy.
            </li>
            <li>
              <span className="font-medium">Privacy Lead / DPO</span> —
              Advises on GDPR/DP law, oversees compliance, monitors
              DPIAs/ROPA, acts as point of contact, arranges audits, reports
              to senior management.
            </li>
            <li>
              <span className="font-medium">
                Data Owners / System Owners
              </span>{" "}
              — For each system, application, or business domain, named
              persons ensure that data processed conforms to policy, approve
              retention, review access, ensure mapping to ROPA.
            </li>
            <li>
              <span className="font-medium">
                IT / Engineering / Security Team
              </span>{" "}
              — Implement security controls (encryption, access controls,
              secure design), assist with audits, logging, incident
              management.
            </li>
            <li>
              <span className="font-medium">Legal / Contracts / Commercial</span>{" "}
              — Ensure DP clauses in contracts, DP due diligence on
              customers/sub-processors, liability allocations, review DPAs.
            </li>
            <li>
              <span className="font-medium">All Employees & Contractors</span>{" "}
              — Adhere to this policy, complete training, follow data
              handling rules, report incidents or concerns.
            </li>
          </ul>

          <h3 className="font-semibold mt-4">4. Fundamental Principles</h3>
          <p>MXR commits to the following principles (as per UK GDPR / DPA 2018):</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>
              <span className="font-medium">
                Lawfulness, fairness & transparency
              </span>{" "}
              — Process only where there is a valid lawful basis (contract,
              legitimate interests, consent, legal obligation). Be
              transparent to data subjects via notices.
            </li>
            <li>
              <span className="font-medium">Purpose limitation</span> — Only
              use data for specified purposes; not repurpose without new
              legal basis.
            </li>
            <li>
              <span className="font-medium">Data minimisation</span> — Only
              collect and retain what is necessary for the purpose.
            </li>
            <li>
              <span className="font-medium">Accuracy</span> — Keep data up
              to date; correct or delete inaccurate data without undue
              delay.
            </li>
            <li>
              <span className="font-medium">Storage limitation</span> —
              Retain only as long as needed, then delete or anonymise
              (subject to legal holds).
            </li>
            <li>
              <span className="font-medium">
                Integrity & confidentiality (security)
              </span>{" "}
              — Protect data against unauthorized or unlawful processing,
              accidental loss, damage, destruction.
            </li>
            <li>
              <span className="font-medium">Accountability</span> — Be able
              to demonstrate compliance (via logs, ROPA, audits, reviews).
            </li>
          </ol>

          <h3 className="font-semibold mt-4">
            5. Legal Bases for Processing (Controller Role)
          </h3>
          <p>
            A matrix of typical processing purposes and their lawful bases,
            adapted to MXR's actual operations:
          </p>
          <DataTable
            headers={["Purpose", "Data Types", "Lawful Basis", "Comments / Mitigations"]}
            rows={legalBasesMatrix}
          />
          <p className="mt-3">
            If MXR ever processes special category data, that must be under
            a further valid condition (e.g. explicit consent, necessary for
            health & safety) and only with additional safeguards such as
            encryption, strict access, DPIA, separate logging.
          </p>

          <h3 className="font-semibold mt-4">6. Transparency & Notice</h3>
          <p>
            MXR shall provide clear, layered privacy notices in all user
            touchpoints (website, apps, platform, training portals). Notices
            will include:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Identity and contact details of the controller</li>
            <li>Purposes and lawful bases</li>
            <li>Recipients / categories of recipients (including sub-processors)</li>
            <li>International transfer information and safeguards</li>
            <li>Retention periods</li>
            <li>Rights of data subjects (access, erasure, portability, objection, withdrawal)</li>
            <li>Complaint route (via ICO)</li>
            <li>Whether provision of data is statutory/contractual and consequences of non-providing</li>
          </ul>
          <p>
            Where MXR acts as processor under contract, MXR ensures
            customer's notice includes appropriate mention of MXR's
            processing role.
          </p>

          <h3 className="font-semibold mt-4">7. Data Subject Rights</h3>
          <p>MXR supports the following rights:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Right of access</li>
            <li>Right of rectification</li>
            <li>Right of erasure (right to be forgotten)</li>
            <li>Right to restriction of processing</li>
            <li>Right to data portability</li>
            <li>Right to object (including profiling)</li>
            <li>Right to withdraw consent</li>
          </ul>
          <p>Procedures:</p>
          <ol className="list-decimal pl-6 space-y-1">
            <li>Receive request (usually via p.khaira@mxr.ai or a designated portal).</li>
            <li>Verify identity of the requester (avoid disclosing to wrong person).</li>
            <li>Determine scope and liaise with relevant systems/data owners.</li>
            <li>Respond within statutory deadlines (usually 1 calendar month, unless extended).</li>
            <li>Document all steps, communications, and decisions.</li>
          </ol>
          <p>
            If the request is manifestly unfounded or excessive, MXR may
            refuse or charge a reasonable fee, documenting the
            justification.
          </p>

          <h3 className="font-semibold mt-4">
            8. Security Measures & Technical & Organisational Controls
          </h3>
          <p>MXR implements and maintains appropriate security measures, such as:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><span className="font-medium">Access control & segregation</span> — role-based access, principle of least privilege</li>
            <li><span className="font-medium">Authentication & multi-factor (MFA)</span> for admin or sensitive access</li>
            <li><span className="font-medium">Encryption</span> in transit (TLS) and at rest (AES or equivalent)</li>
            <li><span className="font-medium">Network security & isolation</span> — segmented zones, firewalls, DMZs</li>
            <li><span className="font-medium">Secure Development Lifecycle (SDLC)</span> — code review, static/dynamic testing, vulnerability scanning</li>
            <li><span className="font-medium">Logging & monitoring</span> — audit logs, alerting on anomalous activity</li>
            <li><span className="font-medium">Backup & disaster recovery</span> — regular backup, offsite, tested restores</li>
            <li><span className="font-medium">Penetration testing & vulnerability management</span> — periodic tests, patching</li>
            <li><span className="font-medium">Vendor / Sub-processor risk management</span> — due diligence, audits, contract controls</li>
            <li><span className="font-medium">Data minimisation & pseudonymisation</span> — where possible, to reduce exposure</li>
            <li><span className="font-medium">Physical security</span> — for any on-prem hardware, access controls, lockable racks</li>
            <li><span className="font-medium">Security awareness & training</span> — periodic training for all staff</li>
            <li><span className="font-medium">Incident response & forensics capability</span> — playbooks, roles, evidence collection</li>
          </ul>
          <p>
            These controls will be documented in a "Controls Inventory /
            Controls Map" and reviewed at least yearly or whenever
            technology changes.
          </p>

          <h3 className="font-semibold mt-4">9. International Data Transfers</h3>
          <p>
            When personal data is transferred outside the UK (or outside
            the European Economic Area if applicable), MXR will:
          </p>
          <ol className="list-decimal pl-6 space-y-1">
            <li>
              Conduct a Transfer Risk Assessment (TRA) to evaluate the
              destination country's legal environment and risks to data
              subjects.
            </li>
            <li>
              Use approved safeguards such as: UK International Data
              Transfer Agreement (IDTA); UK Addendum to EU Standard
              Contractual Clauses; UK-US Data Bridge (for certified US
              recipients); Binding corporate rules (if applicable).
            </li>
            <li>Document the assessments and controls, and include appropriate clauses in contracts.</li>
            <li>Monitor changes (e.g., legal decisions, governmental access in destination) and reassess periodically.</li>
          </ol>

          <h3 className="font-semibold mt-4">10. Sub-processors</h3>
          <p>
            MXR may engage sub-processors to assist in delivering services
            (hosting, analytics, support, etc.). The approach:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>MXR maintains a sub-processor register (published or available on request)</li>
            <li>Where possible, customers/controllers are given prior general authorisation to use sub-processors or are asked for specific approval</li>
            <li>At least 14 days' notice (or reasonable period) of any intended new sub-processor, with right to object on reasonable grounds</li>
            <li>Contracts with sub-processors must impose equivalent data protection obligations (mirroring Article 28 obligations)</li>
            <li>MXR remains fully liable to the controller for sub-processors' compliance (i.e., you cannot contract away responsibility)</li>
          </ul>

          <h3 className="font-semibold mt-4">
            11. Data Breach & Incident Management
          </h3>
          <p>MXR maintains an incident response process:</p>
          <ol className="list-decimal pl-6 space-y-1">
            <li><span className="font-medium">Detection & Logging</span> — systems alert, or staff report suspected breaches</li>
            <li><span className="font-medium">Classification & Triage</span> — assess whether it's a personal data breach, scope, potential harm</li>
            <li><span className="font-medium">Containment & Remediation</span> — stop further loss, collect evidence</li>
            <li><span className="font-medium">Risk Assessment</span> — likelihood and severity of harm to individuals</li>
            <li><span className="font-medium">Notification to ICO / Supervisory Authority</span> — if MXR is controller: notify ICO within 72 hours of becoming aware, unless low risk; if MXR is processor: notify controller without undue delay with full incident details</li>
            <li><span className="font-medium">Notification to Affected Individuals</span> — if likely high risk, in clear language, specify what happened, mitigation, contact</li>
            <li><span className="font-medium">Root cause & post-mortem</span> — lessons learned, corrective action, policy updates</li>
            <li><span className="font-medium">Record keeping</span> — log all breaches, decisions, evidence, remediation</li>
          </ol>

          <h3 className="font-semibold mt-4">
            12. Data Retention, Deletion & Legal Holds
          </h3>
          <p>
            Refer to MXR's Data Retention & Deletion Policy for retention
            periods by data category. High-level rules:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Use retention schedules by category</li>
            <li>Automated deletion or anonymisation when retention expires</li>
            <li>Soft-delete mechanisms with grace periods and audit logs</li>
            <li>Backups: retention cycles and secure overwrite, not accessible for normal restores for deletion</li>
            <li>For any legal, audit, or regulatory hold, suspend deletion for relevant records until hold is lifted</li>
          </ul>

          <h3 className="font-semibold mt-4">13. Children & Sensitive Data</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              MXR does not knowingly target or provide services directly to
              children under 16 (unless through customers). Any project
              involving children requires extra scrutiny, parental consent,
              and DPIA.
            </li>
            <li>
              No routine processing of special category or criminal data.
              If such processing is required in a customer project, MXR
              will only proceed under explicit consent or another valid
              Article 9 condition, with heightened safeguards, encryption,
              limited access, separate logs, and oversight by Privacy Lead.
            </li>
          </ul>

          <h3 className="font-semibold mt-4">
            14. Joint Controllers & Data Sharing
          </h3>
          <p>
            In cases where MXR partners with another entity and jointly
            determines the purpose and means of processing, MXR will:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Define a Joint Controller Agreement clearly allocating responsibilities (transparency, rights handling, security, breach reporting) as per ICO guidance</li>
            <li>Ensure that data subjects are informed (in notices) of the joint arrangement and contact points</li>
            <li>Coordinate so that data subject rights requests are handled seamlessly</li>
          </ul>

          <h3 className="font-semibold mt-4">15. Monitoring, Audit & Review</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Annual policy review (or upon regulation changes, business changes, major product features)</li>
            <li>Quarterly control-check reviews (patching, access logs, vendor reviews)</li>
            <li>Independent audits / third-party reviews periodically</li>
            <li>Breach drills / tabletop exercises at least annually</li>
            <li>Metrics / KPIs: number of DSARs, SLA compliance, training completion rate, number of security findings, number of vendor reviews</li>
          </ul>

          <h3 className="font-semibold mt-4">
            16. Disciplinary & Contractual Compliance
          </h3>
          <p>
            Breaches of this policy by employees or contractors may lead to
            disciplinary actions, up to termination. For third
            parties/sub-processors, non-compliance is grounds for contract
            termination and liability claims.
          </p>
        </>
      ),
    },
    {
      key: "mxr-data-protection-summary",
      title: "Data Protection Policy (GDPR Summary)",
      content: (
        <>
          <h3 className="font-semibold mt-4">1. Introduction</h3>
          <p>
            Meta Extended Reality (MXR) is committed to protecting the
            privacy and confidentiality of personal data in accordance with
            the General Data Protection Regulation (GDPR). This policy
            outlines how MXR collects, stores, processes, and shares
            personal data, and describes the procedures for ensuring
            compliance with GDPR requirements.
          </p>

          <h3 className="font-semibold mt-4">
            2. Types of Personal Data Collected & Processed
          </h3>
          <p>
            MXR may collect and process personal data for the purpose of
            providing its services to customers. This may include, but is
            not limited to, the following types of personal data:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Names</li>
            <li>Addresses</li>
            <li>Email addresses</li>
            <li>Phone numbers</li>
            <li>Financial information</li>
            <li>Customer documents and data</li>
          </ul>
          <p>
            MXR may obtain personal data directly from individuals or
            through third-party sources, and data may be shared through
            various methods including email and on a shared drive.
          </p>

          <h3 className="font-semibold mt-4">
            3. Legal Basis for Processing Personal Data
          </h3>
          <p>
            MXR will only process personal data if there is a lawful basis
            for doing so, such as obtaining consent from the individual,
            fulfilling a contract, or complying with legal obligations.
          </p>

          <h3 className="font-semibold mt-4">
            4. Storage, Processing, and Transmission of Personal Data
          </h3>
          <p>
            MXR uses cloud-based services and local servers to store and
            process personal data. All PCs are password protected and data
            cannot be removed from the office. Appropriate security
            measures, including encryption and access controls, are in
            place to protect personal data.
          </p>

          <h3 className="font-semibold mt-4">5. Access to Personal Data</h3>
          <p>
            Only nominated individuals or those working on the project have
            access to personal data within MXR. Personal data is secured
            through password protection and appropriate access controls.
          </p>

          <h3 className="font-semibold mt-4">
            6. Accuracy and Completeness of Personal Data
          </h3>
          <p>
            MXR will verify the accuracy and completeness of personal data
            through the customer or subject matter expert.
          </p>

          <h3 className="font-semibold mt-4">
            7. Handling Data Subject Access Requests
          </h3>
          <p>
            MXR will handle data subject access requests in accordance with
            GDPR requirements. This includes verifying the identity of the
            individual making the request, responding within the required
            timeframe, and providing the requested data in a commonly used
            electronic format.
          </p>

          <h3 className="font-semibold mt-4">8. Handling Data Breaches</h3>
          <p>
            MXR will handle data breaches in accordance with GDPR
            requirements. This includes identifying the breach and taking
            immediate steps to contain it, evaluating the severity of the
            breach and its potential impact on data subjects, notifying the
            appropriate authorities, conducting an investigation to
            determine the root cause of the breach and implementing
            measures to prevent similar incidents in the future, and
            documenting the breach and the steps taken to comply with GDPR.
          </p>

          <h3 className="font-semibold mt-4">
            9. Handling International Data Transfers
          </h3>
          <p>
            MXR will handle international data transfers in accordance with
            GDPR requirements. This includes ensuring that appropriate
            safeguards are in place to protect the data, such as using
            standard contractual clauses, binding corporate rules, or
            another approved transfer mechanism.
          </p>

          <h3 className="font-semibold mt-4">10. Automated Decision-Making</h3>
          <p>
            MXR will handle automated decision-making in accordance with
            GDPR requirements. This includes ensuring that individuals are
            provided with the ability to challenge and request a review of
            such decisions, and implementing safeguards to protect personal
            data.
          </p>

          <h3 className="font-semibold mt-4">11. Accountability Framework</h3>
          <p>
            MXR has an accountability framework in place to ensure
            compliance with GDPR requirements. This includes outlining the
            roles and responsibilities of individuals within the
            organization, monitoring compliance, and addressing
            non-compliance issues.
          </p>

          <h3 className="font-semibold mt-4">
            12. Data Protection Impact Assessment (DPIA)
          </h3>
          <p>
            MXR will conduct a DPIA for any data processing activities that
            are likely to result in a high risk to individuals' rights and
            freedoms. This includes identifying the potential risks and
            implementing measures to mitigate the risks.
          </p>

          <h3 className="font-semibold mt-4">13. Data Processing for Children</h3>
          <p>
            MXR will handle personal data of individuals under the age of
            16 in accordance with GDPR requirements. This includes obtaining
            parental consent where necessary and implementing appropriate
            safeguards to protect the data.
          </p>

          <h3 className="font-semibold mt-4">14. Data Minimization</h3>
          <p>
            MXR will ensure that personal data is minimized and that only
            the necessary data is collected, processed, and stored to
            achieve the intended purpose.
          </p>

          <h3 className="font-semibold mt-4">
            15. Data Processing for Marketing Purposes
          </h3>
          <p>
            MXR will handle personal data for marketing purposes in
            accordance with GDPR requirements. This includes obtaining
            valid and informed consent from individuals, ensuring that
            individuals can opt-out of marketing communications, and
            handling data subject access requests related to marketing
            data.
          </p>

          <h3 className="font-semibold mt-4">
            16. Data Processing for Research Purposes
          </h3>
          <p>
            MXR will handle personal data for research purposes in
            accordance with GDPR requirements. This includes ensuring that
            the data is anonymized or pseudonymized, obtaining valid and
            informed consent from individuals, and ensuring that the data is
            used only for the intended research purposes.
          </p>

          <h3 className="font-semibold mt-4">17. Data Retention and Deletion</h3>
          <p>
            MXR will retain personal data for as long as necessary to
            fulfill the intended purpose and will delete or archive data
            when it is no longer necessary or when requested by the data
            subject.
          </p>

          <h3 className="font-semibold mt-4">
            18. Data Processing for Employee Data
          </h3>
          <p>
            MXR will handle personal data of employees in accordance with
            GDPR requirements. This includes obtaining valid and informed
            consent from employees, handling data subject access requests
            related to employee data, and handling employee data breaches.
          </p>

          <h3 className="font-semibold mt-4">
            19. Employee Training and Awareness
          </h3>
          <p>
            MXR will ensure that all employees are trained and aware of
            their responsibilities for complying with GDPR requirements.
            This includes reporting data breaches, handling data subject
            access requests, and ensuring the security and confidentiality
            of personal data.
          </p>

          <h3 className="font-semibold mt-4">20. Third Party Data Processing</h3>
          <p>
            MXR will ensure that any third-party processors used to process
            personal data are GDPR-compliant. This includes selecting and
            managing third-party processors in accordance with GDPR
            requirements.
          </p>

          <h3 className="font-semibold mt-4">Conclusion</h3>
          <p>
            MXR is committed to protecting the privacy and confidentiality
            of personal data in accordance with GDPR requirements. This
            Data Protection Policy outlines how MXR will collect, store,
            process, and share personal data, and describes the procedures
            for ensuring compliance with GDPR requirements. MXR will review
            and update this policy regularly to ensure ongoing compliance
            with GDPR.
          </p>
        </>
      ),
    },
    {
      key: "data-retention-policy",
      title: "Data Retention & Deletion Policy",
      content: (
        <>

          <h3 className="font-semibold mt-4">1. Purpose</h3>
          <p>
            This policy sets out how MXR manages the retention, archiving,
            deletion, and anonymisation of personal data. It ensures
            compliance with:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>UK GDPR (storage limitation principle, Article 5(1)(e))</li>
            <li>Data Protection Act 2018</li>
            <li>Applicable financial, tax, employment, and safety laws</li>
          </ul>
          <p>
            It applies to all personal data processed in MXR systems and by
            MXR employees, contractors, and sub-processors.
          </p>

          <h3 className="font-semibold mt-4">2. Principles</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><span className="font-medium">Necessity:</span> Keep data only as long as needed for lawful purposes.</li>
            <li><span className="font-medium">Legal Compliance:</span> Honour minimum statutory retention (e.g. finance, HR).</li>
            <li><span className="font-medium">Anonymisation / Pseudonymisation:</span> Where possible, replace personal data with non-identifiable data for longer-term analysis.</li>
            <li><span className="font-medium">Deletion / Disposal:</span> Ensure secure, irreversible deletion from live systems, archives, and physical copies.</li>
            <li><span className="font-medium">Consistency:</span> Apply retention rules consistently across business units.</li>
            <li><span className="font-medium">Legal Holds:</span> Suspend deletion if data is needed for actual/potential litigation, audit, or regulatory investigation.</li>
          </ul>

          <h3 className="font-semibold mt-4">3. Retention Schedule</h3>
          <p>
            The following baseline applies unless a customer contract
            specifies different retention (when MXR acts as a processor).
          </p>
          <DataTable
            headers={["Data Category", "Examples", "Baseline Retention", "Legal/Business Basis", "Disposal Method"]}
            rows={retentionSchedule}
          />
          <p className="mt-3">
            Customers may direct MXR (as processor) to use stricter or
            longer schedules. MXR will comply and provide deletion
            certificates where requested.
          </p>

          <h3 className="font-semibold mt-4">4. Deletion & Anonymisation Methods</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium">Digital Data:</span>
              <ul className="list-[circle] pl-6 space-y-1 mt-1">
                <li>Soft-delete → hard-delete after grace period (e.g., 30 days).</li>
                <li>Database purges with audit logs.</li>
                <li>Secure erase tools (meeting NIST 800-88 or equivalent).</li>
                <li>Cloud services: provider-level deletion confirmation.</li>
              </ul>
            </li>
            <li>
              <span className="font-medium">Backups:</span>
              <ul className="list-[circle] pl-6 space-y-1 mt-1">
                <li>Immutable backups on rolling cycles.</li>
                <li>Data marked for deletion remains in backup until cycle expires.</li>
                <li>No restore solely for deletion purposes.</li>
              </ul>
            </li>
            <li>
              <span className="font-medium">Paper Records:</span>
              <ul className="list-[circle] pl-6 space-y-1 mt-1">
                <li>Locked bins until cross-cut shredding.</li>
                <li>Certified destruction providers for bulk.</li>
              </ul>
            </li>
            <li>
              <span className="font-medium">Anonymisation:</span>
              <ul className="list-[circle] pl-6 space-y-1 mt-1">
                <li>Strip identifiers (names, IDs, IPs) while retaining trends.</li>
                <li>Aggregate data to a level that prevents re-identification.</li>
              </ul>
            </li>
          </ul>

          <h3 className="font-semibold mt-4">5. Legal Holds</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>When litigation, investigation, or audit is reasonably anticipated, the Privacy Lead (or Legal) issues a Legal Hold Notice.</li>
            <li>Affected records must be preserved, regardless of normal retention rules.</li>
            <li>Hold ends only when confirmed in writing.</li>
            <li>Employees must not delete, alter, or conceal held records.</li>
          </ul>

          <h3 className="font-semibold mt-4">6. Roles & Responsibilities</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><span className="font-medium">Privacy Lead / DPO:</span> Maintains the master retention schedule; conducts annual review.</li>
            <li><span className="font-medium">Data Owners:</span> Ensure implementation in their systems.</li>
            <li><span className="font-medium">IT:</span> Configure automated deletion jobs, maintain deletion logs.</li>
            <li><span className="font-medium">Legal / Compliance:</span> Issue and manage legal holds.</li>
            <li><span className="font-medium">Employees:</span> Follow deletion procedures; escalate uncertainties.</li>
          </ul>

          <h3 className="font-semibold mt-4">7. Monitoring & Review</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Annual audit of system retention settings.</li>
            <li>Spot-checks of deletion logs.</li>
            <li>Review schedule in line with law/regulation changes.</li>
            <li>Report findings to Board/Executive Sponsor.</li>
          </ul>

          <h3 className="font-semibold mt-4">8. Policy Compliance</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Violations by employees may result in disciplinary action.</li>
            <li>Sub-processors and vendors must meet or exceed MXR retention/deletion obligations (via DPA clauses).</li>
          </ul>
        </>
      ),
    },
    {
      key: "modern-slavery",
      title: "Modern Slavery and Human Trafficking Statement",
      content: (
        <>
          <h3 className="font-semibold mt-4">Statement of Commitment</h3>
          <p>
            Although Meta Extended Reality Ltd (MXR) operates as a
            micro-entity and falls well below the statutory turnover
            threshold requiring a formal statement under Section 54 of the
            Modern Slavery Act 2015, we maintain a strict zero-tolerance
            approach to modern slavery, human trafficking, and forced
            labour within our business operations and wider supply chains.
          </p>

          <h3 className="font-semibold mt-4">Our Operations and Supply Chain</h3>
          <p>
            As an information technology and extended reality (XR)
            specialist, our primary operations consist of software
            development, data operations management, and digital
            consultancy. Our supply chain is low-risk and is primarily
            limited to:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Global technology providers and cloud data hosting infrastructure (e.g., AWS, Google).</li>
            <li>Reputable hardware manufacturers for development computers and VR equipment.</li>
            <li>UK-based professional services (such as accounting, legal, and banking).</li>
          </ul>

          <h3 className="font-semibold mt-4">Risk Mitigation and Due Diligence</h3>
          <p>To ensure our operations remain entirely free of exploitation, we enforce the following measures:</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>
              <span className="font-medium">Direct Employment Integrity:</span>{" "}
              We verify the legal right to work of all employees and
              directors prior to onboarding. We ensure all staff are paid
              competitive, market-level salaries that comfortably exceed
              the National Living Wage, with clear contracts of employment.
            </li>
            <li>
              <span className="font-medium">Supplier Accountability:</span>{" "}
              When procuring software, hosting data, or buying technical
              equipment, we explicitly prioritize suppliers who publish
              transparent anti-slavery policies and comply fully with the
              Modern Slavery Act 2015.
            </li>
            <li>
              <span className="font-medium">Reporting Channels:</span> We
              maintain an open, transparent corporate culture. Any
              director, employee, or contractor is empowered to immediately
              report any concerns regarding unethical practices directly to
              the Board of Directors without fear of retaliation.
            </li>
          </ol>
        </>
      ),
    },
    {
      key: "health-safety",
      title: "Health & Safety Policy (Remote & Hybrid Tech Workers)",
      content: (
        <>
          <p>
            MXR is committed to ensuring the health, safety, and
            psychological wellbeing of its entire workforce, including
            directors, employees, and contractors, in accordance with the
            Health and Safety at Work etc. Act 1974. Because our business
            utilizes a modern, digital-first, and hybrid operating model,
            our policy focuses heavily on display screen equipment (DSE)
            safety, mental health support, and remote workspace ergonomics.
          </p>

          <h3 className="font-semibold mt-4">Key Operational Measures</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium">
                Display Screen Equipment (DSE) Assessments:
              </span>{" "}
              Because our daily tasks involve heavy screen use, coding, and
              data operations management, all staff are required to
              complete an annual DSE risk assessment. MXR ensures all
              employees are provided with ergonomically sound hardware,
              including adjustable chairs, separate monitors, and wrist
              supports, to prevent repetitive strain injuries (RSI).
            </li>
            <li>
              <span className="font-medium">
                Immersive Technology & VR Safety:
              </span>{" "}
              As a company specializing in extended reality, our developers
              and testers routinely interact with VR/AR headsets. We
              enforce strict internal safety boundaries, including
              mandatory screen-break intervals (10 minutes for every 50
              minutes of continuous immersion), clear physical tracking
              zones during testing to prevent trips, and regular
              sanitization protocols for shared hardware.
            </li>
            <li>
              <span className="font-medium">
                Remote and Home-Working Risk Management:
              </span>{" "}
              For hybrid or home-based staff, we ensure basic electrical
              safety standards are understood. Staff are trained to
              complete visual checks on plugs, cables, and extension leads
              used to power business machinery to mitigate electrical fire
              hazards.
            </li>
            <li>
              <span className="font-medium">
                Mental Health and Psychological Safety:
              </span>{" "}
              In alignment with our work in alternative education
              environments, we place the highest value on worker mental
              health. We actively combat the isolation risks associated
              with remote tech development by maintaining mandatory daily
              digital check-ins, monitoring workloads to prevent burnout,
              and offering flexible hours to support an optimal work-life
              balance.
            </li>
          </ul>
        </>
      ),
    },
    {
      key: "disaster-recovery",
      title: "Disaster Recovery Plan (Business Continuity Plan)",
      content: (
        <>
          <h3 className="font-semibold mt-4">Objective of Plan</h3>
          <p>
            To have in place a business recovery plan to ensure the
            continuation of Meta Extended Reality business, with the minimum
            of disruption, following any unforeseen disaster.
          </p>

          <h3 className="font-semibold mt-4">Possible Disasters</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Flood</li>
            <li>Electrical failure</li>
            <li>Bomb/terrorist attack</li>
            <li>Major fire</li>
            <li>Major pipe burst</li>
            <li>Chemical attack</li>
            <li>Tropical disease/virus (could disable most of Meta Extended Reality staff in a few days)</li>
          </ul>

          <h3 className="font-semibold mt-4">Access to Site Following Disaster</h3>
          <p>
            Meta Extended Reality's office could become inaccessible and
            uninhabitable. The site belongs to the landlords and Meta
            Extended Reality may have no immediate right of access. The site
            may have reverted to the landlord's insurance company for
            salvage purposes and any access will have to be negotiated.
          </p>

          <h3 className="font-semibold mt-4">What Is Lost?</h3>
          <p>Assume everything.</p>

          <h3 className="font-semibold mt-4">Action Plan</h3>

          <h4 className="font-medium mt-3">
            1. Emergency Response Team – to action the Business Continuity Plan
          </h4>
          <DataTable
            headers={["Action", "Owner"]}
            rows={[
              ["Board of Directors – Responsibility for Clients/PR/Media", "ALL"],
              ["Chief Executive - Responsibility for Finance/Operational", "PK"],
              ["Office Manager – Responsibility for General Office Procedure/Staff Issues", "SG"],
              ["Chief Technical Officer – Responsibility for Data/IT Communications", "DK"],
            ]}
          />

          <h4 className="font-medium mt-3">
            2. Post Disaster Business Plan – managing the vision going forward
          </h4>
          <DataTable
            headers={["Plan Required", "Owner"]}
            rows={[
              ["Client/PR/Media Plan – e.g. who are our priority clients? How do we continue to manage them? – action plan required.", "ALL"],
              ["Financial and commercial aspects – action plan required.", "PK"],
              ["IT – action plan required.", "RG"],
            ]}
          />

          <h4 className="font-medium mt-3">
            3. Day One – Immediate procedure, assuming worst-case scenario of everything being lost
          </h4>
          <DataTable
            headers={["Action", "Owner"]}
            rows={[
              ["If disaster happens out of office hours, the Emergency Response Team (E.R. Team) is contacted by the Chief Executive (E.R. Team to meet online with the Chief Technical Officer and action the Business Continuity Plan).", "PK / E.R. Team"],
              ["If disaster happens during office hours, the Evacuation Procedure follows the same guidelines as the existing Fire Drill Procedure.", "E.R. Team"],
              ["Immediate Assembly Point for staff and E.R. Team is the courtyard in back of the office. Fire Officers to take head count.", "AR"],
              ["Board Directors are an emergency contact point for staff to phone via mobile or for advice/direction (current staff lists available from the Office Manager). Board Directors are responsible for the welfare of staff.", "All"],
              ["E.R. Team to brief Directors/Managers re plan of action.", "Board Directors"],
              ["Chief Executive to inform staff and establish clear guidelines of communication.", "E.R. Team"],
              ["Office Manager will access the Disaster Recovery Box (see below).", "SG"],
              ["The Finance Director / Chief Executive will be in charge of emergency expenditure and petty cash requests and procedure (emergency paid overtime may be required, with a recording system put in place).", "TBC"],
              ["Chief Executive / Finance Director to contact insurers and put claim into effect.", "PK"],
            ]}
          />

          <h4 className="font-medium mt-3">4. Day One – Second Phase – Let's Get Organised</h4>
          <DataTable
            headers={["Action", "Owner"]}
            rows={[
              ["Office Manager to contact the telecoms company and ask them to re-direct the main switchboard number to mobile. Office Manager to take incoming calls and messages.", "SG"],
              ["Rest of staff sent home until next briefing at 12 noon on Day Two.", "All"],
              ["Chief Technical Officer to order 1st phase of IT equipment necessary to resource immediate services: e-mail server, central server, Apple server/storage, all associated software, PCs, IT equipment/VR etc., and consider purchase of further mobiles if company mobiles were destroyed.", "RG"],
              ["Office Manager/Board commence search for temporary office premises.", "—"],
              ["Chief Executive to contact Press/Media and issue Press Releases.", "PK"],
            ]}
          />

          <h4 className="font-medium mt-3">5. Day Two</h4>
          <DataTable
            headers={["Action", "Owner"]}
            rows={[
              ["Board to implement first phase business plans (required to be written by Board).", "Board"],
              ["Appointed staff to contact clients/suppliers to reassure them that the level of service will be maintained in line with Post Disaster Business Plans.", "Board"],
              ["Search for new premises continued by Board – premises with good internet capability.", "Board"],
              ["More stationery ordered.", "Office"],
              ["IT equipment arrives.", "SG"],
              ["2nd IT recovery phase – all associated teams on site to install and co-ordinate recovery process with IT Managers.", "SG"],
              ["All to migrate back-up data to all servers (24 hours).", "SG"],
              ["Briefing for all staff.", "PK"],
              ["Key staff to remain thereafter, e.g. admin staff to prepare mail out.", "Key staff"],
              ["Mail out prepared by Chief Executive to clients and sent out; clients contacted by phone and e-mail as appropriate.", "PK"],
            ]}
          />

          <h4 className="font-medium mt-3">6. Day Three</h4>
          <DataTable
            headers={["Action", "Owner"]}
            rows={[
              ["IT recovery process continues.", "SF"],
              ["Order routers and web servers for new premises (with dedicated internet line).", "SF"],
              ["Staff called in when IT infrastructure installed.", "SF"],
              ["Briefing for all staff.", "SC"],
              ["Decision made whether to rent immediate short-term (3–6 months) serviced office space or search for a longer-term lease — dependent on whether Codebase Stirling can be repaired quickly or part repaired.", "Board"],
              ["IT to purchase and install all necessary further IT equipment (48-hour target).", "RG"],
            ]}
          />

          <h4 className="font-medium mt-3">7. Long Term</h4>
          <DataTable
            headers={["Action", "Owner"]}
            rows={[
              ["Requirement for rented premises for up to 2–3 years until Codebase Stirling is rebuilt. Board to discuss options depending on the current property market, e.g. Landlords may have empty offices elsewhere.", "Board"],
              ["Office Manager to purchase additional requirements for furniture/stationery items from local suppliers.", "TBC"],
            ]}
          />

          <h4 className="font-medium mt-3">
            8. Disaster Recovery Backup – Cloud and Offsite Storage
          </h4>
          <p>Disaster Recovery backup will contain:</p>
          <DataTable
            headers={["Item", "Owner"]}
            rows={[
              ["Copy of lease for office.", "PK"],
              ["Emergency contact details of landlord/property agents, insurers, employer's liability, public liability, insurance certificate.", "PK"],
              ["Contact details of Alarm Maintenance Company & Security.", "PK"],
              ["Details of bankers and all bank agreements/payment arrangements.", "PK"],
              ["Copy of fixed asset register.", "SG"],
              ["Full set of financial paperwork.", "SG/PK"],
              ["Payroll details and contact numbers.", "SG"],
              ["Office layout plan – to locate valuable items for salvage.", "Board"],
              ["Photographs of premises and equipment.", "RG"],
              ["List of current clients and suppliers – addresses and phone numbers etc.", "Office"],
              ["Press contacts list.", "PK"],
              ["Staff address list and phone numbers & emergency contact for each person.", "SG"],
              ["List of all software licence numbers, proof of purchase and contact details.", "RG"],
              ["Details of computer backup procedure.", "RG"],
              ["Full set of printed stationery, including letterheads, business cards, comp slips, labels, envelopes.", "Office"],
              ["Details of printer used to supply printed stationery.", "Office"],
              ["Details of photocopier, suppliers, ID numbers and serial numbers of equipment.", "SG"],
              ["Details of telephone system and mobile phone suppliers and emergency contacts.", "Office"],
              ["24-hour contact numbers for plumbers, electricians, and builders.", "Office"],
              ["Information re property agents for temporary accommodation.", "Office"],
            ]}
          />
        </>
      ),
    },
    {
      key: "disciplinary-policy",
      title: "Disciplinary Policy",
      content: (
        <>
          <p>
            The aims of this procedure are to set out the standards of
            conduct expected of all staff and to provide a framework within
            which managers can work with employees to maintain satisfactory
            standards of conduct and to encourage improvement where
            necessary. This policy applies to all employees regardless of
            length of service, but does not apply to self-employed
            contractors or agency workers, and does not form part of an
            employee's contract of employment.
          </p>
          <p>
            All formal disciplinary action will normally be conducted by the
            employee's manager, with appeals normally conducted by the Chief
            Executive. Before any formal disciplinary action is taken, the
            relevant manager will carry out a full investigation to
            establish the facts. The employee must take all reasonable
            steps to attend disciplinary and/or investigatory meetings, and
            will be given a full opportunity to comment on the allegations
            and explain their case.
          </p>

          <h3 className="font-semibold mt-4">Informal Verbal Warning</h3>
          <p>
            After establishing the facts, Meta Extended Reality may
            consider that there is no need to resort to the formal
            procedure, and that it is enough to talk the matter over with
            the employee. A note of the informal warning may be kept on the
            employee's personnel file but will be disregarded after 6
            months, subject to satisfactory conduct and performance. The
            purpose of an informal warning is to provide an opportunity for
            improvement without the necessity for formal disciplinary
            procedures. If informal action does not bring about an
            improvement, Meta Extended Reality may then decide to take
            formal action.
          </p>

          <h3 className="font-semibold mt-4">Formal Disciplinary Procedure</h3>
          <h4 className="font-medium mt-3">Investigation</h4>
          <p>
            An investigation will take place to determine the facts of the
            allegations, to establish a fair and balanced view before
            deciding whether to proceed with a disciplinary hearing. The
            amount of investigation required will depend on the nature of
            the allegations and may involve interviewing and taking
            statements from the employee and any witnesses, and/or
            reviewing relevant documents. Investigative interviews are
            solely for fact-finding; no decision on disciplinary action will
            be taken until after a disciplinary hearing has been held.
            Every employee is expected to co-operate fully and promptly in
            any investigation, including informing Meta Extended Reality of
            the names of any relevant witnesses, disclosing any relevant
            documents, and attending investigative interviews if required.
          </p>

          <h4 className="font-medium mt-3">Letter</h4>
          <p>
            The employee will be advised in writing of the allegations
            against them and the possible disciplinary action that could
            follow if those allegations are upheld, including whether
            dismissal is a possible outcome. The letter will invite the
            employee to a meeting to discuss the allegations. Before any
            disciplinary hearing, the employee will be:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>told in writing of the allegations/complaints, and the basis of those allegations;</li>
            <li>given a reasonable opportunity to consider their response to that information; and</li>
            <li>offered the opportunity to be accompanied by a fellow employee or a trade union representative.</li>
          </ul>

          <h4 className="font-medium mt-3">Disciplinary Hearing</h4>
          <p>
            At the disciplinary hearing, the employee's manager (or other
            person chairing the hearing) will go through the allegations and
            the evidence gathered. The employee will be able to respond and
            present any evidence of their own, discuss the allegations and
            potential penalties, and may ask relevant witnesses to appear if
            sufficient advance notice is given. The meeting may be adjourned
            if further investigation or time is needed. The employee will
            be informed in writing of the outcome and offered the right to
            appeal.
          </p>

          <h3 className="font-semibold mt-4">Appeal</h3>
          <p>
            If the employee is not satisfied with a disciplinary decision,
            they may appeal in writing within 5 working days, setting out
            the grounds of appeal. Arrangements to hear the appeal will
            normally be made within 5 working days of receiving a written
            request; where the decision was to dismiss, the appeal may be
            heard after the dismissal has taken place. The appeal will
            either be a full rehearing of the disciplinary charge or a
            reconsideration of the original decision, giving the employee
            an opportunity to put forward new evidence or complaints of a
            flaw in the original process. The outcome will be confirmed in
            writing and will either uphold the original decision, overrule
            it, or substitute a less severe sanction. There is no further
            right to appeal.
          </p>

          <h3 className="font-semibold mt-4">Right to Be Accompanied</h3>
          <p>
            Employees have the right to be accompanied at any disciplinary
            hearing by a single companion who is not involved in the
            matter — either a fellow employee or a certified trade union
            official. The companion may address the hearing and confer with
            the employee, but may not answer questions on the employee's
            behalf. If the companion cannot attend on the date set, the
            hearing will normally be postponed to a mutually convenient time
            within 5 working days. Employees do not normally have the right
            to bring a companion to an investigative interview, although
            this may be allowed to overcome a disability or difficulty
            understanding English.
          </p>

          <h3 className="font-semibold mt-4">Suspension</h3>
          <p>
            Meta Extended Reality reserves the right to suspend individuals
            during formal disciplinary action. Any suspension will be on a
            paid basis and does not mean that Meta Extended Reality has
            prejudged the issue.
          </p>

          <h3 className="font-semibold mt-4">Potential Penalties</h3>
          <h4 className="font-medium mt-3">Stage 1: Formal Verbal Warning</h4>
          <p>
            A record will be kept of the fact that a verbal warning has been
            given, and the employee will be advised that it is a "formal"
            verbal warning, informed of the steps needed to improve conduct
            and any time limit for improvement, and told that further
            misconduct will result in further disciplinary action. The
            warning will normally expire after 6 months, subject to
            satisfactory conduct and performance. If the employee's conduct
            is sufficiently serious, Meta Extended Reality may omit Stage 1
            and proceed straight to Stage 2.
          </p>
          <h4 className="font-medium mt-3">Stage 2: Written Warning</h4>
          <p>
            Where the matter is more serious, or the employee has failed to
            meet required standards after a verbal warning, a written
            warning may be given stating the complaint, required standards,
            and any time limit for improvement, and warning that further
            disciplinary action will follow if standards are not met. This
            will normally cease to have effect after 12 months, subject to
            satisfactory conduct. Meta Extended Reality may omit Stages 1
            and 2 and proceed straight to Stage 3 if conduct is sufficiently
            serious.
          </p>
          <h4 className="font-medium mt-3">Stage 3: Final Written Warning</h4>
          <p>
            For more serious matters, or where required standards have not
            been met after warning, a Final Written Warning may be given,
            stating that the employee will be dismissed if standards are
            not met or there is further misconduct. This will normally
            cease to have effect after 12 months.
          </p>
          <h4 className="font-medium mt-3">Stage 4: Dismissal</h4>
          <p>
            Where there has been gross misconduct (in which case earlier
            stages may be omitted), or the employee has failed to meet
            required standards after due warnings, the employee may be
            dismissed. In extenuating circumstances, Meta Extended Reality
            may instead apply a sanction such as disciplinary transfer or
            demotion. In cases of gross misconduct, dismissal will normally
            be without notice (or pay in lieu of notice).
          </p>

          <h3 className="font-semibold mt-4">
            Dismissal Without Notice ("Summary Dismissal")
          </h3>
          <p>
            Meta Extended Reality regards certain issues as serious enough
            to warrant summary dismissal without prior warning, including
            but not limited to:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>acts of dishonesty affecting suitability for continued employment (e.g. theft, fraud, falsification of records or expenses, false reasons for absence);</li>
            <li>acts of bribery;</li>
            <li>serious insubordination or rudeness to customers or suppliers;</li>
            <li>deliberate damage to property;</li>
            <li>a serious breach of Health & Safety policies;</li>
            <li>physical violence or aggressive behaviour;</li>
            <li>indecent or immoral acts;</li>
            <li>being under the influence of, or possessing, alcohol or illegal drugs during working hours;</li>
            <li>bringing the company into serious disrepute;</li>
            <li>any breach of confidentiality requirements, other than minor breaches;</li>
            <li>harassment or bullying;</li>
            <li>refusing to comply with reasonable and legitimate management instructions;</li>
            <li>a serious breach of our GDPR Policy;</li>
            <li>a serious breach of our Equal Opportunities Policy;</li>
            <li>a serious breach of our IT or Social Media Policy.</li>
          </ul>
          <p>
            Except in the most serious cases, a full investigation will be
            held and, if necessary, the employee suspended on full pay
            pending its outcome. In the event of gross misconduct,
            disciplinary action could instead take the form of a demotion
            with financial and status loss, at the company's discretion.
          </p>

          <h3 className="font-semibold mt-4">Other Disciplinary Matters</h3>
          <p>
            Matters which may justify invoking the disciplinary procedure
            include, but are not limited to, the following:
          </p>
          <h4 className="font-medium mt-3">Performance at work</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li>Poor or careless performance in any aspect of work;</li>
            <li>Carelessness in quality of service;</li>
            <li>Interfering to the detriment of the work of colleagues;</li>
            <li>Failing to follow prescribed procedures;</li>
            <li>Failing to attend work in a reasonable condition;</li>
            <li>Removing/defacing/changing bulletins, notices and memorandums;</li>
            <li>Inviting visitors onto our premises without permission;</li>
            <li>Dereliction of duty (which, if serious, may also amount to gross misconduct);</li>
            <li>Misuse of authority;</li>
            <li>Wilfully obstructing the progress of meetings.</li>
          </ul>
          <h4 className="font-medium mt-3">Attendance</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li>Absence without prior permission;</li>
            <li>Leaving work early without prior permission;</li>
            <li>Overstaying lunch or tea breaks;</li>
            <li>Arriving for work late.</li>
          </ul>
          <h4 className="font-medium mt-3">Health & safety</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li>Failing to report personal injuries;</li>
            <li>Failing to observe health and safety regulations;</li>
            <li>Tampering with or misusing safety equipment;</li>
            <li>Failing to take reasonable care for the health and safety of colleagues and yourself;</li>
            <li>Failing to use appropriately supplied safety appliances and protective clothing;</li>
            <li>Failing to report to management any unsafe conditions or defects in equipment and/or premises.</li>
          </ul>

          <h3 className="font-semibold mt-4">
            What You Can Expect During the Disciplinary Process
          </h3>
          <p>At each stage of the disciplinary process:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>the employee will be told of the expected standard of performance/behaviour, and the nature of the shortfall identified;</li>
            <li>the employee will be given the opportunity to reply to any allegations and to outline mitigating circumstances;</li>
            <li>all of the facts will then be considered;</li>
            <li>the employee will be told of the disciplinary sanction being imposed, including any timescale for improvement and likely consequences of no improvement; and</li>
            <li>the employee will be advised of the right to appeal.</li>
          </ul>

          <h3 className="font-semibold mt-4">Serious Gross Misconduct</h3>
          <p>
            In the most serious cases of gross misconduct — for example,
            where Meta Extended Reality discovers the employee in the
            process of a serious act of dishonesty — it is possible that
            the employee will be dismissed immediately without going
            through a formal suspension and investigative procedure. If
            that happens, Meta Extended Reality will write to the employee
            setting out the misconduct which led to their dismissal and the
            basis for the decision. The employee then has the right to
            appeal.
          </p>
        </>
      ),
    },
    {
      key: "environmental-policy",
      title: "Environmental Policy",
      content: (
        <>
          <h3 className="font-semibold mt-4">The Policy</h3>
          <p>
            Meta Extended Reality recognises that as a company, it has
            environmental impacts and wherever possible seeks to minimise
            the effects at local, regional and global levels. Meta Extended
            Reality acknowledges a responsibility for the protection of the
            environment and of the health of its staff and the wider
            community, and continues to review systems and look for
            innovative solutions as appropriate.
          </p>
          <p>
            Meta Extended Reality is committed to working with
            environmental organisations and ensures that its employees are
            informed and kept updated about environmental issues. Employees
            are positively encouraged to be members of organisations
            working towards a more sustainable future.
          </p>
          <p>
            Meta Extended Reality provides safe, healthy working conditions
            for staff and visiting clients. The company contributes to a
            sustainable and healthy future by:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>conserving natural resources;</li>
            <li>minimising avoidable waste and pollution;</li>
            <li>reducing and discouraging litter and noise pollution;</li>
            <li>utilising effective waste management and recycling procedures;</li>
            <li>using recycled and recyclable materials whenever possible.</li>
          </ul>

          <h3 className="font-semibold mt-4">Meta Extended Reality – The Building</h3>
          <p>
            Meta Extended Reality is one of the UK's leading brand and
            visual communication businesses, headquartered in Stirling. The
            headquarters building at Codebase Stirling is the base for the
            majority of staff, occupying an office on the first floor which
            is well insulated to reduce heat loss and has large
            double-glazed windows. All radiators are fixed and
            thermostatically regulated to minimise energy usage while
            retaining a comfortable working environment.
          </p>
          <p>
            Meta Extended Reality does not use heavy equipment in the
            office, nor does it manufacture or assemble products on its
            premises — almost 100% of the company's output is electronic
            or digital in nature. Meta Extended Reality's offices can
            therefore be described as low risk in terms of major
            environmental impacts.
          </p>

          <h3 className="font-semibold mt-4">Main Environmental Impacts</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium">Power conservation:</span>
              <ul className="list-[circle] pl-6 space-y-1 mt-1">
                <li>All computer equipment is on short power-down timings to reduce electricity usage.</li>
                <li>All lighting in meeting rooms is switched off when the room is unoccupied.</li>
                <li>Low voltage bulbs are used throughout the building to minimise electricity usage.</li>
              </ul>
            </li>
            <li>
              <span className="font-medium">Toxic waste disposal and chemical usage:</span>
              <ul className="list-[circle] pl-6 space-y-1 mt-1">
                <li>Meta Extended Reality only uses non-toxic natural-base solvents.</li>
                <li>Only specialist waste disposal companies working to recognised industry standards are utilised.</li>
                <li>The local council monitors and signs off our disposal activities.</li>
              </ul>
            </li>
            <li>
              <span className="font-medium">Company cars:</span>
              <ul className="list-[circle] pl-6 space-y-1 mt-1">
                <li>Meta Extended Reality has adopted a policy of reducing car usage, and staff are encouraged to use public transport/rail to reduce congestion, pollution levels, and use of fossil fuels.</li>
              </ul>
            </li>
            <li>
              <span className="font-medium">Stationery and paper use:</span>
              <ul className="list-[circle] pl-6 space-y-1 mt-1">
                <li>Meta Extended Reality is actively reducing reliance on paper use and paper-based audit trails.</li>
                <li>Internally there is a growing emphasis on digital files, digital storage facilities and electronic audit trails.</li>
                <li>Where possible, and subject to client quality thresholds, we recommend and use recycled paper and water-based inks.</li>
                <li>Waste paper generated within the offices is recycled through appropriately qualified specialist external companies.</li>
              </ul>
            </li>
            <li>
              <span className="font-medium">Supply chain interaction:</span>
              <ul className="list-[circle] pl-6 space-y-1 mt-1">
                <li>Our increased use of digital files has impacted our supply chain, who now take files digitally rather than in hard copy.</li>
                <li>Increased emphasis on recycled paper.</li>
                <li>Use of identifiable sustainable forest and paper resources wherever possible.</li>
                <li>Minimised print runs to reduce potential waste copies in the extended supply chain.</li>
              </ul>
            </li>
          </ul>
          <p>
            The issues of accreditation and reporting are under
            consideration. The policy is monitored and reviewed annually,
            with appropriate actions taken to improve any environmental
            impacts and further reduce any potential imbalance. Meta
            Extended Reality is comfortable with inspections if appropriate
            and only with prior notice.
          </p>
        </>
      ),
    },
    {
      key: "equal-opportunities",
      title: "Equal Opportunities and Discrimination Policy",
      content: (
        <>
          <h3 className="font-semibold mt-4">Introduction</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium">1.1</span> This document sets
              out META EXTENDED REALITY policy on equal opportunities. This
              policy does not form part of your contract of employment but
              is a policy statement on the way in which equal opportunities
              issues are dealt with in META EXTENDED REALITY.
            </li>
            <li>
              <span className="font-medium">1.2</span> META EXTENDED
              REALITY has introduced this equal opportunity policy as a
              commitment to make full use of the talents and resource of
              all its employees and to provide a healthy environment which
              will encourage good and productive working operations within
              the organisation. This document describes how the policy is
              to be applied throughout META EXTENDED REALITY.
            </li>
            <li>
              <span className="font-medium">1.3</span> META EXTENDED
              REALITY is particularly concerned that equality of
              opportunity is maintained in the following areas:
              <ul className="list-[lower-alpha] pl-6 space-y-1 mt-1">
                <li>recruitment and selection;</li>
                <li>promotion, appraisal, transfer and training</li>
                <li>terms of employment, benefits, facilities and services</li>
                <li>grievance and disciplinary procedures</li>
                <li>dismissals, resignations and redundancies.</li>
              </ul>
            </li>
            <li>
              <span className="font-medium">1.4</span> META EXTENDED
              REALITY will ensure that all managers and supervisors with
              responsibility for any of the areas of concern listed in
              paragraph 1.3 above are provided with the appropriate equal
              opportunities training where necessary which may be updated
              as required. Other staff may also be required to attend equal
              opportunities training. Attendance at training will be
              compulsory if you are notified that you should attend a
              course. Up-to-date literature on equal opportunities is
              always available from the Human Resources department.
            </li>
          </ul>

          <h3 className="font-semibold mt-4">2. Statement of Principle</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium">2.1</span> An equal
              opportunities policy statement will be displayed on all
              notice boards and sent to all staff. A copy of this policy is
              available from the Human Resources department.
            </li>
            <li>
              <span className="font-medium">2.2</span> META EXTENDED
              REALITY statement of principle on equal opportunities is:
              <p className="italic border-l-2 border-slate-300 pl-4 mt-2">
                "META EXTENDED REALITY is committed to a policy of treating
                all its employees, workers and job applicants equally. No
                employee or potential employee shall receive less
                favourable treatment on the grounds of:
              </p>
              <ul className="list-[lower-alpha] pl-6 space-y-1 mt-1">
                <li>race, colour, nationality, ethnic or national origins</li>
                <li>religion or belief</li>
                <li>sex or marital/civil partner status</li>
                <li>sexual orientation</li>
                <li>gender reassignment</li>
                <li>age (or perceived age)</li>
                <li>disability (past or present)</li>
                <li>trade union membership (or non-membership)</li>
                <li>part-time or fixed term status</li>
                <li>pregnancy or maternity</li>
              </ul>
              <p className="italic border-l-2 border-slate-300 pl-4 mt-2">
                The above categories include 'Protected Characteristics'.
                The Equality Act 2010, is concerned with discrimination and
                harassment in respect of nine protected characteristics
                namely, age; disability; gender reassignment; marriage and
                civil partnership; pregnancy and maternity; race; religion
                or belief; sex; and sexual orientation. No employee or
                potential employee shall be disadvantaged by any conditions
                of employment that cannot be justified as necessary on
                operational grounds.
              </p>
              <p className="italic border-l-2 border-slate-300 pl-4 mt-2">
                META EXTENDED REALITY aims to encourage, value and manage
                diversity and is committed to equality for its entire
                staff. META EXTENDED REALITY wishes to attain a workforce
                which is representative of the communities from which it is
                drawn."
              </p>
            </li>
            <li>
              <span className="font-medium">2.3</span> Employees are
              expected to work with META EXTENDED REALITY to these aims. In
              certain circumstances an employee can be personally liable
              for discrimination against a fellow employee or a job
              applicant.
            </li>
            <li>
              <span className="font-medium">2.4</span> All staff have a
              duty to act in accordance with this policy and treat
              colleagues with dignity at all times and not to discriminate
              against or harass other members of staff regardless of their
              status.
            </li>
            <li>
              <span className="font-medium">2.5</span> Other company
              policies, such as those dealing with anti-harassment,
              maternity, paternity, adoption, emergency time off for
              dependants and parental leave are set out in separate
              documents.
            </li>
          </ul>

          <h3 className="font-semibold mt-4">3. Principles</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium">3.1</span> There should be no
              discrimination, whether direct or indirect, on any of the
              grounds set out in META EXTENDED REALITY statement of
              principle on equal opportunities contained in paragraph 2.2.
              The types of discrimination which are prohibited are defined
              at paragraph 3.2 below.
            </li>
            <li>
              <span className="font-medium">3.2</span> Discrimination can
              occur in the following forms:
              <ul className="list-[lower-alpha] pl-6 space-y-1 mt-1">
                <li>
                  direct discrimination – this is treating someone less
                  favourably because of their Protected Characteristics. An
                  example of this is paying someone less because of their
                  sex or because they belong to a particular racial group.
                </li>
                <li>
                  indirect discrimination - occurs where someone is
                  disadvantaged by an unjustified provision, criterion or
                  practice that also puts other people with the same
                  Protected Characteristics at a particular disadvantage. An
                  example of this is telling everyone they have to work
                  late at night – although applied to everyone, it will
                  adversely affect those employees with childcare
                  responsibilities and these tend to be women.
                </li>
                <li>
                  victimisation – this is less favourable treatment of
                  someone who has complained or given information about
                  discrimination or harassment, or supported someone else's
                  complaint. An example of this would be an employee
                  claiming that they had been discriminated on the grounds
                  of their disability and then their manager deciding when
                  they left not to give them a reference because they had
                  claimed disability discrimination.
                </li>
                <li>
                  harassment – harassment related to any of the Protected
                  Characteristics is prohibited. Harassment is unwanted
                  conduct that has the purpose or effect of violating
                  someone's dignity, or creating an intimidating, hostile,
                  degrading, humiliating or offensive environment for them.
                  More information on what can constitute harassment is set
                  out in META EXTENDED REALITY anti-harassment policy.
                </li>
              </ul>
            </li>
            <li>
              <span className="font-medium">3.3</span> META EXTENDED
              REALITY will appoint, train, develop, reward and promote on
              the basis of merit and ability.
            </li>
            <li>
              <span className="font-medium">3.4</span> All employees have
              personal responsibility for the practical application of META
              EXTENDED REALITY equal opportunities policy, which extends to
              the treatment of job applicants, employees (including former
              employees), customers/clients and visitors.
            </li>
            <li>
              <span className="font-medium">3.5</span> Special
              responsibility for the practical application of META EXTENDED
              REALITY equal opportunities policy falls upon managers,
              supervisors and the Human Resources department members
              involved in the recruitment, selection, appraisal, promotion
              and training of employees and the way their terms of
              employment are fixed.
            </li>
            <li>
              <span className="font-medium">3.6</span> META EXTENDED
              REALITY Grievance Procedure is available to any employee who
              believes that they may have been unfairly discriminated
              against. The harassment complaints procedure set out in META
              EXTENDED REALITY anti-harassment policy is also available to
              any employee who believes that they may have been harassed.
              Employees will not be victimised in any way for making such a
              complaint in good faith. Complaints of this nature will be
              dealt with seriously, in confidence and as soon as possible.
            </li>
            <li>
              <span className="font-medium">3.7</span> Disciplinary action
              will be taken against any employee who is found to have
              committed an act of unlawful discrimination. Serious breaches
              of this policy and serious incidents of harassment will be
              treated as gross misconduct. Unwarranted allegations of
              discrimination which are not made in good faith may also be
              considered as a disciplinary matter.
            </li>
            <li>
              <span className="font-medium">3.8</span> In the case of any
              doubt or concern about the application of this policy in any
              particular instance or situation, please consult your line
              manager as soon as possible.
            </li>
            <li>
              <span className="font-medium">3.9</span> META EXTENDED
              REALITY will keep under review its policy, procedures and
              practices on equal opportunities.
            </li>
          </ul>

          <h3 className="font-semibold mt-4">4. Recruitment and Selection</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium">4.1</span> The following
              principles should apply whenever recruitment or selection for
              positions takes place, whether externally or internally:
              <ul className="list-[lower-alpha] pl-6 space-y-1 mt-1">
                <li>
                  individuals will be assessed according to their personal
                  capability to carry out a given job
                </li>
                <li>
                  assumptions that only certain types of person will be
                  able to perform certain types of work must not be made
                </li>
                <li>
                  any qualifications or requirements applied to a job which
                  have or may have the effect of inhibiting applications
                  from certain types of person should only be retained if
                  they can be justified in terms of the job to be done
                </li>
                <li>
                  any age limits applied to a job should only be retained
                  if they can be objectively justified in terms of the job
                  to be done – in most cases this will not be the case and
                  managers should consult the Human Resources department if
                  considering an age limit for a particular post
                </li>
                <li>
                  the use of years of experience as a criteria for a
                  particular role will need to be objectively justified
                </li>
                <li>
                  recruitment solely or primarily by word of mouth should
                  be avoided as its effect is or may be to prevent certain
                  types of person from applying
                </li>
                <li>
                  selection tests should be specifically related to job
                  requirements and should measure the person's actual or
                  inherent ability to do or train for the work
                </li>
                <li>
                  selection tests should be reviewed regularly to ensure
                  they remain relevant and free from any unjustifiable
                  bias, either in content or in scoring mechanism
                </li>
                <li>
                  applications from different types of person should be
                  processed in the same way and the same questions asked at
                  interview
                </li>
                <li>
                  written records of interviews and reasons for appointment
                  and non-appointment should be kept
                </li>
                <li>questions at interview should relate to the requirements of the job</li>
                <li>
                  where any provision, criterion or practice for
                  recruitment and selection puts disabled people at a
                  substantial disadvantage due to a reason connected with
                  their disability, reasonable adjustments should be made
                  to eliminate or, if that is not reasonably practicable,
                  reduce the disadvantage. This could include, for example,
                  making different interview arrangements for an applicant
                  with mobility problems or arranging for facilities for
                  applicants with sight or hearing impairments
                </li>
                <li>
                  decisions regarding the method of recruitment or
                  selection or who is recruited or selected should only be
                  made by a person who has read and understood this policy
                  and undergone relevant training.
                </li>
              </ul>
            </li>
          </ul>

          <h3 className="font-semibold mt-4">5. Promotion, Transfer and Training</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium">5.1</span> The following
              principles should apply to appointments for promotion,
              transfer and training:
              <ul className="list-[lower-alpha] pl-6 space-y-1 mt-1">
                <li>
                  assessment criteria and appraisal schemes should be
                  carefully examined to ensure that they are not
                  discriminatory, whether directly or indirectly
                </li>
                <li>
                  assessment criteria and appraisal schemes should be
                  monitored on a regular basis and, where such criteria or
                  schemes result in predominantly one group of workers
                  gaining access to promotion, transfer or training or
                  being awarded a particular appraisal grade, they should be
                  checked to make sure this is not due to any hidden or
                  indirect discrimination
                </li>
                <li>
                  promotion and career development patterns will be
                  regularly monitored to ensure that access to promotion,
                  training and career development opportunities is not
                  denied to particular groups or types of workers
                </li>
                <li>
                  traditional qualifications and requirements for
                  promotion, transfer and training, such as length of
                  service, years of experience or age may discriminate
                  against certain workers and will need to be objectively
                  justified by reference to the job requirements
                </li>
                <li>
                  policies and practices regarding selection for training,
                  day release and personal development should not normally
                  result in an imbalance in training between groups of
                  workers
                </li>
                <li>
                  where any provision, criterion or practice relating to
                  promotion, appraisal, transfer or training puts disabled
                  workers at a substantial disadvantage for a reason
                  connected with their disability, reasonable adjustments
                  will be made to eliminate or, if that is not reasonably
                  practicable, reduce the disadvantage. For example, this
                  could be making training available for a disabled worker
                  in a different way, in a different location or at a
                  different time.
                </li>
              </ul>
            </li>
          </ul>

          <h3 className="font-semibold mt-4">
            6. Terms of Employment, Benefits, Facilities and Services
          </h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium">6.1</span> The following
              principles shall apply to terms of employment, benefits,
              facilities and services:
              <ul className="list-[lower-alpha] pl-6 space-y-1 mt-1">
                <li>
                  the terms of employment, benefits, facilities and
                  services available to workers should be reviewed
                  regularly to ensure that they are provided in a way which
                  is free from unlawful discrimination
                </li>
                <li>
                  part-time workers should receive pay, benefits,
                  facilities and services on a pro rata basis to their
                  full-time comparator unless otherwise objectively
                  justified – managers who are responsible for part-time
                  workers should, in particular, take advice from when
                  assessing pay and benefits for part-time workers
                </li>
                <li>
                  where any provision, criterion or practice relating to
                  terms of employment, benefits, facilities and services
                  puts disabled workers at a substantial disadvantage due
                  to a reason connected with their disability, reasonable
                  adjustments will be made to eliminate or, if that is not
                  reasonably practicable, reduce the disadvantage. Managers
                  responsible for disabled workers should, in particular,
                  take advice when assessing pay and benefits for disabled
                  workers
                </li>
                <li>
                  pay and bonus criteria, policies and practices should be
                  carefully examined and regularly monitored, and if it
                  appears that any group of workers are disadvantaged by
                  them they will be checked to make sure that this is not
                  due to any hidden or indirect discrimination.
                </li>
              </ul>
            </li>
          </ul>

          <h3 className="font-semibold mt-4">
            7. Grievances, Disciplinary Procedures, Dismissals and Redundancies
          </h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium">7.1</span> Workers who, in good
              faith, bring a grievance (or assist another to do so) either
              under this policy or otherwise in relation to an equal
              opportunities matter will not be disciplined, dismissed or
              otherwise suffer any adverse treatment for having done so.
            </li>
            <li>
              <span className="font-medium">7.2</span> No member of a
              particular group of workers will be disciplined or dismissed
              for performance or behaviour which would be overlooked or
              condoned in another group unless there is genuine and lawful
              justification for different treatment.
            </li>
            <li>
              <span className="font-medium">7.3</span> Redundancy criteria
              and procedures will be carefully examined to ensure that they
              are not applied and do not operate in an unlawfully
              discriminatory manner.
            </li>
            <li>
              <span className="font-medium">7.4</span> The provision of any
              voluntary redundancy benefits will be equally available to
              all workers unless there is a genuine and lawful justification
              for doing otherwise.
            </li>
          </ul>

          <h3 className="font-semibold mt-4">8. Disability Policy</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium">8.1</span> It is META EXTENDED
              REALITY policy that disabled people, including job applicants
              and employees, should be able to participate in all of META
              EXTENDED REALITY activities fully on an equal basis with
              people who are not disabled.
            </li>
            <li>
              <span className="font-medium">8.2</span> Due to the wide
              variety of potential disabilities and the likelihood of a
              disability affecting different people in different ways, it
              would be inappropriate to prescribe rigid rules on how issues
              concerning disabled people should be dealt with. What is
              essential, however, is that all managers, supervisors take
              all reasonably practical steps to ensure that disabled people
              are not less favourably treated or disadvantaged by
              comparison to people who are not disabled in relation to
              their work, working environment, or by any provision,
              criterion or practice used by META EXTENDED REALITY. Managers
              and supervisors need to be aware in particular that an
              employee on long-term sick leave or with intermittent
              sickness absence may be disabled.
            </li>
            <li>
              <span className="font-medium">8.3</span> META EXTENDED
              REALITY is particularly concerned that disabled workers are
              treated equally in the following areas:
              <ul className="list-[lower-alpha] pl-6 space-y-1 mt-1">
                <li>recruitment and selection</li>
                <li>promotion, transfer and training</li>
                <li>terms of employment, benefits, facilities and services</li>
                <li>dismissals, resignations and redundancies.</li>
              </ul>
            </li>
            <li>
              <span className="font-medium">8.4</span> For the purpose of
              this policy, disabilities are either physical or mental
              impairments that have a substantial and long term effect upon
              a person's ability to carry out normal day-to-day activities.
              Particular conditions such as HIV and some forms of cancer
              are covered from the point of diagnosis and do not have to
              already be long term.
            </li>
            <li>
              <span className="font-medium">8.5</span> Some disabilities
              are immediately obvious, for example use of a wheelchair,
              while other disabilities may not be apparent at all, for
              example HIV infection. Certain conditions are not considered
              to be disabilities, for example poor eyesight which is
              corrected simply by wearing prescription spectacles, or
              addiction to alcohol or other substances.
            </li>
            <li>
              <span className="font-medium">8.6</span> The general equal
              opportunity principles set out earlier in this policy will
              apply in relation to disabled people whether they currently
              have a disability or whether they had a disability in the
              past.
            </li>
            <li>
              <span className="font-medium">8.7</span> META EXTENDED
              REALITY will take all reasonably practicable steps to ensure
              that disabled people are able to participate in its business
              and activities on an equal basis with people who are not
              disabled.
            </li>
            <li>
              <span className="font-medium">8.8</span> META EXTENDED
              REALITY will not, for a reason relating to a person's
              disability, treat disabled people less favourably than it
              treats, or would treat, others to whom the same reason does
              not or would not apply, unless that treatment would be
              justified.
            </li>
            <li>
              <span className="font-medium">8.9</span> If any provision,
              criterion or practice used by or on behalf of META EXTENDED
              REALITY, or any physical feature of premises occupied by META
              EXTENDED REALITY, puts disabled people at a substantial
              disadvantage compared to people who are not disabled, META
              EXTENDED REALITY will take such reasonably practicable steps
              as it can to prevent this disadvantage. This is known as the
              duty to make reasonable adjustments.
            </li>
            <li>
              <span className="font-medium">8.10</span> The following
              general steps should always be considered where issues
              concerning disabilities arise or may arise:
              <ul className="list-[lower-alpha] pl-6 space-y-1 mt-1">
                <li>
                  Be flexible. There may be many different ways to avoid
                  discrimination or to minimise the effects of
                  discrimination. A small adjustment may be all an employee
                  needs.
                </li>
                <li>
                  Consider any performance or attendance problems in the
                  context of the person's disability and its effect on
                  their ability to meet performance and attendance targets.
                </li>
                <li>
                  Do not make assumptions. Whenever possible talk to the
                  disabled person to find out how their disability affects
                  them and what steps they think might help.
                </li>
                <li>
                  Do not discipline or dismiss a disabled employee for
                  performance or attendance-based reasons without first
                  establishing whether the employee's performance or
                  attendance is affected by the disability and that
                  appropriate adjustments to accommodate the disability
                  have been made.
                </li>
                <li>
                  Seek expert advice. Disability issues can be complex and
                  you may need expert medical advice about a person's
                  disability, or expert technical advice about adjustments
                  to technology or premises that might help the disabled
                  person.
                </li>
                <li>
                  Think ahead. Try to anticipate the effects that certain s
                  may have on disabled people, even if there are no
                  disabled employees at the time, to prevent problems
                  occurring in the future.
                </li>
              </ul>
            </li>
          </ul>
        </>
      ),
    },
    {
      key: "health-safety-full",
      title: "Health and Safety Policy (Including Display Screen Equipment Policy)",
      content: (
        <>
          <p>
            The Board of Directors recognise that they have a
            responsibility to ensure that all reasonable precautions are
            taken to provide and maintain working conditions which are
            safe, healthy and comply with all statutory requirements and
            officially approved codes of practice. The Directors also seek
            the co-operation of all employees for this purpose. Particular
            regard will be paid to: providing information, instruction and
            supervision to enable all employees to contribute positively to
            their own health and safety at work; ensuring electrical
            equipment and systems of work are safe and do not endanger
            health; providing safe arrangements for the storage, handling
            and movement of materials and substances; providing welfare
            facilities and benefits as far as reasonably practicable; and
            providing safe means of access to and egress from places of
            work under the company's control.
          </p>
          <p>
            Although Meta Extended Reality operates in an industry that is
            of low risk, injuries and illnesses can happen in any
            environment, and it is the Board's objective to reduce the
            incidence of these to an absolute minimum, not merely in
            keeping with, but surpassing, the best experience in other
            similar organisations.
          </p>

          <h3 className="font-semibold mt-4">Organisation & Responsibilities</h3>
          <h4 className="font-medium mt-3">A. Executive</h4>
          <p>
            The Board of Directors (as employer) has ultimate
            responsibility for compliance with the Health & Safety at Work
            Act 1974 and all other relevant statutory requirements, and is
            jointly responsible for the safety of staff and others
            (including members of the public) who may be affected by
            company activities. The Board will monitor the safety policy on
            a regular basis and ensure sufficient resources are available
            for health and safety equipment, personal protective equipment,
            training (e.g. manual handling), and eye tests.
          </p>
          <h4 className="font-medium mt-3">B. Safety Officer</h4>
          <p>
            The Safety Officer (the Office Manager) is responsible for
            maintaining safety records, investigating accidents, providing
            accident statistics, and keeping a watching brief on changing
            safety legislation, reporting directly to the Finance Director.
            The Safety Officer is responsible for ensuring the company's
            obligations regarding assessment, control and monitoring of
            hazardous substances, the workplace, work equipment, manual
            handling operations, personal protective equipment and display
            screen equipment are met.
          </p>
          <h4 className="font-medium mt-3">C. Directors</h4>
          <p>Directors have responsibility to provide leadership and promote a responsible attitude towards health and safety, including:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>ensuring new employees receive induction training appropriate to their specific jobs (e.g. location of first aid box, fire exits, fire-fighting equipment);</li>
            <li>ensuring staff are aware of procedures for serious or imminent danger;</li>
            <li>ensuring staff understand the health and safety policy;</li>
            <li>ensuring temporary employees are supplied with sufficient safety information before commencing work;</li>
            <li>keeping up to date with applicable health and safety matters;</li>
            <li>investigating accidents with the Safety Officer, with a view to prevention;</li>
            <li>ensuring good housekeeping standards are applied;</li>
            <li>periodically reviewing new and existing equipment for mechanical and operational safety.</li>
          </ul>
          <h4 className="font-medium mt-3">D. Employees</h4>
          <p>
            All employees have a responsibility to prevent injury to
            themselves, colleagues and others affected by their actions,
            following company procedures, reporting incidents, using
            equipment as trained, informing Directors of serious or
            imminent danger, and reporting shortcomings in protection
            arrangements. If a Director is unavailable, an employee may
            stop work and proceed to a place of safety when exposed to
            serious, imminent and unavoidable danger, raising the matter
            with a Director as soon as possible afterwards.
          </p>

          <h3 className="font-semibold mt-4">Procedures</h3>
          <h4 className="font-medium mt-3">A. Accidents</h4>
          <p>
            In the event of an accident causing injury, ensure the injured
            person is cared for and send immediately for the Safety Officer
            or a Director (calling emergency services where appropriate);
            do not move the injured person. All accidents involving injury,
            however trivial, should be notified to the Safety Officer or
            Finance Director and entered in the accident book, and reported
            to the inspecting authority as necessary. Dangerous occurrences
            should also be reported even without injury, so remedial action
            can be taken. All accidents will be investigated by the
            Directors and Safety Officer to prevent recurrence.
          </p>
          <h4 className="font-medium mt-3">B. First Aid</h4>
          <p>
            Meta Extended Reality has one qualified appointed person (the
            Safety Officer) trained to administer first aid in the office.
            The First Aid Box is located in the cupboard behind Reception;
            the receptionist issues items and notes them in the First Aid
            Book. Employees are shown the location of the first aid box
            during induction and are encouraged to make full use of these
            facilities.
          </p>
          <h4 className="font-medium mt-3">C. Fire</h4>
          <p>See the separate "Fire Regulations & Procedures" document.</p>

          <h3 className="font-semibold mt-4">Company Code of Safe Practice</h3>
          <h4 className="font-medium mt-3">A. Smoking</h4>
          <p>
            Meta Extended Reality always operates a no-smoking policy in
            all areas of the building, applying to all members of staff,
            visitors and clients.
          </p>
          <h4 className="font-medium mt-3">B. Good Housekeeping – Safety Rules and Practice</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li>Floor surrounding work areas should be kept as clear as possible at all times.</li>
            <li>Handrails should be used to go up and down stairs; do not run down steps.</li>
            <li>Lower filing drawers should not be left open, as this can cause trips and falls.</li>
            <li>Electrical and telephone cords must not lie uncovered on the floor and should be taped down.</li>
            <li>Spilled drinks must be wiped immediately to prevent accidents.</li>
            <li>Pointed objects (pencils, pens, letter openers, scalpels, etc.) must be used carefully to avoid puncture wounds.</li>
            <li>Protective clothing or equipment should be worn when provided and as instructed.</li>
            <li>Equipment should be checked for damage before and after use and damage reported promptly.</li>
            <li>Equipment must be cleaned, maintained and carried safely; help should be obtained for awkward or heavy loads.</li>
            <li>Horseplay (throwing paper clips, shooting rubber bands, tossing objects out of windows) is unacceptable and constitutes a disciplinary offence.</li>
            <li>Do not attempt to reach items beyond your reach — use a ladder or stepping stool instead.</li>
          </ul>
          <h4 className="font-medium mt-3">C. Electrical Equipment</h4>
          <p>
            Electrical equipment provided by Meta Extended Reality is
            normally safe because it is properly installed and regularly
            inspected. Personal electrical items should not be brought into
            the office, as the company will not guarantee their safety and
            maintenance. No member of staff should attempt to repair
            equipment unless trained and designated to do so; failure to
            report damage or faults may result in disciplinary action.
          </p>
          <h4 className="font-medium mt-3">D. Risk Assessment / Display Screen Equipment</h4>
          <p>To secure the health and safety of workers so far as reasonably practicable, the company will, in consultation with employees:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>carry out an assessment of each work station, taking into account the Display Screen Equipment (DSE), furniture, working environment and employee;</li>
            <li>take necessary measures to remedy any risks found;</li>
            <li>arrange free DSE eye tests prior to employment and at regular two-year intervals, or where a visual problem is experienced;</li>
            <li>contribute up to £50 towards corrective appliances (glasses or contact lenses) required specifically for DSE work.</li>
          </ul>
          <p>
            Where an employee raises a DSE health and safety matter, the
            company will investigate the circumstances and take corrective
            measures where appropriate; employees must inform the Safety
            Officer immediately of any DSE problem.
          </p>
          <h4 className="font-medium mt-3">E. Eye & Eyesight Tests</h4>
          <p>
            The company will arrange and meet the cost of a pre-employment
            eyesight test where arranged through the company (tests
            obtained independently are not reimbursed). Employees
            transferred to DSE-involving roles are entitled to a test, as
            are those for whom DSE becomes a significant part of the work.
            Employees are entitled to eyesight tests every 2 years via the
            Safety Officer; these tests assess visual capability for screen
            work only and are not a substitute for comprehensive high
            street optician tests. Where visual difficulties are believed
            to be caused by display screen work, the company will offer an
            eye-sight test, and will contribute up to £50 towards glasses
            specifically required for DSE use (evidence of purchase
            required), including for prescription changes specifically
            related to DSE use. Employees are personally responsible for
            the safekeeping of glasses supplied under this policy.
          </p>
          <h4 className="font-medium mt-3">F. Rest Breaks</h4>
          <p>
            The purpose of a break from DSE is to prevent the onset of
            fatigue; users are encouraged to take breaks by incorporating
            changes of activity in the working day. There is no prescribed
            frequency or duration of breaks — employees are given
            discretion over timing and extent of off-screen tasks where
            possible.
          </p>
          <h4 className="font-medium mt-3">G. Radiation & Pregnancy</h4>
          <p>
            Employees using DSE are not at risk from radiation; scientific
            research has concluded such concerns are unjustified and no
            adverse ill effects have been found. There is no reason for a
            person who is pregnant, or seeking to become pregnant, to avoid
            working with such equipment.
          </p>
          <h4 className="font-medium mt-3">H. Training</h4>
          <p>
            Directors and managers responsible for DSE users will ensure
            such users receive training and instruction necessary to work
            without risk to health, including those not in direct
            employment (temporary staff, freelancers).
          </p>
          <h4 className="font-medium mt-3">I. Safety Grievance Policy</h4>
          <p>
            Any health and safety grievance should be reported to the
            Safety Officer in the first instance; details of the grievance
            policy are available from the Office Manager.
          </p>
          <h4 className="font-medium mt-3">J. Disciplinary</h4>
          <p>
            If an employee contravenes the provisions of this policy,
            whether or not doing so places the health and safety of another
            person at risk, the employee will be disciplined and, if
            appropriate, dismissed.
          </p>
        </>
      ),
    },
    {
      key: "it-policy",
      title: "IT Policy",
      content: (
        <>
          <p className="text-sm text-gray-500">
            Meta Extended Reality
            <br />
            team@mxr.ai · https://www.mxr.ai · (+44) 20 7193 5407
          </p>

          <h3 className="font-semibold mt-4">1. Introduction</h3>
          <p>
            Meta Extended Reality (MXR) is committed to providing its
            employees with access to technology and IT resources that
            promote productivity and efficiency. To ensure that our IT
            resources are used in a responsible and ethical manner, this IT
            Policy has been developed to outline the acceptable use of IT
            resources within our organization.
          </p>

          <h3 className="font-semibold mt-4">2. Scope</h3>
          <p>
            This policy applies to all employees who have access to MXR's
            IT resources, including hardware, software, and network
            systems.
          </p>

          <h3 className="font-semibold mt-4">3. Acceptable Use</h3>
          <p>
            All IT resources provided by MXR must be used in a responsible
            and ethical manner. This includes, but is not limited to, the
            following:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Use of IT resources for work-related purposes only</li>
            <li>Compliance with all applicable laws, regulations, and MXR policies</li>
            <li>Protection of confidential information and sensitive data</li>
            <li>Respectful communication and behaviour when using IT resources</li>
            <li>Proper use of software licenses and other intellectual property</li>
            <li>Reporting of any security incidents, data breaches, or other IT-related concerns</li>
          </ul>

          <h3 className="font-semibold mt-4">4. Data Protection and Security</h3>
          <p>
            All employees are responsible for protecting the
            confidentiality, integrity, and availability of MXR data. This
            includes, but is not limited to, the following:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Use of strong passwords and secure login procedures</li>
            <li>Protection of sensitive data through encryption or other security measures</li>
            <li>Regular data backups to ensure data availability</li>
            <li>Adherence to MXR data retention and deletion policies</li>
            <li>Reporting of any suspected security incidents or data breaches</li>
          </ul>

          <h3 className="font-semibold mt-4">5. Equipment Use Maintenance</h3>
          <p>
            All IT equipment provided by MXR must be used in a responsible
            and appropriate manner. This includes, but is not limited to,
            the following:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Proper use and handling of hardware and peripherals</li>
            <li>Compliance with software licensing agreements and vendor policies</li>
            <li>Maintenance of equipment and software to ensure functionality and security</li>
            <li>Reporting of any IT-related issues or concerns to the appropriate personnel</li>
          </ul>

          <h3 className="font-semibold mt-4">
            6. Prohibition on Storing Customer Project Data on USB Drives or Removing it from the Office
          </h3>
          <p>
            MXR prohibits the use of USB drives or other external storage
            devices for storing customer project data. Employees may not
            remove customer project data from the office or access it from
            personal devices or public networks. Customer project data must
            be stored on MXR's secure network drives or cloud-based storage
            solutions.
          </p>

          <h3 className="font-semibold mt-4">7. Monitoring and Enforcement</h3>
          <p>
            MXR reserves the right to monitor and audit all IT resources
            and activities. This includes, but is not limited to, the
            following:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Monitoring of network traffic and system logs for security and compliance purposes</li>
            <li>Regular auditing of user activity and IT resource usage</li>
            <li>Enforcement of MXR policies and procedures through disciplinary action, up to and including termination of employment or access to IT resources</li>
          </ul>

          <h3 className="font-semibold mt-4">8. Acknowledgement and Agreement</h3>
          <p>
            All employees must sign and acknowledge this IT Policy before
            accessing MXR's IT resources. By signing this policy, employees
            agree to comply with all policies and procedures outlined in
            this document.
          </p>

          <h3 className="font-semibold mt-4">Conclusion</h3>
          <p>
            This IT Policy outlines the acceptable use of technology and IT
            resources within MXR. All employees are responsible for
            complying with these policies and procedures, protecting the
            integrity of data, and ensuring the security and
            confidentiality of information. MXR prohibits the use of USB
            drives or other external storage devices for storing customer
            project data and employees may not remove customer project data
            from the office or access it from personal devices or public
            networks. By signing this policy, employees acknowledge their
            agreement to abide by these policies and procedures.
          </p>
        </>
      ),
    },
    {
      key: "it-security-policy",
      title: "IT Security Policy",
      content: (
        <>
          <h3 className="font-semibold mt-4">1. Purpose</h3>
          <p>
            The purpose of this IT security policy is to ensure the
            protection of Meta Extended Reality's assets, data, and
            intellectual property from potential security threats. This
            policy aims to provide a comprehensive set of guidelines that
            all employees and contractors must follow to maintain a secure
            IT environment. By doing so, Meta Extended Reality can protect
            against unauthorized access, maintain the integrity of data,
            and ensure the availability of IT systems.
          </p>

          <h3 className="font-semibold mt-4">2. Scope</h3>
          <p>
            This IT security policy applies to all employees, contractors,
            and vendors of Meta Extended Reality who have access to the
            organization's IT systems, data, and intellectual property. It
            covers all IT assets, including hardware, software, and data,
            regardless of where they are stored or how they are accessed.
          </p>

          <h3 className="font-semibold mt-4">
            3. Components and Security Controls
          </h3>
          <p>
            The following components and security controls must be
            implemented to protect Meta Extended Reality's assets:
          </p>

          <h3 className="font-semibold mt-4">4. Windows Server</h3>
          <p>
            The Windows server is the central hub for Meta Extended
            Reality's IT systems. As such, it is critical that it is
            properly secured to prevent unauthorized access and maintain
            the integrity of data.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium">Access controls:</span> Access
              to sensitive data and IT systems must be limited to authorized
              personnel through the use of passwords, multi-factor
              authentication, and role-based access controls. All users
              must have unique login credentials, and the use of generic
              accounts must be prohibited. Passwords must be complex, and
              employees must be trained to avoid using easily guessable
              passwords. Multi-factor authentication must be used for all
              access to sensitive data and IT systems.
            </li>
            <li>
              <span className="font-medium">Encryption:</span> Sensitive
              data must be encrypted both in transit and at rest to prevent
              unauthorized access. Data must be encrypted using
              industry-standard encryption protocols, such as AES or RSA.
              Encryption keys must be stored securely and accessed only by
              authorized personnel.
            </li>
            <li>
              <span className="font-medium">Regular software updates:</span>{" "}
              All software must be updated regularly to patch
              vulnerabilities and reduce the risk of exploitation. This
              includes the Windows operating system, as well as any
              applications or software that is installed on the server.
            </li>
          </ul>

          <h3 className="font-semibold mt-4">5. PCs and Laptops</h3>
          <p>
            All PCs and laptops used by Meta Extended Reality employees
            must be properly secured to prevent unauthorized access and
            maintain the integrity of data.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium">Access controls:</span> Access
              to sensitive data and IT systems must be limited to authorized
              personnel through the use of passwords, multi-factor
              authentication, and role-based access controls. All users
              must have unique login credentials, and the use of generic
              accounts must be prohibited. Passwords must be complex, and
              employees must be trained to avoid using easily guessable
              passwords. Multi-factor authentication must be used for all
              access to sensitive data and IT systems.
            </li>
            <li>
              <span className="font-medium">Encryption:</span> Sensitive
              data must be encrypted both in transit and at rest to prevent
              unauthorized access. Data must be encrypted using
              industry-standard encryption protocols, such as AES or RSA.
              Encryption keys must be stored securely and accessed only by
              authorized personnel.
            </li>
            <li>
              <span className="font-medium">Norton antivirus software:</span>{" "}
              All devices used by Meta Extended Reality employees must have
              Norton antivirus software installed to protect against
              malware. Antivirus software must be updated regularly to
              ensure that it is effective in detecting and preventing
              malware infections.
            </li>
          </ul>

          <h3 className="font-semibold mt-4">6. SonicWall Firewall</h3>
          <p>
            The SonicWall firewall is critical to protecting Meta Extended
            Reality's network from external threats.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium">Firewall:</span> A SonicWall
              firewall must be in place to protect the network from
              external threats. The firewall must be configured to block
              all incoming traffic except for traffic that is explicitly
              allowed. This includes traffic from known IP addresses and
              ports that are used for legitimate business purposes.
            </li>
            <li>
              <span className="font-medium">Regular software updates:</span>{" "}
              All software must be updated regularly to patch
              vulnerabilities and reduce the risk of exploitation. This
              includes the SonicWall firewall, as well as any applications
              or software that is installed on the device.
            </li>
          </ul>

          <h3 className="font-semibold mt-4">
            7. Windows SharePoint for Cloud Storage
          </h3>
          <p>
            Meta Extended Reality uses Windows SharePoint for cloud
            storage. All data stored in the cloud must be properly secured
            and access must be restricted to authorized users.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium">Access controls:</span> Access
              to sensitive data and IT systems must be limited to authorized
              personnel through the use of passwords, multi-factor
              authentication, and role-based access controls. All users
              must have unique login credentials, and the use of generic
              accounts must be prohibited. Passwords must be complex, and
              employees must be trained to avoid using easily guessable
              passwords. Multi-factor authentication must be used for all
              access to sensitive data and IT systems.
            </li>
            <li>
              <span className="font-medium">Encryption:</span> Sensitive
              data must be encrypted both in transit and at rest to prevent
              unauthorized access. Data must be encrypted using
              industry-standard encryption protocols, such as AES or RSA.
              Encryption keys must be stored securely and accessed only by
              authorized personnel.
            </li>
            <li>
              <span className="font-medium">Regular software updates:</span>{" "}
              All software must be updated regularly to patch
              vulnerabilities and reduce the risk of exploitation. This
              includes the Windows SharePoint software, as well as any
              applications or software that is installed on the server.
            </li>
          </ul>

          <h3 className="font-semibold mt-4">8. Network Connections</h3>
          <p>
            All network connections used by Meta Extended Reality must be
            properly secured to prevent unauthorized access and maintain
            the integrity of data.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium">
                Encrypted data in transit:
              </span>{" "}
              All data must be encrypted during transit to prevent
              unauthorized access. This includes data that is transmitted
              over the internet, as well as data that is transmitted over
              private networks.
            </li>
            <li>
              <span className="font-medium">Access controls:</span> Access
              to sensitive data and IT systems must be limited to authorized
              personnel through the use of passwords, multi-factor
              authentication, and role-based access controls. All users
              must have unique login credentials, and the use of generic
              accounts must be prohibited. Passwords must be complex, and
              employees must be trained to avoid using easily guessable
              passwords. Multi-factor authentication must be used for all
              access to sensitive data and IT systems.
            </li>
          </ul>

          <h3 className="font-semibold mt-4">9. Employee Security Training</h3>
          <p>
            All employees of Meta Extended Reality must receive regular
            security training to prevent social engineering attacks and
            maintain security awareness.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium">
                Regular security training:
              </span>{" "}
              All employees must receive regular security training to
              prevent social engineering attacks and maintain security
              awareness. This includes training on how to create secure
              passwords, how to identify phishing emails, and how to
              recognize other types of social engineering attacks.
            </li>
            <li>
              <span className="font-medium">
                Social engineering prevention:
              </span>{" "}
              Employees must be aware of the risks of social engineering
              attacks and be trained on how to prevent them. This includes
              training on how to verify the identity of a caller or email
              sender before providing sensitive information, and how to
              recognize suspicious behavior.
            </li>
          </ul>

          <h3 className="font-semibold mt-4">10. Incident Response Plan</h3>
          <p>
            An incident response plan must be in place to contain and
            minimize the impact of security incidents.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium">
                Procedures for containing incidents:
              </span>{" "}
              In the event of a security incident, procedures must be in
              place to contain the incident and minimize the impact. This
              includes isolating affected systems, shutting down affected
              servers, and notifying relevant personnel.
            </li>
            <li>
              <span className="font-medium">
                Restoring systems and data:
              </span>{" "}
              Procedures must be in place to restore systems and data in
              the event of a security incident. This includes restoring
              from backups and reinstalling software as necessary.
            </li>
            <li>
              <span className="font-medium">
                Notifying relevant parties:
              </span>{" "}
              Procedures must be in place to notify relevant parties of a
              security incident, such as law enforcement or customers. This
              includes notifying affected customers of any data breaches or
              security incidents that may impact them.
            </li>
          </ul>

          <h3 className="font-semibold mt-4">11. Compliance</h3>
          <p>
            Meta Extended Reality must comply with all legal and regulatory
            requirements that apply to the organization.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium">
                Aligned with legal and regulatory requirements:
              </span>{" "}
              This IT security policy must be aligned with any legal or
              regulatory requirements that apply to the organization, such
              as the GDPR or the California Consumer Privacy Act. This
              includes requirements around data privacy, data protection,
              and cybersecurity.
            </li>
          </ul>

          <h3 className="font-semibold mt-4">12. Monitoring and Testing</h3>
          <p>
            Regular monitoring and testing of IT systems and security
            controls must be conducted to identify potential vulnerabilities
            or weaknesses. This includes penetration testing and
            vulnerability scanning, as well as regular audits of access
            logs to ensure that only authorized personnel are accessing
            sensitive data.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium">Penetration testing:</span>{" "}
              Regular penetration testing must be conducted to identify
              potential vulnerabilities in Meta Extended Reality's IT
              systems. This includes both internal and external
              penetration testing to identify potential attack vectors.
            </li>
            <li>
              <span className="font-medium">Vulnerability scanning:</span>{" "}
              Regular vulnerability scanning must be conducted to identify
              potential vulnerabilities in Meta Extended Reality's IT
              systems. This includes scanning for known vulnerabilities in
              software and hardware used by the organization.
            </li>
            <li>
              <span className="font-medium">Access log audits:</span>{" "}
              Regular audits of access logs must be conducted to ensure
              that only authorized personnel are accessing sensitive data.
              This includes reviewing login records, file access logs, and
              other access records to identify potential unauthorized
              access.
            </li>
          </ul>

          <h3 className="font-semibold mt-4">13. Review and Update</h3>
          <p>
            This IT security policy must be reviewed and updated on an
            annual basis or as necessary to reflect changes in the IT
            environment or threat landscape. This ensures that Meta
            Extended Reality's IT security measures remain up-to-date and
            effective in protecting against potential security threats.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium">Annual review:</span> This IT
              security policy must be reviewed on an annual basis to ensure
              that it remains up-to-date and effective in protecting
              against potential security threats. Any necessary updates
              must be made as part of the review process.
            </li>
            <li>
              <span className="font-medium">Ad hoc updates:</span> This IT
              security policy must be updated as necessary to reflect
              changes in the IT environment or threat landscape. This
              includes updating the policy to reflect changes in software
              or hardware used by the organization, as well as changes in
              legal or regulatory requirements.
            </li>
          </ul>

          <h3 className="font-semibold mt-4">Conclusion</h3>
          <p>
            Meta Extended Reality's IT security policy is critical to
            protecting the organization's assets, data, and intellectual
            property from potential security threats. By following the
            guidelines set forth in this policy, employees and contractors
            can help maintain a secure IT environment that protects against
            unauthorized access, maintains the integrity of data, and
            ensures the availability of IT systems.
          </p>
          <p>
            Regular monitoring, testing, and updating of the policy are
            necessary to ensure that Meta Extended Reality's IT security
            measures remain up-to-date and effective in protecting against
            potential security threats.
          </p>
        </>
      ),
    },
    {
      key: "whistleblowing-policy",
      title: "Whistleblowing Policy",
      content: (
        <>
          <h3 className="font-semibold mt-4">1. Policy</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium">1.1</span> META EXTENDED REALITY
              always seeks to conduct its business honestly and with
              integrity. However, we acknowledge that all organisations face
              the risk of their activities going wrong from time to time, or
              of unknowingly harbouring malpractice. META EXTENDED REALITY
              believes we have a duty to take appropriate measures to
              identify such situations and attempt to remedy them. By
              encouraging a culture of openness and accountability within
              the organisation, META EXTENDED REALITY believes that we can
              help prevent such situations occurring. META EXTENDED REALITY
              expects all staff to maintain high standards in accordance
              with our code of conduct and to report any wrongdoing that
              falls short of these fundamental principles. It is the
              responsibility of all workers to raise any concerns that they
              might have about malpractice within the workplace. The aim of
              this policy is to ensure that our workers are confident that
              they can raise any matters of genuine concern without fear of
              reprisals, in the knowledge that they will be taken seriously
              and that the matters will be investigated appropriately and
              regarded as confidential.
            </li>
            <li>
              <span className="font-medium">1.2</span> The following
              guidance sets out the procedure by which staff can report
              concerns about workplace practices, however it is for guidance
              only and does not form part of the employee's contract of
              employment.
            </li>
            <li>
              <span className="font-medium">1.3</span> This procedure should
              only be used by workers who wish to report or raise concerns
              about a wrongdoing of the nature covered within the scope of
              this policy. It is not intended to replace the normal
              grievance procedures or anti-harassment procedures of META
              EXTENDED REALITY which continue to be the appropriate way to
              raise issues relating to the employee's specific job or
              employment. If a worker has a complaint relating to their
              personal circumstances in the workplace then the worker should
              use the Grievance Procedure or Anti-Harassment Procedure as
              appropriate.
            </li>
            <li>
              <span className="font-medium">1.4</span> This policy seeks to
              provide a mechanism within META EXTENDED REALITY for probity
              and accountability in the hope of ensuring that matters of
              serious concern are dealt with within META EXTENDED REALITY
              rather than in public.
            </li>
            <li>
              <span className="font-medium">1.5</span> It should be noted
              that the provisions and protections afforded in this policy
              apply to all levels of staff working for META EXTENDED REALITY
              (including senior management and directors), together with
              agency workers and contractors providing a service to META
              EXTENDED REALITY as well as those undertaking work experience
              and training within META EXTENDED REALITY. The word "worker"
              in this policy shall be deemed to cover all of these groups of
              individuals.
            </li>
          </ul>

          <h3 className="font-semibold mt-4">2. Legislative Framework</h3>
          <p>
            Whistleblowing is the disclosure of information by a worker or
            employee which relates to some danger, fraud or other illegal
            or unethical conduct in the workplace. The Employment Rights Act
            1996 as amended by the Public Interest Disclosure Act 1998
            governs the making of disclosures concerning workplace
            activities and is intended to protect workers who blow the
            whistle on bad practice from being subjected to any detriment or
            unfairly dismissed as a result.
          </p>

          <h3 className="font-semibold mt-4">3. Worker's Rights and Duties</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium">3.1</span> Workers have certain
              rights and duties to META EXTENDED REALITY which are set out
              in the worker's terms and conditions of employment, including
              a duty to maintain confidentiality in respect of META EXTENDED
              REALITY business and a duty to act in the best interests of
              META EXTENDED REALITY.
            </li>
            <li>
              <span className="font-medium">3.2</span> It is expected that
              any worker who reasonably believes that a wrongdoing or
              malpractice of the kind covered in this policy has taken place
              or is likely to take place within META EXTENDED REALITY,
              should follow the procedure set out in this policy to bring
              the matter to META EXTENDED REALITY attention.
            </li>
            <li>
              <span className="font-medium">3.3</span> Workers who make a
              disclosure in accordance with the terms of this policy have a
              right not to be dismissed, disciplined, victimised, harassed
              or otherwise penalised because they made a disclosure.
            </li>
            <li>
              <span className="font-medium">3.4</span> If a worker believes
              they are being penalised in any way (by META EXTENDED REALITY
              or another worker) having made a disclosure in accordance with
              this policy, then the worker should follow the steps set out
              in META EXTENDED REALITY grievance procedures policy to raise
              any concerns.
            </li>
          </ul>

          <h3 className="font-semibold mt-4">4. Confidentiality</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium">4.1</span> META EXTENDED REALITY
              acknowledges that these types of matters require to be dealt
              with sensitively and efficiently. Whilst it is recognised that
              some workers may find it difficult to report concerns,
              anonymous disclosures will seriously hinder the proper
              investigation of concerns and the ability to implement any
              consequent disciplinary action against the subject(s) of the
              concerns.
            </li>
            <li>
              <span className="font-medium">4.2</span> Knowing the identity
              of the disclosing worker allows META EXTENDED REALITY to
              provide feedback to him/her, which is important in
              demonstrating that the concern is being investigated and
              dealt with. META EXTENDED REALITY undertakes to keep the
              identity of the disclosing worker confidential so far as it is
              reasonably practicable.
            </li>
            <li>
              <span className="font-medium">4.3</span> Workers should
              therefore be aware that we cannot guarantee to investigate
              anonymous allegations.
            </li>
            <li>
              <span className="font-medium">4.4</span> It should be noted
              that, whilst META EXTENDED REALITY will do everything possible
              to maintain the confidentiality of the disclosing worker for
              as long as possible, action taken by META EXTENDED REALITY as
              a result of the disclosure may lead to the worker's identity
              being revealed either by inference or as required by the
              demands of legal or disciplinary proceedings. If in our view
              circumstances exist which may lead to the disclosure of the
              worker's identity, META EXTENDED REALITY will make efforts to
              inform the worker that their identity is likely to be
              disclosed.
            </li>
            <li>
              <span className="font-medium">4.5</span> If it is necessary
              for the worker to participate in an investigation, the fact
              that the worker made the original disclosure will, so far as
              is reasonably practicable, be kept confidential and all
              reasonable steps will be taken to protect the worker from any
              victimisation or detriment as a result of having made a
              disclosure. It is likely, however, that the worker's role as
              the whistleblower could still become apparent to third parties
              during the course of an investigation.
            </li>
            <li>
              <span className="font-medium">4.6</span> In order not to
              jeopardise the investigation into any alleged malpractice, the
              worker shall also be expected to keep the fact that they have
              raised a concern, the nature of that concern and the identity
              of those involved confidential.
            </li>
          </ul>

          <h3 className="font-semibold mt-4">
            5. Types of Disclosure Covered by Policy
          </h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium">5.1</span> Concerns about
              malpractice within META EXTENDED REALITY which affects or
              could affect, for example, customers, service users, members
              of the public or other members of staff should be raised
              using the procedure set out in this policy.
            </li>
            <li>
              <span className="font-medium">5.2</span> This policy applies
              generally to matters which are of public concern. More
              specifically, a worker shall only qualify for protection under
              this policy if, in the reasonable belief of the worker making
              the disclosure, the disclosure shows that one of the following
              "relevant failures" has happened, is happening or is likely to
              happen:-
              <ul className="list-[lower-alpha] pl-6 space-y-1 mt-1">
                <li>a criminal offence;</li>
                <li>a failure to comply with any legal obligation;</li>
                <li>miscarriage of justice;</li>
                <li>danger to the health and safety of any individual;</li>
                <li>bribery;</li>
                <li>damage to the environment; or</li>
                <li>deliberate concealment of any of the above.</li>
              </ul>
              <p className="mt-2">
                A disclosure will still qualify for protection under this
                policy even if the person who receives the information is
                already aware of the information contained in the
                disclosure and in such cases the disclosing worker will be
                deemed to have brought the information to his attention.
              </p>
            </li>
            <li>
              <span className="font-medium">5.3</span> META EXTENDED REALITY
              will value any concerns reported in good faith under this
              procedure. If a worker is uncertain whether the matters
              concerning them are within the scope of the policy, META
              EXTENDED REALITY encourages all workers to report their
              concerns to the Chief Executive who will appoint a Designated
              Whistleblowing Officer ("DWO") in accordance with procedure
              set out in this policy.
            </li>
          </ul>

          <h3 className="font-semibold mt-4">
            6. Procedure for Internal Disclosures
          </h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium">6.1</span> Protection is only
              given under this policy to qualifying disclosures that have
              been disclosed in good faith and in accordance with the
              procedures set out in this policy.
            </li>
            <li>
              <span className="font-medium">6.2</span> Disclosures should,
              in general, always be made to META EXTENDED REALITY in the
              first instance.
            </li>
            <li>
              <span className="font-medium">6.3</span> Subject to the
              provisions of Clause 6.4 below, disclosures should in the
              first instance be made to the orally or in writing who shall
              then report directly to the Board of Directors. Full details
              of the concern and supporting evidence (where possible) should
              be provided at the time of initial disclosure and it should be
              stated that the Whistleblowing Policy is being used.
            </li>
            <li>
              <span className="font-medium">6.4</span> Where initial
              disclosure to the DWO is impossible or the disclosure is
              extremely serious or in any way involves the DWO, disclosure
              may be made directly to the Chief Executive.
            </li>
            <li>
              <span className="font-medium">6.5</span> The Chief Executive
              will ask the worker to formalise their concerns in writing if
              the worker has not already done so and will then acknowledge
              receipt of the worker's formal written disclosure and keep a
              record of further action taken.
            </li>
            <li>
              <span className="font-medium">6.6</span> The worker is
              entitled to be accompanied by a workplace colleague or union
              representative at any meeting with the DWO/ Chief Executive.
              The worker's companion will be asked to respect the
              confidentiality of the disclosure and any subsequent
              investigation.
            </li>
            <li>
              <span className="font-medium">6.7</span> All managers within
              META EXTENDED REALITY have a specific responsibility to
              facilitate the operation of this policy and to ensure that
              workers feel able to raise concerns without fear of reprisals
              in accordance with the procedure set down below. To facilitate
              this process, managers will be given training on the relevant
              legal and operational framework and best practice.
            </li>
            <li>
              <span className="font-medium">6.8</span> META EXTENDED REALITY
              will always endeavour to handle investigations promptly and
              fairly, but if any worker has made a disclosure under the
              terms of this policy and the worker is not satisfied with the
              investigation or its conclusion, the worker should write
              directly to the Chairman of META EXTENDED REALITY detailing
              any concerns.
            </li>
          </ul>

          <h3 className="font-semibold mt-4">
            7. Procedure for External Disclosures
          </h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium">7.1</span> If the disclosing
              worker reasonably believes that the relevant failure relates
              solely or mainly to the conduct of a third party or to any
              matter for which a person other than META EXTENDED REALITY
              has legal responsibility, the worker is entitled to make that
              disclosure to the relevant third party. However, META EXTENDED
              REALITY requests that the worker consults the DWO before
              speaking to the third party.
            </li>
            <li>
              <span className="font-medium">7.2</span> The aim of this
              policy is to provide an internal mechanism for reporting,
              investigating and remedying any workplace wrongdoing. It is
              therefore hoped that it will not be necessary for workers to
              alert external organisations. However, in very serious
              circumstances, or following an internal report which has not
              been addressed, META EXTENDED REALITY recognises that it may
              be appropriate for a worker to report their concerns to an
              external body. The government has prescribed a list of
              appropriate bodies for such external reporting: for example,
              the Environment Agency and the Health and Safety Executive. A
              full list is available from an independent charity called
              Public Concern at Work, who can be contacted by telephone on
              020 7404 6609 and by e-mail at whistle@pcaw.demon.co.uk.
            </li>
          </ul>

          <h3 className="font-semibold mt-4">8. Actions Following Disclosure</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium">8.1</span> Following disclosure
              of a concern under this policy, META EXTENDED REALITY is
              committed to investigating disclosures fully, fairly, quickly
              and confidentially where circumstances permit. Following
              submission of the worker's formal written disclosure, the
              DWO/ Chief Executive will acknowledge receipt within five
              working days and make appropriate arrangements for
              investigation.
            </li>
            <li>
              <span className="font-medium">8.2</span> In most instances,
              the Chief Executive will carry out an initial assessment of
              the disclosure to determine whether there are grounds for a
              more detailed investigation to take place or whether the
              disclosure is, for example, based on erroneous information. In
              any event, a report will be produced and copies will be
              provided to the Board of Directors and, where appropriate, the
              worker will also receive a copy. If the worker is dissatisfied
              with the investigation or its conclusion, then the worker
              should refer to Clause 6.8 of this policy.
            </li>
            <li>
              <span className="font-medium">8.3</span> Assistance of the
              disclosing worker may be required during the investigation.
            </li>
            <li>
              <span className="font-medium">8.4</span> If a longer
              investigation is considered necessary, META EXTENDED REALITY
              will usually appoint an investigator or investigative team
              including personnel with experience of operating workplace
              procedures or specialist knowledge of the subject matter of
              the disclosure. For example, if the disclosure concerns
              financial malpractice, the finance director may be asked to
              investigate. Separate personnel will be asked to make a
              judgement on the report submitted by the investigator (or
              investigative team). Statements may require to be taken from
              other workers. Recommendations for change will also be
              invited from the investigative team to enable us to minimise
              the risk of the recurrence of any malpractice or impropriety
              which has been uncovered. The Board of Directors will then be
              responsible for reviewing and implementing these
              recommendations.
            </li>
            <li>
              <span className="font-medium">8.5</span> So far as the Chief
              Executive considers it appropriate and practicable, the
              worker will be kept informed of the progress of the
              investigation. However, the need for confidentiality may
              prevent us giving the worker specific details of the
              investigation or actions taken. It is not normally appropriate
              to set a specific time frame for completion of investigations
              in advance, as the diverse nature of disclosures contemplated
              makes this unworkable. META EXTENDED REALITY will, however,
              aim to deal with all disclosures in a timely manner and with
              due regard to the rights of all individuals involved.
            </li>
            <li>
              <span className="font-medium">8.6</span> META EXTENDED REALITY
              recognises that there may be matters that cannot be dealt with
              internally and in respect of which external authorities will
              need to be notified and become involved either during or
              after our investigation. META EXTENDED REALITY will endeavour
              to inform the worker if a referral to an external authority is
              about to or has taken place, although the worker may need to
              make such a referral without the worker's knowledge or consent
              if META EXTENDED REALITY considers it appropriate.
            </li>
            <li>
              <span className="font-medium">8.7</span> Workers should be
              aware that where a disclosure is made outside the scope of
              this policy (i.e. in bad faith or of a type of disclosure not
              covered by this policy), the worker will not be protected
              under this policy and could be subject to disciplinary action
              (including, where appropriate, dismissal without notice).
              Those choosing to make disclosures without following this
              procedure or anonymously may not receive the protection
              afforded by this policy.
            </li>
          </ul>

          <h3 className="font-semibold mt-4">9. Protection for Whistleblowers</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium">9.1</span> A protected
              disclosure which has been made in accordance with the
              procedures set out in this policy shall not result in the
              worker being subject to any detriment and/or dismissed.
              Detriment includes unwarranted disciplinary action, threats
              of action, victimisation and other less favourable treatment.
              In addition, a worker shall not be held in breach of contract
              for making a protected disclosure.
            </li>
            <li>
              <span className="font-medium">9.2</span> Workers also have
              legal protection during employment from any detrimental acts
              or omissions which have occurred as a result of a protected
              disclosure and any dismissal of a worker for a reason
              connected with a protected disclosure will automatically be
              unfair.
            </li>
            <li>
              <span className="font-medium">9.3</span> If a worker believes
              that they are being subjected to a detriment within the
              workplace as a result of raising concerns under this
              procedure, the worker should inform the DWO immediately.
              Workers who victimise or retaliate against those who have
              raised concerns under this policy will be subject to
              disciplinary action.
            </li>
          </ul>

          <h3 className="font-semibold mt-4">10. Miscellaneous</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium">10.1</span> This policy may not
              be used in connection with matters which have already been
              raised under META EXTENDED REALITY grievance or
              anti-harassment policies.
            </li>
            <li>
              <span className="font-medium">10.2</span> Workers should
              contact the DWO if they are not clear about the operation of
              this policy or whether their concern falls within the scope
              of this policy to request training or an information pack.
            </li>
          </ul>
        </>
      ),
    },
    {
      key: "privacy-policy",
      title: "Privacy Policy",
      content: (
        <>

          <h3 className="font-semibold mt-4">1. Introduction</h3>
          <p>
            Meta Extended Reality Ltd ("Meta XR", "we", "our" or "us")
            respects your privacy and is committed to protecting your
            personal data. This Privacy Policy explains how we collect, use,
            disclose, store and protect personal information when you visit
            our website, use our software, AI platforms, XR applications,
            mobile applications or interact with us.
          </p>

          <h3 className="font-semibold mt-4">2. Company Information</h3>
          <p>
            Company: Meta Extended Reality Ltd
            <br />
            Registered Address: 267 Argyll Avenue, Slough, England, SL1 4HE
            <br />
            Company Number: 13863637
            <br />
            Country: United Kingdom
            <br />
            Privacy Email:{" "}
            <a href="mailto:navjotkhaira@mxr.ai" className="underline">
              navjotkhaira@mxr.ai
            </a>
          </p>
          <p>
            <span className="font-medium">Data Compliance:</span> As a small
            organisation whose core activities do not involve large-scale
            systematic tracking or large-scale special category data
            storage, we do not require a formally designated Data Protection
            Officer (DPO) under UK GDPR Article 37. Our internal Data
            Privacy Team directly manages all data compliance workflows and
            rights requests.
          </p>

          <h3 className="font-semibold mt-4">3. Scope</h3>
          <p>
            This policy applies to our website, customer portals, SaaS
            platforms, AI services, AR/VR/MR applications, mobile apps,
            software products, support services, marketing activities,
            recruitment and business relationships.
          </p>

          <h3 className="font-semibold mt-4">4. Personal Data We Collect</h3>
          <p>
            We may collect: names, contact details, organisation details,
            login credentials, billing details, device information, IP
            address, browser information, cookies, support requests, product
            usage information, event registrations and any information you
            voluntarily provide. Payment card details are processed by
            authorised payment providers and are not stored by us.
          </p>

          <h3 className="font-semibold mt-4">5. How We Collect Information</h3>
          <p>
            We collect information directly from you, automatically through
            your use of our services, from cookies and analytics
            technologies, and from trusted business partners or publicly
            available sources where permitted by law.
          </p>

          <h3 className="font-semibold mt-4">6. How We Use Your Information</h3>
          <p>
            We use personal data to provide and improve our services,
            create and manage accounts, deliver customer support, process
            payments, communicate with you, maintain security, comply with
            legal obligations, develop new products, conduct analytics and
            administer our business.
          </p>

          <h3 className="font-semibold mt-4">7. Lawful Basis</h3>
          <p>
            We process personal data under UK GDPR using one or more
            lawful bases including: performance of a contract, legitimate
            interests, legal obligation, consent and, where applicable,
            vital interests.
          </p>

          <h3 className="font-semibold mt-4">8. AI and XR Services</h3>
          <p>
            Some MXR products use artificial intelligence, speech
            recognition, computer vision or extended reality technologies.
            Where these features process personal data, they are used only
            for providing requested functionality, improving user
            experience or delivering contracted services. We use
            open-source data in avatars and localised trained models with
            customer-related agreed data.
          </p>

          <h3 className="font-semibold mt-4">9. Cookies and Analytics</h3>
          <p>
            Our website uses essential cookies to operate correctly and may
            use analytics cookies to understand website performance.
            Non-essential cookies will only be used where required consent
            has been obtained. Please refer to our Cookie Policy (above) for
            further details.
          </p>

          <h3 className="font-semibold mt-4">10. Sharing Personal Data</h3>
          <p>
            We may share personal information with carefully selected
            service providers such as cloud hosting providers, payment
            processors, email providers, CRM platforms and IT support
            providers. We require these providers to protect personal data
            and only process it on our instructions where applicable. We do
            not sell personal data.
          </p>

          <h3 className="font-semibold mt-4">11. International Transfers</h3>
          <p>
            If personal data is transferred outside the United Kingdom,
            appropriate safeguards such as the UK International Data
            Transfer Agreement, adequacy regulations or other lawful
            transfer mechanisms will be implemented.
          </p>

          <h3 className="font-semibold mt-4">12. Data Security</h3>
          <p>
            We implement technical and organisational measures including
            encryption where appropriate, secure authentication,
            role-based access controls, backups, monitoring, vulnerability
            management and staff awareness training to protect personal
            information.
          </p>

          <h3 className="font-semibold mt-4">13. Data Retention</h3>
          <p>
            We retain personal data only for as long as necessary to
            fulfil the purposes described in this policy, satisfy
            contractual obligations and comply with legal or regulatory
            requirements. Internal retention schedules define specific
            retention periods for different categories of information.
          </p>

          <h3 className="font-semibold mt-4">14. Your Rights</h3>
          <p>
            You have the right to request access, rectification, erasure,
            restriction, portability, objection to processing and
            withdrawal of consent where applicable. Requests should be sent
            to{" "}
            <a href="mailto:navjotkhaira@mxr.ai" className="underline">
              navjotkhaira@mxr.ai
            </a>
            . We will ask you to verify your identity before responding.
          </p>

          <h3 className="font-semibold mt-4">15. Children's Privacy</h3>
          <p>
            Our core services, software platforms, and XR software
            packages are directed at corporate entities and adults. They
            are not intended for use by children. We do not knowingly
            collect data from children under the age of 13. If we discover
            that any personal data from an individual under 13 has been
            collected without verifiable parental authorization, it will be
            deleted immediately from our infrastructure.
          </p>

          <h3 className="font-semibold mt-4">16. Third-Party Websites</h3>
          <p>
            Our website or applications may contain links to third-party
            websites. We are not responsible for their privacy practices
            and encourage you to review their privacy policies.
          </p>

          <h3 className="font-semibold mt-4">17. Changes to This Policy</h3>
          <p>
            We may update this Privacy Policy from time to time. The
            latest version will always be published on our website with
            the updated revision date.
          </p>

          <h3 className="font-semibold mt-4">18. Contact and Complaints</h3>
          <p>
            For privacy enquiries contact:
            <br />
            Privacy Team
            <br />
            Meta Extended Reality Ltd
            <br />
            267 Argyll Avenue, Slough, England, SL1 4HE
            <br />
            <a href="mailto:navjotkhaira@mxr.ai" className="underline">
              navjotkhaira@mxr.ai
            </a>
          </p>
          <p>
            If you are dissatisfied with how we handle your personal data,
            you have the right to lodge a complaint with the UK Information
            Commissioner's Office (ICO).
          </p>

          <h3 className="font-semibold mt-4">
            Appendix A – Typical Categories of Personal Data
          </h3>
          <DataTable
            headers={["Category", "Example", "Purpose", "Retention"]}
            rows={[
              ["Identity", "Full name, user ID, profile picture, Meta account credentials.", "Account creation, identity verification, cross-platform profiles, and user authentication.", "For the duration of the active account lifecycle, plus 30 days following a deletion request."],
              ["Contact", "Email address, mobile phone number, billing address.", "Transaction receipts, service alerts, policy updates, and identity recovery.", "For the duration of the active account lifecycle, plus 30 days following a deletion request."],
              ["Technical & Telemetry", "IP address, device serial number, OS version, Wi-Fi signal strength, error logs.", "System performance optimization, security monitoring, crash reporting, and regional access control.", "Standard system logs are automatically deleted or fully anonymized after 180 days."],
              ["Support", "Customer helpdesk tickets, chat logs, diagnostic files, hardware RMA records.", "Troubleshooting technical issues, resolving billing disputes, and product safety reviews.", "3 years from the closure of the support ticket, unless required longer for legal claims."],
              ["Marketing", "Opt-in preferences, ad engagement logs, promotional email clicks.", "Delivery of personalized newsletters, localized event invitations, and tailored app recommendations.", "Retained until consent is withdrawn (immediate suppression upon user opt-out)."],
              ["Spatial & Environmental Data (AI-Generated)", "Raw camera feeds, point clouds, 3D room layouts, physical boundary dimensions.", "On-Device AI: Obstacle avoidance, inside-out tracking, and environmental depth mapping.", "Raw video/imagery is deleted instantly. Calculated spatial point clouds remain local to the device."],
              ["Biometric Inputs & Models (AI-Generated)", "Numerical tracking models of hand gestures, body posture, and eye movement.", "On-Device AI: Real-time avatar animation, hands-free UI navigation, and gaze-directed rendering.", "Raw infrared and camera data is deleted instantly on-device. Abstract mathematical tracking models are wiped upon powering down the headset."],
              ["Multimodal Vision Data (AI-Generated)", "Cloud-transmitted camera frames of real-world objects or text.", "Cloud AI: Visual search processing, real-time translations, and AI-driven object description.", "Automatically anonymized and decoupled from user IDs immediately after processing. Deleted within 30 days."],
              ["Voice & Audio Logs (AI-Generated)", "Voice command audio recordings, transcription text, ambient noise maps.", 'Cloud AI: Processing natural language commands (e.g., "Hey Meta") and training speech recognition.', "Text transcripts are saved to the account profile. Audio voice recordings are automatically deleted within 30 days by default."],
            ]}
          />
        </>
      ),
    },
    {
      key: "security-policy",
      title: "Security Policy",
      content: (
        <>
          <h3 className="font-semibold mt-4">1. Introduction</h3>
          <p>
            The Information Security Policy states the types and levels of
            security over the information technology resources and
            capabilities that must be established and operated in order for
            those items to be considered secure. The information can be
            gathered in one or more documents.
          </p>
          <p>
            You can structure policies in as many sections as you identify
            as valid in your organization. In the example below, sections
            have been selected according to best practices and our
            experience. You may include more sections as far as you detect
            more technologies in your company to be addressed with specific
            policies. Sections have been written all together in one
            document. You may as well separate them into independent policy
            documents for easier managing, e.g. one for Email policies,
            other for Internet policies and so on.
          </p>

          <h4 className="font-medium mt-3">1.1 Purpose</h4>
          <p>
            This Security Policy document is aimed to define the security
            requirements for the proper and secure use of the Information
            Technology services in the Organization. Its goal is to protect
            the Organization and users to the maximum extent possible
            against security threats that could jeopardize their integrity,
            privacy, reputation and business outcomes.
          </p>

          <h4 className="font-medium mt-3">1.2 Scope</h4>
          <p>
            This document applies to all the users in the Organization,
            including temporary users, visitors with temporary access to
            services and partners with limited or unlimited access time to
            services. Compliance with policies in this document is
            mandatory for this constituency.
          </p>

          <h4 className="font-medium mt-3">1.3 History</h4>
          <p>
            This section of the Security Policy is aimed to check the life
            time of a specific version of the whole document. In case you
            separate into several policy documents, ensure there is a
            version history for each one of them. Policies must be reviewed
            and eventually updated periodically to keep up with changes in
            risks, technologies and regulations.
          </p>
          <DataTable
            headers={["Version", "Description", "From", "To"]}
            rows={[["1.0", "Initial version", "1/1/2026", "31/12/2026"]]}
          />

          <h4 className="font-medium mt-3">1.4 Responsibilities</h4>
          <DataTable
            headers={["Roles", "Responsibilities"]}
            rows={[
              ["Chief Information Officer", "• Accountable for all aspects of the Organization's information security."],
              ["Information Security Officer", "• Responsible for the security of the IT infrastructure.\n• Plan against security threats, vulnerabilities, and risks.\n• Implement and maintain Security Policy documents.\n• Ensure security training programs.\n• Ensure IT infrastructure supports Security Policies.\n• Respond to information security incidents.\n• Help in disaster recovery plans."],
              ["Information Owners", "• Help with the security requirements for their specific area.\n• Determine the privileges and access rights to the resources within their areas."],
              ["IT Security Team", "• Implements and operates IT security.\n• Implements the privileges and access rights to the resources.\n• Supports Security Policies."],
              ["Users", "• Meet Security Policies.\n• Report any attempted security breaches."],
            ]}
          />

          <h4 className="font-medium mt-3">1.5 General Policy Definitions</h4>
          <p>
            You may structure the policies inside this section in
            subcategories if you think it contributes to the clarity of the
            document.
          </p>
          <ol className="list-decimal pl-6 space-y-1">
            <li>Exceptions to the policies defined in any part of this document may only be authorized by the Information Security Officer. In those cases, specific procedures may be put in place to handle request and authorization for exceptions.</li>
            <li>Every time a policy exception is invoked, an entry must be entered into a security log specifying the date and time, description, reason for the exception and how the risk was managed.</li>
            <li>All the IT services should be used in compliance with the technical and security requirements defined in the design of the services.</li>
            <li>Infractions of the policies in this document may lead to disciplinary actions. In some serious cases they could even led to prosecution.</li>
          </ol>

          <h3 className="font-semibold mt-4">2. IT Assets Policy</h3>

          <h4 className="font-medium mt-3">2.1 Purpose</h4>
          <p>
            The IT Assets Policy section defines the requirements for the
            proper and secure handling of all the IT assets in the
            Organization.
          </p>

          <h4 className="font-medium mt-3">2.2 Scope</h4>
          <p>
            The policy applies to desktops, laptops, printers and other
            equipment, to applications and software, to anyone using those
            assets including internal users, temporary workers and
            visitors, and in general to any resource and capabilities
            involved in the provision of the IT services.
          </p>

          <h4 className="font-medium mt-3">2.3 Policy Definitions</h4>
          <ol className="list-decimal pl-6 space-y-1">
            <li>IT assets must only be used in connection with the business activities they are assigned and / or authorized.</li>
            <li>All the IT assets must be classified into one of the categories in the Organization's security categories; according to the current business function they are assigned to.</li>
            <li>Every user is responsible for the preservation and correct use of the IT assets they have been assigned.</li>
            <li>All the IT assets must be in locations with security access restrictions, environmental conditions and layout according to the security classification and technical specifications of the aforementioned assets.</li>
            <li>Active desktop and laptops must be secured if left unattended. Whenever possible, this policy should be automatically enforced.</li>
            <li>Access to assets is forbidden for non-authorized personnel. Granting access to the assets involved in the provision of a service must be done through the approved Service Request Management and Access Management processes.</li>
            <li>All personnel interacting with the IT assets must have the proper training.</li>
            <li>Users shall maintain the assets assigned to them clean and free of accidents or improper use. They shall not drink or eat near the equipment.</li>
            <li>Access to assets in the Organization location must be restricted and properly authorized, including those accessing remotely. Company's laptops, PDAs and other equipment used at external location must be periodically checked and maintained.</li>
            <li>The IT Technical Teams are the sole responsible for maintaining and upgrading configurations. None other users are authorized to change or upgrade the configuration of the IT assets. That includes modifying hardware or installing software.</li>
            <li>Special care must be taken for protecting laptops, PDAs and other portable assets from being stolen. Be aware of extreme temperatures, magnetic fields and falls.</li>
            <li>When travelling by plane, portable equipment like laptops and PDAs must remain in possession of the user as hand luggage.</li>
            <li>Whenever possible, encryption and erasing technologies should be implemented in portable assets in case they were stolen.</li>
            <li>Losses, theft, damages, tampering or other incident related to assets that compromises security must be reported as soon as possible to the Information Security Officer.</li>
            <li>Disposal of the assets must be done according to the specific procedures for the protection of the information. Assets storing confidential information must be physically destroyed in the presence of an Information Security Team member. Assets storing sensitive information must be completely erased in the presence of an Information Security Team member before disposing.</li>
          </ol>

          <h3 className="font-semibold mt-4">3. Access Control Policy</h3>
          <p>
            This section of the Security Policy lists policies for securing
            access control.
          </p>

          <h4 className="font-medium mt-3">3.1 Purpose</h4>
          <p>
            The Access Control Policy section defines the requirements for
            the proper and secure control of access to IT services and
            infrastructure in the Organization.
          </p>

          <h4 className="font-medium mt-3">3.2 Scope</h4>
          <p>
            This policy applies to all the users in the Organization,
            including temporary users, visitors with temporary access to
            services and partners with limited or unlimited access time to
            services.
          </p>

          <h4 className="font-medium mt-3">3.3 Policy Definitions</h4>
          <ol className="list-decimal pl-6 space-y-1">
            <li>Any system that handles valuable information must be protected with a password-based access control system.</li>
            <li>Any system that handles confidential information must be protected by a two factor -based access control system.</li>
            <li>Discretionary access control list must be in place to control the access to resources for different groups of users.</li>
            <li>Mandatory access controls should be in place to regulate access by process operating on behalf of users.</li>
            <li>Access to resources should be granted on a per-group basis rather than on a per-user basis.</li>
            <li>Access shall be granted under the principle of "less privilege", i.e., each identity should receive the minimum rights and access to resources needed for them to be able to perform successfully their business functions.</li>
            <li>Whenever possible, access should be granted to centrally defined and centrally managed identities.</li>
            <li>Users should refrain from trying to tamper or evade the access control in order to gain greater access than they are assigned.</li>
            <li>Automatic controls, scan technologies and periodic revision procedures must be in place to detect any attempt made to circumvent controls.</li>
          </ol>

          <h3 className="font-semibold mt-4">4. Password Control Policy</h3>
          <p>
            This section of the Security Policy lists policies for securing
            password control.
          </p>

          <h4 className="font-medium mt-3">4.1 Purpose</h4>
          <p>
            The Password Control Policy section defines the requirements
            for the proper and secure handling of passwords in the
            Organization.
          </p>

          <h4 className="font-medium mt-3">4.2 Scope</h4>
          <p>
            This policy applies to all the users in the Organization,
            including temporary users, visitors with temporary access to
            services and partners with limited or unlimited access time to
            services.
          </p>

          <h4 className="font-medium mt-3">4.3 Policy Definitions</h4>
          <ol className="list-decimal pl-6 space-y-1">
            <li>Any system that handles valuable information must be protected with a password-based access control system.</li>
            <li>Every user must have a separate, private identity for accessing IT network services.</li>
            <li>Identities should be centrally created and managed. Single sign-on for accessing multiple services is encouraged.</li>
            <li>Each identity must have a strong, private, alphanumeric password to be able to access any service. They should be as least 8 characters long.</li>
            <li>Each regular user may use the same password for no more than 90 days and no less than 3 days. The same password may not be used again for at least one year.</li>
            <li>Password for some special identities will not expire. In those cases, password must be at least 15 characters long.</li>
            <li>Use of administrative credentials for non-administrative work is discouraged. IT administrators must have two set of credentials: one for administrative work and the other for common work.</li>
            <li>Sharing of passwords is forbidden. They should not be revealed or exposed to public sight.</li>
            <li>Whenever a password is deemed compromised, it must be changed immediately.</li>
            <li>For critical applications, digital certificates and multiple factor authentication using smart cards should be used whenever possible.</li>
            <li>Identities must be locked if password guessing is suspected on the account.</li>
          </ol>

          <h3 className="font-semibold mt-4">5. Email Policy</h3>
          <p>
            This section of the Security Policy lists policies for the
            secure handling of electronic mail.
          </p>

          <h4 className="font-medium mt-3">5.1 Purpose</h4>
          <p>
            The Email Policy section defines the requirements for the
            proper and secure use of electronic mail in the Organization.
          </p>

          <h4 className="font-medium mt-3">5.2 Scope</h4>
          <p>
            This policy applies to all the users in the Organization,
            including temporary users, visitors with temporary access to
            services and partners with limited or unlimited access time to
            services.
          </p>

          <h4 className="font-medium mt-3">5.3 Policy Definitions</h4>
          <ol className="list-decimal pl-6 space-y-1">
            <li>All the assigned email addresses, mailbox storage and transfer links must be used only for business purposes in the interest of the Organization. Occasional use of personal email address on the Internet for personal purpose may be permitted if in doing so there is no perceptible consumption in the Organization system resources and the productivity of the work is not affected.</li>
            <li>Use of the Organization resources for non-authorized advertising, external business, spam, political campaigns, and other uses unrelated to the Organization business is strictly forbidden.</li>
            <li>In no way may the email resources be used to reveal confidential or sensitive information from the Organization outside the authorized recipients for this information.</li>
            <li>Using the email resources of the Organization for disseminating messages regarded as offensive, racist, obscene or in any way contrary to the law and ethics is absolutely discouraged.</li>
            <li>Use of the Organization email resources is maintained only to the extent and for the time is needed for performing the duties. When a user ceases his/her relationship with the company, the associated account must be deactivated according to established procedures for the lifecycle of the accounts.</li>
            <li>Users must have private identities to access their emails and individual storage resources, except specific cases in which common usage may be deemed appropriated.</li>
            <li>Privacy is not guaranteed. When strongest requirements for confidentiality, authenticity and integrity appear, the use of electronically signed messages is encouraged. However, only the Information Security Officer may approve the interception and disclosure of messages.</li>
            <li>Identities for accessing corporate email must be protected by strong passwords. The complexity and lifecycle of passwords are managed by the company's procedures for managing identities. Sharing of passwords is discouraged. Users should not impersonate another user.</li>
            <li>Outbound messages from corporate users should have approved signatures at the foot of the message.</li>
            <li>Attachments must be limited in size according to the specific procedures of the Organization. Whenever possible, restrictions should be automatically enforced.</li>
            <li>Whenever possible, the use of Digital Rights technologies is encouraged for the protection of contents.</li>
            <li>Scanning technologies for virus and malware must be in place in client PCs and servers to ensure the maximum protection in the ingoing and outgoing email.</li>
            <li>Security incidents must be reported and handled as soon as possible according to the Incident Management and Information Security processes. Users should not try to respond by themselves to security attacks.</li>
            <li>Corporate mailboxes content should be centrally stored in locations where the information can be backed up and managed according to company procedures. Purge, backup and restore must be managed according to the procedures set for the IT Continuity Management.</li>
          </ol>

          <h3 className="font-semibold mt-4">6. Internet Policy</h3>

          <h4 className="font-medium mt-3">6.1 Purpose</h4>
          <p>
            The Internet Policy section defines the requirements for the
            proper and secure access to Internet.
          </p>

          <h4 className="font-medium mt-3">6.2 Scope</h4>
          <p>
            This policy applies to all the users in the Organization,
            including temporary users, visitors with temporary access to
            services and partners with limited or unlimited access time to
            services.
          </p>

          <h4 className="font-medium mt-3">6.3 Policy Definitions</h4>
          <ol className="list-decimal pl-6 space-y-1">
            <li>Limited access to Internet is permitted for all users.</li>
            <li>The use of Messenger service is permitted for business purposes.</li>
            <li>Access to pornographic sites, hacking sites, and other risky sites is strongly discouraged.</li>
            <li>Downloading is a privilege assigned to some users. It can be requested as a service.</li>
            <li>Internet access is mainly for business purpose. –some limited personal navigation is permitted if in doing so there is no perceptible consumption of the Organization system resources and the productivity of the work is not affected. Personal navigation is discouraged during working hours.</li>
            <li>Inbound and outbound traffic must be regulated using firewalls in the perimeter. Back to back configuration is strongly recommended for firewalls.</li>
            <li>In accessing Internet, users must behave in a way compatible with the prestige of the Organization. Attacks like denial of service, spam, fishing, fraud, hacking, distribution of questionable material, infraction of copyrights and others are strictly forbidden.</li>
            <li>Internet traffic should be monitored at firewalls. Any attack or abuse should be promptly reported to the Information Security Officer.</li>
            <li>Reasonable measures must be in place at servers, workstations and equipment for detection and prevention of attacks and abuse. They include firewalls, intrusion detection and others.</li>
          </ol>

          <h3 className="font-semibold mt-4">7. Antivirus Policy</h3>
          <p>
            This section of the Security Policy lists policies for the
            implementation of anti-virus and other forms of protection.
          </p>

          <h4 className="font-medium mt-3">7.1 Purpose</h4>
          <p>
            The Antivirus Policy section defines the requirements for the
            proper implementation of antivirus and other forms of
            protection in the Organization.
          </p>

          <h4 className="font-medium mt-3">7.2 Scope</h4>
          <p>
            This policy applies to servers, workstations and equipment in
            the Organization, including portable devices like laptops and
            PDA that may travel outside of the Organization facilities.
            Some policies apply to external computers and devices accessing
            the resources of the Organization.
          </p>

          <h4 className="font-medium mt-3">7.3 Policy Definitions</h4>
          <ol className="list-decimal pl-6 space-y-1">
            <li>Information owners must ensure the security of their information and the systems that support it.</li>
            <li>Information Security Management is responsible for ensuring the confidentiality, integrity and availability of the Organization's assets, information, data and IT services.</li>
            <li>Any breach must be reported immediately to the Information Security Officer. If needed, the appropriate countermeasures must be activated to assess and control damages.</li>
            <li>Information in the Organization is classified according to its security impact. The current categories are: confidential, sensitive, shareable, public and private.</li>
            <li>Information defined as confidential has the highest level of security. Only a limited number of persons must have access to it. Management, access and responsibilities for confidential information must be handled with special procedures defined by Information Security Management.</li>
            <li>Information defined as sensitive must be handled by a greater number of persons. It is needed for the daily performing of jobs duties, but should not be shared outside of the scope needed for the performing of the related function.</li>
            <li>Information defined as shareable can be shared outside of the limits of the Organization, for those clients, organizations, regulators, etc. who acquire or should get access to it.</li>
            <li>Information defined as public can be shared as public records, e.g. content published in the company's public Web Site.</li>
            <li>Information deemed as private belongs to individuals who are responsible for the maintenance and backup.</li>
            <li>Information is classified jointly by the Information Security Officer and the Information Owner.</li>
          </ol>

          <h3 className="font-semibold mt-4">8. Remote Access Policy</h3>
          <p>
            This section of the Security Policy lists policies for the
            secure remote access to the organization's internal resources.
          </p>

          <h4 className="font-medium mt-3">8.1 Purpose</h4>
          <p>
            The Remote Access Policy section defines the requirements for
            the secure remote access to the Organization's internal
            resources.
          </p>

          <h4 className="font-medium mt-3">8.2 Scope</h4>
          <p>
            This policy applies to the users and devices that need access
            the Organization's internal resources from remote locations.
          </p>

          <h4 className="font-medium mt-3">8.3 Policy Definitions</h4>
          <ol className="list-decimal pl-6 space-y-1">
            <li>To gaining access to the internal resources from remote locations, users must have the required authorization. Remote access for an employee, external user or partner can be requested only by the Manager responsible for the information and granted by Access Management.</li>
            <li>Only secure channels with mutual authentication between server and clients must be available for remote access. Both server and clients must receive mutually trusted certificates.</li>
            <li>Remote access to confidential information should not be allowed. Exception to this rule may only be authorized in cases where is strictly needed.</li>
            <li>Users must not connect from public computers unless the access is for viewing public content.</li>
          </ol>

          <h3 className="font-semibold mt-4">9. Outsourcing Policy</h3>
          <p>
            This section of the Security Policy lists policies for the
            outsourcing of IT services, functions and processes.
          </p>

          <h4 className="font-medium mt-3">9.1 Purpose</h4>
          <p>
            The Outsourcing Policy section defines the requirements needed
            to minimize the risks associated with the outsourcing of IT
            services, functions and processes.
          </p>

          <h4 className="font-medium mt-3">9.2 Scope</h4>
          <p>
            This policy applies to the Organization; the services providers
            to whom IT services, functions or processes are been
            outsourced, and the outsourcing process itself.
          </p>

          <h4 className="font-medium mt-3">9.3 Policy Definitions</h4>
          <ol className="list-decimal pl-6 space-y-1">
            <li>Before outsourcing any service, function or process, a careful strategy must be followed to evaluate the risk and financial implications.</li>
            <li>Whenever possible, a bidding process should be followed to select between several service providers.</li>
            <li>In any case, the service provider should be selected after evaluating their reputation, experience in the type of service to be provided, offers and warranties.</li>
            <li>Audits should be planned in advance to evaluate the performance of the service provider before and during the provision of the outsourced service, function or process. If the Organization has not enough knowledge and resources, a specialized company should be hired to do the auditing.</li>
            <li>A service contract and defined service levels must be agreed between the Organization and the service provider.</li>
            <li>The service provider must get authorization from the Organization if it intends to hire a third party to support the outsourced service, function or process.</li>
          </ol>

          <h3 className="font-semibold mt-4">10. Annex</h3>

          <h4 className="font-medium mt-3">10.1 Glossary</h4>
          <p>
            This section of the Security Policy provides the definitions of
            terms, acronyms, and abbreviations required to understand this
            document.
          </p>
          <DataTable
            headers={["Term", "Definition"]}
            rows={[
              ["Access Management", "The process responsible for allowing users to make use of IT services, data or other assets."],
              ["Asset", "Any resource or capability. The assets of a service provider include anything that could contribute to the delivery of a service."],
              ["Audit", "Formal inspection and verification to check whether a standard or set of guidelines is being followed, that records are accurate, or that efficiency and effectiveness targets are being met."],
              ["Confidentiality", "A security principle that requires that data should only be accessed by authorized people."],
              ["External Service Provider", "An IT service provider that is part of a different organization from its customer."],
              ["Identity", "A unique name that is used to identify a user, person or role."],
              ["Information Security Policy", "The policy that governs the organization's approach to information security management."],
              ["Outsourcing", "Using an external service provider to manage IT services."],
              ["Policy", "Formally documented management expectations and intentions. Policies are used to direct decisions, and to ensure consistent and appropriate development and implementation of processes, standards, roles, activities, IT infrastructure etc."],
              ["Risk", "A possible event that could cause harm or loss, or affect the ability to achieve objectives."],
              ["Service Level", "Measured and reported achievement against one or more service level targets."],
              ["Warranty", "Assurance that a product or service will meet agreed requirements."],
            ]}
          />
        </>
      ),
    },
    {
      key: "terms-of-sale",
      title: "Terms of Sale and Software Licensing Agreement",
      content: (
        <>
          <p>
            This Terms of Sale and Software Licensing Agreement (the
            "Agreement") governs the purchase, licensing, billing, and
            deployment of all software applications, extended reality (XR)
            platforms, and integrated Artificial Intelligence (AI) services
            provided by Meta Extended Reality Ltd ("Meta XR", "we", "us",
            or "our") to your business entity ("Client", "you", or "your").
            By signing an Order Form, accepting an invoice, or deploying
            our software, you agree to be bound by these terms.
          </p>

          <h3 className="font-semibold mt-4">
            1.1 Commercial Invoicing and Payment Terms
          </h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><span className="font-medium">Invoice Issuance:</span> Meta XR will issue electronic invoices for software licenses, setup fees, or subscription renewals as specified in your Order Form.</li>
            <li><span className="font-medium">Payment Due Date:</span> All corporate bank invoices must be settled in full within 30 days from the date of the invoice (Net 30) via BACS, CHAPS, or authorized bank wire transfer, unless a different payment term is explicitly stated on the invoice. All payments must be made in British Pounds (GBP) unless otherwise specified.</li>
            <li><span className="font-medium">Late Payments:</span> If an invoice remains unpaid after its due date, we reserve the right to charge interest on the overdue amount at a rate of 4% per annum above the Bank of England base rate, calculated daily from the final due date until payment is settled in full. You will also be responsible for all reasonable legal and debt collection costs incurred by us.</li>
          </ul>

          <h3 className="font-semibold mt-4">
            1.2 Restriction and Suspension of Services for Non-Payment
          </h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><span className="font-medium">Suspension Notice:</span> If any bank invoice remains unpaid for more than 14 days past its due date, Meta XR will issue a formal electronic suspension alert to your account administrator.</li>
            <li><span className="font-medium">Access Restriction:</span> If the outstanding balance is not settled within 7 calendar days from the date of the suspension notice, we reserve the right to automatically restrict, lock, or fully deactivate your corporate access to our SaaS portals, cloud AI processing systems, and XR headsets.</li>
            <li><span className="font-medium">Liability Waiver:</span> Meta XR accepts zero liability for any operational downtime, lost business data, or enterprise disruption suffered by your organization resulting from a software lock triggered by non-payment. Services will only be re-activated once all outstanding balances, late interest fees, and re-activation costs are paid in full.</li>
          </ul>

          <h3 className="font-semibold mt-4">
            1.3 Intellectual Property (IP) Protection and Ownership
          </h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><span className="font-medium">Reservation of Rights:</span> Meta XR retains full, exclusive, and absolute ownership of all intellectual property rights embedded within our services, including proprietary software code, custom on-device edge AI algorithms, trained machine learning model weights, spatial user interface designs, and text-to-3D asset generation systems.</li>
            <li><span className="font-medium">License Grant:</span> Subject to your timely payment of all issued invoices, Meta XR grants you a non-exclusive, non-transferable, revocable, time-limited business license to install and run our XR applications solely for your internal business operations.</li>
            <li><span className="font-medium">Explicit Restrictions:</span> You must not copy, modify, distribute, create derivative works of, sell, lease, or sub-license our software. Reverse engineering or attempting to extract our raw model weights, source code, or proprietary spatial tracking architecture is strictly prohibited and constitutes a material breach of contract.</li>
          </ul>
        </>
      ),
    },
    {
      key: "accessibility-statement",
      title: "Website Accessibility Statement",
      content: (
        <>
          <p>
            Meta Extended Reality Ltd is committed to ensuring digital
            accessibility for all visitors, including individuals with
            visual, motor, auditory, or cognitive impairments. We are
            continuously upgrading our website  (
            <a
              href="https://mxr.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-2 hover:underline"
            >
              https://mxr.ai
            </a>
            )  and online
            developer portals to align with the statutory requirements of
            the UK Equality Act 2010.
          </p>

          <h3 className="font-semibold mt-4">Our Accessibility Targets</h3>
          <p>
            We aim to ensure that our digital assets conform to the Web
            Content Accessibility Guidelines (WCAG) 2.2 Level AA standards.
            Our ongoing optimization roadmap includes:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li><span className="font-medium">Full Keyboard Navigability:</span> Structuring our customer portals and billing interfaces so they can be navigated completely without a mouse, using standard tab sequences and keyboard commands.</li>
            <li><span className="font-medium">Screen Reader Compatibility:</span> Adding comprehensive ARIA landmarks, page structural hierarchies, and explicit image alternative text (Alt Text) to allow text-to-speech software to translate our documentation clearly.</li>
            <li><span className="font-medium">Visual Adaptability:</span> Maintaining high colour contrast ratios between text layouts and backdrops, while ensuring our website content can be scaled up to 200% magnification without breaking page readability or alignment.</li>
            <li><span className="font-medium">Cognitive Clarity:</span> Presenting our software installation guidelines, financial processing tracking details, and compliance terms in clear, plain language accessible to global users.</li>
          </ul>

          <h3 className="font-semibold mt-4">Platform Specific Limitations</h3>
          <p>
            While we strive for absolute web accessibility, certain
            advanced core features of our Extended Reality (XR) software
            bundles and 3D spatial asset generation interfaces require
            high-performance spatial awareness and motor coordination. We
            are actively investigating alternative workflow mechanisms to
            maximize accessibility across our technical software packages.
          </p>

          <h3 className="font-semibold mt-4">
            Feedback and Contact Information
          </h3>
          <p>
            We welcome your input regarding the accessibility of our
            digital platforms. If you encounter any technical visibility or
            structural barriers while navigating MXR.AI, please contact our
            internal team directly:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <span className="font-medium">Email:</span>{" "}
              <a href="mailto:navjotkhaira@mxr.ai" className="underline">
                navjotkhaira@mxr.ai
              </a>{" "}
              (Attn: Digital Accessibility Desk)
            </li>
            <li>
              <span className="font-medium">Postal Address:</span> Meta
              Extended Reality Ltd, 267 Argyll Avenue, Slough, England, SL1
              4HE
            </li>
          </ul>
          <p>
            We review all accessibility inquiries and aim to provide an
            alternative format or technical solution within 10 business
            days.
          </p>
        </>
      ),
    },
    {
      key: "carbon-reduction",
      title: t("carbon_policy_heading", "Carbon Reduction Policy Statement"),
      content: (
        <>

          <h3 className="font-semibold mt-4">
            {t("carbon_policy_intent_heading", "1. Statement of Intent")}
          </h3>
          <p>
            {t(
              "carbon_policy_intent_desc1",
              "Although Meta Extended Reality Ltd (MXR) operates as a micro-entity and falls below the statutory threshold for mandatory Procurement Policy Note (PPN) 06/21 carbon reporting, we are fully committed to reducing our environmental impact. As an organization specialized in information technology, data operations, and immersive virtual environments, we recognize that our primary carbon footprint stems from digital infrastructure, data storage, hardware lifecycles, and travel."
            )}
          </p>
          <p>
            {t(
              "carbon_policy_intent_desc2",
              "Our objective is to minimize our greenhouse gas (GHG) emissions and align our operations with the UK's national target of achieving Net Zero carbon emissions by 2050."
            )}
          </p>

          <h3 className="font-semibold mt-4">
            {t(
              "carbon_policy_action_heading",
              "2. Target Core Areas and Action Plan"
            )}
          </h3>

          {carbonSubsections.map((subsection) => (
            <div key={subsection.heading} className="mt-4">
              <h4 className="font-medium">{subsection.heading}</h4>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                {subsection.bullets.map((bullet) => (
                  <li key={bullet.title}>
                    <span className="font-medium">{bullet.title}:</span>{" "}
                    {bullet.desc}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <h3 className="font-semibold mt-4">
            {t(
              "carbon_policy_governance_heading",
              "3. Monitoring, Governance, and Accountability"
            )}
          </h3>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            {carbonGovernance.map((item) => (
              <li key={item.title}>
                <span className="font-medium">{item.title}:</span>{" "}
                {item.desc}
              </li>
            ))}
          </ul>

          <p className="mt-4 text-sm text-gray-500">
            {t("carbon_policy_approved_by", "Approved by the Board of Directors")}
            : Pouname Khaira, Managing Director — 21 June 2026
          </p>
        </>
      ),
    },
  ];

  return (
    <>
      <Header />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2 text-center">
            {t("policies_page_title", "Policies")}
          </h1>
          <p className="text-center text-gray-500 mb-12">
            Click a policy below to view its full details.
          </p>

          <Disclosure.Group selectedIndex={-1} className="box p-5">
            {policies.map((policy) => (
              <Disclosure>
                <Disclosure.Button className="text-xl">
                  {policy.title}
                </Disclosure.Button>
                <Disclosure.Panel className="text-gray-700 space-y-3">
                  {policy.content}
                </Disclosure.Panel>
              </Disclosure>
            ))}
          </Disclosure.Group>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default PoliciesPage;
