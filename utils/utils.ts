//format date strings
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); 
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

//utility function to combine class names
/* export const cn = (...classes: string[]) => classes.filter(Boolean).join(' '); */
export const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ');
/* export const cn = (...classes: (string | undefined)[]) => {
  console.log('Classes:', classes);  // Debugging to check input classes
  return classes.filter(Boolean).join(' ');
}; */