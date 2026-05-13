import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { forgotPassword, resetPassword } from "../features/auth/authSlice";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const STEPS = ["Email", "Verify OTP", "New Password"];

export default function ForgotPassword() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((s) => s.auth);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { toast.error("Enter a valid email address"); return; }
    const result = await dispatch(forgotPassword(email.trim().toLowerCase()));
    if (!result.error) { toast.success("OTP sent! Check your email inbox."); setStep(2); }
    else toast.error(result.payload || "Failed to send OTP");
  };

  const handleVerifyOTP = (e) => {
    e.preventDefault();
    if (otp.trim().length !== 6) { toast.error("Enter the 6-digit OTP"); return; }
    setStep(3);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    const result = await dispatch(resetPassword({ email, otp, newPassword }));
    if (!result.error) { setStep(4); }
    else {
      toast.error(result.payload || "Password reset failed");
      if (result.payload?.toLowerCase().includes("otp") || result.payload?.toLowerCase().includes("expired")) { setOtp(""); setStep(2); }
    }
  };

  const handleResendOTP = async () => {
    const result = await dispatch(forgotPassword(email.trim().toLowerCase()));
    if (!result.error) { toast.success("New OTP sent to your email!"); setOtp(""); }
    else toast.error(result.payload || "Failed to resend OTP");
  };

  const inputCls = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 outline-none focus:border-red-700 transition-colors box-border font-[inherit]";

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 md:p-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-6">
          <span className="text-3xl">🖨️</span>
          <div>
            <p className="text-red-700 font-black text-sm tracking-widest m-0">CLOUD GRAPHICS</p>
            <p className="text-gray-400 text-[9px] tracking-[4px] m-0">AMRAVATI</p>
          </div>
        </div>

        {step < 4 && (
          <>
            <h1 className="text-2xl font-black text-gray-900 mb-1">Forgot Password</h1>
            <p className="text-gray-400 text-sm mb-6">Reset your account password in 3 easy steps</p>

            {/* Step indicator */}
            <div className="flex items-center mb-7">
              {STEPS.map((label, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${step >= i + 1 ? "bg-red-700 text-white" : "bg-gray-200 text-gray-400"}`}>
                    {step > i + 1 ? "✓" : i + 1}
                  </div>
                  <span className={`text-xs whitespace-nowrap hidden sm:inline ${step >= i + 1 ? "text-red-700 font-bold" : "text-gray-300"}`}>{label}</span>
                  {i < STEPS.length - 1 && <div className={`w-6 md:w-8 h-0.5 mx-1 ${step > i + 1 ? "bg-red-700" : "bg-gray-200"}`} />}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Step 1: Email */}
        {step === 1 && (
          <form onSubmit={handleSendOTP} className="flex flex-col gap-4">
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm leading-relaxed">
              📧 Enter your registered email address and we'll send you a 6-digit OTP to reset your password.
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Email Address *</label>
              <input type="email" className={inputCls} placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3.5 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold text-sm border-none cursor-pointer transition-colors disabled:opacity-60">
              {loading ? "Sending OTP…" : "Send OTP →"}
            </button>
            <Link to="/login" className="block text-center text-red-700 font-semibold text-sm hover:underline">← Back to Login</Link>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4">
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm leading-relaxed">
              📨 A 6-digit OTP has been sent to <strong>{email}</strong>. Valid for 10 minutes.
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-600">Enter OTP *</label>
              <div className="flex gap-2.5 justify-center">
                {[0,1,2,3,4,5].map((i) => (
                  <input key={i} id={`fp-otp-${i}`} type="text" inputMode="numeric" maxLength={1}
                    className="w-11 text-center text-2xl font-black border-2 border-gray-200 rounded-xl outline-none focus:border-red-700 text-gray-900 box-border"
                    style={{ height: "52px" }}
                    value={otp[i] || ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/, "");
                      const arr = otp.split(""); arr[i] = val;
                      setOtp(arr.join("").slice(0, 6));
                      if (val && i < 5) document.getElementById(`fp-otp-${i + 1}`)?.focus();
                    }}
                    onKeyDown={(e) => { if (e.key === "Backspace" && !otp[i] && i > 0) document.getElementById(`fp-otp-${i - 1}`)?.focus(); }}
                  />
                ))}
              </div>
            </div>
            <button type="submit" disabled={otp.length < 6} className="w-full py-3.5 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold text-sm border-none cursor-pointer transition-colors disabled:opacity-50">
              Verify OTP →
            </button>
            <div className="flex items-center justify-center gap-2">
              <span className="text-gray-400 text-xs">Didn't receive it?</span>
              <button type="button" onClick={handleResendOTP} disabled={loading} className="bg-transparent border-none text-red-700 font-bold text-xs cursor-pointer hover:underline">
                {loading ? "Sending…" : "Resend OTP"}
              </button>
            </div>
            <button type="button" onClick={() => setStep(1)} className="block text-center text-red-700 font-semibold text-sm bg-transparent border-none cursor-pointer hover:underline">← Change Email</button>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm">✅ OTP verified! Now set your new password.</div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">New Password *</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} className={`${inputCls} pr-12`} placeholder="Min 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoFocus required />
                <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-base">{showPass ? "🙈" : "👁️"}</button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Confirm New Password *</label>
              <input type="password" className={`${inputCls} ${confirmPassword && confirmPassword !== newPassword ? "border-red-500" : ""}`}
                placeholder="Repeat new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              {confirmPassword && confirmPassword !== newPassword && <p className="text-red-600 text-xs font-semibold">Passwords do not match</p>}
            </div>
            <button type="submit" disabled={loading} className="w-full py-3.5 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold text-sm border-none cursor-pointer transition-colors disabled:opacity-60">
              {loading ? "Resetting…" : "Reset Password →"}
            </button>
          </form>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="text-center flex flex-col items-center gap-3 py-4">
            <div className="text-6xl">🎉</div>
            <h2 className="text-2xl font-black text-gray-900">Password Reset!</h2>
            <p className="text-gray-500 text-sm leading-relaxed">Your password has been reset successfully. You can now log in with your new password.</p>
            <button onClick={() => navigate("/login")} className="w-full mt-2 py-3.5 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold text-sm border-none cursor-pointer transition-colors">
              Go to Login →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
