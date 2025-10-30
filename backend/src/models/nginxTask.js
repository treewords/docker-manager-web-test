const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NginxTask = sequelize.define('NginxTask', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  domain: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  proxyPass: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  enableSSL: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending',
  },
});

module.exports = NginxTask;
