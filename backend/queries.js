const mongoose = require('mongoose');
const Parcel = require('./models/Parcel');
const Driver = require('./models/Driver');
require('dotenv').config();

// Example MongoDB queries for LogiTrack

async function runQueries() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB Atlas');

    // 1. Find parcels in transit
    console.log('\n1. Parcels in Transit:');
    const parcelsInTransit = await Parcel.find({ status: 'In Transit' });
    console.log(parcelsInTransit);

    // 2. Find parcels by driver
    console.log('\n2. Parcels assigned to driver D001:');
    const parcelsByDriver = await Parcel.find({ driverId: 'D001' });
    console.log(parcelsByDriver);

    // 3. Find parcels with weight greater than 2kg
    console.log('\n3. Parcels with weight greater than 2kg:');
    const heavyParcels = await Parcel.find({ weight: { $gt: 2 } });
    console.log(heavyParcels);

    // 4. Update parcel status (example: change P001 to 'In Transit')
    console.log('\n4. Updating parcel P001 status to In Transit:');
    const updatedParcel = await Parcel.findOneAndUpdate(
      { parcelId: 'P001' },
      { status: 'In Transit' },
      { new: true }
    );
    console.log('Updated parcel:', updatedParcel);

    // Additional useful queries

    // Find all delivered parcels
    console.log('\n5. All delivered parcels:');
    const deliveredParcels = await Parcel.find({ status: 'Delivered' });
    console.log(deliveredParcels);

    // Find parcels with specific sender
    console.log('\n6. Parcels from Alice Johnson:');
    const aliceParcels = await Parcel.find({ senderName: 'Alice Johnson' });
    console.log(aliceParcels);

    // Count parcels by status
    console.log('\n7. Parcel count by status:');
    const statusCounts = await Parcel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    console.log(statusCounts);

    // Find parcels sorted by weight (descending)
    console.log('\n8. Parcels sorted by weight (heaviest first):');
    const sortedByWeight = await Parcel.find().sort({ weight: -1 });
    console.log(sortedByWeight);

    // Close connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error running queries:', error);
    process.exit(1);
  }
}

// Run the queries
runQueries();