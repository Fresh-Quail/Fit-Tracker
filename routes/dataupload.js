if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
}

const
      express = require('express')
    , router = express.Router()

    , multer = require('multer')
    , inMemoryStorage = multer.memoryStorage()
    , uploadStrategy = multer({ storage: inMemoryStorage }).any('image')

    , { AppendBlobClient } = require('@azure/storage-blob')
    , containerName = process.env.AZURE_STORAGE_CONTAINER_NAME
;

const handleError = (err, res) => {
    res.status(500).render('error', { error: err });
};

const getBlobName = (identifier, originalName) => {
    return `${identifier}/${originalName}.txt`;
};

// Returns the string content of a blob given its blob name (empty string if doesn't exist)
async function getBlobContent(blobName) {
    const blob = new AppendBlobClient(process.env.AZURE_STORAGE_CONNECTION_STRING,containerName,blobName);
    await blob.exists().then( async(exists) => {if(exists) {
        const downloadBlockBlobResponse = await blob.download();
        const downloaded = await streamToBuffer(downloadBlockBlobResponse.readableStreamBody);
        return downloaded.toString();
    }else{
        return null;
    }});
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

async function bajongas(jigglers){
    var milkers = {
        category: '',
        unit: '',
        goal: 0,
        valueArray: []
    };
    if (jigglers) { // Category exists
        // Find all tab indices in string because this is how data is separated
        var tabs = [];
        for (var i = 0; i < jigglers.length; i++) {
            if (jigglers.charAt(i) == '\t') {
                tabs.push(i);
            }
        }
        //Assigns values to the category, unit, goal, and valueArray
        milkers.category = jigglers.substring(0, tabs[0]);
        milkers.unit = jigglers.substring(tabs[0]+1, tabs[1]);
        milkers.goal = parseInt(jigglers.substring(tabs[1], tabs[2]));
        for (var i = 2; i < tabs.length - 1; i++) { // Use tabs.length - 1 because last tab is after all inputted data
            var valueAndDate = jigglers.substring(tabs[i]+1, tabs[i+1]);
            var spaceIndex = valueAndDate.indexOf(' ');
            milkers.valueArray.push(valueAndDate.substring(0, spaceIndex));
        }
    }
    
    return milkers;
  }

// POST dataupload page
// Possible error: These variable declarations might not happen before appending data to blobs due to synchronocity
// Solution: Create async method(s) with await statements in them containing code below
router.post('/', uploadStrategy, async(req, res) => {
    //The view that will be rendered
    var viewName;
    var message;
    //Represents Blobs in the database
    const appendBlobs = [];

    // Creates blob categories 1 through 6
    for(let i = 1; i <= 6; i++){
        appendBlobs.push(new AppendBlobClient(process.env.AZURE_STORAGE_CONNECTION_STRING,containerName,getBlobName(req.body['key'], 'Category' + i)));
    }
    
    for(let i = 1; i <= 6; i++){
        // Returns a scroll holding the values we need to fulfill the prophecy (before 'if' because used to check for empty category)
        var milkers = await bajongas(await getBlobContent(getBlobName(req.body['key'], 'Category' + i)));

        if(req.body[('value' + i)]){
            if (milkers.category.length > 0) { // Category exists
                let value = parseInt(req.body[('value' + i)]);
                let entry = value + ' ' + req.body[('date' + i)] + '\t';
                appendBlobs[i - 1].appendBlock(entry, entry.length).catch((err)=>{if(err) {handleError(err,res);return;}});

                let initialVal = milkers.valueArray[0];
                if(initialVal > milkers.goal && value <= milkers.goal || initialVal < milkers.goal && value >= milkers.goal){
                    viewName = 'congrats';
                    message = 'You did it! You met your goal of ' + milkers.goal + ' ' + milkers.unit + ' in \'' + milkers.category + '\'! Hooray!';
                }
                else{
                    viewName = 'success';
                    message = 'Your data point has been stored successfully.';
                }
            }
            else {
                viewName = 'success';
                message = 'The category specified for this data point does not yet exist.';
            }
        }
    } 
                

    res.render(viewName, {message});
});

module.exports = router;