import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export default function PerfilTabScreen({ styles, profileDisplayName, userEmail, onLogout }) {
  return (
    <View>
      <Text style={styles.title}>Perfil</Text>
      <Text style={styles.body}>
        Aquí irá la configuración de cuenta, preferencias y datos personales.
      </Text>
      <View style={styles.profileCard}>
        {profileDisplayName ? (
          <Text style={styles.sessionText}>Nombre: {profileDisplayName}</Text>
        ) : null}
        {userEmail ? <Text style={styles.sessionText}>Sesion activa: {userEmail}</Text> : null}
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>Cerrar sesion</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

