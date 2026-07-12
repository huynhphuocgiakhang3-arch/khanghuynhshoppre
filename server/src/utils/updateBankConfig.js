const mongoose = require('mongoose');
const SystemConfig = require('../models/SystemConfig');
require('dotenv').config();

const updateBankConfig = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/khanghuynh_shop');
    console.log('Connected to MongoDB');

    // Update SystemConfig
    const config = await SystemConfig.getSingleton();
    
    config.bank.bin = '970423'; // TPBank
    config.bank.bankName = 'TPBank';
    config.bank.accountNo = '10002181284';
    config.bank.accountName = 'HUYNH PHUOC GIA AN';
    config.bank.template = 'compact';
    
    await config.save();
    console.log('✅ Updated bank configuration:');
    console.log('   Bank:', config.bank.bankName);
    console.log('   BIN:', config.bank.bin);
    console.log('   Account No:', config.bank.accountNo);
    console.log('   Account Name:', config.bank.accountName);
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating bank config:', error);
    process.exit(1);
  }
};

updateBankConfig();
