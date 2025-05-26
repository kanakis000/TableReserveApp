# TableReserveApp 

Η **TableReserveApp** είναι μια mobile και web εφαρμογή κρατήσεων για εστιατόρια, σχεδιασμένη στα πλαίσια του μαθήματος **MOBILE & DISTRIBUTED SYSTEMS (CN6035_1).

##  Περιγραφή Εφαρμογής

Η εφαρμογή επιτρέπει στους χρήστες:
- να εγγράφονται και να συνδέονται (με χρήση JWT),
- να βλέπουν εστιατόρια και να κάνουν κρατήσεις,
- να ψάχνουν εστιατόρια με βάση το όνομα η την τοποθεσία τους,
- να βλέπουν το ιστορικό κρατήσεών τους.

Οι διαχειριστές (admins) μπορούν:
- να δημιουργούν, επεξεργάζονται και διαγράφουν εστιατόρια,
- να διαχειρίζονται το μενού κάθε εστιατορίου,
- να αποδέχονται ή απορρίπτουν κρατήσεις.

##  Τεχνολογίες

- **Frontend**: React Native (Expo), TypeScript
- **Backend**: Node.js (Express)
- **Database**: MariaDB
- **Αυθεντικοποίηση**: JWT (με αποθήκευση σε AsyncStorage)
- **Αρχιτεκτονική**: MVC (routes / controllers / models)
- **Image Upload**: Multer + /uploads folder
- **Search**: Υλοποίηση search bar με βάση όνομα/τοποθεσία

##  Δομή Project

```bash
TableReserveApp/
├── app/                    # React Native frontend
│   ├── (tabs)/             # Οθόνες (Home, Profile, Dashboard, κ.ά.)
│   └── components/         # Κοινά components
├── server/                 # Express.js backend
│   ├── routes/             # Routes για auth, admin, reservations, restaurants
│   ├── controllers/        # Controllers (MVC pattern)
│   ├── uploads/            # Ανεβασμένες εικόνες
│   └── config/db.js        # Σύνδεση και αυτόματη δημιουργία DB

## Οδηγίες Εγκατάστασης
bash:
git clone https://github.com/kanakis000/TableReserveApp.git
cd TableReserveApp

Backend:
cd server
npm install
npm start

Frontend:
cd ..
npm install
npx expo start

Χρήση JWT:
-Κατά το login, το token αποθηκεύεται στο AsyncStorage.
-Ο χρήστης αναγνωρίζεται αυτόματα σε κάθε επόμενο άνοιγμα της εφαρμογής.

Σκοπός Εφαρμογής:
Η εφαρμογή στοχεύει στο να προσφέρει ένα εύχρηστο περιβάλλον για εύκολες και γρήγορες κρατήσεις τραπεζιών,
ενώ ταυτόχρονα επιτρέπει στους διαχειριστές εστιατορίων(admin) να οργανώνουν τις κρατήσεις και τα μενού τους.

Δημήτρης Κανάκης
Metropolitan College — University of East London
Μάθημα: MOBILE & DISTRIBUTED SYSTEMS (CN6035_1)







