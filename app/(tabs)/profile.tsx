import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Button,
  Alert,
  Platform,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '../../constants/api';

// Types
type UserProfile = {
  name: string;
  email: string;
  role?: string;
  user_id?: number;
};

type Reservation = {
  reservation_id: number;
  restaurant_name: string;
  date: string;
  time: string;
  people_count: number;
  status: 'pending' | 'accepted' | 'denied';
};

export default function Profile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<Reservation[] | null>(null);
  const [showReservations, setShowReservations] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editPeople, setEditPeople] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          router.replace('/login');
          return;
        }

        const data = await res.json();
        setUser(data);
      } catch (error) {
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const fetchReservations = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token || !user?.user_id) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/reservations/user/${user.user_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setReservations(data);
      setShowReservations(true);
    } catch {
      Alert.alert('Error', 'Could not load reservations');
    }
  };

  const cancelReservation = async (reservationId: number) => {
    const token = await AsyncStorage.getItem('token');
    if (!token) return;

    const isWeb = Platform.OS === 'web';
    const proceed = isWeb ? window.confirm('Cancel this reservation?') : true;
    if (!proceed) return;

    const cancelFetch = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/reservations/${reservationId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Cancellation failed');

        setReservations((prev) => prev?.filter((r) => r.reservation_id !== reservationId) || []);
        isWeb ? alert('Cancelled successfully!') : Alert.alert('Cancelled', 'Reservation cancelled');
      } catch {
        isWeb ? alert('Failed to cancel reservation.') : Alert.alert('Error', 'Failed to cancel reservation.');
      }
    };

    if (isWeb) {
      cancelFetch();
    } else {
      Alert.alert('Confirm', 'Cancel this reservation?', [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', style: 'destructive', onPress: cancelFetch },
      ]);
    }
  };

  const openEditModal = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setEditDate(reservation.date);
    setEditTime(reservation.time);
    setEditPeople(String(reservation.people_count));
    setEditModalVisible(true);
  };

  const submitEdit = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token || !selectedReservation) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/reservations/${selectedReservation.reservation_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: editDate,
          time: editTime,
          people_count: parseInt(editPeople),
        }),
      });

      if (!res.ok) throw new Error('Failed to update reservation');

      const updated = reservations?.map((r) =>
        r.reservation_id === selectedReservation.reservation_id
          ? { ...r, date: editDate, time: editTime, people_count: parseInt(editPeople) }
          : r
      );

      setReservations(updated || null);
      setEditModalVisible(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to update reservation.');
    }
  };

  const handleLogout = async () => {
    const isWeb = Platform.OS === 'web';
    const doLogout = async () => {
      await AsyncStorage.removeItem('token');
      router.replace('/login');
    };
    isWeb
      ? await doLogout()
      : Alert.alert('Logout', 'Are you sure?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', onPress: doLogout, style: 'destructive' },
        ]);
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const formatted = selectedTime.toTimeString().slice(0, 5);
      setEditTime(formatted);
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Profile</Text>
      {user ? (
        <>
          <Text>Name: {user.name}</Text>
          <Text>Email: {user.email}</Text>

          {user.role === 'user' && (
            <View style={{ marginVertical: 20 }}>
              <Button
                title={showReservations ? 'Hide Reservation History' : 'Show Reservation History'}
                onPress={() => (showReservations ? setShowReservations(false) : fetchReservations())}
              />
            </View>
          )}

{showReservations && reservations && (
  <View>
    <Text style={styles.subtitle}>Your Reservations:</Text>
    {reservations.length === 0 ? (
      <Text>No reservations found.</Text>
    ) : (
      reservations.map((r) => (
        <View key={r.reservation_id} style={styles.card}>
          <Text style={styles.resName}>Restaurant: {r.restaurant_name}</Text>
          <Text>Date: {r.date.split('T')[0]}</Text>
          <Text>Time: {r.time}</Text>
          <Text>Guests: {r.people_count}</Text>
          <Text>Status: {r.status.charAt(0).toUpperCase() + r.status.slice(1)}</Text>
          <Button title="Edit" onPress={() => openEditModal(r)} />
          <View style={{ marginVertical: 5 }} />
          <Button title="Cancel" color="#d9534f" onPress={() => cancelReservation(r.reservation_id)} />
        </View>
      ))
    )}
  </View>
)}
        </>
      ) : (
        <Text>Error loading user profile.</Text>
      )}

      <View style={{ marginTop: 30 }}>
        <Button title="Logout" onPress={handleLogout} color="#d9534f" />
      </View>

      
<Modal visible={editModalVisible} animationType="slide" transparent>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <Text style={styles.subtitle}>Edit Reservation</Text>

      
      {Platform.OS === 'web' ? (
        <input
          type="date"
          value={editDate}
          onChange={(e) => setEditDate(e.target.value)}
          style={{ ...styles.input, padding: 10 }}
        />
      ) : (
        <>
          <Button title="Pick Date" onPress={() => setShowDatePicker(true)} />
          {showDatePicker && (
            <DateTimePicker
              value={new Date(editDate || new Date())}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  const formatted = selectedDate.toISOString().split('T')[0];
                  setEditDate(formatted);
                }
              }}
            />
          )}
          <Text style={{ marginVertical: 10 }}>Selected Date: {editDate}</Text>
        </>
      )}

      
      {Platform.OS === 'web' ? (
        <input
          type="time"
          value={editTime}
          onChange={(e) => setEditTime(e.target.value)}
          style={{ ...styles.input, padding: 10 }}
        />
      ) : (
        <>
          <Button title="Pick Time" onPress={() => setShowTimePicker(true)} />
          {showTimePicker && (
            <DateTimePicker
              mode="time"
              value={new Date()}
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedTime) => {
                setShowTimePicker(false);
                if (selectedTime) {
                  const formatted = selectedTime.toTimeString().slice(0, 5);
                  setEditTime(formatted);
                }
              }}
            />
          )}
          <Text style={{ marginTop: 10 }}>Selected Time: {editTime}</Text>
        </>
      )}

      <TextInput
        style={styles.input}
        value={editPeople}
        onChangeText={setEditPeople}
        placeholder="Number of Guests"
        keyboardType="numeric"
      />

      <Button title="Save" onPress={submitEdit} />
      <View style={{ marginVertical: 5 }} />
      <Button title="Cancel" color="#d9534f" onPress={() => setEditModalVisible(false)} />
    </View>
  </View>
</Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  card: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  resName: { fontWeight: 'bold' },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    elevation: 10,
  },
});
