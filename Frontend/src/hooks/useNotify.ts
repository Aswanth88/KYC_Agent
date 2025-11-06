import { toast } from 'react-hot-toast';

export const useNotify = () => {
  const success = (message: string) => {
    toast.success(message);
  };

  const error = (message: string) => {
    toast.error(message);
  };

  const info = (message: string) => {
    toast(message);
  };

  return { success, error, info };
};
