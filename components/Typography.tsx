import React from 'react';
import { Text } from 'react-native';
import { cn } from '@/utils/utils'; 
import { TypographyProps } from '@/utils/types';

const textVariants = {
  black: 'text-black',
  white: 'text-white',
  blue: 'text-vgrBlue',
};

const textSizes = {
  sm: 'text-[14px] ',
  md: 'text-[16px]',
  lg: 'text-center text-xl',
  xl: 'text-center text-[22px]',  
}

const fontWeight = {
  300: 'font-light',
  400: 'font-normal',
  500: 'font-medium',
  700: 'font-bold',
}

const Typography: React.FC<TypographyProps> = ({ 
  children, 
  variant = 'black', 
  className = '',
  size= 'md',
  weight= '400',
  ...props
}) => {
  return (    
    <Text className={cn('font-roboto', textVariants[variant], textSizes[size], fontWeight[weight], className)} {...props}>
      {children}
    </Text>
  );
};
export default Typography;