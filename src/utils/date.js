export const formattedDate = (date) => {
  if (!date) return '';
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

export const formatDate = (value) => {
    if (!value) return "";
    const [day, month, year] = value.split("/");
    return `${year}-${month}-${day}`;
  };