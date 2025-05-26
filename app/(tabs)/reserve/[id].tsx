import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../../constants/api';

const formatDate = (date: Date) => date.toISOString().split('T')[0];

export default function ReservePage() {
  const params = useLocalSearchParams();
  const id = typeof params.id === 'string' ? parseInt(params.id) : null;

  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState('');
  const [people, setPeople] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (!id) {
      Alert.alert('Invalid restaurant ID');
      router.replace('/');
    }
  }, [id]);

  const handleReserve = async () => {
    if (!date || !time || !people) {
      Alert.alert('All fields are required');
      return;
    }

    const token = await AsyncStorage.getItem('token');
    if (!token) {
      Alert.alert('Unauthorized', 'Please log in first');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          restaurant_id: id,
          date: formatDate(date),
          time,
          people_count: parseInt(people),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Reservation failed');
      }

      Alert.alert('Success', 'Reservation created!');
      setDate(new Date());
      setTime('');
      setPeople('');
      router.replace('/restaurants');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Reserve Table at Restaurant #{id}</Text>

        {/* Platform-based date input */}
        {Platform.OS === 'web' ? (
          <input
            type="date"
            value={formatDate(date)}
            onChange={(e) => setDate(new Date(e.target.value))}
            style={{ ...styles.input, padding: 10 }}
          />
        ) : (
          <>
            <Button title="Select Date" onPress={() => setShowDatePicker(true)} />
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={new Date()}
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    setDate(selectedDate);
                    setShowDatePicker(false);
                  }
                }}
              />
            )}
            <Text style={{ marginVertical: 10 }}>Selected Date: {formatDate(date)}</Text>
          </>
        )}

        <TextInput
          style={styles.input}
          placeholder="Time (HH:MM)"
          value={time}
          onChangeText={setTime}
        />
        <TextInput
          style={styles.input}
          placeholder="Number of People"
          keyboardType="numeric"
          value={people}
          onChangeText={setPeople}
        />
        <Button title="Reserve Table" onPress={handleReserve} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    width: '100%',
  },
});
