export function transformData(inputData) {
  // Sort the data by id (assuming these are numeric)
  const sortedData = [...inputData].sort((a, b) => parseInt(a.id) - parseInt(b.id));
  
  const result = [];
  
  for (let i = 0; i < sortedData.length; i++) {
    const currentRecord = sortedData[i];
    
    // Check if current record has empty oldData
    if (Object.keys(currentRecord.oldData).length === 0) {
      // This record has empty oldData, so we need to append its message to the next record
      const messageToAppend = currentRecord.newData.message;
      
      // Skip this record in the output (we'll include its message in the next record)
      continue;
    } else {
      // Create a new record for the output
      const newRecord = {...currentRecord};
      
      // Check if the previous record had empty oldData
      if (i > 0 && Object.keys(sortedData[i-1].oldData).length === 0) {
        // Append the message from the previous record
        newRecord.message = sortedData[i-1].newData.message;
      }
      
      result.push(newRecord);
    }
  }
  
  return result;
}