const nodemailer = require("nodemailer");

let transporter = null;

const getTransporter = () => {
    if (transporter) return transporter;

    const user = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : null;
    const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, "") : null;

    if (!user || !pass) {
        console.warn("[EmailService] EMAIL_USER or EMAIL_PASS is not configured. Real email sending is disabled.");
        return null;
    }

    try {
        transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user,
                pass,
            },
            tls: {
                rejectUnauthorized: false,
            },
        });
        return transporter;
    } catch (err) {
        console.error("[EmailService] Failed to initialize transporter:", err.message);
        return null;
    }
};

const buildHtmlEmail = ({ title, subtitle, statusText, statusColor, contentHtml, actionButton }) => {
    const colorHex = {
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#0EA5E9",
        teal: "#0D9488",
    }[statusColor] || "#0D9488";

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8FAFC; padding: 36px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.06); border: 1px solid #E2E8F0;">
          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); padding: 32px 36px; text-align: left; border-bottom: 3px solid ${colorHex};">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="display: inline-block; background-color: rgba(13, 148, 136, 0.2); border: 1px solid rgba(13, 148, 136, 0.4); border-radius: 8px; padding: 6px 12px; margin-bottom: 12px;">
                      <span style="color: #5EEAD4; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">SmartCare AI Healthcare</span>
                    </div>
                    <h1 style="margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">${title}</h1>
                    ${subtitle ? `<p style="margin: 6px 0 0 0; color: #94A3B8; font-size: 14px;">${subtitle}</p>` : ""}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- STATUS BADGE (IF PROVIDED) -->
          ${
              statusText
                  ? `
          <tr>
            <td style="padding: 24px 36px 0 36px;">
              <div style="display: inline-block; background-color: ${colorHex}15; border: 1px solid ${colorHex}40; color: ${colorHex}; font-size: 13px; font-weight: 700; padding: 6px 14px; border-radius: 9999px;">
                ● Status: ${statusText}
              </div>
            </td>
          </tr>`
                  : ""
          }

          <!-- CONTENT BODY -->
          <tr>
            <td style="padding: 24px 36px 36px 36px; font-size: 15px; line-height: 1.65; color: #334155;">
              ${contentHtml}

              ${
                  actionButton
                      ? `
              <div style="margin-top: 32px; text-align: center;">
                <a href="${actionButton.url}" style="display: inline-block; background: linear-gradient(135deg, #0D9488 0%, #0F766E 100%); color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);">
                  ${actionButton.label}
                </a>
              </div>`
                      : ""
              }
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #F8FAFC; padding: 24px 36px; border-top: 1px solid #E2E8F0; text-align: center; color: #94A3B8; font-size: 12px; line-height: 1.5;">
              <p style="margin: 0 0 4px 0; font-weight: 600; color: #64748B;">SmartCare AI Hospital & Clinical Operating System</p>
              <p style="margin: 0 0 8px 0;">This is an automated system dispatch. Please do not reply directly to this email.</p>
              <p style="margin: 0; color: #CBD5E1;">&copy; ${new Date().getFullYear()} SmartCare AI. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

const sendEmail = async ({ to, subject, text, html }) => {
    const tx = getTransporter();
    if (!tx) {
        console.warn(`[EmailService] Skipping email to <${to}>: SMTP credentials not available.`);
        return { sent: false, error: "SMTP credentials not configured" };
    }

    try {
        const info = await tx.sendMail({
            from: `"SmartCare AI" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html: html || buildHtmlEmail({ title: subject, contentHtml: `<p>${text.replace(/\n/g, "<br>")}</p>` }),
        });
        console.log(`[EmailService] Email sent successfully to ${to} (Message ID: ${info.messageId})`);
        return { sent: true, messageId: info.messageId };
    } catch (error) {
        console.error(`[EmailService] Failed to send email to ${to}:`, error.message);
        return { sent: false, error: error.message };
    }
};

// 1. Hospital Registration Acknowledgment Email to Registering Hospital
const sendHospitalRegistrationEmail = async (hospital) => {
    const name = hospital.fullName || hospital.hospitalName || "Hospital Administrator";
    const subject = "SmartCare AI - Hospital Registration Received (Pending Review)";
    const text = `Dear ${name},

Thank you for submitting your hospital registration with SmartCare AI.
Your application is currently under administrative review. Once our team verifies your credentials and operational details, you will receive an approval confirmation email allowing you to log in.

Registered Email: ${hospital.email}
Status: Pending Administrator Review

Best regards,
SmartCare AI Administration`;

    const html = buildHtmlEmail({
        title: "Registration Received",
        subtitle: "Application under administrative verification",
        statusText: "Pending Approval",
        statusColor: "warning",
        contentHtml: `
          <p>Dear <strong>${name}</strong>,</p>
          <p>Thank you for submitting your hospital registration with <strong>SmartCare AI</strong>. Your application has been logged into our compliance queue and is currently undergoing administrative review.</p>
          
          <div style="background-color: #F1F5F9; border-radius: 10px; padding: 18px 22px; margin: 20px 0; border-left: 4px solid #F59E0B;">
            <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Hospital Name:</strong> ${name}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Account Email:</strong> ${hospital.email}</p>
            <p style="margin: 0; font-size: 14px;"><strong>Initial Status:</strong> <span style="color: #D97706; font-weight: 700;">Pending Administrator Review</span></p>
          </div>

          <p><strong>What happens next?</strong></p>
          <ul style="padding-left: 20px; margin-top: 8px;">
            <li style="margin-bottom: 6px;">Our compliance administrators verify hospital licensing and facilities.</li>
            <li style="margin-bottom: 6px;">Upon approval, you will receive an email notice enabling full portal access.</li>
            <li>You will not be able to log in until your application is approved.</li>
          </ul>
        `,
    });

    return sendEmail({ to: hospital.email, subject, text, html });
};

// 2. Notification to Admin when a new hospital registers
const sendAdminNewHospitalNotification = async (hospital, adminEmail) => {
    const to = adminEmail || process.env.EMAIL_USER;
    if (!to) return;
    const name = hospital.fullName || hospital.hospitalName || "New Hospital";
    const subject = `[Admin Alert] New Hospital Registration: ${name}`;
    const text = `Hello Administrator,

A new hospital registration has been submitted and requires review.

Hospital Name: ${name}
Email: ${hospital.email}
Phone: ${hospital.phone || "Not provided"}

Please log in to the SmartCare AI Admin Portal to review, verify, and approve or reject this application.

SmartCare AI System`;

    const html = buildHtmlEmail({
        title: "New Hospital Registration Request",
        subtitle: "A hospital center has registered and awaits administrative authorization",
        statusText: "Action Required: Review Dossier",
        statusColor: "info",
        contentHtml: `
          <p>Hello Administrator,</p>
          <p>A new hospital facility has registered on SmartCare AI and is awaiting your review and approval:</p>
          
          <div style="background-color: #F8FAFC; border-radius: 12px; padding: 20px; border: 1px solid #E2E8F0; margin: 20px 0;">
            <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 14px;">
              <tr>
                <td width="35%" style="color: #64748B; font-weight: 600;">Facility Name:</td>
                <td style="color: #0F172A; font-weight: 700;">${name}</td>
              </tr>
              <tr>
                <td style="color: #64748B; font-weight: 600;">Official Email:</td>
                <td style="color: #0F172A;">${hospital.email}</td>
              </tr>
              <tr>
                <td style="color: #64748B; font-weight: 600;">Phone Number:</td>
                <td style="color: #0F172A;">${hospital.phone || "N/A"}</td>
              </tr>
              <tr>
                <td style="color: #64748B; font-weight: 600;">Submission Date:</td>
                <td style="color: #0F172A;">${new Date().toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <p>Please log in to the Administrator Control Center to inspect accreditation documents, verify facilities, and approve or reject the request.</p>
        `,
        actionButton: {
            label: "Open Admin Approvals Console",
            url: "http://localhost:3000/admin/hospitals?filter=Pending",
        },
    });

    return sendEmail({ to, subject, text, html });
};

// 3. Hospital Approval Email to Hospital
const sendHospitalApprovalEmail = async (hospital) => {
    const name = hospital.fullName || hospital.hospitalName || "Hospital Partner";
    const subject = "SmartCare AI - Congratulations! Hospital Account Approved";
    const text = `Dear ${name},

Congratulations! Your SmartCare AI hospital account has been verified and APPROVED by our administration team.

You now have full access to:
- Hospital Operations Dashboard
- Doctor & Department Management
- Automated Time-Slot Scheduling
- Appointment Processing
- Patient Management
- Emergency & Ambulance Dispatch
- Medical Report Sharing

You can now log in using your registered credentials at:
http://localhost:3000/login

Thank you for partnering with SmartCare AI.

Warm regards,
SmartCare AI Operations Team`;

    const html = buildHtmlEmail({
        title: "Hospital Registration Approved!",
        subtitle: "Your credentials have been verified and full access is granted",
        statusText: "Approved & Active",
        statusColor: "success",
        contentHtml: `
          <p>Dear <strong>${name}</strong>,</p>
          <p>We are delighted to inform you that your hospital registration with <strong>SmartCare AI</strong> has been <strong>approved</strong> by our administration team.</p>
          
          <div style="background-color: #ECFDF5; border-radius: 12px; padding: 20px; border: 1px solid #A7F3D0; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; color: #065F46; font-size: 15px; font-weight: 700;">Activated Privileges & Modules:</p>
            <ul style="margin: 0; padding-left: 20px; color: #047857; font-size: 14px; line-height: 1.7;">
              <li>Comprehensive Hospital Management Console</li>
              <li>Doctor Staffing, Specializations & Shift Scheduling</li>
              <li>Patient Appointment Triage & Verification</li>
              <li>Emergency Protocol & Real-time Ambulance Dispatch</li>
              <li>Diagnostic & Medical Record Publishing</li>
            </ul>
          </div>

          <p>Your hospital portal is ready. You may now log in with your registered email and password to begin setting up your departments and doctors.</p>
        `,
        actionButton: {
            label: "Log In to Hospital Portal",
            url: "http://localhost:3000/login",
        },
    });

    return sendEmail({ to: hospital.email, subject, text, html });
};

// 4. Hospital Cancellation Email to Hospital (when admin cancels/revokes approval)
const sendHospitalCancellationEmail = async (hospital, reason) => {
    const name = hospital.fullName || hospital.hospitalName || "Hospital Administrator";
    const subject = "SmartCare AI - Notice: Hospital Approval Status Cancelled";
    const text = `Dear ${name},

We are writing to inform you that your hospital approval status on SmartCare AI has been CANCELLED by system administration.

Reason for cancellation:
${reason || "Administrative review / compliance update."}

Access to the Hospital Management Console has been revoked. If you believe this action was taken in error or if you have questions regarding this decision, please reach out to our administrative support desk.

Sincerely,
SmartCare AI Administration Team`;

    const html = buildHtmlEmail({
        title: "Hospital Approval Cancelled",
        subtitle: "Notice of administrative status revocation",
        statusText: "Approval Cancelled",
        statusColor: "danger",
        contentHtml: `
          <p>Dear <strong>${name}</strong>,</p>
          <p>This is an official notice to inform you that your hospital approval on the <strong>SmartCare AI</strong> network has been <strong>cancelled</strong> by system administration.</p>
          
          <div style="background-color: #FEF2F2; border-radius: 12px; padding: 20px; border: 1px solid #FECACA; margin: 20px 0;">
            <p style="margin: 0 0 6px 0; color: #991B1B; font-weight: 700; font-size: 14px;">Reason for Cancellation:</p>
            <p style="margin: 0; color: #B91C1C; font-size: 14px; line-height: 1.5;">${reason || "Administrative compliance review or facility suspension."}</p>
          </div>

          <p><strong>Impact of this decision:</strong></p>
          <ul style="padding-left: 20px; margin-top: 8px;">
            <li style="margin-bottom: 6px;">Hospital operations console access is suspended immediately.</li>
            <li style="margin-bottom: 6px;">Your hospital will not appear in the active public booking directory.</li>
            <li>Active sessions have been restricted.</li>
          </ul>

          <p>If you believe this decision was made in error or wish to submit updated compliance documentation for reinstatement, please contact our support team at <a href="mailto:${process.env.EMAIL_USER}" style="color: #0D9488; font-weight: 600;">${process.env.EMAIL_USER}</a>.</p>
        `,
    });

    return sendEmail({ to: hospital.email, subject, text, html });
};

// 5. Hospital Rejection Email (when initial pending application is rejected)
const sendHospitalRejectionEmail = async (hospital, reason) => {
    const name = hospital.fullName || hospital.hospitalName || "Hospital Administrator";
    const subject = "SmartCare AI - Hospital Registration Status Update";
    const text = `Dear ${name},

Thank you for your interest in SmartCare AI.
After reviewing your hospital registration submission, we regret to inform you that your application could not be approved at this time.

Reason for decision:
${reason || "Submitted information or credentials could not be verified."}

If you believe this decision was made in error or wish to provide updated documentation, please contact our support desk.

Regards,
SmartCare AI Compliance & Administration`;

    const html = buildHtmlEmail({
        title: "Registration Application Not Approved",
        subtitle: "Decision on hospital onboarding submission",
        statusText: "Application Rejected",
        statusColor: "danger",
        contentHtml: `
          <p>Dear <strong>${name}</strong>,</p>
          <p>Thank you for submitting your application to join the <strong>SmartCare AI</strong> network. After careful review by our compliance team, we regret to inform you that your application could not be approved at this time.</p>
          
          <div style="background-color: #FEF2F2; border-radius: 12px; padding: 20px; border: 1px solid #FECACA; margin: 20px 0;">
            <p style="margin: 0 0 6px 0; color: #991B1B; font-weight: 700; font-size: 14px;">Reason for Decision:</p>
            <p style="margin: 0; color: #B91C1C; font-size: 14px; line-height: 1.5;">${reason || "Submitted information or accreditation credentials could not be verified."}</p>
          </div>

          <p>If you believe this decision was reached in error, or if you have revised documentation to submit, please reach out to our administration desk.</p>
        `,
    });

    return sendEmail({ to: hospital.email, subject, text, html });
};

// 6. Appointment Created Email to Patient
const sendAppointmentCreatedEmail = async (appointment, patient, doctor, hospital) => {
    const pName = patient?.fullName || "Patient";
    const docName = doctor?.doctorName || "Doctor";
    const hospName = hospital?.hospitalName || "Hospital";
    const apptDate = new Date(appointment.appointmentDate).toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const subject = "SmartCare AI - Appointment Booking Received";
    const text = `Dear ${pName},

Your appointment booking request has been successfully created.

Doctor: Dr. ${docName} (${doctor?.specialization || "General Specialist"})
Hospital: ${hospName}
Date: ${apptDate}
Time Slot: ${appointment.appointmentTime}
Status: ${appointment.status}

You will receive an update once the hospital confirms your appointment.

Best regards,
SmartCare AI Team`;

    const html = buildHtmlEmail({
        title: "Appointment Booking Confirmed",
        subtitle: "Your clinical consultation request is logged",
        statusText: appointment.status || "Pending Confirmation",
        statusColor: "teal",
        contentHtml: `
          <p>Dear <strong>${pName}</strong>,</p>
          <p>Your appointment has been successfully scheduled with <strong>${hospName}</strong>. Details of your appointment are listed below:</p>

          <div style="background-color: #F8FAFC; border-radius: 12px; padding: 20px; border: 1px solid #E2E8F0; margin: 20px 0;">
            <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 14px;">
              <tr>
                <td width="35%" style="color: #64748B; font-weight: 600;">Doctor:</td>
                <td style="color: #0F172A; font-weight: 700;">Dr. ${docName} (${doctor?.specialization || "General"})</td>
              </tr>
              <tr>
                <td style="color: #64748B; font-weight: 600;">Hospital:</td>
                <td style="color: #0F172A;">${hospName}</td>
              </tr>
              <tr>
                <td style="color: #64748B; font-weight: 600;">Date:</td>
                <td style="color: #0F172A; font-weight: 700;">${apptDate}</td>
              </tr>
              <tr>
                <td style="color: #64748B; font-weight: 600;">Time Slot:</td>
                <td style="color: #0F172A; font-weight: 700;">${appointment.appointmentTime}</td>
              </tr>
              ${appointment.reason ? `<tr><td style="color: #64748B; font-weight: 600;">Reason:</td><td style="color: #0F172A;">${appointment.reason}</td></tr>` : ""}
            </table>
          </div>

          <p>Please arrive 15 minutes prior to your allocated slot.</p>
        `,
        actionButton: {
            label: "View in Patient Portal",
            url: "http://localhost:3000/patient/appointments",
        },
    });

    return sendEmail({ to: patient.email, subject, text, html });
};

// 7. Appointment Status Update Email
const sendAppointmentStatusEmail = async (appointment, patient, doctor, hospital, newStatus, notes) => {
    const pName = patient?.fullName || "Patient";
    const docName = doctor?.doctorName || "Doctor";
    const hospName = hospital?.hospitalName || "Hospital";
    const apptDate = new Date(appointment.appointmentDate).toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const statusColors = {
        Confirmed: "success",
        Completed: "info",
        Cancelled: "danger",
        Rejected: "danger",
    };

    const subject = `SmartCare AI - Appointment Update: ${newStatus}`;
    const text = `Dear ${pName},

Your appointment with Dr. ${docName} at ${hospName} has been updated.

Status: ${newStatus}
Date: ${apptDate}
Time: ${appointment.appointmentTime}
${notes ? `Hospital Notes: ${notes}` : ""}

Please visit your Patient Portal for full details.

Best regards,
SmartCare AI Team`;

    const html = buildHtmlEmail({
        title: `Appointment ${newStatus}`,
        subtitle: `Dr. ${docName} • ${hospName}`,
        statusText: newStatus,
        statusColor: statusColors[newStatus] || "teal",
        contentHtml: `
          <p>Dear <strong>${pName}</strong>,</p>
          <p>There is a status change regarding your scheduled consultation with <strong>Dr. ${docName}</strong> at <strong>${hospName}</strong>.</p>

          <div style="background-color: #F8FAFC; border-radius: 12px; padding: 20px; border: 1px solid #E2E8F0; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Updated Status:</strong> <span style="font-weight: 700; color: #0D9488;">${newStatus}</span></p>
            <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Scheduled Date:</strong> ${apptDate}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Slot Time:</strong> ${appointment.appointmentTime}</p>
            ${notes ? `<p style="margin: 0; font-size: 14px; color: #475569;"><strong>Clinical Note:</strong> ${notes}</p>` : ""}
          </div>
        `,
        actionButton: {
            label: "Open Patient Appointments",
            url: "http://localhost:3000/patient/appointments",
        },
    });

    return sendEmail({ to: patient.email, subject, text, html });
};

// 8. Emergency Alert Email
const sendEmergencyAlertEmail = async (emergency, hospital, patient) => {
    if (!hospital?.hospitalEmail) return;
    const subject = `[URGENT] Emergency Request - SmartCare AI`;
    const text = `URGENT MEDICAL ALERT

An emergency request has been directed to ${hospital.hospitalName}.

Patient Name: ${patient?.fullName || "Emergency Patient"}
Contact Number: ${emergency.contactNumber}
Location / Address: ${emergency.address || "GPS Coordinates Provided"}
Description: ${emergency.description}
Status: ${emergency.status}

Please log in to your Hospital Emergency Console immediately to respond and dispatch an ambulance.

SmartCare AI Emergency Response System`;

    const html = buildHtmlEmail({
        title: "Urgent: Emergency Request Dispatched",
        subtitle: "Immediate response required by triage staff",
        statusText: "High Priority Emergency",
        statusColor: "danger",
        contentHtml: `
          <div style="background-color: #FEF2F2; border-radius: 12px; padding: 20px; border: 2px solid #EF4444; margin: 10px 0 20px 0;">
            <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: 800; color: #B91C1C;">CRITICAL INTAKE NOTICE</p>
            <p style="margin: 0 0 6px 0; font-size: 14px;"><strong>Patient:</strong> ${patient?.fullName || "Emergency Patient"}</p>
            <p style="margin: 0 0 6px 0; font-size: 14px;"><strong>Phone:</strong> ${emergency.contactNumber}</p>
            <p style="margin: 0 0 6px 0; font-size: 14px;"><strong>Location:</strong> ${emergency.address || "Live GPS Shared"}</p>
            <p style="margin: 0; font-size: 14px;"><strong>Condition:</strong> ${emergency.description}</p>
          </div>
        `,
        actionButton: {
            label: "Open Emergency Console",
            url: "http://localhost:3000/hospital/emergency",
        },
    });

    return sendEmail({ to: hospital.hospitalEmail, subject, text, html });
};

// 9. Emergency Status Update Email to Patient
const sendEmergencyStatusEmail = async (emergency, patient, status, ambulance) => {
    if (!patient?.email) return;
    const subject = `SmartCare AI - Emergency Status: ${status}`;
    const text = `Dear ${patient.fullName},

There is an update regarding your emergency request:

Current Status: ${status}
${ambulance ? `Ambulance Assigned: ${ambulance.ambulanceNumber} (${ambulance.vehicleType})\nDriver: ${ambulance.driverName} - Phone: ${ambulance.driverPhone}` : ""}

Please stay on the line and keep your phone accessible.

SmartCare AI Emergency Response`;

    const html = buildHtmlEmail({
        title: `Emergency Response: ${status}`,
        subtitle: "Live status dispatch from triage team",
        statusText: status,
        statusColor: status === "Dispatched" ? "warning" : "teal",
        contentHtml: `
          <p>Dear <strong>${patient.fullName}</strong>,</p>
          <p>Your emergency dispatch request has been updated by the responding hospital:</p>

          <div style="background-color: #F8FAFC; border-radius: 12px; padding: 20px; border: 1px solid #E2E8F0; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Status:</strong> ${status}</p>
            ${
                ambulance
                    ? `
            <p style="margin: 0 0 6px 0; font-size: 14px;"><strong>Vehicle Number:</strong> ${ambulance.ambulanceNumber} (${ambulance.vehicleType || "Advanced Life Support"})</p>
            <p style="margin: 0; font-size: 14px;"><strong>Driver Contact:</strong> ${ambulance.driverName} (${ambulance.driverPhone})</p>`
                    : ""
            }
          </div>

          <p style="color: #DC2626; font-weight: 600;">Please ensure someone is available at the entrance or keep your phone line open for the driver.</p>
        `,
    });

    return sendEmail({ to: patient.email, subject, text, html });
};

module.exports = {
    sendEmail,
    sendHospitalRegistrationEmail,
    sendAdminNewHospitalNotification,
    sendHospitalApprovalEmail,
    sendHospitalCancellationEmail,
    sendHospitalRejectionEmail,
    sendAppointmentCreatedEmail,
    sendAppointmentStatusEmail,
    sendEmergencyAlertEmail,
    sendEmergencyStatusEmail,
};
