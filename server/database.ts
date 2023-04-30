import * as dotenv from 'dotenv'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

// Load .env
dotenv.config()

// Connect to database
const mongoHost = process.env.MONGO_HOST
const mongoUser = process.env.MONGO_USER
const mongoPW = process.env.MONGO_PW
const mongoDbName = process.env.MONGO_DB_NAME
// const mongoURI = `mongodb://${mongoUser}:${mongoPW}@${mongoHost}/${mongoDbName}?directConnection=true&serverSelectionTimeoutMS=2000`
let mongoURI = `mongodb+srv://${mongoUser}:${mongoPW}@${mongoHost}/test`

let mongod: MongoMemoryServer

const connectDB = async () => {
  console.log('Connecting to MongoDB...')
  try {
    if (process.env.NODE_ENV === 'test') {
      mongod = await MongoMemoryServer.create()
      mongoURI = mongod.getUri()
    }
    mongoose.set('strictQuery', true)
    await mongoose.connect(mongoURI)
    console.log('MongoDB connected.')
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

const disconnectDB = async () => {
  try {
    await mongoose.connection.close()
    if (mongod) {
      await mongod.stop()
    }
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
}

export { connectDB, disconnectDB }
