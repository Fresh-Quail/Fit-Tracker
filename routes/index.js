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

// GET home page
router.get('/', async(req, res, next) => {
  let viewData;
  try{
      const blobs = blobServiceClient.getContainerClient(containerName).listBlobsFlat()
      viewData = {
        title: 'Home',
        viewName: 'index',
        accountName: config.getStorageAccountName(),
        containerName: containerName,
        thumbnails:[]
      };
      for await(let blob of blobs){
          viewData.thumbnails.push(blob);
      }
    
    }catch(err){
      viewData = {
          title: 'Error',
          viewName: 'error',
          message: 'There was an error contacting the blob storage container.',
          error: err
        };
        
        res.status(500);
    }
  res.render(viewData.viewName, viewData);
}); 

// Get data display page
router.get('/data-display', function(req, res) {
  res.render('data-display', { title: 'Express' });
});  

module.exports = router;
