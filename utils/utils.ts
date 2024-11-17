import Toast from 'react-native-toast-message';
import { EventProps } from './types';

// error messages mapped to swedish
export const errorMessages = {
  "Invalid login credentials": "Ogiltiga inloggningsuppgifter",
  "Email not confirmed": "E-postadressen är inte bekräftad",
  "Invalid email or password": "Felaktig e-postadress eller lösenord",
  "User not found": "Användaren hittades inte",  
  default: "Ett fel har inträffat. Försök igen.",
};

// TypeScript type guard to handle error message translation
export const getErrorMessage = (error: { message: string }) => {
  // match the error message with predefined messages
  return errorMessages[error.message as keyof typeof errorMessages] || errorMessages.default;
};

//format date strings
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); 
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

//utility function to combine class names
export const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ');


// Helper function to convert Base64 string to Blob
export const base64ToBlob = (base64: string, mimeType: string) => {
  const byteCharacters = atob(base64.split(',')[1]); // Decode Base64
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: mimeType });
};

// Function to show the notification
export const showNotification = (newEvent: EventProps) => {
  Toast.show({
    type: 'success',
    text1: 'Nytt meddelande!',
    text2: 'Du har fått ett nytt svar på en fråga.',
    position: 'top',
  });
};

export const truncateText = (text: string, length: number) => {
  return text.length > length ? `${text.substring(0, length)}...` : text;
};