import React from "react";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { Dialog } from "@/components/Base/Headless";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  currentPlan,
}) => {
  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={() => {
        onClose();
      }}
    >
      <Dialog.Panel>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Upgrade Your Plan</h3>
              <button onClick={onClose} className="text-gray-500">
                <Lucide icon="X" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-bold text-primary">Professional Plan</h4>
                <p className="text-gray-600">$29/month</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Unlimited patient notes</li>
                  <li>Advanced analytics</li>
                  <li>Team collaboration</li>
                </ul>
                <Button className="mt-3 w-full bg-primary text-white">
                  Subscribe Now
                </Button>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-bold text-purple-600">Lifetime Access</h4>
                <p className="text-gray-600">$299 (one-time)</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Everything in Professional</li>
                  <li>Never pay again</li>
                  <li>Exclusive features</li>
                </ul>
                <Button className="mt-3 w-full bg-purple-600 text-white">
                  Get Lifetime Access
                </Button>
              </div>
            </div>

            <p className="mt-4 text-sm text-gray-500 text-center">
              Your current plan:{" "}
              <span className="capitalize">{currentPlan}</span>
            </p>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
};

export default SubscriptionModal;
