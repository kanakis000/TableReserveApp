import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  TextInput,
  Pressable,
  Platform,
} from 'react-native';
import { API_BASE_URL } from '../../constants/api';
import { useRouter } from 'expo-router';

type Restaurant = {
  restaurant_id: number;
  name: string;
  location: string;
  description: string;
};

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filtered, setFiltered] = useState<Restaurant[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchRestaurants = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/restaurants`);
      if (!res.ok) throw new Error('Failed to fetch restaurants');
      const data = await res.json();
      setRestaurants(data);
      setFiltered(data);
    } catch (err) {
      console.error('Failed to fetch restaurants:', err);
      Alert.alert('Error', 'Could not load restaurants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleSearch = (text: string) => {
    setSearch(text);
    if (text.trim() === '') {
      setFiltered(restaurants);
    } else {
      const lower = text.toLowerCase();
      const results = restaurants.filter(
        (r) =>
          r.name.toLowerCase().includes(lower) ||
          r.location.toLowerCase().includes(lower)
      );
      setFiltered(results);
    }
  };

  const renderItem = ({ item }: { item: Restaurant }) => (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/menu/[id]',
          params: { id: item.restaurant_id.toString() },
        })
      }
      style={({ pressed }) => [
        styles.card,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Text style={styles.name}>{item.name}</Text>
      <Text>{item.location}</Text>
      <Text>{item.description}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Restaurants</Text>

      <TextInput
        placeholder="Search by name or location"
        value={search}
        onChangeText={handleSearch}
        style={styles.search}
      />

      {loading ? (
        <Text>Loading...</Text>
      ) : filtered.length === 0 ? (
        <Text>No results found.</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.restaurant_id.toString()}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 100,
    backgroundColor: '#fff',
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  search: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    padding: Platform.OS === 'web' ? 10 : 12,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#f2f2f2',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
