import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, Share, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

export default function PerfilTabScreen({
  styles,
  profileDisplayName,
  profileAvatarUrl,
  userEmail,
  onLogout,
}) {
  const resolvedName = useMemo(
    () => String(profileDisplayName || '').trim() || 'Usuario SaveMyDish',
    [profileDisplayName]
  );
  const resolvedAvatarUrl = useMemo(
    () => String(profileAvatarUrl || '').trim(),
    [profileAvatarUrl]
  );

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileNameInput, setProfileNameInput] = useState(resolvedName);
  const [profilePhotoInput, setProfilePhotoInput] = useState(resolvedAvatarUrl);
  const [profileFeedback, setProfileFeedback] = useState('');
  const [profileFeedbackKind, setProfileFeedbackKind] = useState('info');
  const [isPlusModalVisible, setIsPlusModalVisible] = useState(false);

  const feedbackTones = {
    success: {
      backgroundColor: '#e6f4ea',
      borderColor: '#9bc9a8',
      textColor: '#1f5c34',
      icon: 'checkmark-circle-outline',
    },
    error: {
      backgroundColor: '#fdebec',
      borderColor: '#e3a8ac',
      textColor: '#8d2b33',
      icon: 'alert-circle-outline',
    },
    info: {
      backgroundColor: '#e9f0fb',
      borderColor: '#afc3e8',
      textColor: '#274a84',
      icon: 'information-circle-outline',
    },
  };

  const showFeedback = (message, kind = 'info') => {
    setProfileFeedback(message);
    setProfileFeedbackKind(kind);
  };

  useEffect(() => {
    if (isEditingProfile) {
      return;
    }
    setProfileNameInput(resolvedName);
    setProfilePhotoInput(resolvedAvatarUrl);
  }, [isEditingProfile, resolvedAvatarUrl, resolvedName]);

  const handlePickProfilePhoto = async () => {
    if (!isEditingProfile || isSavingProfile) {
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      showFeedback('Debes permitir acceso a tus fotos para actualizar tu perfil.', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.65,
      base64: true,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const selectedAsset = result.assets[0];
    const mimeType = selectedAsset.mimeType || 'image/jpeg';
    const photoUrl = selectedAsset.base64
      ? `data:${mimeType};base64,${selectedAsset.base64}`
      : selectedAsset.uri;
    setProfilePhotoInput(photoUrl);
    setProfileFeedback('');
    setProfileFeedbackKind('info');
  };

  const handleStartProfileEdit = () => {
    setProfileNameInput(resolvedName);
    setProfilePhotoInput(resolvedAvatarUrl);
    setProfileFeedback('');
    setProfileFeedbackKind('info');
    setIsEditingProfile(true);
  };

  const handleCancelProfileEdit = () => {
    setProfileNameInput(resolvedName);
    setProfilePhotoInput(resolvedAvatarUrl);
    setProfileFeedback('');
    setProfileFeedbackKind('info');
    setIsEditingProfile(false);
  };

  const handleSaveProfile = async () => {
    const cleanName = String(profileNameInput || '').trim();
    if (!cleanName) {
      showFeedback('El nombre es obligatorio.', 'error');
      return;
    }

    if (!supabase || !isSupabaseConfigured) {
      showFeedback('Configura Supabase para guardar cambios de perfil.', 'error');
      return;
    }

    setIsSavingProfile(true);
    setProfileFeedback('');
    setProfileFeedbackKind('info');
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: cleanName,
        avatar_url: String(profilePhotoInput || '').trim() || null,
      },
    });
    setIsSavingProfile(false);

    if (error) {
      showFeedback('No se pudo actualizar el perfil.', 'error');
      return;
    }

    setIsEditingProfile(false);
    showFeedback('Perfil actualizado correctamente.', 'success');
  };

  const handleOpenPlaceholder = () => {
    showFeedback('Disponible pronto.', 'info');
  };

  const handleShareWithFriends = async () => {
    const shareLink = 'https://www.savemydish.com';
    const shareMessage =
      'Quiero que conozcas SaveMyDish. Sé que te va a encantar para organizar tus recetas, planificar comidas y llevar tu lista de compras de forma fácil.\n\nDescárgala aquí: https://www.savemydish.com';
    try {
      await Share.share({
        title: 'SaveMyDish',
        message: shareMessage,
        url: shareLink,
      });
    } catch (_error) {
      showFeedback('No se pudo abrir el menú de compartir en este dispositivo.', 'error');
    }
  };

  const handleOpenPlusInterestMessage = () => {
    setIsPlusModalVisible(true);
  };

  const displayName = String(profileNameInput || '').trim() || resolvedName;
  const displayAvatar = String(profilePhotoInput || '').trim();
  const activeFeedbackTone = feedbackTones[profileFeedbackKind] || feedbackTones.info;

  return (
    <View>
      <Text style={styles.title}>Perfil</Text>
      <Text style={styles.body}>Administra tu cuenta, tu foto y tus preferencias.</Text>
      <View style={styles.profileCard}>
        <TouchableOpacity
          style={styles.profilePhotoButton}
          onPress={() => {
            void handlePickProfilePhoto();
          }}
          activeOpacity={isEditingProfile ? 0.85 : 1}
          disabled={!isEditingProfile || isSavingProfile}
        >
          {displayAvatar ? (
            <Image source={{ uri: displayAvatar }} style={styles.profilePhotoImage} resizeMode="cover" />
          ) : (
            <View style={styles.profilePhotoPlaceholder}>
              <Ionicons name="person-outline" size={36} color={styles.logoutText.color} />
            </View>
          )}
          {isEditingProfile ? (
            <View style={styles.profilePhotoEditBadge}>
              <Ionicons name="camera-outline" size={14} color={styles.logoutText.color} />
            </View>
          ) : null}
        </TouchableOpacity>

        {isEditingProfile ? (
          <TextInput
            style={styles.profileNameInput}
            value={profileNameInput}
            onChangeText={setProfileNameInput}
            placeholder="Nombre del usuario"
            placeholderTextColor={styles.sessionText.color}
            editable={!isSavingProfile}
          />
        ) : (
          <Text style={styles.profileNameText}>{displayName}</Text>
        )}

        <Text style={styles.profileEmailText}>{userEmail || 'Sin correo'}</Text>

        {isEditingProfile ? (
          <View style={styles.profileEditActions}>
            <TouchableOpacity
              style={[styles.secondaryAction, isSavingProfile && styles.buttonDisabled]}
              onPress={handleCancelProfileEdit}
              disabled={isSavingProfile}
            >
              <Text style={styles.secondaryActionText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.importButtonPrimary, isSavingProfile && styles.buttonDisabled]}
              onPress={handleSaveProfile}
              disabled={isSavingProfile}
            >
              {isSavingProfile ? (
                <ActivityIndicator size="small" color={styles.logoutText.color} />
              ) : (
                <Text style={styles.importButtonPrimaryText}>Guardar perfil</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.profileEditButton} onPress={handleStartProfileEdit}>
            <Ionicons name="create-outline" size={16} color={styles.logoutText.color} />
            <Text style={styles.logoutText}>Editar perfil</Text>
          </TouchableOpacity>
        )}

        {profileFeedback ? (
          <View
            style={{
              marginTop: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: activeFeedbackTone.borderColor,
              backgroundColor: activeFeedbackTone.backgroundColor,
              paddingHorizontal: 12,
              paddingVertical: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Ionicons name={activeFeedbackTone.icon} size={16} color={activeFeedbackTone.textColor} />
            <Text style={{ flex: 1, color: activeFeedbackTone.textColor, fontSize: 13, lineHeight: 18 }}>
              {profileFeedback}
            </Text>
          </View>
        ) : null}

        <View style={styles.profileDivider} />

        <TouchableOpacity style={styles.profilePlusButton} onPress={handleOpenPlusInterestMessage}>
          <Ionicons name="sparkles-outline" size={18} color={styles.profilePlusButtonText.color} />
          <Text style={styles.profilePlusButtonText}>Actualizar a SaveMyDish Plus</Text>
        </TouchableOpacity>

        <View style={styles.profileDivider} />

        <TouchableOpacity
          style={styles.profileMenuRow}
          onPress={() => {
            void handleShareWithFriends();
          }}
        >
          <Ionicons name="share-social-outline" size={18} color={styles.profileMenuText.color} />
          <Text style={styles.profileMenuText}>Compartir con Amigos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.profileMenuRow} onPress={handleOpenPlaceholder}>
          <Ionicons name="help-circle-outline" size={18} color={styles.profileMenuText.color} />
          <Text style={styles.profileMenuText}>Ayuda</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.profileMenuRow} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={18} color={styles.profileMenuText.color} />
          <Text style={styles.profileMenuText}>Cerrar Sesion</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isPlusModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPlusModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(20, 31, 51, 0.38)',
            justifyContent: 'center',
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              backgroundColor: '#f6f7fb',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: '#c2d2ee',
              paddingHorizontal: 18,
              paddingVertical: 18,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: '800',
                color: '#1e3a76',
                marginBottom: 8,
              }}
            >
              SaveMyDish Plus
            </Text>
            <Text
              style={{
                fontSize: 14,
                lineHeight: 21,
                color: '#284471',
                marginBottom: 14,
              }}
            >
              Gracias por tu interés. Estamos desarrollando nuevas funcionalidades y mejoras para mejorar tu
              experiencia. Pronto estará listo. Puedes disfrutar todas las funciones de SaveMyDish y no olvides
              compartirlo con tus amigos.
            </Text>
            <TouchableOpacity
              onPress={() => setIsPlusModalVisible(false)}
              style={{
                alignSelf: 'flex-end',
                backgroundColor: '#7d98cc',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: '#ffffff', fontWeight: '700' }}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
