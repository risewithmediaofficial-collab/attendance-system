import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImg from "@/assets/logo.png";
import { apiJson } from "@/lib/api";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const token = searchParams.get("token");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setMessage("No verification token provided.");
        return;
      }

      try {
        const response = await apiJson(`/auth/verify-email?token=${encodeURIComponent(token)}`, {
          method: "GET",
        });

        if (response.success) {
          setStatus("success");
          setMessage("Email verified successfully! Redirecting to login...");
          setTimeout(() => navigate("/login"), 2000);
        } else {
          setStatus("error");
          setMessage(response.error || "Verification failed. Please try again.");
        }
      } catch (err) {
        setStatus("error");
        const errorMsg = err instanceof Error ? err.message : "Verification failed.";
        setMessage(
          errorMsg === "Invalid or expired verification token"
            ? "This verification link has expired. Please register again to receive a new link."
            : errorMsg
        );
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="min-h-screen p-3 md:p-6">
      <div className="app-scene mx-auto max-w-[1320px] min-h-[calc(100vh-1.5rem)] md:min-h-[calc(100vh-3rem)] flex items-center justify-center">
        <div className="app-bubble light h-24 w-24 left-1 top-20 md:h-36 md:w-36 md:left-8" />
        <div className="app-bubble dark h-24 w-24 left-0 bottom-16 md:h-32 md:w-32 md:left-4" />
        <div className="app-bubble dark h-24 w-24 right-16 top-8 md:h-28 md:w-28 md:right-24" />
        <div className="app-bubble light h-24 w-24 right-2 bottom-14 md:h-36 md:w-36 md:right-8" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm"
        >
          <div className="glass-card rounded-3xl p-10 md:p-12 text-center">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-block mb-6"
            >
              <img
                src={logoImg}
                alt="Rise With Media"
                className="h-16 w-16 rounded-2xl mx-auto"
                style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}
              />
            </motion.div>

            {/* Status Icon and Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {status === "loading" && (
                <div className="space-y-4">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
                    <Loader2 className="h-12 w-12 mx-auto text-primary" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-foreground">Verifying Email</h2>
                  <p className="text-sm text-muted-foreground">Please wait while we verify your email address...</p>
                </div>
              )}

              {status === "success" && (
                <div className="space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
                  >
                    <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-green-600">Email Verified!</h2>
                  <p className="text-sm text-muted-foreground">{message}</p>
                  <div className="pt-4">
                    <Button onClick={() => navigate("/login")} className="w-full rounded-lg">
                      Go to Login
                    </Button>
                  </div>
                </div>
              )}

              {status === "error" && (
                <div className="space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
                  >
                    <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-red-600">Verification Failed</h2>
                  <p className="text-sm text-muted-foreground">{message}</p>
                  <div className="pt-4 space-y-2">
                    <Button onClick={() => navigate("/login")} className="w-full rounded-lg">
                      Back to Login
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/login", { state: { focusRegister: true } })}
                      className="w-full rounded-lg"
                    >
                      Register Again
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Info Text */}
            {status === "loading" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-xs text-muted-foreground mt-8"
              >
                This usually takes a few seconds...
              </motion.p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
