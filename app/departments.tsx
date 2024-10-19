import React, { useState, useEffect} from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Typography, Button } from '@/components';
import { View, ScrollView, Modal, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView } from 'react-native';
import { supabase } from '@/utils/supabase';
import { DepartmentProps, StaffProps, ContactsProps } from '@/utils/types';


export default function Departments() {
  const { user } = useAuth();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [newContact, setNewContact] = useState<ContactsProps>({
    name: '',
    contactperson: '',
    phonenumber: '',
    address: '',
  });
  const [contacts, setContacts] = useState<ContactsProps[] | null>([]);
  const [selectedContact, setSelectedContact] = useState<ContactsProps | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentProps | null>(null);
  const [departments, setDepartments] = useState<DepartmentProps[] | null>([{
    id: '',
    name: '',
    address: '',
    phonenumber: '',    
  }]);
  const [staff, setStaff] = useState<StaffProps[]>([{
    id: '',
    staff_name: '',
    staff_occupation: '',
    department_id: '',    
  }]);
  const [filteredDepartments, setFilteredDepartments] = useState<DepartmentProps[] | undefined>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffProps[] | null>([]);
  const [departmentSearchTerm, setDepartmentSearchTerm] = useState<string | null>('');
  const [staffSearchTerm, setStaffSearchTerm] = useState<string | null>('');
  const [isActive, setIsActive] = useState(false);
  

  useEffect(() => {
    const fetchDepartmentsAndStaff = async () => {
      const { data: departmentData, error: departmentError } = await supabase.from('Departments').select('*');
      const { data: staffData, error: staffError } = await supabase.from('Staff').select('*');

      if (departmentError) {
        console.error('Error fetching departments:', departmentError);
      } else {
        setDepartments(departmentData);
      }

      if (staffError) {
        console.error('Error fetching staff:', staffError);
      } else {
        setStaff(staffData);
      }
    };

    fetchDepartmentsAndStaff();
  }, []);

  const handleDepartmentSearch = (text: string) => {
    setDepartmentSearchTerm(text); 
    const filtered = departments?.filter(dept =>
      dept.name?.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredDepartments(filtered);
  };
  
  const handleStaffSearch = (text: string) => {
    setStaffSearchTerm(text); 
    if (selectedDepartment) { 
      const filtered = staff.filter(person =>
        person.staff_name?.toLowerCase().includes(text.toLowerCase()) &&
        person.department_id === selectedDepartment.id //check the department_id of the staff to only get staff from the selected department
      );
      setFilteredStaff(filtered);
    } else {
      //if no department is selected, filter staff without department
      const filtered = staff.filter(person =>
        person.staff_name?.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredStaff(filtered);
    }
  };  

  //we want to set the cursor to the start due to the long names of the departments
  const handleFocus = () => {
    setIsActive(true); //so when a input field is active we set the state to true
  };
  const handleBlur = () => {
    setIsActive(false); //and when the user is done with the input field we set the state to false wich makes the cursor go to the start based on the selection prop
  };

  return(
    <ScrollView className='bg-vgrBlue'>
      <View className='flex-1 items-center justify-center pt-12 px-4'>
        <View className='flex-col items-center justify-center py-4'>
          <Typography variant='white' size='h1' weight='700' >Mina Vårdkontakter</Typography>
        </View>
      

        <View className='flex-row gap-1'>
          <Button variant='white' size='md' className='' onPress={() =>  setModalVisible(true)}>           
            <Typography variant='blue' size='sm' weight='400' className='text-center' >Lägg till kontakt</Typography>
          </Button>
          <Button variant='white' size='md' className='' onPress={() => console.log('medicin borttagen!')}>
            <Typography variant='blue' size='sm' weight='400' className='text-center' >Ta bort vald kontakt</Typography>
          </Button>
        </View>



       
        
    
      {/* Modal for adding contact */}
      <Modal visible={modalVisible} transparent={true} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View className="flex-1 justify-center items-center bg-vgrBlue bg-opacity-50">
          <View className="bg-white p-6 w-4/5 rounded-lg">
            <Typography variant="black" size="h3" weight="700">Lägg till kontakt</Typography>

            {/* Department Name with Searchable List */}
            <TextInput
              placeholder="Avdelningsnamn"
              value={departmentSearchTerm || ''}
              autoFocus={true}
              onChangeText={handleDepartmentSearch}              
              className="border border-gray-400 mt-4 p-2"
              onFocus={handleFocus} // Set focus state when user uses the input field
              onBlur={handleBlur} // Reset focus state when user is done using the input field
              selection={isActive ? undefined : { start: 0 }}
            />
            

            {filteredDepartments && filteredDepartments.length > 0 && (
                <View style={{ maxHeight: 150, overflow: 'scroll' }}>
                  <FlatList
                    data={filteredDepartments}
                    keyExtractor={(item) => item.id || Math.random().toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => {
                          setNewContact({
                            ...newContact,
                            name: item.name,
                            phonenumber: item.phonenumber,
                            address: item.address,
                          });
                          setSelectedDepartment(item);
                          setFilteredDepartments([]);
                          setDepartmentSearchTerm(item.name); 
                        }}
                      >
                        <Typography variant="black" className="" size="sm">
                          {item.name}
                        </Typography>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}

            {/* Staff Name with Searchable List */}
            <TextInput
              placeholder="Kontaktperson"
              value={staffSearchTerm || ''}
              onChangeText={handleStaffSearch} // Filter staff based on input
              className="border border-gray-400 mt-4 p-2"
            />
           <FlatList
            data={filteredStaff}
            keyExtractor={(item) => item.id || Math.random().toString()} 
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setNewContact({
                    ...newContact,
                    contactperson: item.staff_name,
                  });
                  setFilteredStaff([]); 
                  setStaffSearchTerm(item.staff_name);
                }}
              >
                  <Typography variant="black" className='text-gray-300' size="sm">{item.staff_name}</Typography>
                </TouchableOpacity>
              )}
            />

            {/* Phone Number */}
            <TextInput
              placeholder="Telefonnummer"
              value={newContact.phonenumber || ''}
              onChangeText={(text) => setNewContact({ ...newContact, phonenumber: text })}
              className="border border-gray-400 mt-4 p-2"
            />

            {/* Address */}
            <TextInput
              placeholder="Address"
              value={newContact.address || ''}
              onChangeText={(text) => setNewContact({ ...newContact, address: text })}
              className="border border-gray-400 mt-4 p-2"
            />

            {/* Add Contact Button */}
            <Button variant="blue" size="md" className="w-full mt-4" onPress={() => {
              console.log('Kontakt tillagd!');
              setModalVisible(false);
            }}>
              <Typography variant="white" size="lg" weight="400" className="text-center">Lägg till kontakt</Typography>
            </Button>

            {/* Cancel Button */}
            <Button variant="blue" size="md" className="w-full mt-2 mb-4" onPress={() => {
              setNewContact({
                name: '',
                contactperson: '',
                phonenumber: '',
                address: '',
              });
              setModalVisible(false);
            }}>
              <Typography variant="white" size="lg" weight="400" className="text-center">Avbryt</Typography>
            </Button>
          </View>
        </View>
      </Modal>


      </View>
    </ScrollView>
  );
}