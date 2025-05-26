import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../constants/api';
import { useRouter } from 'expo-router';

type Restaurant = {
  restaurant_id: number;
  name: string;
  location: string;
  description: string;
  image_url?: string;
};

export default function HomeScreen() {
  const [userName, setUserName] = useState<string | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndRestaurants = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const user = await res.json();
          if (user.name) setUserName(user.name);
        } catch {
          
        }
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/restaurants`);
        const data = await res.json();
        const shuffled = data.sort(() => 0.5 - Math.random());
        setRestaurants(shuffled.slice(0, 3));
      } catch (err) {
        console.error('Failed to fetch restaurants');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndRestaurants();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.welcome}>
         Καλωσήρθες{userName ? `, ${userName}!` : ` στην TableReserveApp!`}
      </Text>

      <Text style={styles.subtitle}>🍽️ Προτεινόμενα Εστιατόρια</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : (
        <FlatList
          horizontal
          data={restaurants}
          keyExtractor={(item) => item.restaurant_id.toString()}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image
                source={{
                  uri: item.image_url || 'https://via.placeholder.com/300x200?text=No+Image',
                }}
                style={styles.image}
              />
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.location}>{item.location}</Text>
              <Text style={styles.desc} numberOfLines={2}>
                {item.description}
              </Text>
            </View>
          )}
        />
      )}
      {/* Περιγραφή εφαρμογής */}
      <View style={{ paddingVertical: 30 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
          Καλωσορίσατε στο TableReserveApp!
        </Text>
        <Text style={{ fontSize: 16, lineHeight: 24 }}>
          Η εφαρμογή μας σας δίνει τη δυνατότητα να ανακαλύψετε εστιατόρια σε όλη την Ελλάδα
          και να κάνετε εύκολες και γρήγορες κρατήσεις τραπεζιών. Στόχος μας είναι να συνδέσουμε 
          τους πελάτες με τα αγαπημένα τους καταστήματα, προσφέροντας μια απλή και αξιόπιστη 
          εμπειρία κράτησης. Είτε είστε πελάτης που ψάχνει για ένα ωραίο δείπνο, είτε διαχειριστής 
          εστιατορίου που θέλει να οργανώσει καλύτερα τις κρατήσεις του, το TableReserveApp είναι εδώ για εσάς.
        </Text>
      </View>
    </ScrollView>
  );
}





const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  welcome: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 30,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  card: {
    width: 220,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 10,
    marginRight: 12,
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  name: { fontSize: 16, fontWeight: 'bold' },
  location: { fontSize: 14, color: '#666' },
  desc: { fontSize: 13, marginTop: 5 },
});
