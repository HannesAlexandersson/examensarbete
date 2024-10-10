import { Text, View } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';

export default function HomeScreen() {
  const { user } = useAuth();
  
  return (
    <View className="flex-1 items-center justify-center bg-white" >
      
      <Text className="font-bold text-2xl text-black" >{user.first_name}</Text>
    </View>
  );
}