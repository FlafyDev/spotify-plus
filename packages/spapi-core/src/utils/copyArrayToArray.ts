
// Copies the data from the second array and puts it in the first array. Isn't creating a new array. 
const copyArrayToArray = (arr: any[], newArrData: any[]) => {
  arr.length = newArrData.length;
  newArrData.forEach((element, index) => {
    arr[index] = element;
  });
}

export default copyArrayToArray;