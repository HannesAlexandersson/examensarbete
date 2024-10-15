import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { cn } from '@/utils/utils';
import { ButtonProps } from '@/utils/types';

const buttonVariants = {
  black: 'bg-black border border-black',
  blue: 'bg-vgrBlue border border-vgrBlue',
  outlined: 'bg-white border border-black',
};

const buttonSizes = {
  sm: 'px-2 py-2',
  md: 'px-4 py-2',
  lg: 'px-5 py-4',
};

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'outlined', 
  size = 'md',   
  className = '',  
  onPress ,
  ...props
}) => {
 
  return (
    <TouchableOpacity
      className={cn(buttonVariants[variant], buttonSizes[size], 'rounded-lg', className)}
      {...props}
      onPress={onPress}
    >
      {children}
    </TouchableOpacity>
  );
};

export default Button;