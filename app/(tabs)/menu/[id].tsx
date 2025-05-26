import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../../constants/api';

// Reuse this component to show restaurant menu
// Reservation logic will be moved to /reserve/[id].tsx

type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
};

export default function MenuPage() {
  const params = useLocalSearchParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const router = useRouter();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (!id) {
      Alert.alert('Invalid restaurant ID');
      router.replace('/');
      return;
    }
    checkUserRoleAndFetchMenu();
  }, [id]);

  const checkUserRoleAndFetchMenu = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      if (token) {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = await res.json();

        if (user?.role === 'admin') setIsAdmin(true);

        await fetchMenuItems(token);
      } else {
        await fetchMenuItems();
      }
    } catch (err) {
      Alert.alert('Error', 'Could not verify user');
    }
  };

  const fetchMenuItems = async (token?: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/menu/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error('Failed to fetch menu items');
      const data = await res.json();
      setMenuItems(data);
    } catch (err) {
      Alert.alert('Error', 'Could not load menu items.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMenuItem = async () => {
    if (!name || !description || !price || !category) {
      Alert.alert('All fields are required');
      return;
    }

    const token = await AsyncStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/menu/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description,
          price: parseFloat(price),
          category,
        }),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Failed to add menu item');
      }

      setName('');
      setDescription('');
      setPrice('');
      setCategory('');
      fetchMenuItems(token!);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const renderItem = ({ item }: { item: MenuItem }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      <Text>{item.description}</Text>
      <Text>Category: {item.category}</Text>
      <Text>Price: €{Number(item.price).toFixed(2)}</Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Menu for Restaurant ID: {id}</Text>

      {isAdmin && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
          />
          <TextInput
            style={styles.input}
            placeholder="Category"
            value={category}
            onChangeText={setCategory}
          />
          <TextInput
            style={styles.input}
            placeholder="Price (€)"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
          />
          <Button title="Add Menu Item" onPress={handleAddMenuItem} />
        </>
      )}

      {!isAdmin && (
        <View style={{ marginTop: 20 }}>
          <Button
            title="Make a Reservation"
            onPress={() => router.push({ pathname: '/reserve/[id]', params: { id } })}
          />
        </View>
      )}

      {loading ? (
        <Text style={{ marginTop: 30 }}>Loading menu items...</Text>
      ) : (
        <FlatList
          data={menuItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          style={{ marginTop: 20 }}
        />
      )}
    </ScrollView>
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
  },
  card: {
    backgroundColor: '#eee',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  name: { fontSize: 18, fontWeight: 'bold' },
});
