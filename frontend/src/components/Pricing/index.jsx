import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Check, Star, Zap, Building, Crown, Loader2 } from "lucide-react";
import ConfirmModal from "../ui/ConfirmModal";
import { useToast } from "../hooks/useToast";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const Pricing = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelingSubscription, setCancelingSubscription] = useState(false);
  const { showToast, ToastComponent } = useToast();
  const baseURL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    fetchPlans();
    fetchUserInfo();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("canceled") === "true") {
      setError("Payment was canceled. You can try again anytime.");

      setTimeout(() => {
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
        setError(null);
      }, 3000);
    }
  }, []);

  const handleCancelSubscription = async () => {
    try {
      setCancelingSubscription(true);
      setError(null);

      const response = await fetch(
        `${baseURL}/api/payments/cancel-subscription`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setShowCancelModal(false);

        await fetchUserInfo();

        showToast(
          "Subscription canceled successfully. You are now on the free plan.",
          "success"
        );
      } else {
        setError(data.error || "Failed to cancel subscription");
        setShowCancelModal(false);

        showToast("Failed to cancel subscription", "error");
      }
    } catch (error) {
      console.error("Cancel subscription error:", error);
      setError("Failed to cancel subscription");
      setShowCancelModal(false);
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setCancelingSubscription(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${baseURL}/api/payments/plans`);
      const data = await response.json();

      if (data.success) {
        setPlans(data.data.plans);
      } else {
        setError("Failed to load plans");
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
      setError(
        "Failed to connect to server. Make sure backend is running on port 5000."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchUserInfo = async () => {
    try {
      if (!token) return;

      const response = await fetch(`${baseURL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Токен истек или недействителен
          localStorage.removeItem("authToken");
          window.location.href = "/login";
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setUserInfo(data.data.user);
      } else {
        console.error("Failed to fetch user info:", data.error);
      }
    } catch (error) {
      console.error("Error fetching user info:", error);

      if (error.message.includes("401") || error.message.includes("token")) {
        localStorage.removeItem("authToken");
      }
    }
  };

  const handleUpgrade = async (priceId, planId) => {
    try {
      setProcessingPlan(planId);
      setError(null);

      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("Please login first");
        setProcessingPlan(null);
        return;
      }

      const response = await fetch(
        `${baseURL}/api/payments/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            priceId,
            planId,
          }),
        }
      );

      const contentType = response.headers.get("content-type");

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;

        try {
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } else {
            // ✅ Читаем как текст, если не JSON
            const errorText = await response.text();
            console.log("❌ Server response:", errorText.substring(0, 500));
            errorMessage = `Server error: ${response.status}`;
          }
        } catch (parseError) {
          console.error("❌ Error parsing response:", parseError);
          errorMessage = `Server error: ${response.status}`;
        }

        throw new Error(errorMessage);
      }

      // ✅ Проверяем content-type для успешного ответа
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error("❌ Expected JSON, got:", textResponse.substring(0, 200));
        throw new Error("Server returned invalid response format");
      }

      const data = await response.json();
      console.log("✅ Response data:", data);

      if (data.success) {
        const stripe = await stripePromise;

        if (!stripe) {
          throw new Error("Stripe failed to load");
        }

        const { error } = await stripe.redirectToCheckout({
          sessionId: data.data.sessionId,
        });

        if (error) {
          console.error("❌ Stripe redirect error:", error);
          const errorMessage = error.message || error.code || "Payment failed";
          setError("Payment failed: " + errorMessage);
        }
      } else {
        setError(data.error || "Failed to create checkout session");
      }
    } catch (error) {
      let errorMessage = "Something went wrong";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error && error.message) {
        errorMessage = error.message;
      } else if (error && error.error) {
        errorMessage = error.error;
      }

      if (errorMessage.includes("btoa") || errorMessage.includes("Latin1")) {
        errorMessage = "Encoding error. Please try refreshing the page.";
      }

      setError(errorMessage);
    } finally {
      setProcessingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading plans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Create amazing content with AI-powered scripts, voiceovers, and
            thumbnails.
          </p>
        </div>

        {userInfo && (
          <div className="mb-8 bg-white border border-gray-200 rounded-lg p-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  <p className="font-medium text-gray-900">
                    Current Plan:{" "}
                    <span className="capitalize text-blue-600">
                      {userInfo.subscription}
                    </span>
                  </p>
                </div>
                <div className="text-sm text-gray-600 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="font-medium">Scripts:</span>{" "}
                    {userInfo.usage?.scriptsGenerated || 0}/
                    {userInfo.limits?.scriptsGenerated === -1
                      ? "∞"
                      : userInfo.limits?.scriptsGenerated || 0}
                  </div>
                  <div>
                    <span className="font-medium">Audio:</span>{" "}
                    {Math.floor((userInfo.usage?.audioGenerated || 0) / 1000)}k/
                    {userInfo.limits?.audioGenerated === -1
                      ? "∞"
                      : Math.floor(
                          (userInfo.limits?.audioGenerated || 0) / 1000
                        )}
                    k chars
                  </div>
                  <div>
                    <span className="font-medium">Thumbnails:</span>{" "}
                    {userInfo.usage?.thumbnailsGenerated || 0}/
                    {userInfo.limits?.thumbnailsGenerated === -1
                      ? "∞"
                      : userInfo.limits?.thumbnailsGenerated || 0}
                  </div>
                </div>
              </div>
              {userInfo.subscription !== "free" && (
                <div className="ml-4">
                  <button
                    onClick={() => setShowCancelModal(true)}
                    disabled={cancelingSubscription}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cancelingSubscription ? (
                      <div className="flex items-center">
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Canceling...
                      </div>
                    ) : (
                      "Cancel Subscription"
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4 max-w-2xl mx-auto">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white rounded-lg border-2 border-gray-200 hover:border-gray-300 shadow-sm p-6 relative transition-all">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gray-50 rounded-full">
                  <Crown className="w-8 h-8 text-gray-600" />
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Free Plan
              </h3>

              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">Free</span>
                <span className="text-gray-600">/forever</span>
              </div>

              <p className="text-gray-600 mb-6">
                Best for testing TubeHi risk-free
              </p>

              <ul className="text-left space-y-3 mb-6">
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-sm">3 scripts per month</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-sm">
                    10k characters audio generation
                  </span>
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-sm">5 thumbnails per month</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-sm">Basic AI voices</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-sm">Community support</span>
                </li>
              </ul>

              <button
                className="w-full py-3 px-4 bg-gray-600 text-white rounded-md transition-colors font-medium cursor-not-allowed"
                disabled
              >
                {userInfo?.subscription === "free"
                  ? "Current Plan"
                  : "Start Free"}
              </button>
            </div>
          </div>

          {/* Boost Plan */}
          <div className="bg-white rounded-lg border-2 border-blue-200 hover:border-blue-300 ring-2 ring-blue-200 shadow-sm p-6 relative transition-all">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                🔥 MOST POPULAR
              </span>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gray-50 rounded-full">
                  <Star className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Boost
              </h3>

              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">$16.58</span>
                <span className="text-gray-600">/month</span>
              </div>

              <div className="text-sm text-gray-500 mb-4">12 month · $199</div>

              <p className="text-gray-600 mb-6">
                Perfect for active content creators
              </p>

              <ul className="text-left space-y-3 mb-6">
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-sm">25 scripts per month</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-sm">
                    60k characters audio generation
                  </span>
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-sm">30 thumbnails per month</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-sm">All AI voices + HD export</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-sm">Priority support</span>
                </li>
              </ul>

              <button
                onClick={() => handleUpgrade("price_1ABC123def456ghi", "boost")}
                disabled={userInfo?.subscription === "boost"}
                className={`w-full py-3 px-4 text-white rounded-md transition-colors font-medium ${
                  userInfo?.subscription === "boost"
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {userInfo?.subscription === "boost"
                  ? "Current Plan"
                  : "Choose Plan"}
              </button>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="bg-white rounded-lg border-2 border-purple-200 hover:border-purple-300 shadow-sm p-6 relative transition-all">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gray-50 rounded-full">
                  <Zap className="w-8 h-8 text-purple-600" />
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Pro Plan
              </h3>

              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">$99</span>
                <span className="text-gray-600">/month</span>
              </div>

              <div className="text-sm text-gray-500 mb-4">
                12 month · $1,188
              </div>

              <p className="text-gray-600 mb-6">
                For professional creators and small teams
              </p>

              <ul className="text-left space-y-3 mb-6">
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-sm">100 scripts per month</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-sm">
                    200k characters audio generation
                  </span>
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-sm">100 thumbnails per month</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-sm">API access + analytics</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-sm">Priority support</span>
                </li>
              </ul>

              <button
                onClick={() => handleUpgrade("price_1S3PJBKGtjox6w5rdL90zKhC", "pro")}
                disabled={userInfo?.subscription === "pro"}
                className={`w-full py-3 px-4 text-white rounded-md transition-colors font-medium ${
                  userInfo?.subscription === "pro"
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                {userInfo?.subscription === "pro"
                  ? "Current Plan"
                  : "Choose Plan"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Frequently Asked Questions
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Can I change plans anytime?
                </h3>
                <p className="text-gray-600 text-sm">
                  Yes! You can upgrade or downgrade your plan at any time.
                  Changes take effect immediately.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  What payment methods do you accept?
                </h3>
                <p className="text-gray-600 text-sm">
                  We accept all major credit cards through our secure payment
                  processor Stripe.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  What happens if I exceed my limits?
                </h3>
                <p className="text-gray-600 text-sm">
                  You'll be notified when you're close to your limits. You can
                  upgrade your plan or wait for the next billing cycle.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Can I cancel anytime?
                </h3>
                <p className="text-gray-600 text-sm">
                  Yes! You can cancel your subscription at any time. You'll
                  continue to have access until the end of your billing period.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Need help choosing a plan?{" "}
            <a
              href="mailto:support@yourapp.com"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelSubscription}
        title="Cancel Subscription"
        message="Are you sure you want to cancel your subscription? You will be downgraded to the free plan immediately."
        confirmText={
          cancelingSubscription ? "Canceling..." : "Cancel Subscription"
        }
        cancelText="Keep Subscription"
        type="danger"
      />
      <ToastComponent />
    </div>
  );
};

export default Pricing;
