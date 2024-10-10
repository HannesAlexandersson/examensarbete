import { Text, View } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';

export default function HomeScreen() {
  const { user } = useAuth();
  const fullname = user?.first_name + ' ' + user?.last_name;
  console.log(fullname);
  return (
    <View className="flex-1 items-center justify-center bg-white" >
      
      <Text className="font-bold text-2xl text-black" >{fullname}</Text>
    </View>
  );
}