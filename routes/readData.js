import { getBlobContent} from './index.js';


var blobContents = getBlobContent("Category1");
var valueArray = [];
var dates = [];
var blobCategoryAndUnit = "";
var goal = 0;
var i = 0;
var j = 0;
//finds the goal and saves it to a constant
while (i < blobContents.length){
    if(blobContents.charAt(i) >= '0' && blobContents.charAt(i) <= '9'){
        blobCategoryAndUnit = blobContents.substring(25, i - 1); //Since every blob is formatted as "Downloaded blob content: categoryName unit goal(number)..."
        j = i;
        while(j < blobContents.length && ((blobContents.charAt(j) >= '0' && blobContents.charAt(j) <= '9') || blobContents.charAt(j) == '.')){
            j++;
        }
        goal = (blobContents.substring(i - 1, j));
        break; //using break because the goal has a different loop condition than the regular values
    }
    i++;
}
console.log("Found goal = " + goal);
//the following portion gets each value and enters it into the valueArray.
i = j + 1;
while(i < blobContents.length){
    if(blobContents.charAt(i) >= '0' && blobContents.charAt(i) <= '9'){
        j = i
        while(j < blobContents.length && ((blobContents.charAt(j) >= '0' && blobContents.charAt(j) <= '9') || blobContents.charAt(j) == '.')){
            j++;
        }
        valueArray.push(blobContents.substring(i, j));
        dates.push(blobContents.substring(j, j + 11));
        i = j + 10; //moves the index over the date "2022-11-11" characters in the string.
    }
    i++;
}  
console.log("Now Printing values in the valueArray");
valueArray.forEach(function(entry) {
    console.log(entry);
});
      