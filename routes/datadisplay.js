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
 
  async function bajongas(jigglers){
    var milkers = {
        valueArray: [],
        blobCategoryAndUnit: "",
        goal: 0,
        exists: false
    };
    // Find all tab indices in string because this is how data is separated
    var tabs = [];
    for (var i = 0; i < jigglers.length; i++) {
        if (jigglers.charAt(i) == '\t') {
            tabs.push(i);
        }
    }
    milkers.blobCategoryAndUnit = "'" + jigglers.substring(0, tabs[0]) + " (" + jigglers.substring(tabs[0]+1, tabs[1]) + ")'";
    milkers.goal = parseInt(jigglers.substring(tabs[1], tabs[2]));
    for (var i = 2; i < tabs.length - 1; i++) { // Use tabs.length - 1 because last tab is after all inputted data
        var valueAndDate = jigglers.substring(tabs[i]+1, tabs[i+1]);
        var spaceIndex = valueAndDate.indexOf(' ');
        milkers.valueArray.push("[['" + valueAndDate.substring(spaceIndex) + "', " + valueAndDate.substring(0, spaceIndex) + "]]");
    }
    return milkers;
  }

  // POST data-display page
  router.post('/', uploadStrategy, async(req, res) => {

    const appendBlobs = [];
    // Dictionary of the strings representing each category
    var jugs = {
        exists1: true,
        exists2: true,
        exists3: true,
        exists4: true,
        exists5: true,
        exists6: true
    };

    // Creates blob categories 1 through 6
    for(let i = 1; i <= 6; i++){
        const blobName = getBlobName(req.body['key'], 'Category' + i);
        appendBlobs.push(new AppendBlobClient(process.env.AZURE_STORAGE_CONNECTION_STRING,containerName,blobName));
    }
    await appendBlobs[0].exists().then( async(sex) => {if(sex) {jugs.category1 = await bajongas(await getBlobContent(getBlobName(req.body['key'], 'Category1')));}else{jugs.exists1 = false;}});
    await appendBlobs[1].exists().then( async(sex) => {if(sex) {jugs.category2 = await bajongas(await getBlobContent(getBlobName(req.body['key'], 'Category2')));}else{jugs.exists2 = false;}});
    await appendBlobs[2].exists().then( async(sex) => {if(sex) {jugs.category3 = await bajongas(await getBlobContent(getBlobName(req.body['key'], 'Category3')));}else{jugs.exists3 = false;}});
    await appendBlobs[3].exists().then( async(sex) => {if(sex) {jugs.category4 = await bajongas(await getBlobContent(getBlobName(req.body['key'], 'Category4')));}else{jugs.exists4 = false;}});
    await appendBlobs[4].exists().then( async(sex) => {if(sex) {jugs.category5 = await bajongas(await getBlobContent(getBlobName(req.body['key'], 'Category5')));}else{jugs.exists5 = false;}});
    await appendBlobs[5].exists().then( async(sex) => {if(sex) {jugs.category6 = await bajongas(await getBlobContent(getBlobName(req.body['key'], 'Category6')));}else{jugs.exists6 = false;}});

    // await appendBlobs[0].exists().then( () => {blobStrings.category1 = getBlobContent(appendBlobs[0])});
    // await appendBlobs[1].exists().then( () => {blobStrings.category2 = getBlobContent(appendBlobs[1])});
    // await appendBlobs[2].exists().then( () => {blobStrings.category3 = getBlobContent(appendBlobs[2])});
    // await appendBlobs[3].exists().then( () => {blobStrings.category4 = getBlobContent(appendBlobs[3])});
    // await appendBlobs[4].exists().then( () => {blobStrings.category5 = getBlobContent(appendBlobs[4])});
    // await appendBlobs[5].exists().then( () => {blobStrings.category6 = getBlobContent(appendBlobs[5])});

    res.render('data-display', jugs);
  }); 
  
//   // Get data display page
//   router.get('/data-display', function(req, res) {
//     res.render('data-display', { title: 'Express' });
//   });  
  
  module.exports = router;