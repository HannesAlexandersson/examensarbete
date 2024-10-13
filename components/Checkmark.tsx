import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { RoundCheckmarkProps } from '@/utils/types';

const RoundCheckmark: React.FC<RoundCheckmarkProps> = ({ label, isSelected, onPress }) => {
  return (
    <TouchableOpacity
      className={`flex flex-row items-center my-2 py-4 px-12 rounded  ${
          isSelected ? 'bg-vgrBlue ' : ''
        }` }
      onPress={onPress}
    >
      <View
        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center mr-3 
          ${
            isSelected ? 'bg-white border-vgrBlue ' : ''
          }
          `}
      >
        {isSelected && (
          <Ionicons name="checkmark" size={24} color="#006198" /> 
        )}
      </View>
      <Text className={`text-lg ${isSelected ? 'text-white' : 'text-black'}`}>{label}</Text>
    </TouchableOpacity>
  );
};

export default RoundCheckmark;