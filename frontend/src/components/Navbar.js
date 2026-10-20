import React from "react";
import { useAuth } from "../context/AuthContext";
import GuestNavbar from "./navbars/GuestNavbar";
import PatientNavbar from "./navbars/PatientNavbar";
import HospitalNavbar from "./navbars/HospitalNavbar";
import AdminNavbar from "./navbars/AdminNavbar";

/**
 * Universal Navbar Router
 * Automatically renders the exact dedicated Navbar tailored for the current user's authentication state & role:
 * - Guest (not logged in): GuestNavbar (with Home, Hospitals, Doctors, Services, Emergency, Book Appointment, Sign In, Register)
 * - Patient: PatientNavbar (with Find Doctors, Hospitals, My Appointments, Reports, Health AI, Emergency, Book Appointment CTA, Profile menu)
 * - Hospital: HospitalNavbar (with Dashboard, Doctors, Schedules, Appointments, Patients, Emergency, Reports, Hospital menu)
 * - Admin: AdminNavbar (with Admin Dashboard, Hospitals, Users, Doctors, Analytics, Reports, Notifications)
 */
export default function Navbar({ overrideRole }) {
    const { role, isAuthenticated } = useAuth();

    const activeRole = overrideRole || (isAuthenticated ? role : null);

    switch (activeRole) {
        case "patient":
            return <PatientNavbar />;
        case "hospital":
            return <HospitalNavbar />;
        case "admin":
            return <AdminNavbar />;
        default:
            return <GuestNavbar />;
    }
}