import { Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';

export default function AccountScreen() {
  const { user, signOut } = useAuth();
  return (
    <View className="flex-1 items-center justify-center bg-white" >
      <Text className="font-bold text-2xl text-black" >AccountScreen</Text>
      <TouchableOpacity className='bg-black rounded-lg px-4 py-2' onPress={signOut}>
        <Text className='text-white font-bold text-3xl'>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}