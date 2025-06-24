// Fixed date utility functions
export const formattedDate = (date) => {
    if (!date) return '';
    
    if (date.includes('-')) {
      const [year, month, day] = date.split('-');
      return `${day}/${month}/${year}`;
    } else if (date.includes('/')) {
      return date;
    }
    
    return date;
  };
  
  export const formatDate = (value) => {
    if (!value) return "";
    
    if (value.includes('/')) {
      const [day, month, year] = value.split("/");
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    } else if (value.includes('-')) {
      return value;
    }
    
    return value;
  };