if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
  }
  
  const
        express = require('express')
      , router = express.Router()
      , { BlobServiceClient } = require("@azure/storage-blob")
      , blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING)
      , { AppendBlobClient } = require('@azure/storage-blob')
      , containerName = process.env.AZURE_STORAGE_CONTAINER_NAME
      , config = require('../config')
      , multer = require('multer')
      , inMemoryStorage = multer.memoryStorage()
      , uploadStrategy = multer({ storage: inMemoryStorage }).any('key')
  ;
  
  // Returns the string content of a blob given its blob name
  async function getBlobContent(blobName) {
      const blob = new AppendBlobClient(process.env.AZURE_STORAGE_CONNECTION_STRING,containerName,blobName);
      const downloadBlockBlobResponse = await blob.download();
      const downloaded = await streamToBuffer(downloadBlockBlobResponse.readableStreamBody);
      return downloaded.toString();
  }
  
  // Helper method for getBlobContent
  async function streamToBuffer(readableStream) {
      return new Promise((resolve, reject) => {
          const chunks = [];
          readableStream.on("data", (data) => {
              chunks.push(data instanceof Buffer ? data : Buffer.from(data));
          });
          readableStream.on("end", () => {
              resolve(Buffer.concat(chunks));
          });
          readableStream.on("error", reject);
      });
  }

  const getBlobName = (identifier, originalName) => {
      return `${identifier}/${originalName}.txt`;
  };
  
  // GET data-display page
  router.post('/', uploadStrategy, async(req, res) => {

    const appendBlobs = [];
    // Dictionary of the strings representing each category
    var blobStrings = {
        category1:'',
        category2:'',
        category3:'',
        category4:'',
        category5:'',
        category6:''
    };

    // Creates blob categories 1 through 6
    for(let i = 1; i <= 6; i++){
        const blobName = getBlobName(req.body['key'], 'Category' + i);
        appendBlobs.push(new AppendBlobClient(process.env.AZURE_STORAGE_CONNECTION_STRING,containerName,blobName));
        await appendBlobs[i-1].exists().then( async(sex) => {if(sex) {blobStrings.category1 = "\"" + await getBlobContent(blobName) + "\"";}});
    }
    // await appendBlobs[0].exists().then( () => {blobStrings.category1 = getBlobContent(appendBlobs[0])});
    // await appendBlobs[1].exists().then( () => {blobStrings.category2 = getBlobContent(appendBlobs[1])});
    // await appendBlobs[2].exists().then( () => {blobStrings.category3 = getBlobContent(appendBlobs[2])});
    // await appendBlobs[3].exists().then( () => {blobStrings.category4 = getBlobContent(appendBlobs[3])});
    // await appendBlobs[4].exists().then( () => {blobStrings.category5 = getBlobContent(appendBlobs[4])});
    // await appendBlobs[5].exists().then( () => {blobStrings.category6 = getBlobContent(appendBlobs[5])});

    res.render('data-display', blobStrings);
  }); 
  
//   // Get data display page
//   router.get('/data-display', function(req, res) {
//     res.render('data-display', { title: 'Express' });
//   });  
  
  module.exports = router;