import React, { useState } from "react";
import Page from "../common/Page";
import Card from "../ui/Card";
import Button from "../ui/Button";

const PrivacyPolicyPage = () => {
  const [expandedSection, setExpandedSection] = useState(null);

  const sections = [
    {
      id: "collection",
      title: "Information Collection",
      summary: "What information we collect",
      content:
        "We collect only the necessary information required to provide our services, including usage data and technical information about your device.",
    },
    {
      id: "usage",
      title: "Use of Information",
      summary: "How we use your information",
      content:
        "The collected information is used to improve service quality, personalize user experience, and ensure security.",
    },
    {
      id: "sharing",
      title: "Sharing Information",
      summary: "When we share your information",
      content:
        "We do not sell or transfer your personal information to third parties without your consent, except as required by law.",
    },
    {
      id: "security",
      title: "Data Security",
      summary: "How we protect your data",
      content:
        "We apply modern encryption and data protection methods to ensure the security of your information.",
    },
  ];

  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <Page
      title="Privacy Policy - VideoEditor"
      description="Learn how we protect and use your personal information"
    >
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Privacy Policy</h1>
          <p className="text-gray-600">
            We take the protection of your privacy seriously
          </p>
        </div>

        <Card className="bg-green-50 border-green-200">
          <div className="flex items-start space-x-3">
            <div className="text-green-500 text-xl">🔒</div>
            <div>
              <h3 className="font-semibold text-green-800 mb-2">
                Your Data is Secure
              </h3>
              <p className="text-green-700 text-sm">
                We use SSL encryption and modern data protection methods to ensure
                the security of your information.
              </p>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          {sections.map((section) => (
            <Card key={section.id} className="transition-all duration-200">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection(section.id)}
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {section.title}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {section.summary}
                  </p>
                </div>
                <div className="text-gray-400">
                  {expandedSection === section.id ? "−" : "+"}
                </div>
              </div>

              {expandedSection === section.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-gray-700 leading-relaxed">
                    {section.content}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>

        <div className="text-center">
          <p className="text-gray-600 mb-6">
            Do you have any questions about privacy?
          </p>
          <Button variant="secondary">Contact Us</Button>
        </div>
      </div>
    </Page>
  );
};

export default PrivacyPolicyPage;