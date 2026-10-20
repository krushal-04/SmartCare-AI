import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
} from "react-router-dom";

import {
    ThemeProvider,
} from "@mui/material/styles";

import CssBaseline from "@mui/material/CssBaseline";

import theme from "./theme/theme";
import { AuthProvider } from "./context/AuthContext";

/* =========================
   PUBLIC PAGES
========================= */

import Home from "./pages/Home";
import Hospitals from "./pages/Hospitals";
import HospitalDetails from "./pages/HospitalDetails";
import Doctors from "./pages/Doctors";
import DoctorDetails from "./pages/DoctorDetails";
import Departments from "./pages/Departments";
import Services from "./pages/Services";
import Emergency from "./pages/Emergency";

/* =========================
   AUTH PAGES
========================= */

import Login from "./pages/Login";
import Register from "./pages/Register";

/* =========================
   COMMON PROTECTION
========================= */

import ProtectedRoute from "./components/ProtectedRoute";

/* =========================
   APPOINTMENT
========================= */

import BookAppointment from "./pages/BookAppointment";

/* =========================
   PATIENT PAGES
========================= */

import PatientDashboard from "./pages/patient/PatientDashboard";
import PatientProfile from "./pages/patient/PatientProfile";
import PatientAppointments from "./pages/patient/PatientAppointments";
import PatientReports from "./pages/patient/PatientReports";
import PatientEmergency from "./pages/patient/PatientEmergency";
import PatientAI from "./pages/patient/PatientAI";
import PatientReviews from "./pages/patient/PatientReviews";
import PatientNotifications from "./pages/patient/PatientNotifications";

/* =========================
   HOSPITAL PAGES
========================= */

import HospitalDashboard from "./pages/hospital/HospitalDashboard";
import HospitalProfile from "./pages/hospital/HospitalProfile";
import HospitalDepartments from "./pages/hospital/HospitalDepartments";
import HospitalDoctors from "./pages/hospital/HospitalDoctors";
import HospitalSchedules from "./pages/hospital/HospitalSchedules";
import HospitalAppointments from "./pages/hospital/HospitalAppointments";
import HospitalPatients from "./pages/hospital/HospitalPatients";
import HospitalEmergency from "./pages/hospital/HospitalEmergency";
import HospitalReports from "./pages/hospital/HospitalReports";
import HospitalNotifications from "./pages/hospital/HospitalNotifications";

/* =========================
   ADMIN PAGES
========================= */

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminHospitals from "./pages/admin/AdminHospitals";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminDoctors from "./pages/admin/AdminDoctors";
import AdminDepartments from "./pages/admin/AdminDepartments";
import AdminAmbulances from "./pages/admin/AdminAmbulances";
import AdminMedicines from "./pages/admin/AdminMedicines";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminReports from "./pages/admin/AdminReports";
import AdminNotifications from "./pages/admin/AdminNotifications";


function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />

            <BrowserRouter>
                <AuthProvider>
                    <Routes>

                    {/* =================================================
                        PUBLIC WEBSITE
                    ================================================= */}

                    <Route
                        path="/"
                        element={<Home />}
                    />

                    <Route
                        path="/hospitals"
                        element={<Hospitals />}
                    />

                    <Route
                        path="/hospital/:id"
                        element={<HospitalDetails />}
                    />

                    <Route
                        path="/doctors"
                        element={<Doctors />}
                    />

                    <Route
                        path="/doctor/:id"
                        element={<DoctorDetails />}
                    />

                    <Route
                        path="/departments"
                        element={<Departments />}
                    />

                    <Route
                        path="/services"
                        element={<Services />}
                    />

                    <Route
                        path="/emergency"
                        element={<Emergency />}
                    />

                    {/* =================================================
                        AUTHENTICATION
                    ================================================= */}

                    <Route
                        path="/login"
                        element={<Login />}
                    />

                    <Route
                        path="/register"
                        element={<Register />}
                    />

                    {/* =================================================
                        PATIENT APPOINTMENT BOOKING
                        Login required
                    ================================================= */}

                    <Route
                        path="/book-appointment"
                        element={
                            <ProtectedRoute role="patient">
                                <BookAppointment />
                            </ProtectedRoute>
                        }
                    />

                    {/* =================================================
                        PATIENT MODULE
                    ================================================= */}

                    <Route
                        path="/patient"
                        element={
                            <ProtectedRoute role="patient">
                                <PatientDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/patient/profile"
                        element={
                            <ProtectedRoute role="patient">
                                <PatientProfile />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/patient/appointments"
                        element={
                            <ProtectedRoute role="patient">
                                <PatientAppointments />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/patient/reports"
                        element={
                            <ProtectedRoute role="patient">
                                <PatientReports />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/patient/emergency"
                        element={
                            <ProtectedRoute role="patient">
                                <PatientEmergency />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/patient/ai"
                        element={
                            <ProtectedRoute role="patient">
                                <PatientAI />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/patient/reviews"
                        element={
                            <ProtectedRoute role="patient">
                                <PatientReviews />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/patient/notifications"
                        element={
                            <ProtectedRoute role="patient">
                                <PatientNotifications />
                            </ProtectedRoute>
                        }
                    />

                    {/* =================================================
                        HOSPITAL MODULE
                    ================================================= */}

                    <Route
                        path="/hospital"
                        element={
                            <ProtectedRoute role="hospital">
                                <HospitalDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/hospital/profile"
                        element={
                            <ProtectedRoute role="hospital">
                                <HospitalProfile />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/hospital/departments"
                        element={
                            <ProtectedRoute role="hospital">
                                <HospitalDepartments />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/hospital/doctors"
                        element={
                            <ProtectedRoute role="hospital">
                                <HospitalDoctors />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/hospital/schedules"
                        element={
                            <ProtectedRoute role="hospital">
                                <HospitalSchedules />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/hospital/appointments"
                        element={
                            <ProtectedRoute role="hospital">
                                <HospitalAppointments />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/hospital/patients"
                        element={
                            <ProtectedRoute role="hospital">
                                <HospitalPatients />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/hospital/emergency"
                        element={
                            <ProtectedRoute role="hospital">
                                <HospitalEmergency />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/hospital/reports"
                        element={
                            <ProtectedRoute role="hospital">
                                <HospitalReports />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/hospital/notifications"
                        element={
                            <ProtectedRoute role="hospital">
                                <HospitalNotifications />
                            </ProtectedRoute>
                        }
                    />

                    {/* =================================================
                        ADMIN MODULE
                    ================================================= */}

                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute role="admin">
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/admin/hospitals"
                        element={
                            <ProtectedRoute role="admin">
                                <AdminHospitals />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/admin/users"
                        element={
                            <ProtectedRoute role="admin">
                                <AdminUsers />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/admin/doctors"
                        element={
                            <ProtectedRoute role="admin">
                                <AdminDoctors />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/admin/departments"
                        element={
                            <ProtectedRoute role="admin">
                                <AdminDepartments />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/admin/ambulances"
                        element={
                            <ProtectedRoute role="admin">
                                <AdminAmbulances />
                            </ProtectedRoute>
                        }
                    />

                    {/* 
                    <Route
                        path="/admin/medicines"
                        element={
                            <ProtectedRoute role="admin">
                                <AdminMedicines />
                            </ProtectedRoute>
                        }
                    /> 
                    */}

                    <Route
                        path="/admin/analytics"
                        element={
                            <ProtectedRoute role="admin">
                                <AdminAnalytics />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/admin/reports"
                        element={
                            <ProtectedRoute role="admin">
                                <AdminReports />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/admin/notifications"
                        element={
                            <ProtectedRoute role="admin">
                                <AdminNotifications />
                            </ProtectedRoute>
                        }
                    />

                    {/* =================================================
                        INVALID ROUTE
                    ================================================= */}

                    <Route
                        path="*"
                        element={
                            <Navigate
                                to="/"
                                replace
                            />
                        }
                    />

                </Routes>
                </AuthProvider>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;