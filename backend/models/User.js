const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "hospital", "patient", "doctor", "driver"],
      default: "patient",
    },

    assignedAmbulanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ambulance",
    },

    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
    },

    dutyStatus: {
      type: String,
      enum: ["OFF_DUTY", "ON_DUTY"],
      default: "OFF_DUTY",
    },

    lastDutyStartAt: {
      type: Date,
    },

    lastDutyEndAt: {
      type: Date,
    },

    currentLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      accuracy: { type: Number },
      speed: { type: Number },
      heading: { type: Number },
      updatedAt: { type: Date },
    },

    isApproved: {
      type: Boolean,
      default: false,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvalDate: {
      type: Date,
    },
    rejectionDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    reminderSettings: {
      enabled: { type: Boolean, default: true },
      reminder24h: { type: Boolean, default: true },
      reminder1h: { type: Boolean, default: true },
      channels: {
        inApp: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
