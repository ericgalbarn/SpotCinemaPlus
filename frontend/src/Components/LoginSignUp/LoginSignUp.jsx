import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginSignUp.css";
import { Mail, Lock, User, Phone, MapPin, Calendar } from "lucide-react";
import PasswordReset from "../PasswordReset/PasswordReset";
import LoadingSpinner from "../CinemaDashboard/CinemaManagement/LoadingSpinner/LoadingSpinner";
import apiClient from "../../api/apiClient";

const LoginSignUp = () => {
  const navigate = useNavigate();
  const [action, setAction] = useState("Đăng nhập");
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    dateOfBirth: "",
    sex: 1,
    address: "",
    email: "",
    password: "",
    type: 1,
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/home");
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const fetchProfileId = async (token) => {
    try {
      const response = await apiClient.get("/account/admin/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.id;
    } catch (err) {
      console.error("Error fetching profile:", err);
      throw new Error("Failed to fetch profile information");
    }
  };

  const handleSubmit = async (type) => {
    if (type === "Đăng nhập") {
      setIsLoading(true);
      setError("");

      try {
        // First, perform the login
        const loginResponse = await apiClient.post("/auth/sign-in", {
          email: formData.email,
          password: formData.password,
        });

        if (loginResponse.data.accessToken) {
          const token = loginResponse.data.accessToken;
          localStorage.setItem("token", token);

          // After successful login, fetch the profile ID
          try {
            const profileId = await fetchProfileId(token);
            // Update the userId in localStorage with the profile ID
            localStorage.setItem("userId", profileId.toString());
            navigate("/home");
          } catch (profileError) {
            // If profile fetch fails, clear token and show error
            localStorage.removeItem("token");
            localStorage.removeItem("userId");
            setError("Failed to fetch user profile. Please try again.");
          }
        }
      } catch (err) {
        console.error("Login error:", err);
        setError(err.response?.data?.message || "Invalid email or password");
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePasswordResetSuccess = () => {
    setShowPasswordReset(false);
    setAction("Đăng nhập");
  };

  return (
    <div className="container">
      {showPasswordReset ? (
        <PasswordReset
          onBackToLogin={() => setShowPasswordReset(false)}
          onResetSuccess={handlePasswordResetSuccess}
        />
      ) : (
        <>
          <div className="header">
            <div className="text">{action}</div>
            <div className="underline"></div>
          </div>

          <div className="toggle-buttons">
            <div
              className={action === "Đăng nhập" ? "toggle gray" : "toggle"}
              onClick={() => setAction("Đăng ký")}
            >
              Đăng ký
            </div>
            <div
              className={action === "Đăng ký" ? "toggle gray" : "toggle"}
              onClick={() => setAction("Đăng nhập")}
            >
              Đăng nhập
            </div>
          </div>

          {error && (
            <div
              style={{
                color: "red",
                textAlign: "center",
                marginBottom: "10px",
              }}
            >
              {error}
            </div>
          )}

          {isLoading && <LoadingSpinner />}

          <div className="inputs">
            {action === "Đăng ký" && (
              <>
                <div className="input">
                  <User className="input-icon" />
                  <input
                    type="text"
                    name="firstName"
                    placeholder="Nhập tên..."
                    value={formData.firstName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="input">
                  <User className="input-icon" />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Nhập họ..."
                    value={formData.lastName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="input">
                  <Phone className="input-icon" />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Số điện thoại..."
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="input">
                  <Calendar className="input-icon" />
                  <input
                    type="date"
                    name="dateOfBirth"
                    placeholder="Ngày sinh..."
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="input">
                  <User className="input-icon" />
                  <select
                    name="sex"
                    value={formData.sex}
                    onChange={handleInputChange}
                  >
                    <option value={1}>Nam</option>
                    <option value={0}>Nữ</option>
                  </select>
                </div>
                <div className="input">
                  <MapPin className="input-icon" />
                  <input
                    type="text"
                    name="address"
                    placeholder="Địa chỉ..."
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>
              </>
            )}

            <div className="input">
              <Mail className="input-icon" />
              <input
                type="email"
                name="email"
                placeholder="Nhập email của bạn..."
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div className="input">
              <Lock className="input-icon" />
              <input
                type="password"
                name="password"
                placeholder="Nhập mật khẩu của bạn..."
                value={formData.password}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {action === "Đăng nhập" && (
            <div className="forgot-password">
              Quên mật khẩu?{" "}
              <span onClick={() => setShowPasswordReset(true)}>
                Vui lòng ấn tại đây!
              </span>
            </div>
          )}

          <div className="submit-container">
            <div
              className="submit"
              onClick={() => handleSubmit(action)}
              style={{ cursor: isLoading ? "not-allowed" : "pointer" }}
            >
              {action === "Đăng ký" ? "Đăng ký" : "Đăng nhập"}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LoginSignUp;
