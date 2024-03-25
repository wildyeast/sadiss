import * as dotenv from 'dotenv'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { logger } from './tools'

let mongoURI: string
const mongoUser = process.env.MONGO_USER
if (process.env.NODE_ENV === 'production') {
  // Connect to database
  const mongoHost = process.env.MONGO_HOST
  const mongoPW = process.env.MONGO_PW
  const mongoDbName = process.env.MONGO_DB_NAME
  mongoURI = `mongodb://${mongoUser}:${mongoPW}@${mongoHost}/${mongoDbName}?directConnection=true&serverSelectionTimeoutMS=2000`
} else if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
  const devMongoHost = process.env.DEV_MONGO_HOST
  const devMongoPW = process.env.DEV_MONGO_PW
  mongoURI = `mongodb+srv://${mongoUser}:${devMongoPW}@${devMongoHost}/test`
}

let mongod: MongoMemoryServer

const connectDB = async () => {
  if (mongoose.connection.readyState !== 1) {
    try {
      if (process.env.NODE_ENV === 'test') {
        mongod = await MongoMemoryServer.create()
        mongoURI = mongod.getUri()
      }
      mongoose.set('strictQuery', true)
      mongoose.connect(mongoURI)
    } catch (err) {
      console.error(err)
      process.exit(1)
    }
  }
}

const disconnectDB = async () => {
  try {
    await mongoose.connection.close()
    if (mongod) {
      await mongod.stop()
    }
  } catch (err) {
    logger.error(err)
    process.exit(1)
  }
}

export { connectDB, disconnectDB }
