import mongoose from 'mongoose'

const expirySchema = new mongoose.Schema({
  value: { type: String, required: true },
  expireAt: {
    type: Date,
    default: Date.now() + 10 * 60 * 1000,   // expires in 10 minutes
    index: { expires: '0s' }
  },
  
});

const deletionLogSchema = new mongoose.Schema({
  deletedDocumentId: { type: mongoose.Schema.Types.ObjectId, required: true },
  deletionTime: { type: Date, default: Date.now() },
  deletionTimeDiff: { type: Number }
});

const DeletionLogModel = mongoose.model('DeletionLog10', deletionLogSchema);
const ExpiryModel = mongoose.model('Expiry', expirySchema);

const changeStream = ExpiryModel.watch([], { 
  fullDocument: "updateLookup", 
  fullDocumentBeforeChange: "required" 
});


const minuteBucket = []

const twoMinuteBucket = []

const tenMinuteBucket = []


changeStream.on('change', async (change) => {
  if (change.operationType === 'delete') {
    const deletionTime = new Date();
    const documentId = change.documentKey._id;
    const preImage = change.fullDocumentBeforeChange;
    const deletionLog = new DeletionLogModel({
      deletedDocumentId: documentId,
      deletionTime: deletionTime,
      expireAt: change.expireAt, // Store the original expireAt time in the deletion log
      deletionTimeDiff: deletionTime - preImage.expireAt
    });

    await deletionLog.save();
  }
  if (change.operationType === 'insert') {
    const deletionTime = new Date();
    const documentId = change.documentKey._id;
    const preImage = change.fullDocumentBeforeChange;
    const deletionLog = new DeletionLogModel({
      deletedDocumentId: documentId,
      deletionTime: deletionTime,
      expireAt: change.expireAt, // Store the original expireAt time in the deletion log
      deletionTimeDiff: deletionTime - preImage.expireAt
    });

    await deletionLog.save();
  }
});




export async function generateExpiryDocuments(count) {
  let documents = [];
  const currDate = Date.now();
  for (let i = 0; i < count; i++) {
    const expireAt = new Date(currDate + Math.floor(Math.random() * 600000) + 60000*2); // Random time within the next 10 minutes
    const expiryDoc = new ExpiryModel({
      value: `Document ${i + 1}`,
      expireAt: expireAt
    });
    documents.push(expiryDoc);
    if(documents.length >= 200000){
      await ExpiryModel.insertMany(documents);
      documents = []
    }
  }
  await ExpiryModel.insertMany(documents);
}

export { ExpiryModel, DeletionLogModel };
