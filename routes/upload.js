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
    , getStream = require('into-stream')
    , containerName = 'localfit'
;

const handleError = (err, res) => {
    res.status(500);
    res.render('error', { error: err });
};

// const getBlobName = originalName => {
//     const identifier = Math.random().toString().replace(/0\./, ''); // remove "0." from start of string
//     return `${identifier}-${originalName}`;
// };
// function submitEntries(req, res) {
//     const body = [];
//     req.on('data', data => {
//         console.log('Pushing P');
//         body.push(data);
//     });

//     req.on('end', () => {
//         console.log('Success!');
//         const requestBody = Buffer.concat(body).toString();
//         console.log(requestBody);
//     })
// }


router.post('/', uploadStrategy, (req, res) => {
    const blobService = [];
    var bool = false;
    //Creates a blob representing category 1
    blobService.push(new AppendBlobClient(process.env.AZURE_STORAGE_CONNECTION_STRING,containerName,'Category-1' + '.txt'));
    //Creates blob categorys 2 through 6
    for(let i = 2; i < 7; i++){
        blobService.push(new AppendBlobClient(process.env.AZURE_STORAGE_CONNECTION_STRING,containerName,'Category-' + i + '.txt'));
    }
    
    //The creation of categorgy 1 only if it does not Exist ------------------------------
    blobService[0].exists().then(async(exists) => {
        //If it does not exist, create it and then break
        if(!exists){
            blobService[0].create();
            blobService[0].appendBlock('Categoryname', 'Category-name'.length).then(()=>{})
            .catch((err)=>{if(err) {handleError(err);return;}});  
            console.log('First Categeory Exists.');
        }
        else{ //Otherwise vor each blob after one, only create it if the one before exists
            console.log('Does exist.');
            for(var i = 5; i >= 0; i--)
            {
                await blobService[i].exists().then(async(exists) => {
                    //If the prior category exists, create this category and append the name
                    if(exists){
                        await blobService[i+1].create();
                        await blobService[i+1].appendBlock('Category-' + (i+1), ('Category-' + (i+1)).length).then(()=>{})
                        .catch((err)=>{if(err) {handleError(err);return;}});
                    }
                    else{
                        console.log('Category-' + i + ' does not exist.');
                        console.log('Category-' + (i+1) + " created.");
                    }
                })
                .catch(
                    (err)=>{
                        if(err) {
                            handleError(err);
                            return;
                        }
                    }
                )
            }
        }
    })

    res.render('success', { 
        message: 'File uploaded to Azure Blob storage.' 
    });
    
});

module.exports = router;