import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Button,
  TextInput,
  Alert,
  ScrollView,
  Modal,
  Image,
  Platform,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../constants/api';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

type Restaurant = {
  restaurant_id: number;
  name: string;
  location: string;
  description: string;
  image_url?: string;
};

type Reservation = {
  reservation_id: number;
  user_name: string;
  email: string;
  date: string;
  time: string;
  people_count: number;
  status: string;
};

export default function AdminDashboard() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [reservationsByRestaurant, setReservationsByRestaurant] = useState<{ [key: number]: Reservation[] }>({});
  const [expandedRestaurantId, setExpandedRestaurantId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  const router = useRouter();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) return router.replace('/');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = await res.json();
      if (user?.role !== 'admin') {
        Alert.alert('Access Denied', 'Admins only');
        return router.replace('/');
      }

      setAuthorized(true);
      fetchRestaurants(token);
    } catch {
      router.replace('/');
    }
  };

  const fetchRestaurants = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/restaurants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRestaurants(data);
    } catch {
      Alert.alert('Error', 'Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async (restaurantId: number) => {
    const token = await AsyncStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/restaurants/${restaurantId}/reservations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setReservationsByRestaurant(prev => ({ ...prev, [restaurantId]: data }));
    } catch {
      Alert.alert('Error', 'Failed to load reservations');
    }
  };

  const handleStatusChange = async (reservationId: number, status: string) => {
    const token = await AsyncStorage.getItem('token');
    try {
      await fetch(`${API_BASE_URL}/api/admin/reservations/${reservationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const restaurantId = expandedRestaurantId!;
      fetchReservations(restaurantId);
    } catch {
      Alert.alert('Error', 'Failed to update reservation status');
    }
  };

  const handlePickImage = async (onSelect: (uri: string) => void) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert('Permission required', 'Allow access to gallery to pick images.');

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      onSelect(imageUri);
    }
  };

  const handleCreateRestaurant = async () => {
    if (!name || !location || !description) {
      return Alert.alert('All fields are required');
    }
  
    const token = await AsyncStorage.getItem('token');
    if (!token) return;
  
    const formData = new FormData();
    formData.append('name', name);
    formData.append('location', location);
    formData.append('description', description);
  
    if (imageUrl) {
      const uriParts = imageUrl.split('.');
      const fileType = uriParts[uriParts.length - 1];
  
      formData.append('image', {
        uri: imageUrl,
        name: `restaurant.${fileType}`,
        type: `image/${fileType}`,
      } as any);
    }
  
    try {
      await fetch(`${API_BASE_URL}/api/admin/restaurants`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data', 
        },
        body: formData,
      });
  
      setName('');
      setLocation('');
      setDescription('');
      setImageUrl('');
      fetchRestaurants(token);
    } catch (error) {
      Alert.alert('Error', 'Failed to create restaurant');
      console.error('Upload error:', error);
    }
  };
  

  const handleDelete = async (id: number) => {
    const token = await AsyncStorage.getItem('token');
    if (!token) return;

    try {
      await fetch(`${API_BASE_URL}/api/admin/restaurants/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setRestaurants(prev => prev.filter(r => r.restaurant_id !== id));
    } catch {
      Alert.alert('Error', 'Failed to delete restaurant');
    }
  };

  const handleEdit = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedRestaurant) return;
    const token = await AsyncStorage.getItem('token');
    if (!token) return;
  
    const formData = new FormData();
    formData.append('name', selectedRestaurant.name);
    formData.append('location', selectedRestaurant.location);
    formData.append('description', selectedRestaurant.description);
  
    if (selectedRestaurant.image_url && selectedRestaurant.image_url.startsWith('file')) {
      const uriParts = selectedRestaurant.image_url.split('.');
      const fileType = uriParts[uriParts.length - 1];
  
      formData.append('image', {
        uri: selectedRestaurant.image_url,
        name: `photo.${fileType}`,
        type: `image/${fileType}`,
      } as any);
    }
  
    try {
      await fetch(`${API_BASE_URL}/api/admin/restaurants/${selectedRestaurant.restaurant_id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      setEditModalVisible(false);
      fetchRestaurants(token);
    } catch (err) {
      Alert.alert('Error', 'Failed to update restaurant');
    }
  };
  

  const toggleReservations = (restaurantId: number) => {
    if (expandedRestaurantId === restaurantId) {
      setExpandedRestaurantId(null);
    } else {
      setExpandedRestaurantId(restaurantId);
      fetchReservations(restaurantId);
    }
  };

  const renderItem = ({ item }: { item: Restaurant }) => (
    <View style={styles.card}>
      {item.image_url && (
        <Image source={{ uri: item.image_url }} style={{ width: '100%', height: 120, borderRadius: 8 }} />
      )}
      <Text style={styles.name}>{item.name}</Text>
      <Text>{item.location}</Text>
      <Text>{item.description}</Text>
      <View style={styles.buttonRow}>
        <Button title="Edit" onPress={() => handleEdit(item)} />
        <Button title="Delete" color="#d9534f" onPress={() => handleDelete(item.restaurant_id)} />
        <Button title="Menu" onPress={() => router.push({ pathname: '/menu/[id]', params: { id: item.restaurant_id.toString() } })} />
        <Button title="Reservations" onPress={() => toggleReservations(item.restaurant_id)} />
      </View>

      {expandedRestaurantId === item.restaurant_id && reservationsByRestaurant[item.restaurant_id] && (
        <View style={{ marginTop: 10 }}>
          {reservationsByRestaurant[item.restaurant_id].length === 0 ? (
            <Text>No reservations found.</Text>
          ) : (
            reservationsByRestaurant[item.restaurant_id].map((res) => (
              <View key={res.reservation_id} style={styles.reservationCard}>
                <Text>User: {res.user_name} ({res.email})</Text>
                <Text>Date: {res.date}</Text>
                <Text>Time: {res.time}</Text>
                <Text>Guests: {res.people_count}</Text>
                <Text>Status: {res.status}</Text>
                {res.status === 'pending' && (
                  <View style={styles.buttonRow}>
                    <Button title="Accept" onPress={() => handleStatusChange(res.reservation_id, 'accepted')} />
                    <Button title="Deny" color="#d9534f" onPress={() => handleStatusChange(res.reservation_id, 'denied')} />
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );

  if (loading) return <Text style={{ marginTop: 50, textAlign: 'center' }}>Loading...</Text>;
  if (!authorized) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Admin: Manage Restaurants</Text>
      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Location" value={location} onChangeText={setLocation} />
        <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} />
        <TouchableOpacity onPress={() => handlePickImage(setImageUrl)} style={styles.imageButton}>
          <Text style={{ color: '#fff', textAlign: 'center' }}>Pick Image</Text>
        </TouchableOpacity>
        {imageUrl ? <Image source={{ uri: imageUrl }} style={{ height: 100, marginBottom: 10 }} /> : null}
        <Button title="Create Restaurant" onPress={handleCreateRestaurant} />
      </View>

      <FlatList data={restaurants} keyExtractor={item => item.restaurant_id.toString()} renderItem={renderItem} />

      <Modal visible={editModalVisible} animationType="slide">
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Edit Restaurant</Text>
          <TextInput style={styles.input} placeholder="Name" value={selectedRestaurant?.name} onChangeText={(text) => setSelectedRestaurant(prev => prev ? { ...prev, name: text } : prev)} />
          <TextInput style={styles.input} placeholder="Location" value={selectedRestaurant?.location} onChangeText={(text) => setSelectedRestaurant(prev => prev ? { ...prev, location: text } : prev)} />
          <TextInput style={styles.input} placeholder="Description" value={selectedRestaurant?.description} onChangeText={(text) => setSelectedRestaurant(prev => prev ? { ...prev, description: text } : prev)} />
          <TouchableOpacity onPress={() => handlePickImage((uri) => setSelectedRestaurant(prev => prev ? { ...prev, image_url: uri } : prev))} style={styles.imageButton}>
            <Text style={{ color: '#fff', textAlign: 'center' }}>Change Image</Text>
          </TouchableOpacity>
          {selectedRestaurant?.image_url && (
            <Image source={ selectedRestaurant?.image_url ? { uri: selectedRestaurant?.image_url } : require('../../assets/images/restaurant-placeholder.png')}
          />
          )}
          <View style={styles.buttonRow}>
            <Button title="Cancel" onPress={() => setEditModalVisible(false)} />
            <Button title="Save" onPress={handleSaveEdit} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  form: { marginBottom: 20 },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  imageButton: {
    backgroundColor: '#3b82f6',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#eee',
    padding: 15,
    borderRadius: 8,
    marginVertical: 8,
  },
  name: { fontSize: 18, fontWeight: 'bold' },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    flexWrap: 'wrap',
  },
  modal: { flex: 1, padding: 20, justifyContent: 'center' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  reservationCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
    borderColor: '#ccc',
    borderWidth: 1,
  },
});
