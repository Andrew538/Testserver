const sequelize = require('../db')
const {DataTypes} = require('sequelize')

const User = sequelize.define('user', {
    id:{type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: {type: DataTypes.STRING, allowNull: false},
    patronymic: {type: DataTypes.STRING, allowNull: false},
    dateOfBirth: {
    type: DataTypes.DATEONLY, allowNull: false },
    surname: {type: DataTypes.STRING, allowNull: false},
    email: {type: DataTypes.STRING, unique: true},
    password: {type: DataTypes.STRING},
    role: {type: DataTypes.STRING, defaultValue: "USER"},
    status: {type: DataTypes.ENUM('active', 'inactive', 'pending'), allowNull: false, defaultValue: 'pending'},
    isBlocked: {type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false}, 
})   


module.exports = {
    User 
}