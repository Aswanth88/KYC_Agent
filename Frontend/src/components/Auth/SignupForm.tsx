import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNotify } from "../../hooks/useNotify";
import { Mail, Lock, Eye, EyeOff, User, UserPlus } from "lucide-react";

interface SignupFormProps {
  onToggleForm: () => void;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const SignupForm: React.FC<SignupFormProps> = ({ onToggleForm }) => {
  const { signup } = useAuth();
  const notify = useNotify();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { firstName, lastName, email, password, confirmPassword } = formData;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      notify.error("Please fill in all fields.");
      return;
    }

    if (!emailRegex.test(email)) {
      notify.error("Please enter a valid email address.");
      return;
    }

    if (password !== confirmPassword) {
      notify.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      notify.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const success = await signup({
        email,
        password,
        firstName,
        lastName,
      });

      if (success) {
        notify.success("Account created successfully! Please sign in.");
        setTimeout(onToggleForm, 1000);
      } else {
        notify.error("User already exists with this email");
      }
    } catch {
      notify.error("An error occurred during signup");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Create Account</h1>
          <p className="text-gray-500">Join our secure platform</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Names */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {["firstName", "lastName"].map((field) => (
              <div className="relative" key={field}>
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  name={field}
                  type="text"
                  placeholder={field === "firstName" ? "First Name" : "Last Name"}
                  value={(formData as any)[field]}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>

          {/* Email */}
          <div className="mb-4 relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              name="email"
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Password */}
          <div className="mb-4 relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="mb-4 relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              name="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <div className="text-center mt-4">
            <p className="text-gray-500">
              Already have an account?{" "}
              <button onClick={onToggleForm} className="text-blue-600 hover:underline font-semibold">
                Sign in here
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
