

import { useState, useRef } from "react";
import { FiEye, FiEyeOff, FiEdit2, FiCheck, FiMail, FiLock, FiUser, FiPhone, FiMapPin, FiHome } from "react-icons/fi";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login, signup } from "../Slices/AuthSlice.js";
import toast from "react-hot-toast";
import axios from "axios";

export default function AuthPage() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""]);
  const [isVerified, setIsVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const fileInputRef = useRef(null);
  const verificationInputRefs = useRef([]);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
    role: "",
    phone: "",
    address: "",
    city: "",
    district: "",
    county: "",
    postcode: "",
  });

  const flipCard = () => {
    setIsFlipped(!isFlipped);
    setError(null);
    setSuccessMessage(null);
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData({
      ...loginData,
      [name]: value,
    });
  };

  const handleTestUserLogin = async () => {
  setIsSubmitting(true);
  setError(null);
  toast("Waking up the server... This could take up to 40 seconds. Thanks for your patience!",{duration:6000,position:'top-center'})

  try {
    const testUserData = {
      email: `${import.meta.env.VITE_TEST_EMAIL}`,
      password: `${import.meta.env.VITE_TEST_PASSWORD}`
    };

    const result = await dispatch(login(testUserData)).unwrap();
    if (result) {
      localStorage.setItem(
        "auth",
        JSON.stringify({
          userData: result.user,
          token: result.token,
          isAuthorized: true,
        })
      );
      toast.success("Test user login successful!");
      navigate("/");
    }
  } catch (err) {
    const errorMessage = err || "Test user login failed. Please try again.";
    setError(errorMessage);
    toast.error(errorMessage);
  } finally {
    setIsSubmitting(false);
  }
};

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData({
      ...registerData,
      [name]: value,
    });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatar(event.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await dispatch(login(loginData)).unwrap();
      if (result) {
        localStorage.setItem(
          "auth",
          JSON.stringify({
            userData: result.user,
            token: result.token,
            isAuthorized: true,
          })
        );
        toast.success("Login successful!");
        navigate("/");
      }
    } catch (err) {
      const errorMessage = err || "Login failed. Please check your credentials.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!avatar) {
      setError("Please upload an avatar.");
      toast.error("Please upload an avatar.");
      setIsSubmitting(false);
      return;
    }

    const formDataToSend = new FormData();
    Object.keys(registerData).forEach((key) => {
      formDataToSend.append(key, registerData[key]);
    });
    if (fileInputRef.current?.files[0]) {
      formDataToSend.append("avatar", fileInputRef.current.files[0]);
    }

    try {
      const result = await dispatch(signup(formDataToSend)).unwrap();
      if (result.success) {
        setShowVerification(true);
        setSuccessMessage("Verification code sent to your email. Please verify to complete registration.");
        toast.success("Verification code sent to your email!");
      }
    } catch (err) {
      const errorMessage = err || "Registration failed. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerificationCodeChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...verificationCode];
      newCode[index] = value;
      setVerificationCode(newCode);

      if (value !== "" && index < 5) {
        verificationInputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const code = verificationCode.join("");
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_BASEURL}/user/register/verification`,
        { email: registerData.email, verificationCode: code },
        { withCredentials: true }
      );

      if (response.data.success) {
        setIsVerified(true);
        setSuccessMessage("Your email has been successfully verified! Welcome to TownSquare!");
        toast.success("Verification successful!");

        // Update localStorage with verified user data
        const authData = {
          userData: response.data.user,
          token: response.data.token, // Ensure backend returns token
          isAuthorized: true,
        };
        localStorage.setItem("auth", JSON.stringify(authData));

        // Update Redux state
        dispatch({
          type: "user/signup/fulfilled",
          payload: { user: response.data.user, token: response.data.token },
        });

        setTimeout(() => navigate("/"), 2000);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Verification failed. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_BASEURL}/user/register/resend`,
        { email: registerData.email },
        { withCredentials: true }
      );
      setSuccessMessage("Verification code resent successfully. Please check your email.");
      toast.success("Verification code resent successfully!");
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to resend verification code.";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && verificationCode[index] === "" && index > 0) {
      verificationInputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="auth-container">
      {!showVerification ? (
        <div className={`auth-card ${isFlipped ? "flipped" : ""}`}>
          {/* Login Side */}
          <div className="card-side front">
            <div className="auth-header">
              <h2>Welcome Back</h2>
              <p>Sign in to continue to TownSquare</p>
            </div>

            {error && <div className="error-message">{error}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}

            <form className="auth-form login-form" onSubmit={handleLoginSubmit}>
              <div className="form-group login-form-group">
                <label htmlFor="login-email">Email</label>
                <div className="input-with-icon login-input-with-icon">
                  <FiMail className="input-icon" />
                  <input
                    type="email"
                    id="login-email"
                    name="email"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div className="form-group login-form-group">
                <label htmlFor="login-password">Password</label>
                <div className="input-with-icon login-input-with-icon">
                  <FiLock className="input-icon" />
                  <input
                    type={passwordVisible ? "text" : "password"}
                    id="login-password"
                    name="password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    aria-label={passwordVisible ? "Hide password" : "Show password"}
                  >
                    {passwordVisible ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="form-options login-form-options">
                <div className="remember-me login-remember-me">
                  <input type="checkbox" id="remember" />
                  <label htmlFor="remember">Remember me</label>
                </div>
                <a href="#" className="forgot-password login-forgot-password">
                  Forgot Password?
                </a>
              </div>

              <button type="submit" className="auth-button login-auth-button" disabled={isSubmitting}>
                {isSubmitting ? <span className="loading-spinner"></span> : "Sign In"}
              </button>

              <div className="auth-divider login-auth-divider">
                <span>OR</span>
              </div>

              <div className="social-login login-social-login">
                <button 
  type="button" 
  className="social-button google login-social-button"
  onClick={handleTestUserLogin}
  disabled={isSubmitting}
>
  Sign in as a test user
</button>
              </div>

              <div className="auth-footer login-auth-footer">
                <p>
                  Don't have an account?{" "}
                  <button type="button" onClick={flipCard} className="flip-button login-flip-button">
                    Sign Up
                  </button>
                </p>
              </div>
            </form>
          </div>

          {/* Register Side */}
          <div className="card-side back">
            <div className="auth-header">
              <div className="avatar-upload">
                <div
                  className="avatar-preview"
                  onClick={handleAvatarClick}
                  style={{ backgroundImage: avatar ? `url(${avatar})` : "none" }}
                >
                  {!avatar && <FiUser className="avatar-placeholder" />}
                  <div className="avatar-edit">
                    <FiEdit2 />
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                  required
                />
              </div>
              <h2>Create Account</h2>
              <p>Join the TownSquare community</p>
            </div>

            {error && <div className="error-message">{error}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}

            <form className="auth-form register-form" onSubmit={handleRegisterSubmit}>
              <div className="register-form-grid">
                <div className="form-group register-form-group">
                  <label htmlFor="username">Username</label>
                  <div className="input-with-icon register-input-with-icon">
                    <FiUser className="input-icon" />
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={registerData.username}
                      onChange={handleRegisterChange}
                      placeholder="Choose a username"
                      required
                    />
                  </div>
                </div>

                <div className="form-group register-form-group">
                  <label htmlFor="register-email">Email</label>
                  <div className="input-with-icon register-input-with-icon">
                    <FiMail className="input-icon" />
                    <input
                      type="email"
                      id="register-email"
                      name="email"
                      value={registerData.email}
                      onChange={handleRegisterChange}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div className="form-group register-form-group">
                  <label htmlFor="register-password">Password</label>
                  <div className="input-with-icon register-input-with-icon">
                    <FiLock className="input-icon" />
                    <input
                      type={passwordVisible ? "text" : "password"}
                      id="register-password"
                      name="password"
                      value={registerData.password}
                      onChange={handleRegisterChange}
                      placeholder="Create a password"
                      required
                      minLength="6"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setPasswordVisible(!passwordVisible)}
                      aria-label={passwordVisible ? "Hide password" : "Show password"}
                    >
                      {passwordVisible ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <div className="form-group register-form-group">
                  <label htmlFor="role">Role</label>
                  <div className="input-with-icon register-input-with-icon">
                    <FiUser className="input-icon" />
                    <select id="role" name="role" value={registerData.role} onChange={handleRegisterChange} required>
                      <option value="">Select your role</option>
                      <option value="resident">Resident</option>
                      <option value="business">Business Owner</option>
                      <option value="government">Government Official</option>
                      <option value="visitor">Visitor</option>
                    </select>
                  </div>
                </div>

                <div className="form-group register-form-group">
                  <label htmlFor="phone">Phone</label>
                  <div className="input-with-icon register-input-with-icon">
                    <FiPhone className="input-icon" />
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={registerData.phone}
                      onChange={handleRegisterChange}
                      placeholder="Enter your phone number"
                      required
                    />
                  </div>
                </div>

                <div className="form-group register-form-group full-width">
                  <label htmlFor="address">Address</label>
                  <div className="input-with-icon register-input-with-icon">
                    <FiHome className="input-icon" />
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={registerData.address}
                      onChange={handleRegisterChange}
                      placeholder="Enter your street address"
                      required
                    />
                  </div>
                </div>

                <div className="form-group register-form-group">
                  <label htmlFor="city">City</label>
                  <div className="input-with-icon register-input-with-icon">
                    <FiMapPin className="input-icon" />
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={registerData.city}
                      onChange={handleRegisterChange}
                      placeholder="City"
                      required
                    />
                  </div>
                </div>

                <div className="form-group register-form-group">
                  <label htmlFor="district">District</label>
                  <input
                    type="text"
                    id="district"
                    name="district"
                    value={registerData.district}
                    onChange={handleRegisterChange}
                    placeholder="District"
                    required
                  />
                </div>

                <div className="form-group register-form-group">
                  <label htmlFor="county">County</label>
                  <input
                    type="text"
                    id="county"
                    name="county"
                    value={registerData.county}
                    onChange={handleRegisterChange}
                    placeholder="County"
                    required
                  />
                </div>

                <div className="form-group register-form-group">
                  <label htmlFor="postcode">Postcode</label>
                  <input
                    type="text"
                    id="postcode"
                    name="postcode"
                    value={registerData.postcode}
                    onChange={handleRegisterChange}
                    placeholder="Postcode"
                    required
                  />
                </div>
              </div>

              <div className="terms-checkbox register-terms-checkbox">
                <input type="checkbox" id="terms" required />
                <label htmlFor="terms">
                  I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
                </label>
              </div>

              <button type="submit" className="auth-button register-auth-button" disabled={isSubmitting}>
                {isSubmitting ? <span className="loading-spinner"></span> : "Create Account"}
              </button>

              <div className="auth-footer register-auth-footer">
                <p>
                  Already have an account?{" "}
                  <button type="button" onClick={flipCard} className="flip-button register-flip-button">
                    Sign In
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className={`verification-card ${isVerified ? "verified" : ""}`}>
          <div className="auth-header">
            <div className="verification-icon">
              <FiMail className={isVerified ? "hidden" : ""} />
              <FiCheck className={isVerified ? "" : "hidden"} />
            </div>
            <h2>{isVerified ? "Verification Successful" : "Verify Your Email"}</h2>
            <p>
              {isVerified
                ? "Your account has been successfully verified!"
                : `We've sent a verification code to ${registerData.email}`}
            </p>
          </div>

          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}

          {!isVerified && (
            <form className="auth-form" onSubmit={handleVerificationSubmit}>
              <div className="verification-code-container">
                {verificationCode.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleVerificationCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    ref={(el) => (verificationInputRefs.current[index] = el)}
                    className="verification-input"
                    required
                  />
                ))}
              </div>

              <button
                type="submit"
                className="auth-button"
                disabled={isSubmitting || verificationCode.some((digit) => digit === "")}
              >
                {isSubmitting ? <span className="loading-spinner"></span> : "Verify"}
              </button>

              <div className="resend-code">
                <p>
                  Didn't receive the code?{" "}
                  <button type="button" onClick={handleResendCode} className="resend-button">
                    Resend
                  </button>
                </p>
              </div>
            </form>
          )}

          {isVerified && (
            <div className="success-animation">
              <div className="checkmark-circle">
                <div className="checkmark draw"></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}