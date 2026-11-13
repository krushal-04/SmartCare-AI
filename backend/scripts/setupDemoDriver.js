const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();
const User = require('../models/User');
const Ambulance = require('../models/Ambulance');
const Hospital = require('../models/Hospital');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const sunflower = await Hospital.findOne({ hospitalName: { $regex: 'Sunflower', $options: 'i' } });
  console.log('Sunflower Hospital:', sunflower?._id, sunflower?.hospitalName);

  // Check driver
  let driver = await User.findOne({ email: 'driver@smartcare.ai' });
  if (driver) {
    driver.password = await bcrypt.hash('Driver@123', 10);
    driver.isVerified = true;
    driver.isApproved = true;
    driver.status = 'Approved';
    driver.dutyStatus = 'ON_DUTY';
    if (sunflower) driver.hospitalId = sunflower._id;
    await driver.save();
    console.log('Updated driver Ramesh Kumar: driver@smartcare.ai / Driver@123 to ON_DUTY');
  } else {
    const hashed = await bcrypt.hash('Driver@123', 10);
    driver = await User.create({
      fullName: 'Ramesh Kumar (EMS Driver)',
      email: 'driver@smartcare.ai',
      phone: '9876501234',
      password: hashed,
      role: 'driver',
      isVerified: true,
      isApproved: true,
      status: 'Approved',
      dutyStatus: 'ON_DUTY',
      hospitalId: sunflower?._id
    });
    console.log('Created driver Ramesh Kumar: driver@smartcare.ai / Driver@123');
  }

  // Check ambulances for Sunflower
  if (sunflower) {
    let amb = await Ambulance.findOne({ hospitalId: sunflower._id });
    if (amb) {
      amb.status = 'Available';
      amb.driverId = driver._id;
      amb.driverName = driver.fullName;
      amb.driverPhone = driver.phone;
      amb.capability = ['TRAUMA', 'CARDIAC', 'BASIC', 'OXYGEN_SUPPORT'];
      await amb.save();
      console.log('Updated Sunflower ambulance:', amb.ambulanceNumber, 'status: Available, capability:', amb.capability);
    }
    // Also assign second ambulance to Sunflower
    const amb2 = await Ambulance.findOne({ ambulanceNumber: 'GJ-01-CD-5678' });
    if (amb2) {
      amb2.hospitalId = sunflower._id;
      amb2.status = 'Available';
      amb2.driverId = driver._id;
      amb2.driverName = driver.fullName;
      amb2.driverPhone = driver.phone;
      amb2.capability = ['TRAUMA', 'CARDIAC', 'BASIC', 'OXYGEN_SUPPORT'];
      await amb2.save();
      console.log('Assigned second ambulance GJ-01-CD-5678 to Sunflower as Available');
    }
  }

  console.log('COMPLETE');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
