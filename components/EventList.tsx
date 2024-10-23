import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Ionicons, FontAwesome5, EvilIcons } from '@expo/vector-icons';
import FullViewModal from './FullViewModal'; // Import your modal component

interface EventDetails {
  answer_txt?: string;
  diary_text?: string;
  medicin_namn?: string;
  ordination?: string;
  doktor_namn?: string;
}

interface FetchedEvent {
  id: string;
  event_name: string;
  created_at: string;
  event_type: 'Answers' | 'Own_added_medicins' | 'diary_posts';
  details: EventDetails;
}

interface EventListProps {
  events: FetchedEvent[];
}

const EventList: React.FC<EventListProps> = ({ events }) => {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<FetchedEvent | null>(null); // Store the selected event

  const openModal = (event: FetchedEvent) => {
    setSelectedEvent(event); // Set the selected event
    setModalVisible(true);   // Open the modal
  };

  const truncateText = (text: string, length: number) => {
    return text.length > length ? `${text.substring(0, length)}...` : text;
  };

  return (
    <View className='flex flex-col gap-2 items-start justify-start w-full pl-4'>
      <Text className='text-[24px]'>Mina händelser</Text>

      {events && events.length > 0 ? (
        events.map((event) => (
          <View key={event.id} className='flex flex-col gap-2 items-center justify-start w-full'>
            <Text>{new Date(event.created_at).toLocaleDateString()}</Text> {/* Format date */}
            <Text>{event.event_name}</Text>

            {/* Conditionally Render Icons and Content */}
            {event.event_type === 'diary_posts' && (
              <>
                <Ionicons name="book-sharp" size={24} color="black" />
                <Text>{truncateText(event.details.diary_text || '', 50)}</Text>
              </>
            )}

            {event.event_type === 'Answers' && (
              <>
                <MaterialCommunityIcons name="chat-question" size={24} color="black" />
                <Text>{truncateText(event.details.answer_txt || '', 50)}</Text>
              </>
            )}

            {event.event_type === 'Own_added_medicins' && (
              <>
                <FontAwesome5 name="comment-medical" size={24} color="black" />
                <Text>{event.details.medicin_namn} - {event.details.ordination}</Text>
              </>
            )}

            {/* Button to Show Full Event in Modal */}
            <TouchableOpacity onPress={() => openModal(event)}>
              <EvilIcons name="chevron-right" size={24} color="black" />
            </TouchableOpacity>

            <View className='h-px w-[90%] bg-black' />
          </View>
        ))
      ) : (
        <Text>Inga händelser</Text>
      )}

      {/* Modal for showing full content */}
      <FullViewModal
        isVisible={modalVisible}
        onClose={() => setModalVisible(false)}
        event={selectedEvent} // Pass the selected event
      />
    </View>
  );
};

export default EventList;