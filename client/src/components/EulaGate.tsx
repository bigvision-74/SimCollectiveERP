import React, { useEffect, useState } from "react";
import Dialog from "@/components/Base/Headless/Dialog";
import Button from "@/components/Base/Button";
import { FormCheck } from "@/components/Base/Form";

const EULA_VERSION = 2;
const STORAGE_PREFIX = "mxr_eula_accepted_";

interface StoredAcceptance {
  version: number;
  acceptedAt: string;
}

const EulaGate: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [confirmedTerms, setConfirmedTerms] = useState(false);
  const [confirmedDirectContract, setConfirmedDirectContract] = useState(false);

  useEffect(() => {
    const username = localStorage.getItem("user");
    if (!username) return;

    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${username}`);
      const stored: StoredAcceptance | null = raw ? JSON.parse(raw) : null;
      if (!stored || stored.version !== EULA_VERSION) {
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }
  }, []);

  const handleAccept = () => {
    const username = localStorage.getItem("user");
    if (username) {
      const record: StoredAcceptance = {
        version: EULA_VERSION,
        acceptedAt: new Date().toISOString(),
      };
      localStorage.setItem(`${STORAGE_PREFIX}${username}`, JSON.stringify(record));
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onClose={() => {}} staticBackdrop size="xl">
      <Dialog.Panel>
        <Dialog.Title>
          <h2 className="mr-auto text-base font-medium">
            Platform Terms &amp; End User Licence Agreement (EULA)
          </h2>
        </Dialog.Title>
        <Dialog.Description className="max-h-[65vh] overflow-y-auto space-y-3">
          <p className="text-sm text-gray-500">
            Please read and accept the updated terms below to access your
            account dashboard.
          </p>

          <p className="font-semibold">
            IMPORTANT LEGAL NOTICE TO ALL PLATFORM USERS
          </p>
          <p>
            This End User Licence Agreement ("EULA") is a legally binding
            contract between you (the "End User") and Meta Extended Reality
            Ltd ("MXR"), a corporation with its principal place of business
            at 267 Argyll Ave, Slough, United Kingdom. By ticking the
            acceptance boxes below and accessing the software platform, you
            unconditionally agree to be bound by these terms.
          </p>

          <h3 className="font-semibold mt-4">1. Licence Grant &amp; Access</h3>
          <p>
            MXR grants you a limited, non-exclusive, non-transferable,
            revocable licence to access and use the software platform and
            infrastructure solely for your internal business operations.
            You explicitly acknowledge that this software platform is
            licensed to you, not sold, and that you do not acquire any
            ownership stake, source code access, or proprietary rights in
            the platform asset.
          </p>

          <h3 className="font-semibold mt-4">
            2. Third-Party Resellers &amp; Billing Roles
          </h3>
          <p>
            If your access to this platform was originally facilitated,
            introduced, or invoiced by an authorised third-party reseller,
            sales agent, or transactional intermediary, you explicitly
            acknowledge and agree that your direct technical service and
            software hosting contract is held exclusively with MXR. Any
            independent financial, commercial, or invoicing disputes
            between you and a third-party intermediary do not alter your
            direct technical obligations to MXR, nor do they diminish MXR's
            legal status as your underlying software provider.
          </p>

          <h3 className="font-semibold mt-4">
            3. Intellectual Property &amp; Data Guardianship
          </h3>
          <p>
            All rights, title, and interest in and to the software
            platform—including its underlying source code, user databases,
            server architecture, digital infrastructure, and interface
            designs—remain the exclusive property of Meta Extended Reality
            Ltd. Under applicable data protection legislation (including UK
            GDPR and the Data Protection Act 2018), MXR operates as the
            sole Data Controller for the platform hosting environment. Your
            user profile data, historical system interactions, and
            databases are secured safely inside MXR's direct technical
            infrastructure.
          </p>

          <h3 className="font-semibold mt-4">
            4. Account Continuity &amp; Direct Migration
          </h3>
          <p>
            In the event that an authorised reseller fails to remit
            contractually agreed wholesale platform fees to MXR, or if
            MXR's commercial relationship with that reseller terminates for
            any reason whatsoever, MXR reserves the absolute right to
            secure your user data and seamlessly transition your platform
            account into a direct, MXR-managed support and billing
            structure. This mechanism is executed strictly to guarantee
            your business continuity of service, avoid operational
            downtime, and safeguard your live data environment.
          </p>

          <h3 className="font-semibold mt-4">
            5. Jurisdiction &amp; Governing Law
          </h3>
          <p>
            This EULA and any dispute or claim arising out of or in
            connection with it or its subject matter shall be governed by,
            and construed in accordance with, the laws of England and
            Wales. The Courts of England shall have exclusive jurisdiction
            to settle any disputes.
          </p>

          <div className="pt-2 space-y-3 border-t border-slate-200/60 dark:border-darkmode-400">
            <FormCheck className="items-start mt-3">
              <FormCheck.Input
                id="eula-checkbox-1"
                type="checkbox"
                className="mt-1"
                checked={confirmedTerms}
                onChange={(e) => setConfirmedTerms(e.target.checked)}
              />
              <FormCheck.Label htmlFor="eula-checkbox-1">
                I confirm I have read, understood, and accept the MXR End
                User Licence Agreement (EULA) and the{" "}
                <a
                  href="/policies"
                  target="_blank"
                  rel="noreferrer"
                  className="underline font-medium hover:opacity-80 transition"
                >
                  MXR Privacy &amp; GDPR Policy
                </a>{" "}
                written above.
              </FormCheck.Label>
            </FormCheck>
            <FormCheck className="items-start">
              <FormCheck.Input
                id="eula-checkbox-2"
                type="checkbox"
                className="mt-1"
                checked={confirmedDirectContract}
                onChange={(e) => setConfirmedDirectContract(e.target.checked)}
              />
              <FormCheck.Label htmlFor="eula-checkbox-2">
                I acknowledge that my software hosting contract is directly
                with Meta Extended Reality Ltd, independent of any
                third-party reseller invoicing.
              </FormCheck.Label>
            </FormCheck>
          </div>
        </Dialog.Description>
        <Dialog.Footer>
          <Button
            type="button"
            variant="primary"
            className="w-full"
            disabled={!confirmedTerms || !confirmedDirectContract}
            onClick={handleAccept}
          >
            Accept Terms and Enter Dashboard
          </Button>
        </Dialog.Footer>
      </Dialog.Panel>
    </Dialog>
  );
};

export default EulaGate;
