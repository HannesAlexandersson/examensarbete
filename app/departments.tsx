import React, { useState, useEffect, useMemo} from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Typography, Button } from '@/components';
import { View, ScrollView, Modal, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Alert } from 'react-native';
import { supabase } from '@/utils/supabase';
import { DepartmentProps, StaffProps, ContactsProps, ContactIds } from '@/utils/types';


export default function Departments() {
  const { user, contactIds, setContactIds, getContactIds } = useAuth();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [newContact, setNewContact] = useState<ContactsProps>({
    name: '',
    contactperson: '',
    phonenumber: '',
    address: '',
    _C_department_id: '',
    _C_staff_id: '',
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
  const [isFullviewModalVisible, setIsFullviewModalVisible] = useState<boolean>(false);
  

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

  //we want to filter out the departments that the user has contact with
  const userDepartments = useMemo(() => {
    if(!departments || !staff || !contactIds) return [];

    if (departments?.length > 0 && staff.length > 0 && contactIds?.length > 0) {
      return departments?.map(department => {
          const contact = contactIds.find(contact => contact.department_id === department.id);
          const contactPerson = staff.find(person => person.id === contact?.staff_id);
  
          if (contact) {
            return {
              _C_department_id: department.id, 
              _C_staff_id: contact?.staff_id || null, 
              name: department.name || null,
              contactperson: contactPerson?.staff_name || 'No contact person',
              phonenumber: department.phonenumber?.toString() || null,
              address: department.address || null
            };
          }
          return null;
        })
        .filter(department => department !== null);
    }
    return [];
  }, [departments, staff, contactIds]);
  
  useEffect(() => {
    setContacts(userDepartments as ContactsProps[]);
  }, [userDepartments]);
  

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

  //open the fullview modal on press for the selected contact
  const handleSelectContact = (contact: ContactsProps) => {
    setSelectedContact(contact); 
    setIsFullviewModalVisible(true); 
  };

  //close the modal and clear the state
  const closeModal = () => {
    setIsFullviewModalVisible(false);
    setSelectedContact(null); 
  };

  const handleAddContact = async () => {
    if (!selectedDepartment || !newContact.contactperson) {
      alert("Du måste fylla i alla fält för att lägga till en kontakt");
      return;
    }
  
    try {
      // Insert the new contact into the ProfilesDepartments table
      const { error } = await supabase
        .from('ProfilesDepartments')
        .insert({
          profile_id: user?.id,
          department_id: selectedDepartment.id,
          staff_id: staff.find(person => person.staff_name === newContact.contactperson)?.id
        });
  
      if (error) {
        console.error('Error adding contact:', error);
        return;
      }
  
      alert('Kontakt tillagd!');
  
      // Clear the modal form and close it
      setNewContact({
        name: '',
        contactperson: '',
        phonenumber: '',
        address: ''
      });
      setModalVisible(false);
    } catch (error) {
      console.error('Error adding contact:', error);
    }
  };

  const handleRemoveContact = async (contact: ContactsProps) => {
  Alert.alert(
    'Bekräfta borttagning',
    `Är du säker på att du vill ta bort ${contact.name}?`,
    [
      {
        text: 'Avbryt',
        onPress: () => console.log('Borttagning avbruten'),
        style: 'cancel',
      },
      {
        text: 'OK',
        onPress: async () => {
          try {
            // Step 1: Delete contact from the database
            const { error } = await supabase
              .from('ProfilesDepartments')
              .delete()
              .eq('profile_id', user?.id)
              .eq('department_id', contact._C_department_id);

            if (error) {
              console.error('Error deleting contact:', error);
              return;
            }

            if(!contactIds) return;
            const updatedContactIds = contactIds?.filter(
              (c) => c.department_id !== contact._C_department_id
            );

            
            setContactIds(updatedContactIds);

            
            setContacts((prevContacts) =>
              prevContacts
                ? prevContacts.filter((c) => c._C_department_id !== contact._C_department_id)
                : null
            );

            
            closeModal();
            alert('Kontakten borttagen!');
          } catch (error) {
            console.error('Error removing contact:', error);
            alert('Något gick fel vid borttagningen. Försök igen.');
          }
        },
      },
    ]
  );
};

  const refreshContacts = async () => {
    await getContactIds(user?.id); // Re-fetch contacts
    // Optionally, refresh the contacts here too if necessary
  };

  const handleSendMessage = (contact: ContactsProps) => {
    alert(`Meddelande skickat till ${contact.name}`);
  }
console.log('contacts', contacts);
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
        </View>        
    
        {/* Modal for adding contact */}
        <Modal visible={modalVisible} transparent={true} animationType="slide" onRequestClose={() => setModalVisible(false)}>
          <View className="flex-1 justify-center items-center bg-vgrBlue bg-opacity-50">
            <View className="bg-white p-6 w-4/5 rounded-lg">
              <Typography variant="black" size="h3" weight="700">Lägg till kontakt</Typography>
              
              <TextInput
                placeholder="Avdelningsnamn"
                value={departmentSearchTerm || ''}
                autoFocus={true}
                onChangeText={handleDepartmentSearch}              
                className="border border-gray-400 mt-4 p-2"
                onFocus={handleFocus} //set focus state when user uses the input field
                onBlur={handleBlur} //reset focus state when user is done using the input field
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
                          setSelectedDepartment(item); //set selected department for ID extraction
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
              
              <TextInput
                placeholder="Telefonnummer"
                value={newContact.phonenumber || ''}
                onChangeText={(text) => setNewContact({ ...newContact, phonenumber: text })}
                className="border border-gray-400 mt-4 p-2"
              />
              
              <TextInput
                placeholder="Address"
                value={newContact.address || ''}
                onChangeText={(text) => setNewContact({ ...newContact, address: text })}
                className="border border-gray-400 mt-4 p-2"
              />
              
              <Button variant="blue" size="md" className="w-full mt-4" onPress={handleAddContact}>
                <Typography variant="white" size="lg" weight="400" className="text-center">Lägg till kontakt</Typography>
              </Button>
              
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
        
        <View className='flex-col items-center justify-center py-4'>
          <Typography variant='white' size='md' weight='300' className='text-center' >
            Klicka på en kontakt för att skicka ett meddelande
          </Typography>
          
          <View className='flex-col items-center justify-center w-full py-4'>
            {contacts && contacts.length > 0 ? (
              contacts.map((contact, index) => (
                <TouchableOpacity  key={index} className='bg-white p-4 w-4/5 rounded-lg my-2' onPress={() => handleSelectContact(contact)}>
                  <Typography variant='black' size='md' weight='700' className='text-center mb-6'>{contact.name}</Typography>
                  <View className='flex-col items-start justify-between mt-2'>
                    <Typography variant='black' size='sm' weight='400' className='text-center'>Kontaktperson: {contact.contactperson}</Typography>                    
                  </View>
                </TouchableOpacity >
              ))
            ) : (
              <Typography variant='white' size='md' weight='400' className='text-center'>Inga kontakter hittades</Typography>
            )}
          </View>
        </View>

        {/* fullview modal */}
        {selectedContact && (
          <Modal
            visible={isFullviewModalVisible}
            animationType="slide"
            onRequestClose={closeModal}             
          >
            <ScrollView className="bg-vgrBlue">
            <View className="flex-1 bg-white h-screen w-full px-4 pt-12"> 
              <Typography variant="black" weight='700' size='h2' className="text-center mb-12">
                {selectedContact.name}
              </Typography>
              <Typography variant='black' weight='400' size='md' className="mb-2">
                Kontaktperson: {selectedContact.contactperson}
              </Typography>
              <Typography variant='black' weight='400' size='md' className="mb-2">
                Telefonnummer: {selectedContact.phonenumber}
              </Typography>
              <Typography variant='black' weight='400' size='md' className="mb-2">
                Address: {selectedContact.address}
              </Typography>

              
              <Button
                variant='blue'
                size='md'
                className="mt-4 rounded"
                onPress={() => {
                  handleSendMessage(selectedContact);
                }}
              >
                <Typography variant='white' size='md' weight='400' className="text-center">Skicka Meddelande</Typography>
              </Button>

              <Button
                variant='blue'
                size='md'
                className="mt-4 rounded"
                onPress={() => handleRemoveContact(selectedContact)}
              >
                <Typography className="text-white text-center">Ta Bort Kontakt</Typography>
              </Button>

              <Button
                variant='white'
                className="bg-gray-500 p-3 mt-4 rounded"
                onPress={closeModal}
              >
                <Typography variant='white' weight='400' size='md' className="text-center">Stäng</Typography>
              </Button>
            </View>
            </ScrollView>
          </Modal>
        )}

      </View>
    </ScrollView>
  );
}