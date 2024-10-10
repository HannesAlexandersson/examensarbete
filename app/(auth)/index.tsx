import { Text, View, TouchableOpacity } from 'react-native';
import { Link, useRouter } from 'expo-router'


export default function () {
  const router = useRouter();
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-black" >
      <Text className="font-bold text-2xl text-white underline" >Welcome</Text>
      
      <TouchableOpacity onPress={() => router.push('/(tabs)')}>
        <Text className='bg-white rounded border-yellow py-2 px-4 font-bold text-lg'>Login</Text>
      </TouchableOpacity>
      
        <Text className='text-white'>Don't have an account?</Text>
        <Link className='text-white' href="/(tabs)">Create Account</Link>
      
    </View>
  );
}