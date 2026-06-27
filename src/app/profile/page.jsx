'use client';
import Navbar from '@/components/Navbar';
import { useState, useEffect } from 'react';
import { User, Mail, MapPin, ArrowLeft, Calendar, Clock, ChevronDown, ChevronUp, X, Home } from 'lucide-react';
import Link from 'next/link';
import { useSession, signOut } from "next-auth/react";
import { useAppointments } from '@/context/AppointmentsContext';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const { appointments, loading, refetchAppointments } = useAppointments();
  const [showAppointments, setShowAppointments] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelError, setCancelError] = useState(null);

  useEffect(() => {
    console.log(session);
  }, [status]);

  useEffect(()=>{
    console.log("Appointments are: ",appointments)
  },[appointments])
  const handleCancelAppointment = async (appt) => {
    const apptKey = `${appt.property_id}-${appt.issue_date}-${appt.issue_time}`;
    setCancellingId(apptKey);
    setCancelError(null);

    try {
      // TODO: build this endpoint — should update status to 'Cancelled'
      // for the appointment matching user_id + property_id + issue_date + issue_time
      const res = await fetch('/api/appointment/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apn: appt.property_id,
          Issue_date: appt.issue_date,
          Issue_time: appt.issue_time,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel appointment');
      }

      // Refresh the cached appointments list after successful cancellation
      refetchAppointments();
    } catch (err) {
      setCancelError(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  const statusStyles = {
    Scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    Completed: 'bg-green-500/10 text-green-400 border-green-500/30',
    Cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />

      <main className="max-w-2xl mx-auto px-6 py-8">
        <Link href="/dashboard" className="flex items-center gap-2 text-accent-light hover:text-accent-primary font-medium mb-6">
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>

        {/* Profile Card */}
        <div className="bg-dark-bg-secondary rounded-lg shadow-dark-lg border border-dark-border p-8">
          <div className="flex items-start gap-6 mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-lg flex items-center justify-center">
              <User size={40} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-dark-text mb-2">Your Profile</h1>
              <p className="text-dark-text-secondary">Manage your account information</p>
            </div>
          </div>

          <div className="space-y-6 border-t border-dark-border pt-6">
            <div>
              <label className="block text-sm font-medium text-dark-text-secondary mb-2">Username</label>
              <div className="p-3 bg-dark-bg-primary rounded-lg text-dark-text border border-dark-border">
                {session?.user?.name || 'User Name'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-text-secondary mb-2">Email Address</label>
              <div className="flex items-center gap-3 p-3 bg-dark-bg-primary rounded-lg text-dark-text border border-dark-border">
                <Mail size={18} className="text-dark-text-muted" />
                {session?.user?.email || 'user@example.com'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-text-secondary mb-2">Account Type</label>
              <div className="p-3 bg-dark-bg-primary rounded-lg text-dark-text border border-dark-border">
                {session?.user?.role || 'Role'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-text-secondary mb-2">Location</label>
              <div className="flex items-center gap-3 p-3 bg-dark-bg-primary rounded-lg text-dark-text border border-dark-border">
                <MapPin size={18} className="text-dark-text-muted" />
                All India
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-dark-border flex gap-4">
            <button className="flex-1 bg-accent-primary hover:bg-accent-dark text-white font-semibold py-2 px-4 rounded-lg transition shadow-dark-md">
              Edit Profile
            </button>
            <button className="flex-1 bg-dark-bg-tertiary hover:bg-dark-bg-hover text-dark-text font-semibold py-2 px-4 rounded-lg transition border border-dark-border">
              Change Password
            </button>
          </div>

          <button onClick={() => signOut()} className="w-full mt-4 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200 dark:bg-red-950/30 dark:hover:bg-red-950/50 dark:text-red-400 dark:hover:text-red-300 dark:border-red-900/50 font-semibold py-2 px-4 rounded-lg transition">
            Logout
          </button>
        </div>

        {/* My Appointments Section */}
        <div className="bg-dark-bg-secondary rounded-lg shadow-dark-lg border border-dark-border mt-6 overflow-hidden">
          <button
            onClick={() => setShowAppointments(!showAppointments)}
            className="w-full flex items-center justify-between p-6 hover:bg-dark-bg-hover transition"
          >
            <div className="flex items-center gap-3">
              <Calendar size={22} className="text-accent-primary" />
              <span className="text-lg font-bold text-dark-text">View My Appointments</span>
              {appointments.length > 0 && (
                <span className="px-2 py-0.5 bg-accent-primary/10 text-accent-primary text-xs font-semibold rounded-full border border-accent-primary/30">
                  {appointments.length}
                </span>
              )}
            </div>
            {showAppointments ? (
              <ChevronUp size={20} className="text-dark-text-secondary" />
            ) : (
              <ChevronDown size={20} className="text-dark-text-secondary" />
            )}
          </button>

          {showAppointments && (
            <div className="border-t border-dark-border p-6 space-y-4">
              {cancelError && (
                <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 text-sm">
                  {cancelError}
                </div>
              )}

              {loading ? (
                <p className="text-dark-text-secondary text-center py-6">Loading appointments...</p>
              ) : appointments.length === 0 ? (
                <p className="text-dark-text-secondary text-center py-6">
                  You have no appointments yet.
                </p>
              ) : (
                appointments.map((appt) => {
                  const apptKey = `${appt.property_id}-${appt.issue_date}-${appt.issue_time}`;
                  const isCancelling = cancellingId === apptKey;
                  const canCancel = appt.status === 'Scheduled';

                  return (
                    <div
                      key={apptKey}
                      className="p-4 bg-dark-bg-primary rounded-lg border border-dark-border"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Link
                            href={`/property/${appt.property_id}`}
                            className="flex items-center gap-2 text-accent-light hover:text-accent-primary font-semibold transition"
                          >
                            <Home size={16} />
                            {appt.title ? appt.title : `Property #${appt.property_id}`}
                          </Link>
                          {(appt.city || appt.local_address) && (
                            <p className="text-sm text-dark-text-secondary mt-1">
                              {appt.local_address ? `${appt.local_address}, ` : ''}{appt.city}{appt.state ? `, ${appt.state}` : ''}
                            </p>
                          )}
                          <p className="text-xs text-dark-text-muted mt-1">APN: {appt.property_id}</p>
                        </div>

                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${
                            statusStyles[appt.status] || 'bg-dark-bg-tertiary text-dark-text-secondary border-dark-border'
                          }`}
                        >
                          {appt.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-dark-text-secondary">
                          <Calendar size={14} className="text-dark-text-muted" />
                          <span>Visit: {appt.visit_date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-dark-text-secondary">
                          <Clock size={14} className="text-dark-text-muted" />
                          <span>{appt.visit_time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-dark-text-muted text-xs col-span-2">
                          <span>Requested on {appt.issue_date} at {appt.issue_time}</span>
                        </div>
                      </div>

                      {canCancel && (
                        <button
                          onClick={() => handleCancelAppointment(appt)}
                          disabled={isCancelling}
                          className="w-full mt-4 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200 dark:bg-red-950/30 dark:hover:bg-red-950/50 dark:text-red-400 dark:hover:text-red-300 dark:border-red-900/50 font-medium py-2 rounded-lg transition disabled:opacity-50 text-sm"
                        >
                          <X size={14} />
                          {isCancelling ? 'Cancelling...' : 'Cancel Appointment'}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}