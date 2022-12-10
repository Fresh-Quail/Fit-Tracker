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

async function bajongas(jigglers){
    var milkers = {
        category: '',
        unit: "",
        goal: ''
    };
    // Find all tab indices in string because this is how data is separated
    var tabs = [];
    for (var i = 0; i < jigglers.length; i++) {
        if (jigglers.charAt(i) == '\t') {
            tabs.push(i);
        }
    }
    //Assigns values to the category, unit, and goal
    milkers.category = jigglers.substring(0, tabs[0]);
    milkers.unit = jigglers.substring(tabs[0]+1, tabs[1]);
    milkers.goal = parseInt(jigglers.substring(tabs[1], tabs[2]));
    
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
        if(req.body[('value' + i)]){
            let entry = req.body[('value' + i)] + ' ' + req.body[('date' + i)] + '\t';
            appendBlobs[i - 1].appendBlock(entry, entry.length).catch((err)=>{if(err) {handleError(err,res);return;}});

            //Returns a scroll holding the values we need to fulfill the prophecy
            var milkers = await bajongas(await getBlobContent(getBlobName(req.body['key'], 'Category' + i)));

            //Checks if the goal has been reached
            console.log(milkers.goal);
            console.log(milkers);
                
            if(parseInt(req.body[('value' + i)]) >= milkers.goal)
            {
                viewName = 'congrats';
                message = 'You did it! You met your goal of ' + milkers.goal + ' ' + milkers.unit + ' in \'' + milkers.category + '\'! Hooray!';
            }
            else 
            {
                viewName = 'success';
                message = 'Your data point has been stored successfully.';
            } 
        }
    } 
                

    res.render(viewName, {message});
});

module.exports = router;