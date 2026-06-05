'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, User, Mail, Lock, Building2, MapPin, Phone } from 'lucide-react';

const SignIn = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'individual',
    officeName: '',
    officeAddress: '',
    officeContact: '',
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.userType === 'firm') {
      if (!formData.officeName.trim()) {
        newErrors.officeName = 'Office name is required';
      }
      if (!formData.officeAddress.trim()) {
        newErrors.officeAddress = 'Office address is required';
      }
      if (!formData.officeContact.trim()) {
        newErrors.officeContact = 'Office contact is required';
      } else if (!/^\d{10}$/.test(formData.officeContact.replace(/\D/g, ''))) {
        newErrors.officeContact = 'Please enter a valid 10-digit phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Backend API call to register user
      // const response = await fetch('/api/auth/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });
      
      // if (!response.ok) {
      //   throw new Error('Registration failed');
      // }

      console.log('Form submitted:', formData);
      
      // Redirect to dashboard after successful registration
      router.push('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      setErrors((prev) => ({
        ...prev,
        submit: 'Registration failed. Please try again.',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 border border-blue-100 relative z-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">Create Account</h1>
          <p className="text-gray-600">Join Homemakers and start your journey</p>
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Field */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Choose a username"
              className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-blue-50 transition ${
                errors.username ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.username && (
              <p className="text-red-600 text-xs mt-1">{errors.username}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-blue-50 transition ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.email && (
              <p className="text-red-600 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* User Type Field */}
          <div>
            <label htmlFor="userType" className="block text-sm font-medium text-gray-700 mb-1">
              Account Type
            </label>
            <select
              id="userType"
              name="userType"
              value={formData.userType}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-blue-50 transition font-medium appearance-none cursor-pointer"
            >
              <option value="individual" className="bg-white text-gray-900 font-semibold">Individual Buyer/Renter</option>
              <option value="firm" className="bg-white text-gray-900 font-semibold">Firm</option>
              <option value="agent" className="bg-white text-gray-900 font-semibold">Real Estate Agent</option>
            </select>
          </div>

          {/* Conditional Firm Fields */}
          {formData.userType === 'firm' && (
            <>
              <div>
                <label htmlFor="officeName" className="block text-sm font-medium text-gray-700 mb-1">
                  Office Name
                </label>
                <input
                  type="text"
                  id="officeName"
                  name="officeName"
                  value={formData.officeName}
                  onChange={handleInputChange}
                  placeholder="Enter office name"
                  className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-blue-50 transition ${
                    errors.officeName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.officeName && (
                  <p className="text-red-600 text-xs mt-1">{errors.officeName}</p>
                )}
              </div>

              <div>
                <label htmlFor="officeAddress" className="block text-sm font-medium text-gray-700 mb-1">
                  Office Address
                </label>
                <textarea
                  id="officeAddress"
                  name="officeAddress"
                  value={formData.officeAddress}
                  onChange={handleInputChange}
                  placeholder="Enter office address"
                  rows="3"
                  className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-blue-50 transition resize-none ${
                    errors.officeAddress ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.officeAddress && (
                  <p className="text-red-600 text-xs mt-1">{errors.officeAddress}</p>
                )}
              </div>

              <div>
                <label htmlFor="officeContact" className="block text-sm font-medium text-gray-700 mb-1">
                  Office Contact Number
                </label>
                <input
                  type="tel"
                  id="officeContact"
                  name="officeContact"
                  value={formData.officeContact}
                  onChange={handleInputChange}
                  placeholder="Enter 10-digit phone number"
                  className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-blue-50 transition ${
                    errors.officeContact ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.officeContact && (
                  <p className="text-red-600 text-xs mt-1">{errors.officeContact}</p>
                )}
              </div>
            </>
          )}

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a password"
                className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-blue-50 transition pr-10 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-600 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-blue-50 transition pr-10 ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-600 text-xs mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-400 disabled:to-indigo-400 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 shadow-lg"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Already have an account?{' '}
            <a href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium transition">
              Sign In
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
