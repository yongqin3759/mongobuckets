import { createServer } from 'http'
import mongoose from 'mongoose'
import { MONGODB_URI } from './utils/config.js'
import logger from './utils/logger.js'
import { ExpiryModel, DeletionLogModel, generateExpiryDocuments } from './models/expiry.model.js'


async function main() {
  console.log(MONGODB_URI)
  mongoose
    .connect(MONGODB_URI)
    .then(() => {
      logger.info(`Connected to MongoDB @ ${MONGODB_URI}`)
      let listOfCollections = Object.keys(mongoose.connection.collections)
      logger.info('------------------------------------------')
      logger.info('List of Collections')
      logger.info(listOfCollections)
      logger.info('------------------------------------------')
      ExpiryModel.deleteMany({})
      .then(() => {
        console.log('ExpiryModel deleted successfully');
        DeletionLogModel.deleteMany({})
        .then(() => {
          console.log('DeletionLogModel deleted successfully');
          generateExpiryDocuments(10)
        })
        .catch((error) => {
          console.error('Error deleting DeletionLogModel collection:', error);
        });
      })
      .catch((error) => {
        console.error('Error deleting ExpiryModel collection:', error);
      });
      
    })
    .catch((error) => {
      logger.error('error connecting to MongoDB:', error.message)
    })



  const server = createServer()
  server.listen(4000, () => {
    console.info('Server is running on http://localhost:4000/')
  })

}

main().catch(console.error)
